# CrOptix Privacy Policy

**Effective date: August 23, 2026**

CrOptix is a browser extension that changes the Crunchyroll website and player. This policy describes data handled by the extension itself. Crunchyroll's own website, player, and services remain governed by Crunchyroll's privacy policy.

## Summary

* CrOptix does not operate a server and does not collect analytics, advertising identifiers, or telemetry for the developer.
* Extension settings are stored locally in the browser.
* CrOptix uses the AniList API to provide AniList Trending data.
* CrOptix does not sell personal data.

## Local extension data

CrOptix stores feature preferences, including design-related settings, in the browser's local extension storage. These settings are not sent to the developer. They remain until the user changes them, clears extension storage, or uninstalls the extension.

## Crunchyroll services

CrOptix runs on Crunchyroll and allows Crunchyroll's website and player to communicate with Crunchyroll and Sony services needed for playback, subtitles, images, account features, watch progress, and other requested functionality.

For AniList Trending, CrOptix may make an additional request to Crunchyroll's official content API to retrieve the Crunchyroll objects corresponding to the AniList ranking. Existing Crunchyroll authorization and anonymous-device headers may be reused only for that same-origin Crunchyroll request. They are never sent to AniList or the CrOptix developer.

Crunchyroll and Sony process these requests under their [privacy policies](https://help.crunchyroll.com/hc/en-us/articles/34292052724884-Data-Privacy).

## AniList Trending

CrOptix uses public trending data from the AniList API to replace Crunchyroll's popularity order with the corresponding AniList ranking. This functionality is enabled by default and is part of CrOptix's operation.

When AniList Trending is used, the browser sends AniList:

* a predefined GraphQL query;
* pagination values needed to load the public ranking; and
* technical connection information normally present in a web request, such as the IP address and standard HTTP headers.

The request origin or timing may allow AniList to infer that Crunchyroll or CrOptix is being used.

CrOptix does not send AniList Crunchyroll account details, viewing history, the currently watched title, search terms, Crunchyroll authorization headers, AniList credentials, or extension settings. AniList requests use no cookies or credentials and no page referrer.

AniList results are cached only in the current page's memory. They become stale after 15 minutes and are not placed in persistent extension storage or sent to the developer.

AniList and its infrastructure process connection data under the [AniList Privacy Policy](https://www.iubenda.com/privacy-policy/909656).

## Data transmission and control

AniList Trending is an integrated part of CrOptix and is active whenever the extension is in use. Using CrOptix therefore involves the AniList requests described above when the AniList Trending functionality is loaded or used.

Users who do not want CrOptix to make these AniList requests can stop using or uninstall the extension.

## Data sharing, sale, and retention

The developer does not receive or retain the data described above. Data is sent only to Crunchyroll/Sony as required for Crunchyroll functionality and to AniList for the trending functionality.

The developer does not sell data or use it for advertising, profiling, credit decisions, or unrelated purposes.

## User choices and requests

Users can clear CrOptix's local storage or uninstall CrOptix. Because the developer does not operate a collection server, the developer has no server-side user record to access or delete.

Requests concerning data held by Crunchyroll/Sony or AniList must be directed to those services.

Questions about this policy can be submitted through the [CrOptix support repository](https://github.com/stratumadev/croptix/issues). Do not include passwords, authentication tokens, or other sensitive information in a public issue.

## Changes

This policy will be updated when CrOptix's data practices change. The effective date at the top identifies the latest revision.
