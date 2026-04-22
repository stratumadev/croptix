import browser from './browser'
;(() => {
    if (document.documentElement.hasAttribute('croptix-katamari-fix')) return

    const script = document.createElement('script')
    script.src = browser.runtime.getURL('katamari.js')
    script.dataset.croptix = '1'

    document.documentElement.setAttribute('croptix-katamari-fix', '1')
    ;(document.head || document.documentElement).appendChild(script)
    script.remove()
})()
