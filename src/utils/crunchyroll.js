;(() => {
    const marker = Symbol.for('croptix.crunchyroll-page-patches')
    if (window[marker]) return

    const nativeFetch = window.fetch
    const trending = {
        ids: [],
        seen: new Set(),
        catalogs: new Map(),
        page: 1,
        done: false,
        expires: 0,
        retryAt: 0,
        loading: null
    }
    const aniListQuery = `query ($firstPage: Int!, $secondPage: Int!) {
        first: Page(page: $firstPage, perPage: 50) {
            media(type: ANIME, sort: TRENDING_DESC, isAdult: false) { externalLinks { url } }
        }
        second: Page(page: $secondPage, perPage: 50) {
            media(type: ANIME, sort: TRENDING_DESC, isAdult: false) { externalLinks { url } }
        }
    }`

    const resetTrending = () => {
        trending.ids.length = 0
        trending.seen.clear()
        trending.catalogs.clear()
        Object.assign(trending, { page: 1, done: false, expires: 0, retryAt: 0 })
    }

    const loadTrending = () => {
        const now = Date.now()
        if (trending.loading) return trending.loading
        if (trending.expires && trending.expires <= now) resetTrending()
        if (trending.done) return Promise.resolve()
        if (now < trending.retryAt) return Promise.reject(new Error('AniList retry is temporarily delayed'))
        if (typeof nativeFetch !== 'function') return Promise.reject(new Error('Fetch is unavailable'))

        const pages = [trending.page, Math.min(trending.page + 1, 10)]
        trending.loading = nativeFetch
            .call(window, 'https://graphql.anilist.co', {
                method: 'POST',
                credentials: 'omit',
                referrerPolicy: 'no-referrer',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    query: aniListQuery,
                    variables: { firstPage: pages[0], secondPage: pages[1] }
                })
            })
            .then(async (response) => {
                if (!response.ok) throw new Error(`AniList returned HTTP ${response.status}`)

                const json = await response.json()
                if (json.errors?.length) throw new Error(json.errors.map(({ message }) => message).join(', '))

                const media = [...(json.data?.first?.media ?? []), ...(json.data?.second?.media ?? [])]
                for (const anime of media) {
                    for (const link of anime.externalLinks ?? []) {
                        const id = link.url?.match(/crunchyroll\.com\/(?:[a-z]{2}\/)?series\/([a-z0-9]+)/i)?.[1]?.toUpperCase()
                        if (!id || trending.seen.has(id)) continue

                        trending.seen.add(id)
                        trending.ids.push(id)
                    }
                }

                trending.page = pages[1] + 1
                trending.done = trending.page > 10
                trending.expires = Date.now() + 15 * 60 * 1000
                trending.retryAt = 0
            })
            .catch((error) => {
                trending.retryAt = Date.now() + 60 * 1000
                console.warn('[CrOptix] Failed to load AniList trending anime.', error)
                throw error
            })
            .finally(() => {
                trending.loading = null
            })

        return trending.loading
    }

    const getRange = (url) => {
        const start = Number.parseInt(url.searchParams.get('start') ?? '0', 10)
        const size = Number.parseInt(url.searchParams.get('n') ?? '36', 10)
        return [start > 0 ? start : 0, size > 0 ? size : 36]
    }

    const getCatalog = (url, create = true) => {
        const locale = url.searchParams.get('locale') || 'en-US'
        const audio = url.searchParams.get('preferred_audio_language') || locale
        const key = `${locale}|${audio}`

        if (!trending.catalogs.has(key) && create) {
            trending.catalogs.set(key, {
                locale,
                audio,
                ratings: url.searchParams.get('ratings') || 'true',
                items: [],
                seen: new Set(),
                cursor: 0,
                wanted: 0,
                done: false,
                loading: null
            })
        }

        return trending.catalogs.get(key)
    }

    const fillCatalog = async (url, requestHeaders) => {
        if (!trending.ids.length || trending.expires <= Date.now()) await loadTrending()

        const catalog = getCatalog(url)
        const [start, size] = getRange(url)
        const wanted = start + size
        catalog.wanted = Math.max(catalog.wanted, wanted)

        if (!catalog.loading) {
            catalog.loading = (async () => {
                while (catalog.items.length < catalog.wanted && !catalog.done) {
                    if (catalog.cursor >= trending.ids.length) {
                        if (trending.done) {
                            catalog.done = true
                            break
                        }

                        await loadTrending()
                        continue
                    }

                    const ids = trending.ids.slice(catalog.cursor, catalog.cursor + 50)
                    const api = new URL(`/content/v2/cms/objects/${ids.join(',')}`, url.origin)
                    api.searchParams.set('ratings', catalog.ratings)
                    api.searchParams.set('preferred_audio_language', catalog.audio)
                    api.searchParams.set('locale', catalog.locale)

                    const headers = new Headers(requestHeaders)
                    headers.set('accept', 'application/json')
                    headers.delete('content-length')
                    headers.delete('host')

                    const response = await nativeFetch.call(window, api.href, {
                        credentials: 'same-origin',
                        headers
                    })
                    if (!response.ok) throw new Error(`Crunchyroll objects returned HTTP ${response.status}`)

                    const data = (await response.json())?.data
                    if (!Array.isArray(data)) throw new Error('Crunchyroll objects returned invalid JSON')

                    const byId = new Map(data.map((item) => [String(item.id ?? '').toUpperCase(), item]))
                    catalog.cursor += ids.length

                    for (const id of ids) {
                        const item = byId.get(id)
                        if (!item || catalog.seen.has(id)) continue

                        catalog.seen.add(id)
                        catalog.items.push(item)
                    }

                    catalog.done = trending.done && catalog.cursor >= trending.ids.length
                }
            })().finally(() => {
                catalog.loading = null
            })
        }

        await catalog.loading
        if (catalog.items.length < wanted && !catalog.done) await fillCatalog(url, requestHeaders)
    }

    const replaceTrending = (body, url) => {
        const catalog = getCatalog(url, false)
        if (!catalog || (!catalog.items.length && body?.data?.length)) return body

        const [start, size] = getRange(url)
        body.data = catalog.items.slice(start, start + size)
        body.total = catalog.done ? catalog.items.length : 500
        return body
    }

    const moveHistoryToTop = (body) => {
        const rows = body?.children
        if (!Array.isArray(rows)) return body

        const from = rows.findIndex((row) => row?.type === 'HistoryCollection')
        if (from < 0) return body

        const history = rows.splice(from, 1)[0]
        const afterHero = rows.findIndex((row) => !['HeroMediaCard', 'HeroCollection'].includes(row?.type))
        rows.splice(afterHero < 0 ? rows.length : afterHero, 0, history)
        return body
    }

    const responsePatches = [
        {
            hint: '/f/v1/home',
            matches: (url) => url.pathname === '/f/v1/home',
            transform: moveHistoryToTop
        },
        {
            hint: '/content/v2/discover/browse',
            matches: (url) => url.pathname === '/content/v2/discover/browse' && url.searchParams.get('sort_by') === 'popularity',
            prepare: fillCatalog,
            transform: replaceTrending
        }
    ]

    const findPatches = (input, headers = new Headers()) => {
        const text = String(input)
        const candidates = responsePatches.filter(({ hint }) => text.includes(hint))
        if (!candidates.length) return []

        const url = new URL(text, window.location.href)
        return candidates.filter((patch) => patch.matches(url)).map((patch) => ({ ...patch, url, headers }))
    }

    const patchJson = (body, patches) => patches.reduce((json, patch) => (patch.failed ? json : patch.transform(json, patch.url)), body)

    const preparePatches = (patches) =>
        Promise.all(patches.map((patch) => patch.prepare?.(patch.url, patch.headers))).catch((error) => {
            for (const patch of patches) patch.failed = true
            throw error
        })

    const rewriteResponse = async (response, patches, ready) => {
        const body = await response.clone().json()
        await ready

        const headers = new Headers(response.headers)
        headers.delete('content-encoding')
        headers.delete('content-length')

        const patched = new Response(JSON.stringify(patchJson(body, patches)), {
            status: response.status,
            statusText: response.statusText,
            headers
        })

        for (const property of ['url', 'redirected', 'type']) {
            try {
                Object.defineProperty(patched, property, { value: response[property] })
            } catch {}
        }

        return patched
    }

    if (typeof nativeFetch === 'function') {
        window.fetch = function (...args) {
            let patches

            try {
                const request = args[0]
                const isRequest = typeof Request !== 'undefined' && request instanceof Request
                const headers = new Headers(isRequest ? request.headers : undefined)
                if (args[1]?.headers) new Headers(args[1].headers).forEach((value, name) => headers.set(name, value))
                patches = findPatches(isRequest ? request.url : request, headers)
            } catch (error) {
                console.warn('[CrOptix] Failed to inspect a Crunchyroll fetch request.', error)
                return nativeFetch.apply(this, args)
            }

            const response = nativeFetch.apply(this, args)
            if (!patches.length) return response

            const ready = preparePatches(patches)
            return response.then(async (result) => {
                try {
                    return await rewriteResponse(result, patches, ready)
                } catch (error) {
                    console.warn('[CrOptix] Failed to patch a Crunchyroll fetch response.', error)
                    return result
                }
            })
        }
    }

    const XHR = window.XMLHttpRequest
    if (typeof XHR === 'function') {
        const prototype = XHR.prototype
        const nativeOpen = prototype.open
        const textDescriptor = Object.getOwnPropertyDescriptor(prototype, 'responseText')
        const responseDescriptor = Object.getOwnPropertyDescriptor(prototype, 'response')

        if (typeof nativeOpen === 'function') {
            prototype.open = function (method, input, ...args) {
                const result = nativeOpen.call(this, method, input, ...args)

                try {
                    const headers = new Headers()
                    const patches = findPatches(input, headers)
                    if (!patches.length) return result

                    if (args[0] !== false && patches.some(({ prepare }) => prepare) && typeof this.send === 'function') {
                        const nativeSend = this.send
                        const nativeSetHeader = this.setRequestHeader
                        let sent = false

                        if (typeof nativeSetHeader === 'function') {
                            Object.defineProperty(this, 'setRequestHeader', {
                                configurable: true,
                                value: (name, value) => {
                                    nativeSetHeader.call(this, name, value)
                                    headers.append(String(name), String(value))
                                }
                            })
                        }

                        const send = (...sendArgs) => {
                            if (sent) throw new DOMException('The request has already been sent.', 'InvalidStateError')
                            sent = true

                            void preparePatches(patches)
                                .catch((error) => console.warn('[CrOptix] Failed to prepare a Crunchyroll XHR request.', error))
                                .then(() => {
                                    if (this.readyState === 1 && this.send === send) nativeSend.apply(this, sendArgs)
                                })
                        }

                        Object.defineProperty(this, 'send', { configurable: true, value: send })
                    }

                    const cache = {}
                    const readText = () => {
                        const text = textDescriptor.get.call(this)
                        if (this.readyState !== 4) return text
                        if ('text' in cache) return cache.text

                        try {
                            cache.text = JSON.stringify(patchJson(JSON.parse(text), patches))
                        } catch {
                            cache.text = text
                        }
                        return cache.text
                    }

                    if (typeof textDescriptor?.get === 'function') {
                        Object.defineProperty(this, 'responseText', {
                            configurable: true,
                            enumerable: textDescriptor.enumerable,
                            get: readText
                        })
                    }

                    if (typeof responseDescriptor?.get === 'function') {
                        Object.defineProperty(this, 'response', {
                            configurable: true,
                            enumerable: responseDescriptor.enumerable,
                            get: () => {
                                const response = responseDescriptor.get.call(this)
                                if (this.readyState !== 4) return response

                                if (this.responseType === 'json') {
                                    if (!('json' in cache)) cache.json = patchJson(response, patches)
                                    return cache.json
                                }

                                return this.responseType === '' || this.responseType === 'text' ? readText() : response
                            }
                        })
                    }
                } catch (error) {
                    console.warn('[CrOptix] Failed to patch a Crunchyroll XHR response.', error)
                }

                return result
            }
        }
    }

    window[marker] = true
})()
