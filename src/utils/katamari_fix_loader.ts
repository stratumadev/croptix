import browser from './browser'
;(() => {
    if (document.documentElement.hasAttribute('croptix-katamari-fix')) return

    const injectScript = (path: string, onDone?: () => void) => {
        const script = document.createElement('script')
        script.src = browser.runtime.getURL(path)
        script.dataset.croptix = '1'
        script.onload = () => {
            script.remove()
            onDone?.()
        }
        script.onerror = () => {
            script.remove()
            onDone?.()
        }
        ;(document.head || document.documentElement).appendChild(script)
    }

    document.documentElement.setAttribute('croptix-katamari-fix', '1')
    injectScript('subtitle-octopus/subtitles-octopus.js', () => injectScript('katamari.js'))
})()
