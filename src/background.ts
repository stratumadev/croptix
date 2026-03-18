import browser from 'webextension-polyfill'

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

// Replace bundle.js request body with modified bundle.js content
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
