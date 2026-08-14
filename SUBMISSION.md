# Chrome Web Store submission checklist

## Upload package

Upload this file from the v1.2.0 GitHub release:

`rofi-chrome-cws-1.2.0.zip`

https://github.com/amosbird/rofi-chrome/releases/download/v1.2.0/rofi-chrome-cws-1.2.0.zip

## Store listing

Copy the name, summary, detailed description, category, and language from `store-listing.md`.

Upload these files from `store-assets/`:

- `screenshot-tabs.png`
- `screenshot-history.png`
- `screenshot-site-history.png`
- `small-promo.png`

The 128×128 store icon is already included in the extension ZIP at `icons/icon128.png`.

## Privacy practices

Copy the single-purpose statement and each permission justification from `store-listing.md`.

- Remote code: **No**
- Privacy policy: https://amosbird.github.io/rofi-chrome/privacy
- Data disclosures: web history, tab/URL metadata, and download metadata
- Complete every Limited Use certification checkbox truthfully as described in `store-listing.md`

## Distribution

- Visibility: Public
- Regions: All regions
- Pricing: Free

## Test instructions

Copy the reviewer instructions from `store-listing.md`. No credentials are required.

## After the first upload

Record the Item ID assigned by the Developer Dashboard. Before submitting for review:

1. Install the native host with `./scripts/install.sh --extension-id ITEM_ID`.
2. Restart Chromium and confirm the toolbar popup says `Local host connected`.
3. Send the Item ID back so `serverconfig`, Qtile URLs, and the managed policy can be updated.
