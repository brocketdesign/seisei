#!/bin/bash
export PATH="$HOME/gcloud/google-cloud-sdk/bin:$PATH"

# Create temp file
TMPFILE=$(mktemp)

# Start gcloud auth and capture output
script -q -c "gcloud auth login --no-launch-browser" "$TMPFILE" &
PID=$!

# Wait for URL to be printed
sleep 5

# Show the URL
echo ""
echo "========================================"
echo "PLEASE OPEN THIS URL IN YOUR BROWSER:"
echo "========================================"
grep -o 'https://accounts.google.com[^[:space:]]*' "$TMPFILE" 2>/dev/null | head -1 || cat "$TMPFILE"
echo ""
echo "========================================"
echo "After signing in, enter the code here:"
echo "========================================"

# Wait for user input
read CODE

# Find the gcloud process and send the code
# Kill the script process
kill $PID 2>/dev/null

# Now run gcloud auth with the code
echo "$CODE" | gcloud auth login --no-launch-browser 2>&1

rm -f "$TMPFILE"
