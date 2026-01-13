import { readFile, writeFile, mkdir } from 'fs/promises'
import { resolve, dirname } from 'path'

const packagePath = resolve('package.json')
const manifestPath = resolve('dist', 'manifest.json')

async function generateManifest() {
    const packageraw = await readFile(packagePath, 'utf-8')
    const packagejson = JSON.parse(packageraw)
    const version = packagejson.version || '0.0.0'

    const manifest = {
        manifest_version: 2,
        name: 'CrOptix – Enhancements for Crunchyroll',
        version: version,
        description: 'Crunchyroll improvements and fixes',
        permissions: ['webRequest', 'webRequestBlocking', '*://*.crunchyroll.com/*'],
        background: {
            scripts: ['background.js']
        },
        icons: {
            '16': 'icons/icon_16x16.png',
            '32': 'icons/icon_32x32.png',
            '48': 'icons/icon_48x48.png',
            '128': 'icons/icon_128x128.png'
        },
        browser_action: {
            default_icon: {
                '16': 'icons/icon_16x16.png',
                '32': 'icons/icon_32x32.png',
                '48': 'icons/icon_48x48.png',
                '128': 'icons/icon_128x128.png'
            },
            default_title: 'CrOptix'
        },
        browser_specific_settings: {
            gecko: {
                id: '{bc118c9c-5c07-4347-b502-657d03d87065}',
                data_collection_permissions: {
                    required: ['none']
                }
            }
        },
        content_scripts: [
            {
                matches: ['*://*.crunchyroll.com/*'],
                js: ['content.js'],
                all_frames: true
            }
        ]
    }

    await mkdir(dirname(manifestPath), { recursive: true })
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')

    console.log(`manifest.json generated, version`, version)
}

generateManifest()
