import type { Browser } from 'webextension-polyfill'
declare const chrome: any
declare const browser: Browser
const ext = (typeof browser !== 'undefined' ? browser : chrome) as Browser

export default ext
