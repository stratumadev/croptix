const ext = typeof browser !== 'undefined' ? browser : chrome
const toggleDesign = document.getElementById('toggleDesign')
const togglePlayerButtons = document.getElementById('togglePlayerButtons')
const toggleCBRBypass = document.getElementById('toggleCBRBypass')

function isMV2Browser() {
    return typeof browser !== 'undefined' && typeof browser.webRequest !== 'undefined' && typeof browser.webRequest.filterResponseData === 'function'
}

async function loadSettings() {
    const result = await ext.storage.local.get(['designEnabled', 'playerButtonsEnabled', 'tvAuthEnabled'])

    toggleDesign.checked = result.designEnabled !== false
    togglePlayerButtons.checked = result.playerButtonsEnabled !== false

    if (!isMV2Browser()) {
        tvAuthContainer.style.display = 'none'
        return
    }

    toggleCBRBypass.checked = result.tvAuthEnabled !== false
}

function saveSetting(key, value) {
    ext.storage.local.set({ [key]: value })
}

toggleDesign.addEventListener('change', () => saveSetting('designEnabled', toggleDesign.checked))
togglePlayerButtons.addEventListener('change', () => saveSetting('playerButtonsEnabled', togglePlayerButtons.checked))
toggleCBRBypass.addEventListener('change', () => saveSetting('tvAuthEnabled', toggleCBRBypass.checked))
loadSettings()
