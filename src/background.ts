import browser from 'webextension-polyfill'

let auth: string | undefined = undefined
let tv_auth: string | undefined = undefined

async function load_tv_auth() {
    const settings = await browser.storage.local.get(['tvAuthEnabled'])
    if (settings.tvAuthEnabled === false) {
        tv_auth = undefined
        return
    }

    const data = (await browser.storage.local.get(['cr_tv_auth'])) as any
    tv_auth = data.cr_tv_auth?.access_token ?? undefined
}

load_tv_auth()

browser.storage.onChanged.addListener(async (data: any) => {
    if (data.tvAuthEnabled) {
        if (data.tvAuthEnabled.newValue === false) {
            tv_auth = undefined
            return
        }

        void load_tv_auth()
        return
    }

    if (data.cr_tv_auth) {
        tv_auth = data.cr_tv_auth.newValue?.access_token ?? undefined
    }
})

browser.webRequest.onBeforeRequest.addListener(
    (details) => {
        if (!details.url.includes('/auth/v1/token')) return

        const filter = browser.webRequest.filterResponseData(details.requestId)
        const decoder = new TextDecoder()
        const encoder = new TextEncoder()

        let response_body = ''

        filter.ondata = (event) => {
            response_body += decoder.decode(event.data, { stream: true })
        }

        filter.onstop = async () => {
            try {
                const data = JSON.parse(response_body)
                if (!data) {
                    filter.write(encoder.encode(response_body))
                    filter.close()
                    return {}
                }

                if (data.access_token) {
                    browser.tabs.query({}).then((tabs) => {
                        for (const tab of tabs) {
                            if (tab.id) {
                                browser.tabs
                                    .sendMessage(tab.id, {
                                        type: 'BEARER_UPDATED',
                                        access_token: data.access_token,
                                        account_id: data.account_id
                                    })
                                    .catch(() => {})
                            }
                        }
                    })
                }
            } catch (e) {
                console.error('Token parse failed', e)
            }

            filter.write(encoder.encode(response_body))
            filter.close()
        }

        return {}
    },
    {
        urls: ['https://www.crunchyroll.com/auth/v1/token']
    },
    ['blocking']
)

browser.webRequest.onBeforeRequest.addListener(
    (details) => {
        if (!tv_auth) return

        const url = new URL(details.url)

        if (url.pathname.includes('/playback/v3/') && url.pathname.includes('/web/')) {
            const newPath = url.pathname.replace(/\/web\/[^/]+\/play/, '/tv/android_tv/play')

            return {
                redirectUrl: `https://www.crunchyroll.com${newPath}`
            }
        }
    },
    {
        urls: ['*://www.crunchyroll.com/playback/*/*/web/*/play']
    },
    ['blocking']
)

browser.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        if (!tv_auth) return

        let headers = details.requestHeaders || []
        headers = headers.filter((h) => h.name.toLowerCase() !== 'authorization' && h.name.toLowerCase() !== 'user-agent')

        headers.push({
            name: 'Authorization',
            value: `Bearer ${tv_auth}`
        })

        headers.push({
            name: 'User-Agent',
            value: 'Crunchyroll/ANDROIDTV/3.58.0_22336 (Android 12; en-US; SHIELD Android TV Build/SR1A.211012.001)'
        })

        return {
            requestHeaders: headers
        }
    },
    {
        urls: ['*://*.crunchyroll.com/playback/*', '*://*.crunchyroll.com/license/*']
    },
    ['blocking', 'requestHeaders']
)

// browser.webRequest.onBeforeRequest.addListener(
//     (details) => {
//         return { cancel: true }
//     },
//     {
//         urls: [
//             '*://*.ketchjs.com/*',
//             '*://*.cookielaw.org/*',
//             '*://*.ketchcdn.com/*',
//             '*://*.ipify.org/*',
//             '*://*.litix.io/*',
//             '*://*.braze.com/*',
//             '*://*.datadoghq.com/*',
//             '*://*.crunchyroll.com/analytics/*'
//         ]
//     },
//     ['blocking']
// )

// Replace player.html request body with modified player.html content
browser.webRequest.onBeforeRequest.addListener(
    (details) => {
        const filter = browser.webRequest.filterResponseData(details.requestId)
        const encoder = new TextEncoder()
        filter.ondata = () => {}

        filter.onstop = async () => {
            try {
                const localScript = await fetch(browser.runtime.getURL('player.html')).then((r) => r.text())

                filter.write(encoder.encode(localScript))
            } catch (e) {
                console.error('Chunk replace failed', e)
            } finally {
                filter.close()
            }
        }

        return {}
    },
    {
        urls: ['https://static.crunchyroll.com/vilos-v2/web/vilos/player.html'],
        types: ['main_frame', 'sub_frame']
    },
    ['blocking']
)

// Replace bundle.js request body with modified bundle.js content
browser.webRequest.onBeforeRequest.addListener(
    (details) => {
        const filter = browser.webRequest.filterResponseData(details.requestId)
        const encoder = new TextEncoder()
        filter.ondata = () => {}

        filter.onstop = async () => {
            try {
                const localScript = await fetch(browser.runtime.getURL('bundle.js')).then((r) => r.text())

                filter.write(encoder.encode(localScript))
            } catch (e) {
                console.error('Bundle replace failed', e)
            } finally {
                filter.close()
            }
        }

        return {}
    },
    {
        urls: ['https://static.crunchyroll.com/vilos-v2/web/vilos/js/bundle.js'],
        types: ['script']
    },
    ['blocking']
)

// Replace 8134-d35297e852da455a.js request body with modified katamari-fix.js content
browser.webRequest.onBeforeRequest.addListener(
    (details) => {
        const filter = browser.webRequest.filterResponseData(details.requestId)
        const encoder = new TextEncoder()
        filter.ondata = () => {}

        filter.onstop = async () => {
            try {
                const localScript = await fetch(browser.runtime.getURL('katamari-fix.js')).then((r) => r.text())

                filter.write(encoder.encode(localScript))
            } catch (e) {
                console.error('Chunk replace failed', e)
            } finally {
                filter.close()
            }
        }

        return {}
    },
    {
        urls: ['https://www.crunchyroll.com/build/_next/static/chunks/8134-d35297e852da455a.js'],
        types: ['script']
    },
    ['blocking']
)
