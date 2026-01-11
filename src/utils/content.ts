let isMonitoring = false

function removePipAttribute(video: HTMLVideoElement | null) {
    video?.removeAttribute('disablepictureinpicture')
}

function createPipControl() {
    const fullscreenBtn = document.querySelector('[data-testid="vilos-fullscreen_button"]') as HTMLElement | null

    if (!fullscreenBtn) return null

    const pipBtn = fullscreenBtn.cloneNode(true) as HTMLElement

    pipBtn.id = 'pipControl'
    pipBtn.setAttribute('aria-label', 'Picture in Picture')
    pipBtn.setAttribute('data-testid', 'vilos-pip_button')

    pipBtn.setAttribute('data-test-state', 'closed')

    const iconDiv = pipBtn.querySelector('div[style*="background-image"]') as HTMLDivElement | null
    const img = pipBtn.querySelector('img') as HTMLImageElement | null

    const pipSvg = encodeURIComponent(
        `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="#fff" 
            d="M2 11V9h3.6L1.3 4.7l1.4-1.4L7 7.6V4h2v7zm2 9q-.825 0-1.412-.587T2 18v-5h2v5h8v2zm16-7V6h-9V4h9q.825 0 1.413.588T22 6v7zm-6 7v-5h8v5z"/>      
    </svg>
  `.trim()
    )

    const dataUrl = `data:image/svg+xml;utf8,${pipSvg}`

    if (iconDiv) iconDiv.style.backgroundImage = `url("${dataUrl}")`
    if (img) img.src = dataUrl

    return pipBtn
}

function addPipControl(controlsContainer: HTMLElement | null, video: HTMLVideoElement | null) {
    if (!controlsContainer || !video) return
    if (document.getElementById('pipControl')) return

    const fullscreenBtn = document.querySelector('[data-testid="vilos-fullscreen_button"]') as HTMLElement | null
    if (!fullscreenBtn) return

    const pipControl = createPipControl()
    if (!pipControl) return

    fullscreenBtn.parentElement?.insertBefore(pipControl, fullscreenBtn)

    const hoverEl = pipControl.querySelector('.r-b1u33m.r-1ozmr9b') as HTMLElement | null
    if (hoverEl) {
        pipControl.addEventListener('mouseenter', () => {
            hoverEl.style.backgroundColor = 'rgba(0,0,0,0.6)'
        })

        pipControl.addEventListener('mouseleave', () => {
            hoverEl.style.backgroundColor = ''
        })
    }

    removePipAttribute(video)

    pipControl.addEventListener('click', (e) => {
        e.stopImmediatePropagation()
        if (!document.pictureInPictureEnabled) return

        if (document.pictureInPictureElement) {
            void document.exitPictureInPicture()
        } else {
            void video.requestPictureInPicture()
        }
    })
}

function startVideoControlsMonitor() {
    if (isMonitoring) return

    const monitor = new MutationObserver(() => {
        if (navigator.userAgent.toLowerCase().includes('firefox')) return
        const video = document.getElementById('player0') as HTMLVideoElement | null
        if (!video) return

        const controlsContainer = document.getElementById('vilosControlsContainer') as HTMLElement | null
        if (!controlsContainer) return

        const pipControl = document.getElementById('pipControl')
        if (pipControl) return

        addPipControl(controlsContainer, video)
    })

    monitor.observe(document.body, {
        childList: true,
        subtree: true
    })
    isMonitoring = true
}

startVideoControlsMonitor()
