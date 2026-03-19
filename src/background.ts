import browser from 'webextension-polyfill'

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
