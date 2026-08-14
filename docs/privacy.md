# Privacy Policy for Rofi Browser Controller

_Last updated: August 14, 2026_

Rofi Browser Controller is a local-only browser extension for displaying Chromium tabs, browsing
history, and downloaded files in a Rofi menu on the user's Linux computer.

## Data the extension accesses

The extension accesses only the data needed for its single purpose:

- **Tab titles, URLs, and window identifiers** to list and activate browser tabs.
- **Browsing history titles, URLs, and visit times** to search and reopen recently visited pages.
- **Download filenames, local paths, status, and start times** to list completed downloads and let
  the user copy or open a selected file.

## How data is used

This data is sent through Chromium's Native Messaging API only to the Rofi Browser Controller
native host installed on the same computer. The native host displays the data in Rofi and performs
the action explicitly selected by the user.

## Data collection, sharing, and retention

- No data is transmitted to the developer or to any remote server.
- No telemetry, analytics, advertising, or user accounts are used.
- No user data is sold, rented, shared with third parties, or used for creditworthiness or lending.
- The extension and native host do not create a persistent copy of browser data.
- Data remains in memory only while fulfilling the user's requested local action.

The user may remove all extension access by uninstalling the extension and its native host.

The use of information received from Chrome APIs adheres to the Chrome Web Store User Data Policy,
including the Limited Use requirements.

## Contact

Questions about this policy can be filed at:
https://github.com/amosbird/rofi-chrome/issues
