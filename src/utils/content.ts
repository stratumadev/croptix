import browser from './browser'
// import { CrunchyAuth } from '../types/crunchy'
const is_vilos: boolean = window.top !== window
let crunchyroll_observer: MutationObserver | null = null
let crunchyroll_listener: ((e: MessageEvent) => void) | null = null
let vilos_observer: MutationObserver | null = null

// let tv_auth: boolean = false
// let tv_auth_running: boolean = false
// let tv_auth_refresh_running: boolean = false

// Throttle utility - limits function execution to once per interval
function throttle<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
    let lastCall = 0
    return ((...args: unknown[]) => {
        const now = Date.now()
        if (now - lastCall >= ms) {
            lastCall = now
            fn(...args)
        }
    }) as T
}

// Listener to communicate between vilos and crunchyroll
function setup_listener_crunchyroll() {
    if (!is_vilos || crunchyroll_listener) return

    crunchyroll_listener = (e: MessageEvent) => {
        if (!e.data?.type) return

        if (e.data.type === 'CROPIX_TOGGLE_THEATER') {
            document.documentElement.classList.toggle('cropix-theater')
        }
    }

    window.addEventListener('message', crunchyroll_listener)
}

// Remove Listener
function remove_listener_crunchyroll() {
    if (!crunchyroll_listener) return

    window.removeEventListener('message', crunchyroll_listener)
    crunchyroll_listener = null
}

// Create a new vilos control (will appear on the left of the fullscreen button)
function create_new_control_vilos(btn: { id: string; label: string; svg: string }) {
    const fullscreenBtn = document.querySelector('[data-testid="vilos-fullscreen_button"]') as HTMLElement | null
    if (!fullscreenBtn) return null

    const pipBtn = fullscreenBtn.cloneNode(true) as HTMLElement

    pipBtn.id = btn.id
    pipBtn.setAttribute('aria-label', btn.label)
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
function add_new_control_vilos(controls_container: HTMLElement | null, video: HTMLVideoElement | null, btn: { id: string; label: string; svg: string }) {
    if (!controls_container || !video) return
    if (document.getElementById(btn.id)) return

    const fullscreen_button = document.querySelector('[data-testid="vilos-fullscreen_button"]') as HTMLElement | null
    if (!fullscreen_button) return

    const new_control = create_new_control_vilos(btn)
    if (!new_control) return

    fullscreen_button.parentElement?.insertBefore(new_control, fullscreen_button)

    const hover = new_control.querySelector('.r-b1u33m.r-1ozmr9b') as HTMLElement | null
    if (hover) {
        new_control.addEventListener('mouseenter', () => {
            hover.style.backgroundColor = 'rgba(0,0,0,0.6)'
        })

        new_control.addEventListener('mouseleave', () => {
            hover.style.backgroundColor = ''
        })
    }

    return new_control
}

// Observer Main - throttled to max 10 executions per second
function start_observe_crunchyroll() {
    if (crunchyroll_observer || is_vilos) return

    const player = document.querySelector('.video-player')
    if (player) {
        document.documentElement.classList.add('cropix-player')
    } else {
        document.documentElement.classList.remove('cropix-player')
    }

    const handle_crunchyroll_mutation = throttle(() => {
        // Player Class Toggle
        const player = document.querySelector('.video-player')
        if (player) {
            document.documentElement.classList.add('cropix-player')
        } else {
            document.documentElement.classList.remove('cropix-player')
        }
    }, 100)

    crunchyroll_observer = new MutationObserver(handle_crunchyroll_mutation)
    crunchyroll_observer.observe(document.body, {
        childList: true,
        subtree: true
    })
}

// Remove Crunchyroll observer
function stop_observe_crunchyroll() {
    if (crunchyroll_observer) {
        crunchyroll_observer.disconnect()
        crunchyroll_observer = null
    }

    document.documentElement.classList.remove('cropix-player')
}

// Observer Iframe
function start_observe_vilos() {
    if (vilos_observer || !is_vilos) return

    const handle_vilos_mutation = throttle(() => {
        if (document.getElementById('vilos-pip_button')) return

        const video = document.getElementById('player0') as HTMLVideoElement | null
        if (!video) return

        const controls_container = document.getElementById('vilosControlsContainer') as HTMLElement | null
        if (!controls_container) return

        add_pip_control(controls_container, video)
        add_theater_control(controls_container, video)
    }, 20)

    vilos_observer = new MutationObserver(handle_vilos_mutation)
    vilos_observer.observe(document.body, {
        childList: true,
        subtree: true
    })
}

// Remove Vilos observer
function stop_observe_vilos() {
    if (vilos_observer) {
        vilos_observer.disconnect()
        vilos_observer = null
    }

    document.getElementById('vilos-pip_button')?.remove()
    document.getElementById('vilos-theater_button')?.remove()
}

function add_pip_control(controls_container: HTMLElement | null, video: HTMLVideoElement | null) {
    if (navigator.userAgent.toLowerCase().includes('firefox')) return

    const el = add_new_control_vilos(controls_container, video, {
        id: 'vilos-pip_button',
        label: 'Picture in Picture',
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

function add_theater_control(controls_container: HTMLElement | null, video: HTMLVideoElement | null) {
    const el = add_new_control_vilos(controls_container, video, {
        id: 'vilos-theater_button',
        label: 'Theater mode',
        svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M21.20 3.01L21 3H3L2.79 3.01C2.30 3.06 1.84 3.29 1.51 3.65C1.18 4.02 .99 4.50 1 5V19L1.01 19.20C1.05 19.66 1.26 20.08 1.58 20.41C1.91 20.73 2.33 20.94 2.79 20.99L3 21H21L21.20 20.98C21.66 20.94 22.08 20.73 22.41 20.41C22.73 20.08 22.94 19.66 22.99 19.20L23 19V5C23.00 4.50 22.81 4.02 22.48 3.65C22.15 3.29 21.69 3.06 21.20 3.01ZM3 15V5H21V15H3ZM7.87 6.72L7.79 6.79L4.58 10L7.79 13.20C7.88 13.30 7.99 13.37 8.11 13.43C8.23 13.48 8.37 13.51 8.50 13.51C8.63 13.51 8.76 13.48 8.89 13.43C9.01 13.38 9.12 13.31 9.21 13.21C9.31 13.12 9.38 13.01 9.43 12.89C9.48 12.76 9.51 12.63 9.51 12.50C9.51 12.37 9.48 12.23 9.43 12.11C9.37 11.99 9.30 11.88 9.20 11.79L7.41 10L9.20 8.20L9.27 8.13C9.42 7.93 9.50 7.69 9.48 7.45C9.47 7.20 9.36 6.97 9.19 6.80C9.02 6.63 8.79 6.52 8.54 6.51C8.30 6.49 8.06 6.57 7.87 6.72ZM14.79 6.79C14.60 6.98 14.50 7.23 14.50 7.5C14.50 7.76 14.60 8.01 14.79 8.20L16.58 10L14.79 11.79L14.72 11.86C14.57 12.06 14.49 12.30 14.50 12.54C14.51 12.79 14.62 13.02 14.79 13.20C14.97 13.37 15.20 13.48 15.45 13.49C15.69 13.50 15.93 13.42 16.13 13.27L16.20 13.20L19.41 10L16.20 6.79C16.01 6.60 15.76 6.50 15.5 6.50C15.23 6.50 14.98 6.60 14.79 6.79ZM3 19V17H21V19H3Z"></path></svg>'
    })
    if (!el) return

    el.addEventListener('click', (e) => {
        e.stopImmediatePropagation()
        window.top?.postMessage({ type: 'CROPIX_TOGGLE_THEATER' }, 'https://www.crunchyroll.com')
    })
}

// browser.runtime.onMessage.addListener(async (msg: any) => {
//     if (msg.type === 'BEARER_UPDATED') {
//         await run_tv_auth(msg.access_token, msg.account_id)
//     }
// })

// async function init_tv_auth() {
//     const { cr_tv_auth } = (await browser.storage.local.get(['cr_tv_auth'])) as {
//         cr_tv_auth?: CrunchyAuth
//     }
//     if (!tv_auth || !cr_tv_auth) return

//     if (is_tv_auth_expired(cr_tv_auth)) {
//         await refresh_tv_auth()
//     }

//     schedule_refresh()
// }

// async function schedule_refresh() {
//     const { cr_tv_auth } = (await browser.storage.local.get(['cr_tv_auth'])) as {
//         cr_tv_auth?: CrunchyAuth
//     }
//     if (!tv_auth || !cr_tv_auth) return

//     const expiresAt = cr_tv_auth.createdAt + cr_tv_auth.expires_in * 1000
//     const refreshAt = expiresAt - 60000
//     const delay = refreshAt - Date.now()

//     setTimeout(
//         async () => {
//             await refresh_tv_auth()
//             schedule_refresh()
//         },
//         Math.max(delay, 10000)
//     )
// }

// function is_tv_auth_expired(tv_auth: CrunchyAuth) {
//     if (!tv_auth) return true

//     const created = tv_auth.createdAt
//     const expires = tv_auth.expires_in * 1000

//     const now = Date.now()
//     return now > created + expires - 30000
// }

// async function refresh_tv_auth() {
//     tv_auth_refresh_running = true

//     const { cr_tv_auth } = (await browser.storage.local.get(['cr_tv_auth'])) as any
//     if (!cr_tv_auth) {
//         tv_auth_refresh_running = false
//         return
//     }

//     try {
//         const data = new URLSearchParams({
//             refresh_token: cr_tv_auth.refresh_token,
//             grant_type: 'refresh_token',
//             device_id: cr_tv_auth.device_token,
//             device_name: 'emu64xa',
//             device_type: 'ANDROIDTV'
//         })
//         const refresh = await fetch('https://www.crunchyroll.com/auth/v1/token', {
//             method: 'POST',
//             headers: {
//                 'User-Agent': 'Crunchyroll/ANDROIDTV/3.58.0_22336 (Android 12; en-US; SHIELD Android TV Build/SR1A.211012.001)',
//                 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
//                 Authorization: 'Basic bzd1b3d5N3E0bGdsdGJhdnloanE6bHFyakVUTng2Vzd1Um5wY0RtOHdSVmo4QkNoakMxZXI='
//             },
//             body: data
//         }).then((r) => r.json())

//         if (!refresh.access_token && refresh.error) {
//             console.warn('TV Auth refresh failed. Deleting stored auth...')

//             await browser.storage.local.remove('cr_tv_auth')
//             tv_auth_running = false
//             return
//         }

//         if (!refresh.access_token) {
//             console.error('Failed to refresh TV Auth', refresh)
//             tv_auth_running = false
//             return
//         }

//         await browser.storage.local.set({
//             cr_tv_auth: {
//                 createdAt: Date.now(),
//                 device_token: cr_tv_auth.device_code,
//                 ...refresh
//             }
//         })

//         console.log('TV Auth refresh successful')
//     } catch (e) {
//         console.error('TV Auth Refresh Error', e)
//     } finally {
//         tv_auth_refresh_running = false
//     }
// }

// async function run_tv_auth(web_auth: string, account_id: string | undefined) {
//     if (!tv_auth || tv_auth_running) return
//     if (web_auth && !account_id) {
//         console.warn('TV Auth standby, not logged in.')
//         await browser.storage.local.remove('cr_tv_auth')
//         return
//     }
//     tv_auth_running = true

//     const { cr_tv_auth } = (await browser.storage.local.get(['cr_tv_auth'])) as {
//         cr_tv_auth?: CrunchyAuth
//     }
//     if (cr_tv_auth && account_id && cr_tv_auth.account_id === account_id) {
//         tv_auth_running = false
//         return
//     }

//     if (cr_tv_auth && account_id && cr_tv_auth.account_id !== account_id) {
//         console.warn('Detected new user, creating new tv auth...')
//         await browser.storage.local.remove('cr_tv_auth')
//     }

//     console.log('Started TV Auth process...')
//     try {
//         const device = await fetch('https://www.crunchyroll.com/auth/v1/device/code', {
//             method: 'POST',
//             headers: {
//                 'User-Agent': 'Crunchyroll/ANDROIDTV/3.58.0_22336 (Android 12; en-US; SHIELD Android TV Build/SR1A.211012.001)',
//                 Authorization: 'Basic bzd1b3d5N3E0bGdsdGJhdnloanE6bHFyakVUTng2Vzd1Um5wY0RtOHdSVmo4QkNoakMxZXI='
//             }
//         }).then((r) => r.json())
//         if (!device) {
//             tv_auth_running = false
//             console.error('Failed to get device auth code')
//             return
//         }

//         const account_auth = await fetch('https://www.crunchyroll.com/auth/v1/device', {
//             method: 'POST',
//             headers: {
//                 Authorization: `Bearer ${web_auth}`,
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 user_code: device.user_code
//             })
//         }).then((r) => r.json())
//         if (!account_auth) {
//             tv_auth_running = false
//             console.error('Failed to authorize new device')
//             return
//         }

//         let attempts = 0
//         while (attempts < 5) {
//             attempts++

//             const data = await fetch('https://www.crunchyroll.com/auth/v1/device/token', {
//                 method: 'POST',
//                 headers: {
//                     'User-Agent': 'Crunchyroll/ANDROIDTV/3.58.0_22336 (Android 12; en-US; SHIELD Android TV Build/SR1A.211012.001)',
//                     Authorization: 'Basic bzd1b3d5N3E0bGdsdGJhdnloanE6bHFyakVUTng2Vzd1Um5wY0RtOHdSVmo4QkNoakMxZXI=',
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({
//                     device_code: device.device_code
//                 })
//             }).then((r) => r.json())

//             if (data.access_token) {
//                 await browser.storage.local.set({
//                     cr_tv_auth: {
//                         createdAt: Date.now(),
//                         device_token: device.device_code,
//                         ...data
//                     }
//                 })
//                 console.log('Got TV Auth')
//                 break
//             }

//             await new Promise((r) => setTimeout(r, device.interval * 1000 || 5000))
//         }
//     } catch (e) {
//         console.error('TV Auth Error', e)
//     } finally {
//         tv_auth_running = false
//     }
// }

async function load_settings() {
    // Load settings
    if (!is_vilos) {
        const settings = await browser.storage.local.get(['designEnabled', 'tvAuthEnabled'])

        const crunchyroll_design = settings.designEnabled !== false
        if (crunchyroll_design) {
            // Inject custom design
            document.documentElement.classList.add('cropix')
            // Start crunchyroll listener
            setup_listener_crunchyroll()
            // Start custom player design listener
            start_observe_crunchyroll()
        } else {
            document.documentElement.classList.remove('cropix')
            // Remove crunchyroll listener
            remove_listener_crunchyroll()
            // Stop custom player design listener
            stop_observe_crunchyroll()
        }

        // tv_auth = settings.tvAuthEnabled !== false
        // // Only enable tv auth (CBR bypass) on firefox (manifest v2)
        // if (tv_auth) {
        //     await init_tv_auth()
        // }
    } else {
        const settings = await browser.storage.local.get(['playerButtonsEnabled'])

        const player = settings.playerButtonsEnabled !== false
        if (player) {
            start_observe_vilos()
        } else {
            stop_observe_vilos()
        }
    }
}

// Set default vilos class
if (is_vilos) {
    document.documentElement.classList.add('cropix-vilos')
}

load_settings()
browser.storage.onChanged.addListener(load_settings)
