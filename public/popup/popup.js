const ext = typeof browser !== 'undefined' ? browser : chrome
const toggleDesign = document.getElementById('toggleDesign')

async function loadSettings() {
    const result = await ext.storage.local.get(['designEnabled'])
    toggleDesign.checked = result.designEnabled !== false
}

function saveSetting(key, value) {
    ext.storage.local.set({ [key]: value })
}

toggleDesign.addEventListener('change', () => saveSetting('designEnabled', toggleDesign.checked))
loadSettings()
