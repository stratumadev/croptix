import { readFile, writeFile, mkdir, cp } from 'fs/promises'
import { resolve, dirname } from 'path'

const packagePath = resolve('package.json')
const manifestPath = resolve('dist', 'manifest.json')

async function generateManifest() {
    const packageraw = await readFile(packagePath, 'utf-8')
    const packagejson = JSON.parse(packageraw)
    const version = packagejson.version || '0.0.0'

    const manifest = {
        manifest_version: 2,
        name: 'Crunchyroll Enhancer – CrOptix',
        version: version,
        description: 'Crunchyroll improvements and fixes',
        permissions: ['storage', 'webRequest', 'webRequestBlocking', '*://*.crunchyroll.com/*'],
        icons: {
            '16': 'icons/icon_16x16.png',
            '32': 'icons/icon_32x32.png',
            '48': 'icons/icon_48x48.png',
            '128': 'icons/icon_128x128.png'
        },
        browser_action: {
            default_popup: 'popup/popup.html',
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
        web_accessible_resources: ['config_init.js', 'katamari.js', 'subtitle-octopus/*', 'fonts/*'],
        content_scripts: [
            {
                matches: ['*://www.crunchyroll.com/*'],
                js: ['katamari_fix_loader.js', 'subtitle-octopus/subtitles-octopus.js'],
                run_at: 'document_start',
                all_frames: true
            },
            {
                matches: ['*://*.crunchyroll.com/*'],
                js: ['content.js'],
                css: ['css/croptix.css', 'css/croptix-player.css', 'css/croptix-katamari.css'],
                all_frames: true
            }
        ]
    }

    await mkdir(dirname(manifestPath), { recursive: true })
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')
    console.log(`manifest.json generated, version`, version)

    await cp('public', 'dist', { recursive: true })
    console.log('Copied public folder into dist')

    await cp('subtitle-octopus', 'dist/subtitle-octopus', { recursive: true })
    console.log('Copied subtitle octopus folder into dist')

    await cp('fonts', 'dist/fonts', { recursive: true })
    console.log('Copied fonts folder into dist')
}

generateManifest()
