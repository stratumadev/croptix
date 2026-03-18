const ext = typeof browser !== 'undefined' ? browser : chrome
const toggleDesign = document.getElementById('toggleDesign')
const togglePlayerButtons = document.getElementById('togglePlayerButtons')

async function loadSettings() {
    const result = await ext.storage.local.get(['designEnabled', 'playerButtonsEnabled'])
    toggleDesign.checked = result.designEnabled !== false
    togglePlayerButtons.checked = result.playerButtonsEnabled !== false
}

function saveSetting(key, value) {
    ext.storage.local.set({ [key]: value })
}

toggleDesign.addEventListener('change', () => saveSetting('designEnabled', toggleDesign.checked))
togglePlayerButtons.addEventListener('change', () => saveSetting('playerButtonsEnabled', togglePlayerButtons.checked))
loadSettings()
