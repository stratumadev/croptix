;(() => {
    const initializationMarker = Symbol.for('croptix.crunchyroll-page-patches')

    if (window[initializationMarker]) return

    const prioritizeContinueWatching = (body) => {
        if (!Array.isArray(body?.children)) return body

        const historyIndex = body.children.findIndex((child) => child?.type === 'HistoryCollection')
        if (historyIndex < 0) return body

        const [historyCollection] = body.children.splice(historyIndex, 1)
        const firstCollectionIndex = body.children.findIndex((child) => !['HeroMediaCard', 'HeroCollection'].includes(child?.type))
        const targetIndex = firstCollectionIndex < 0 ? body.children.length : firstCollectionIndex

        body.children.splice(targetIndex, 0, historyCollection)

        return body
    }

    const jsonResponsePatches = [
        {
            urlHint: '/f/v1/home',
            matches: (url) => url.pathname === '/f/v1/home',
            transform: prioritizeContinueWatching
        }
    ]

    const findPatches = (requestUrl) => {
        const requestUrlText = String(requestUrl)
        const candidates = jsonResponsePatches.filter((patch) => !patch.urlHint || requestUrlText.includes(patch.urlHint))

        if (0 === candidates.length) return candidates

        const url = new URL(requestUrlText, window.location.href)
        return candidates.filter((patch) => patch.matches(url))
    }

    const applyPatches = (body, patches) => patches.reduce((patchedBody, patch) => patch.transform(patchedBody), body)

    const rewriteJsonResponse = async (response, patches) => {
        const originalBody = await response.clone().json()
        const patchedBody = applyPatches(originalBody, patches)
        const headers = new Headers(response.headers)

        headers.delete('content-encoding')
        headers.delete('content-length')

        const patchedResponse = new Response(JSON.stringify(patchedBody), {
            status: response.status,
            statusText: response.statusText,
            headers
        })

        for (const property of ['url', 'redirected', 'type']) {
            try {
                Object.defineProperty(patchedResponse, property, { value: response[property] })
            } catch {}
        }

        return patchedResponse
    }

    const installFetchPatch = () => {
        const originalFetch = window.fetch
        if ('function' !== typeof originalFetch) return

        window.fetch = function (...args) {
            let matchingPatches
            try {
                const request = args[0]
                const requestUrl = 'undefined' !== typeof Request && request instanceof Request ? request.url : String(request)
                matchingPatches = findPatches(requestUrl)
            } catch (error) {
                console.warn('[CrOptix] Failed to inspect a Crunchyroll fetch request.', error)
                return originalFetch.apply(this, args)
            }

            const responsePromise = originalFetch.apply(this, args)
            if (0 === matchingPatches.length) return responsePromise

            return responsePromise.then(async (response) => {
                try {
                    return await rewriteJsonResponse(response, matchingPatches)
                } catch (error) {
                    console.warn('[CrOptix] Failed to patch a Crunchyroll fetch response.', error)
                    return response
                }
            })
        }
    }

    const installXmlHttpRequestPatch = () => {
        const XMLHttpRequestConstructor = window.XMLHttpRequest
        if ('function' !== typeof XMLHttpRequestConstructor) return

        const prototype = XMLHttpRequestConstructor.prototype
        const originalOpen = prototype.open
        const responseTextDescriptor = Object.getOwnPropertyDescriptor(prototype, 'responseText')
        const responseDescriptor = Object.getOwnPropertyDescriptor(prototype, 'response')

        if ('function' !== typeof originalOpen) return

        prototype.open = function (method, requestUrl, ...args) {
            const result = originalOpen.call(this, method, requestUrl, ...args)

            try {
                const matchingPatches = findPatches(String(requestUrl))
                if (0 === matchingPatches.length) return result

                let patchedText
                let patchedJson
                let textWasPatched = false
                let jsonWasPatched = false

                const readPatchedText = () => {
                    const originalText = responseTextDescriptor.get.call(this)
                    if (4 !== this.readyState || textWasPatched) return textWasPatched ? patchedText : originalText

                    textWasPatched = true
                    try {
                        patchedText = JSON.stringify(applyPatches(JSON.parse(originalText), matchingPatches))
                    } catch {
                        patchedText = originalText
                    }

                    return patchedText
                }

                if ('function' === typeof responseTextDescriptor?.get) {
                    Object.defineProperty(this, 'responseText', {
                        configurable: true,
                        enumerable: responseTextDescriptor.enumerable,
                        get: readPatchedText
                    })
                }

                if ('function' === typeof responseDescriptor?.get) {
                    Object.defineProperty(this, 'response', {
                        configurable: true,
                        enumerable: responseDescriptor.enumerable,
                        get: () => {
                            const originalResponse = responseDescriptor.get.call(this)
                            if (4 !== this.readyState) return originalResponse

                            if ('json' === this.responseType) {
                                if (!jsonWasPatched) {
                                    jsonWasPatched = true
                                    patchedJson = applyPatches(originalResponse, matchingPatches)
                                }
                                return patchedJson
                            }

                            return '' === this.responseType || 'text' === this.responseType ? readPatchedText() : originalResponse
                        }
                    })
                }
            } catch (error) {
                console.warn('[CrOptix] Failed to patch a Crunchyroll XHR response.', error)
            }

            return result
        }
    }

    window[initializationMarker] = true
    installFetchPatch()
    installXmlHttpRequestPatch()
})()
