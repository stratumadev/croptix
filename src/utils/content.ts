import browser from './browser'
// import { CrunchyAuth } from '../types/crunchy'
let crunchyroll_observer: MutationObserver | null = null
// let crunchyroll_listener: ((e: MessageEvent) => void) | null = null
let focused_player_element: HTMLElement | null = null

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

function is_text_input_active() {
    const active_element = document.activeElement

    return (
        active_element instanceof HTMLInputElement ||
        active_element instanceof HTMLTextAreaElement ||
        active_element instanceof HTMLSelectElement ||
        (active_element instanceof HTMLElement && active_element.isContentEditable)
    )
}

// Focusing Katamari for hotkeys to work properly
function focus_crunchyroll_player() {
    if (is_text_input_active()) return

    const player_container = document.querySelector<HTMLElement>('#player-container, .player-container')
    const player_focus_target = player_container?.children[1] as HTMLElement | undefined
    const focus_target = player_focus_target ?? player_container

    if (!focus_target || focused_player_element === focus_target || document.activeElement === focus_target) return

    if (!focus_target.hasAttribute('tabindex')) {
        focus_target.tabIndex = -1
    }

    focus_target.focus({ preventScroll: true })
    focused_player_element = focus_target
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
        focus_crunchyroll_player()
    } else {
        document.documentElement.classList.remove('croptix-player')
        focused_player_element = null
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
            focus_crunchyroll_player()
        } else {
            document.documentElement.classList.remove('croptix-player')
            focused_player_element = null
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
