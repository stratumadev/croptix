# CrOptix
<img align="right" width="90" height="90" src="https://lh3.googleusercontent.com/u-7uSBlENExASVjTwS6-5GF5sQOifzfyzlU_EPZjQjI7mgLhoR4eHXqqXPJitFwhwl8QUFLNRMTRqXN976seKcLPWkU=s60">

#### A browser extension that fixes alot of stuff on Crunchyroll.

[<img lign="right" width="150" height="90" src="https://blog.mozilla.org/addons/files/2020/04/get-the-addon-fx-apr-2020.svg" alt="for Firefox" height="60px">](https://addons.mozilla.org/de/firefox/addon/croptix/)
[<img lign="left" width="180" height="100" src="https://i.ibb.co/Fb1jPBTX/206x58-chrome-web-bcb82d15b2486.png" alt="for Chrome" height="60px">](https://chromewebstore.google.com/detail/croptix/cagbhcegcmbdkbflpdfileejdfphojcj)

Features:
- Replaces the new Katamari player with the classic Vilos player
- Re-enables the video quality selector (resolution picker)
- Brings back the old CBR encodes (only on Firefox/MV2)
- Modernized Crunchyroll design / UI improvements
- More playback speed options
- Theater mode for distraction-free watching
- Picture-in-Picture support (no-subs only)

## Setup

Make sure to install dependencies:

```bash
bun install
```

## Development (Manifest V2)
```bash
bun run dev:v2
```

## Development (Manifest V3)
```bash
bun run dev:v3
```

## Build Extension (Manifest V2)
```bash
bun run build:v2
```

## Build Extension (Manifest V3)
```bash
bun run build:v3
```
