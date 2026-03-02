# Privacy Policy for Auto Refresh & Click

**Last Updated: March 2, 2026**

## Overview

Auto Refresh & Click is a Chrome browser extension that auto-refreshes web pages at user-defined intervals and monitors link text to automatically open or bookmark matching links. This privacy policy explains how the extension handles user data.

## Data Collection

**Auto Refresh & Click does not collect, transmit, or share any personal data or browsing information.** The extension operates entirely within your browser and does not communicate with any external servers, analytics services, or third parties.

## Data Stored Locally

The extension stores the following data locally on your device using Chrome's `chrome.storage.local` API. This data never leaves your browser:

| Data | Purpose |
|------|---------|
| **User preferences** | Refresh interval, match keywords, match mode settings, and UI language preference |
| **Running state** | Whether monitoring is currently active, and timing information for the refresh cycle |
| **Visited URLs list** | URLs of previously matched links, used solely to prevent duplicate openings |
| **Match log** | A local log of match and click events for the user's reference |

## Bookmarks

When the user explicitly enables the "Add to Bookmarks" feature, the extension creates bookmark entries for matched links under a dedicated folder. No existing bookmarks are read, modified, or deleted beyond checking for duplicates within the extension's own folder.

## Permissions

The extension requests the following browser permissions, used solely for its core functionality:

- **storage** ！ Save user preferences and operational state locally
- **tabs** ！ Identify, refresh, and open tabs as part of the auto-refresh and auto-open workflow
- **alarms** ！ Schedule reliable periodic page refreshes via Manifest V3 alarms
- **activeTab** ！ Access the currently active tab when the user initiates monitoring
- **bookmarks** ！ Create bookmarks for matched links when the user enables this option
- **Host permissions (`<all_urls>`)** ！ Inject the content script on any page the user chooses to monitor, since target websites cannot be predetermined

## Third-Party Services

This extension does not use any third-party services, SDKs, analytics, tracking, or advertising frameworks. No network requests are made by the extension.

## Data Sharing

**No data is shared with any third party.** All data remains on the user's local device.

## Data Security

All extension data is stored in Chrome's local storage, protected by the browser's built-in security model. No data is transmitted over the network.

## Children's Privacy

This extension does not knowingly collect any information from children under the age of 13.

## Changes to This Policy

If this privacy policy is updated, the changes will be reflected in this document with an updated "Last Updated" date. Users are encouraged to review this policy periodically.

## Open Source

This extension is open source. You can review the complete source code at:
[https://github.com/piggyy/Auto-Refresh-Chrome-And-Click](https://github.com/piggyy/Auto-Refresh-Chrome-And-Click)

## Contact

If you have any questions about this privacy policy or the extension's data practices, please open an issue on the GitHub repository:
[https://github.com/piggyy/Auto-Refresh-Chrome-And-Click/issues](https://github.com/piggyy/Auto-Refresh-Chrome-And-Click/issues)
