import { readFile, writeFile, mkdir } from 'fs/promises'
import { resolve, dirname } from 'path'

const packagePath = resolve('package.json')
const manifestPath = resolve('dist', 'manifest.json')

async function generateManifest() {
    const packageraw = await readFile(packagePath, 'utf-8')
    const packagejson = JSON.parse(packageraw)
    const version = packagejson.version || '0.0.0'

    const manifest = {
        manifest_version: 3,
        name: 'CrOptix',
        version: version,
        description: 'Crunchyroll improvements and fixes',
        permissions: ['declarativeNetRequest'],
        host_permissions: ['*://*.crunchyroll.com/*'],
        web_accessible_resources: [
            {
                resources: ['bundle.js'],
                matches: ['*://static.crunchyroll.com/*']
            }
        ],
        icons: {
            '16': 'icons/icon_16x16.png',
            '32': 'icons/icon_32x32.png',
            '48': 'icons/icon_48x48.png',
            '128': 'icons/icon_128x128.png'
        },
        action: {
            default_icon: {
                '16': 'icons/icon_16x16.png',
                '32': 'icons/icon_32x32.png',
                '48': 'icons/icon_48x48.png',
                '128': 'icons/icon_128x128.png'
            },
            default_title: 'CrOptix'
        },
        declarative_net_request: {
            rule_resources: [
                {
                    id: 'redirectRules',
                    enabled: true,
                    path: 'rules.json'
                }
            ]
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
