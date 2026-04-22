import browser from './browser'
// import { CrunchyAuth } from '../types/crunchy'
let crunchyroll_observer: MutationObserver | null = null
let crunchyroll_listener: ((e: MessageEvent) => void) | null = null

// let tv_auth: boolean = false
// let tv_auth_running: boolean = false
// let tv_auth_refresh_running: boolean = false

const s = document.createElement('script')
s.src = browser.runtime.getURL('config_init.js')
s.dataset.baseUrl = browser.runtime.getURL('')
;(document.head || document.documentElement).appendChild(s)

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

// Observer Main - throttled to max 10 executions per second
function start_observe_crunchyroll() {
    if (crunchyroll_observer) return

    const katamari = document.querySelector('.player-container')
    const player_wrapper = document.querySelector('video-player-wrapper')
    if (katamari) {
        document.documentElement.classList.add('croptix-player')
        if (player_wrapper) {
            player_wrapper.classList.add('croptix-katamari')
        }
    } else {
        document.documentElement.classList.remove('croptix-player')
    }

    const handle_crunchyroll_mutation = throttle(() => {
        // Player Class Toggle
        const katamari = document.querySelector('.player-container')
        const player_wrapper = document.querySelector('video-player-wrapper')
        if (katamari) {
            document.documentElement.classList.add('croptix-player')
            if (player_wrapper) {
                player_wrapper.classList.add('croptix-katamari')
            }
        } else {
            document.documentElement.classList.remove('croptix-player')
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

    document.documentElement.classList.remove('croptix-player')
}

async function load_settings() {
    // Load settings
    const settings = await browser.storage.local.get(['designEnabled', 'tvAuthEnabled'])

    const crunchyroll_design = settings.designEnabled !== false
    if (crunchyroll_design) {
        // Inject custom design
        document.documentElement.classList.add('croptix')
        // Start custom player design listener
        start_observe_crunchyroll()
    } else {
        document.documentElement.classList.remove('croptix')
        // Stop custom player design listener
        stop_observe_crunchyroll()
    }
}

load_settings()
browser.storage.onChanged.addListener(load_settings)
