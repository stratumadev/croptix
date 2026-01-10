import browser from 'webextension-polyfill'

// Disabled because of crunchyrolls new auth system
// Replace Firefox Playback URL with LGTV Playback URL to get CBR Encode
// browser.webRequest.onBeforeRequest.addListener(
//     (details) => {
//         const originalUrl = details.url

//         const pattern = /playback\/v3\/([^/]+)\/web\/firefox\/play/
//         const match = originalUrl.match(pattern)

//         if (match) {
//             const id = match[1]
//             const newUrl = `https://www.crunchyroll.com/playback/v3/${id}/tv/lg/play`

//             console.log(`Redirecting from: ${originalUrl} to: ${newUrl}`)

//             return { redirectUrl: newUrl }
//         }

//         return {}
//     },
//     {
//         urls: ['*://www.crunchyroll.com/playback/v3/*/web/firefox/play'],
//         types: ['xmlhttprequest', 'main_frame', 'sub_frame']
//     },
//     ['blocking']
// )

// Re-enable Quality selector
browser.webRequest.onBeforeRequest.addListener(
    (details) => {
        const filter = browser.webRequest.filterResponseData(details.requestId)
        const encoder = new TextEncoder()
        const chunks: Uint8Array[] = []

        filter.ondata = (e) => {
            chunks.push(new Uint8Array(e.data))
        }

        filter.onstop = () => {
            try {
                filter.write(
                    encoder.encode(
                        JSON.stringify({
                            config_delta: {
                                playbackSpeed: { enabled: true },
                                qualitySettings: { enabled: false }
                            }
                        })
                    )
                )
            } finally {
                filter.close()
            }
        }

        return {}
    },
    {
        urls: ['*://beta-api.crunchyroll.com/config-delta/v1/apps/vilos-v2/config_delta*'],
        types: ['xmlhttprequest', 'main_frame', 'sub_frame']
    },
    ['blocking']
)

browser.webRequest.onBeforeRequest.addListener(
    (details) => {
        const filter = browser.webRequest.filterResponseData(details.requestId)
        const decoder = new TextDecoder('utf-8')
        const encoder = new TextEncoder()

        let data = ''

        filter.ondata = (event) => {
            data += decoder.decode(event.data, { stream: true })
        }

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

// // Injecting Android TV basic token
// browser.webRequest.onBeforeSendHeaders.addListener(
//     (details) => {
//         const NEW_AUTH = 'Basic Ym1icmt4eXgzZDd1NmpzZnlsYTQ6QUlONEQ1VkVfY3Awd1Z6Zk5vUDBZcUhVcllGcDloU2c='

//         const headers = details.requestHeaders || []
//         let found = false

//         for (const h of headers) {
//             if (h.name.toLowerCase() === 'authorization') {
//                 h.value = NEW_AUTH
//                 found = true
//                 break
//             }
//         }
//         if (!found) {
//             headers.push({ name: 'Authorization', value: NEW_AUTH })
//         }

//         return { requestHeaders: headers }
//     },
//     {
//         urls: ['*://www.crunchyroll.com/auth/v1/token'],
//         types: ['xmlhttprequest', 'main_frame', 'sub_frame']
//     },
//     ['blocking', 'requestHeaders']
// )
