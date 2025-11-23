# Clipboard Transformer (Chrome extension prototype)

This small Chrome extension reads the clipboard when you open the extension popup, detects whether the clipboard contains CSV, TSV (tabbed, for Sheets), JSON, or a JOOQ-like values list, and provides buttons to convert and copy the transformed result back to the clipboard.

Features
- Detects clipboard format on popup open and displays it in the popup (non-clickable text)
- Convert to CSV, JSON, TSV (for Sheets), or a simple JOOQ-ish list
- Copies result to the clipboard (if allowed by browser)

Assumptions & notes
- "JOOQ-ish" here is a heuristic: lines of parenthesized values like (1, 'a', true), which we parse into rows. This is not a full SQL parser.
- Clipboard access in Chrome popup is allowed but may require user gesture/permission.
- CSV parsing is basic but handles quoted fields and doubled quotes.
- For JSON objects (array of objects) we convert to a table using the keys of the first object as header.

Developer
- Files:
  - `manifest.json` — extension manifest
  - `popup.html` — popup UI
  - `popup.js` — detection and conversion logic
  - `styles.css` — popup styles

How to load
1. Open chrome://extensions
2. Enable "Developer mode"
3. Click "Load unpacked" and select this repository folder
4. Click the extension icon to open the popup; the detected format will show and you can press a conversion button.

Next steps / improvements
- Add options to show intermediate preview and allow editing before copying
- Improve JOOQ/SQL parsing and add column typing heuristics
- Add unit tests for parsing/formatting functions
