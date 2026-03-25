import browser from './browser'
;(() => {
    if (document.documentElement.hasAttribute('cropix-katamari-fix')) return

    const script = document.createElement('script')
    script.src = browser.runtime.getURL('katamari_fix.js')
    script.dataset.cropix = '1'

    document.documentElement.setAttribute('cropix-katamari-fix', '1')
    ;(document.head || document.documentElement).appendChild(script)
    script.remove()
})()
