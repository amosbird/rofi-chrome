# Chrome Web Store submission copy

## Product details

**Name:** Rofi Browser Controller

**Summary:** Control Chromium tabs, history, downloads, and bookmarks through local interfaces.

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
- Optionally grant bookmark access to bulk-add raw URLs without visiting them.
- Search existing bookmarks and move or delete selected entries.
- Launch browser commands from the toolbar popup or configurable extension shortcuts.

The extension requires the companion native messaging host and Rofi. All browser information stays
on the user's computer. There is no telemetry, account, advertising, or remote service.

Source code and native-host installation instructions:
https://github.com/amosbird/rofi-chrome

## Single purpose

Provide local interfaces for navigating Chromium tabs, browsing history, downloads, and optional
bookmark management.

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

### bookmarks (optional)

Requested only after the user opens Bookmark Manager and clicks **Enable bookmark access**. It is
used to bulk-add raw HTTP(S) URLs without visiting them, list and search bookmark metadata, create
folders, and move or delete entries explicitly selected by the user. Bookmark data remains in
Chromium and is never sent to the native host or a remote service.

## Remote code

**No.** The extension does not execute remote code. All JavaScript and CSS are included in the
submitted package.

## User-data disclosure

Disclose the following data types in the Privacy practices tab:

- Web history: titles, URLs, and visit times.
- Website content: tab titles and URLs (metadata only; page contents are not read).
- User activity: open-tab and download metadata used for the requested local menu.
- Personal communications or user-provided content: bookmark titles, URLs, and folder paths handled
  locally after optional permission is granted.

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
   https://github.com/amosbird/rofi-chrome/releases/tag/v1.3.0
2. Download and extract `rofi-chrome-host-1.3.0.tar.gz`.
3. Run:

   ```bash
   ./scripts/install.sh --extension-id jpgfhlaplofoaempbhliigmjbpofeghk
   ```

4. Restart Chromium.
5. Click the extension toolbar icon. It should report `Local host connected`.
6. Open several tabs, click **Switch tab**, and select one in Rofi.
7. Click **Browse history** and select a result.
8. Click **Downloads** after downloading a file.
9. Click **Bookmark manager**, then **Enable bookmark access**. Add two raw URLs, search them,
   select one, and test moving it to another folder. Delete only a disposable test bookmark.

No account or test credentials are required. If the review environment cannot run a graphical Linux
Rofi session, the complete native-host source and protocol are available in the linked public
repository; the toolbar popup still exposes and documents every command.

## Distribution

- Visibility: Public
- Regions: All regions
- Pricing: Free
