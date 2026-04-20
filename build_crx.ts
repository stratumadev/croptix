import { $ } from 'bun'
import pkg from './package.json'

const outName = `crunchyroll_enhancer_croptix-${pkg.version}`
await $`mkdir -p build`
await $`bunx crx3 -p build/key.pem -o build/${outName}.crx -z build/${outName}.zip dist`
