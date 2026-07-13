const ext = typeof browser !== 'undefined' ? browser : chrome
const toggleDesign = document.getElementById('toggleDesign')
const toggleMobileBypass = document.getElementById('toggleMobileBypass')

async function loadSettings() {
    const result = await ext.storage.local.get([
        'designEnabled',
        'mobileBypassEnabled'
    ]);
    toggleDesign.checked = result.designEnabled !== false
    toggleMobileBypass.checked = result.mobileBypassEnabled === true // default to false
}

function saveSetting(key, value) {
    ext.storage.local.set({ [key]: value })
}

toggleDesign.addEventListener('change', () => saveSetting('designEnabled', toggleDesign.checked))
toggleMobileBypass.addEventListener('change', () => saveSetting('mobileBypassEnabled', toggleMobileBypass.checked))
loadSettings()
