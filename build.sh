#!/bin/bash
# Build script for Chrome Web Store distribution

echo "Building Chrome extension ZIP..."

# Remove old zip if it exists
rm -f chrome_csv_helper.zip

# Create zip excluding git files, build scripts, and other non-essential files
zip -r chrome_csv_helper.zip . \
  -x "*.git*" \
  -x "*.DS_Store" \
  -x "build.sh" \
  -x "CHROME_WEB_STORE_DESCRIPTION.md" \
  -x "*.zip"

echo "✓ chrome_csv_helper.zip created successfully!"
echo "  Size: $(du -h chrome_csv_helper.zip | cut -f1)"
echo ""
echo "Ready to upload to Chrome Web Store:"
echo "https://chrome.google.com/webstore/devconsole"
