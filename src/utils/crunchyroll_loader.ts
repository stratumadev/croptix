import browser from './browser'

;(() => {
    if (document.documentElement.hasAttribute('croptix-page-script')) return

    const script = document.createElement('script')
    script.src = browser.runtime.getURL('crunchyroll.js')
    script.dataset.croptix = '1'
    script.onload = script.onerror = () => script.remove()

    document.documentElement.setAttribute('croptix-page-script', '1')
    ;(document.head || document.documentElement).appendChild(script)
})()
