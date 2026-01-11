import browser from 'webextension-polyfill'

// Replace bundle.js request body with modified bundle.js content
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
