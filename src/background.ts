import browser from "webextension-polyfill";

// Replace Firefox Playback URL with LGTV Playback URL to get CBR Encode
browser.webRequest.onBeforeRequest.addListener(
    (details) => {
        const originalUrl = details.url;

        const pattern = /playback\/v3\/([^/]+)\/web\/firefox\/play/;
        const match = originalUrl.match(pattern);

        if (match) {
            const id = match[1];
            const newUrl = `https://www.crunchyroll.com/playback/v3/${id}/tv/lg/play`;

            console.log(`Redirecting from: ${originalUrl} to: ${newUrl}`);

            return { redirectUrl: newUrl };
        }

        return {};
    },
    {
        urls: ["*://www.crunchyroll.com/playback/v3/*/web/firefox/play"],
        types: ["xmlhttprequest", "main_frame", "sub_frame"],
    },
    ["blocking"]
);
