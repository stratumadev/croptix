import browser from 'webextension-polyfill'

// Replace Firefox Playback URL with LGTV Playback URL to get CBR Encode
browser.webRequest.onBeforeRequest.addListener(
    (details) => {
        const originalUrl = details.url

        const pattern = /playback\/v3\/([^/]+)\/web\/firefox\/play/
        const match = originalUrl.match(pattern)

        if (match) {
            const id = match[1]
            const newUrl = `https://www.crunchyroll.com/playback/v3/${id}/tv/lg/play`

            console.log(`Redirecting from: ${originalUrl} to: ${newUrl}`)

            return { redirectUrl: newUrl }
        }

        return {}
    },
    {
        urls: ['*://www.crunchyroll.com/playback/v3/*/web/firefox/play'],
        types: ['xmlhttprequest', 'main_frame', 'sub_frame']
    },
    ['blocking']
)

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
