# Chrome Web Store submission copy

## Product details

**Name:** Rofi Browser Controller

**Summary:** Control Chromium tabs, browsing history, and downloads through a local Rofi menu.

**Category:** Productivity

**Language:** English

## Detailed description

Rofi Browser Controller connects Chromium to Rofi on Linux, providing a fast keyboard-driven way
to navigate your browser without adding an in-page user interface.

Features:

- Search and activate open tabs.
- Search recent browsing history and open a result.
- Search history limited to the current website.
- Return to the previously active tab.
- List completed downloads, copy a path, or open a selected file.
- Launch every command from the toolbar popup or configurable extension shortcuts.

The extension requires the companion native messaging host and Rofi. All browser information stays
on the user's computer. There is no telemetry, account, advertising, or remote service.

Source code and native-host installation instructions:
https://github.com/amosbird/rofi-chrome

## Single purpose

Provide a local Rofi interface for navigating Chromium tabs, browsing history, and downloaded files.

## Permission justifications

### nativeMessaging

Required to send the menu entries to the locally installed Rofi Browser Controller host and receive
the user's selected result. The native host runs only on the user's computer.

### tabs

Required to read open-tab titles and URLs, activate the selected tab, track the previously active
tab, and change the current tab to a selected history URL.

### history

Required to let the user search and reopen recently visited pages, including pages from the current
website. History is processed locally and is not retained by the extension.

### downloads

Required to list completed download filenames and local paths, and to react when a download
finishes. The selected path is passed only to the local native host.

## Remote code

**No.** The extension does not execute remote code. All JavaScript and CSS are included in the
submitted package.

## User-data disclosure

Disclose the following data types in the Privacy practices tab:

- Web history: titles, URLs, and visit times.
- Website content: tab titles and URLs (metadata only; page contents are not read).
- User activity: open-tab and download metadata used for the requested local menu.

Certifications:

- Data is used only for the extension's single purpose.
- Data is not sold or transferred to third parties.
- Data is not used or transferred for advertising, creditworthiness, or lending.
- Human access to user data is not provided.

Privacy policy URL:
https://amosbird.github.io/rofi-chrome/privacy

## Test instructions for reviewers

Platform: Linux with Chromium, Python 3, and Rofi.

1. Open the release page:
   https://github.com/amosbird/rofi-chrome/releases/tag/v1.2.0
2. Download and extract `rofi-chrome-host-1.2.0.tar.gz`.
3. Run:

   ```bash
   ./scripts/install.sh --extension-id ITEM_ID_FROM_DASHBOARD
   ```

4. Restart Chromium.
5. Click the extension toolbar icon. It should report `Local host connected`.
6. Open several tabs, click **Switch tab**, and select one in Rofi.
7. Click **Browse history** and select a result.
8. Click **Downloads** after downloading a file.

No account or test credentials are required. If the review environment cannot run a graphical Linux
Rofi session, the complete native-host source and protocol are available in the linked public
repository; the toolbar popup still exposes and documents every command.

## Distribution

- Visibility: Public
- Regions: All regions
- Pricing: Free
