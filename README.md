# Clipboard Transformer

A lightweight Chrome extension that instantly transforms clipboard data between different formats: CSV (comma-separated), CSV (pipe-separated), TSV (tab-separated for Google Sheets), JSON, and JOOQ-style value lists.

## Features

- 🔍 **Auto-detect format** - Automatically identifies CSV (comma), CSV (pipe), TSV, JSON, or JOOQ format in your clipboard
- 🔄 **One-click conversion** - Transform between any supported formats with a single click
- 📋 **Direct clipboard integration** - Read from and write to clipboard automatically
- ⚡ **Fast and lightweight** - No external dependencies, runs entirely in your browser
- 🎨 **Clean, simple UI** - Minimal clicks to get your data transformed

## Common Use Cases

### 📊 Google Sheets/Excel → Code
Select and copy cells from Google Sheets or Excel, then transform to CSV or JSON to paste directly into your code editor (VS Code, Sublime, etc.). Perfect for:
- Creating test data fixtures
- Generating mock API responses
- Building database seed files
- Sharing data with non-spreadsheet users

**Example workflow:**
1. Select cells in Google Sheets (they copy as TSV)
2. Click extension → "To JSON"
3. Paste into VS Code as a ready-to-use JSON array

### 💾 CSV/JSON → Google Sheets
Copy CSV data from a file or JSON from an API response, convert to TSV, and paste directly into Google Sheets with proper cell separation.

**Example workflow:**
1. Copy CSV data from a text file or terminal output
2. Click extension → "To TSV (Sheets)"
3. Paste into Google Sheets - data automatically fills the correct cells

### 🔄 Quick Format Switching
- Convert comma-separated CSV to pipe-separated for different database imports
- Transform JSON API responses to spreadsheet-friendly format
- Generate SQL INSERT value lists from spreadsheet data

## Installation

### Option 1: Chrome Web Store (Recommended)
*Coming soon - pending approval*

### Option 2: Manual Installation from GitHub

1. **Download the extension:**
   - Download the [latest release](https://github.com/lex3001/chrome_csv_helper/archive/refs/heads/main.zip)
   - Or clone the repository:
     ```bash
     git clone https://github.com/lex3001/chrome_csv_helper.git
     ```

2. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions`
   - Enable **Developer mode** (toggle in top-right corner)
   - Click **Load unpacked**
   - Select the `chrome_csv_helper` folder

3. **Pin the extension** (optional):
   - Click the puzzle icon in Chrome toolbar
   - Find "Clipboard Transformer" and click the pin icon

## Usage

1. **Copy data** to your clipboard (from Google Sheets, a CSV file, JSON, etc.)
2. **Click the extension icon** in your Chrome toolbar
3. The extension will automatically detect the format
4. **Click a conversion button** to transform to your desired format:
   - `To CSV (comma)` - Convert to comma-separated values
   - `To CSV (pipe)` - Convert to pipe-separated values
   - `To TSV (Sheets)` - Convert to tab-separated (paste directly into Google Sheets)
   - `To JSON` - Convert to JSON format
   - `To JOOQ-ish` - Convert to JOOQ-style value list

5. The converted data is **automatically copied** to your clipboard and displayed in the popup

### Fallback Options

If automatic clipboard detection doesn't work (due to browser permissions):
- Click the **"Detect clipboard"** button to manually trigger detection
- Or paste your data into the text area and click **"Use pasted data"**

## Supported Formats

### Input Formats (Auto-detected)
- **CSV (comma)** - Standard comma-separated values
- **CSV (pipe)** - Pipe-separated values (`|`)
- **TSV** - Tab-separated values (from Google Sheets, Excel)
- **JSON** - Arrays of objects or arrays of arrays
- **JOOQ** - Parenthesized value lists like `(1, 'value', true), (2, 'value2', false)`

### Output Formats (One-click conversion)
All of the above formats are available as conversion targets.

## Technical Notes

### CSV Parsing
- Handles quoted fields with commas, newlines, and escaped quotes
- Automatically detects separator type (comma vs pipe vs tab)
- Preserves data integrity during conversion

### JSON Conversion
- Array of objects → Table with keys as headers
- Array of arrays → Direct table representation
- Table → Array of objects (first row becomes keys)

### JOOQ Format
- Heuristic parser for SQL-style value lists
- Supports strings (quoted), numbers, booleans, and NULL
- Useful for generating INSERT statements

### Clipboard Permissions
- Uses `navigator.clipboard` API (requires user gesture in some browsers)
- Falls back to manual paste if automatic clipboard access is blocked
- Stores permission state locally to minimize future prompts

## Privacy

- **No data is transmitted** - All processing happens locally in your browser
- **No tracking or analytics** - Your data stays private
- **No external dependencies** - No third-party libraries or API calls

## Development

Want to contribute or modify the extension?

```bash
# Clone the repository
git clone https://github.com/lex3001/chrome_csv_helper.git
cd chrome_csv_helper

# Make your changes to the code
# Test by loading the extension in Chrome (see Installation Option 2)

# Regenerate icons if needed (requires librsvg or ImageMagick)
rsvg-convert -w 128 -h 128 icon.svg -o icon128.png
rsvg-convert -w 48 -h 48 icon.svg -o icon48.png
rsvg-convert -w 32 -h 32 icon.svg -o icon32.png
rsvg-convert -w 16 -h 16 icon.svg -o icon16.png

# Create a distributable ZIP for Chrome Web Store
./build.sh
```

## File Structure

```
chrome_csv_helper/
├── manifest.json       # Extension configuration
├── popup.html          # Popup UI
├── popup.js            # Detection, parsing, and conversion logic
├── styles.css          # Popup styles
├── icon.svg            # Source icon
├── icon*.png           # Icon assets (16, 32, 48, 128 px)
└── README.md           # This file
```

## Known Limitations

- **JOOQ parsing** is heuristic and may not handle all SQL syntax variations
- **Large datasets** (>10,000 rows) may be slow in the popup UI
- **Clipboard access** requires user permission/gesture in some browsers

## Future Improvements

- Add preview/edit mode before copying to clipboard
- Support for more formats (XML, YAML, etc.)
- Batch conversion of multiple files
- Custom delimiter configuration
- Export converted data as downloadable files

## License

MIT License - feel free to use, modify, and distribute

## Support

Found a bug or have a feature request? [Open an issue](https://github.com/lex3001/chrome_csv_helper/issues) on GitHub.

## Author

Created by [lex3001](https://github.com/lex3001)
