let isMonitoringMain = false
let isMonitoringIframe = false
const isTop = window.top === window

// Listener to communicate between iframe and site
function setupListenerTop() {
    if (!isTop) return

    window.addEventListener('message', (e) => {
        if (!e.data?.type) return

        switch (e.data.type) {
            case 'CROPIX_TOGGLE_THEATER': {
                document.documentElement.classList.toggle('cropix-theater')
                break
            }
        }
    })
}

// Create a new player control (will appear on the left of the fullscreen button)
function createNewControl(btn: { id: string; lable: string; svg: string }) {
    const fullscreenBtn = document.querySelector('[data-testid="vilos-fullscreen_button"]') as HTMLElement | null
    if (!fullscreenBtn) return null

    const pipBtn = fullscreenBtn.cloneNode(true) as HTMLElement

    pipBtn.id = btn.id
    pipBtn.setAttribute('aria-label', btn.lable)
    pipBtn.setAttribute('data-testid', btn.id)

    pipBtn.setAttribute('data-test-state', 'closed')

    const iconDiv = pipBtn.querySelector('div[style*="background-image"]') as HTMLDivElement | null
    const img = pipBtn.querySelector('img') as HTMLImageElement | null

    const pipSvg = encodeURIComponent(btn.svg.trim())

    const dataUrl = `data:image/svg+xml;utf8,${pipSvg}`

    if (iconDiv) iconDiv.style.backgroundImage = `url("${dataUrl}")`
    if (img) img.src = dataUrl

    return pipBtn
}

// Create a new player control (will appear on the left of the fullscreen button)
function addNewControl(controlsContainer: HTMLElement | null, video: HTMLVideoElement | null, btn: { id: string; lable: string; svg: string }) {
    if (!controlsContainer || !video) return
    if (document.getElementById(btn.id)) return

    const fullscreenBtn = document.querySelector('[data-testid="vilos-fullscreen_button"]') as HTMLElement | null
    if (!fullscreenBtn) return

    const newControl = createNewControl(btn)
    if (!newControl) return

    fullscreenBtn.parentElement?.insertBefore(newControl, fullscreenBtn)

    const hoverEl = newControl.querySelector('.r-b1u33m.r-1ozmr9b') as HTMLElement | null
    if (hoverEl) {
        newControl.addEventListener('mouseenter', () => {
            hoverEl.style.backgroundColor = 'rgba(0,0,0,0.6)'
        })

        newControl.addEventListener('mouseleave', () => {
            hoverEl.style.backgroundColor = ''
        })
    }

    return newControl
}

// Observer Main
function startObserverMain() {
    if (isMonitoringMain || !isTop) return

    const monitor = new MutationObserver(() => {
        // Player Class Toggle
        const player = document.querySelector('.video-player')
        if (player) {
            document.documentElement.classList.add('cropix-player')
        } else {
            document.documentElement.classList.remove('cropix-player')
        }
    })

    monitor.observe(document.body, {
        childList: true,
        subtree: true
    })
    isMonitoringMain = true
}

// Observer Iframe
function startObserverIframe() {
    if (isMonitoringIframe || isTop) return

    const monitor = new MutationObserver(() => {
        const video = document.getElementById('player0') as HTMLVideoElement | null
        if (!video) return

        const controlsContainer = document.getElementById('vilosControlsContainer') as HTMLElement | null
        if (!controlsContainer) return

        pipControl(controlsContainer, video)
        theaterControl(controlsContainer, video)
    })

    monitor.observe(document.body, {
        childList: true,
        subtree: true
    })
    isMonitoringIframe = true
}

function pipControl(controlsContainer: HTMLElement | null, video: HTMLVideoElement | null) {
    if (navigator.userAgent.toLowerCase().includes('firefox')) return

    const el = addNewControl(controlsContainer, video, {
        id: 'vilos-pip_button',
        lable: 'Picture in Picture',
        svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M2 11V9h3.6L1.3 4.7l1.4-1.4L7 7.6V4h2v7zm2 9q-.825 0-1.412-.587T2 18v-5h2v5h8v2zm16-7V6h-9V4h9q.825 0 1.413.588T22 6v7zm-6 7v-5h8v5z"/></svg>'
    })
    if (!el) return

    video?.removeAttribute('disablepictureinpicture')

    el.addEventListener('click', (e) => {
        e.stopImmediatePropagation()
        if (!document.pictureInPictureEnabled) return

        if (document.pictureInPictureElement) {
            void document.exitPictureInPicture()
        } else {
            void video?.requestPictureInPicture()
        }
    })
}

function theaterControl(controlsContainer: HTMLElement | null, video: HTMLVideoElement | null) {
    const el = addNewControl(controlsContainer, video, {
        id: 'vilos-theater_button',
        lable: 'Theater mode',
        svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M21.20 3.01L21 3H3L2.79 3.01C2.30 3.06 1.84 3.29 1.51 3.65C1.18 4.02 .99 4.50 1 5V19L1.01 19.20C1.05 19.66 1.26 20.08 1.58 20.41C1.91 20.73 2.33 20.94 2.79 20.99L3 21H21L21.20 20.98C21.66 20.94 22.08 20.73 22.41 20.41C22.73 20.08 22.94 19.66 22.99 19.20L23 19V5C23.00 4.50 22.81 4.02 22.48 3.65C22.15 3.29 21.69 3.06 21.20 3.01ZM3 15V5H21V15H3ZM7.87 6.72L7.79 6.79L4.58 10L7.79 13.20C7.88 13.30 7.99 13.37 8.11 13.43C8.23 13.48 8.37 13.51 8.50 13.51C8.63 13.51 8.76 13.48 8.89 13.43C9.01 13.38 9.12 13.31 9.21 13.21C9.31 13.12 9.38 13.01 9.43 12.89C9.48 12.76 9.51 12.63 9.51 12.50C9.51 12.37 9.48 12.23 9.43 12.11C9.37 11.99 9.30 11.88 9.20 11.79L7.41 10L9.20 8.20L9.27 8.13C9.42 7.93 9.50 7.69 9.48 7.45C9.47 7.20 9.36 6.97 9.19 6.80C9.02 6.63 8.79 6.52 8.54 6.51C8.30 6.49 8.06 6.57 7.87 6.72ZM14.79 6.79C14.60 6.98 14.50 7.23 14.50 7.5C14.50 7.76 14.60 8.01 14.79 8.20L16.58 10L14.79 11.79L14.72 11.86C14.57 12.06 14.49 12.30 14.50 12.54C14.51 12.79 14.62 13.02 14.79 13.20C14.97 13.37 15.20 13.48 15.45 13.49C15.69 13.50 15.93 13.42 16.13 13.27L16.20 13.20L19.41 10L16.20 6.79C16.01 6.60 15.76 6.50 15.5 6.50C15.23 6.50 14.98 6.60 14.79 6.79ZM3 19V17H21V19H3Z"></path></svg>'
    })
    if (!el) return

    el.addEventListener('click', (e) => {
        e.stopImmediatePropagation()
        window.top?.postMessage({ type: 'CROPIX_TOGGLE_THEATER' }, '*')
    })
}

document.documentElement.classList.add('cropix')

setupListenerTop()
startObserverMain()
startObserverIframe()
