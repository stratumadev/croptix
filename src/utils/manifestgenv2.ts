import { readFile, writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";

const packagePath = resolve("package.json");
const manifestPath = resolve("dist", "manifest.json");

async function generateManifest() {
    const packageraw = await readFile(packagePath, "utf-8");
    const packagejson = JSON.parse(packageraw);
    const version = packagejson.version || "0.0.0";

    const manifest = {
        manifest_version: 2,
        name: "CrOptix",
        version: version,
        description: "Crunchyroll CBR Stream forcer",
        permissions: ["storage", "webRequest", "webRequestBlocking"],
        host_permissions: ["*://www.crunchyroll.com/*"],
        background: {
            scripts: ["background.ts"],
        },
        icons: {
            "16": "icons/icon_16x16.png",
            "32": "icons/icon_32x32.png",
            "48": "icons/icon_48x48.png",
            "128": "icons/icon_128x128.png",
        },
        action: {
            default_icon: {
                "16": "icons/icon_16x16.png",
                "32": "icons/icon_32x32.png",
                "48": "icons/icon_48x48.png",
                "128": "icons/icon_128x128.png",
            },
            default_title: "CrOptix",
        },
    };

    await mkdir(dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

    console.log(`manifest.json generated, version`, version);
}

generateManifest();
