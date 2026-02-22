#!/bin/bash
export PATH="$HOME/gcloud/google-cloud-sdk/bin:$PATH"

# Start gcloud auth in background and capture the URL
gcloud auth login --no-launch-browser > /tmp/gcloud_auth_output.txt 2>&1 &
PID=$!

# Wait a moment for the URL to be printed
sleep 3

# Extract and display the URL
echo "=== AUTHENTICATION URL ==="
grep -o 'https://accounts.google.com[^[:space:]]*' /tmp/gcloud_auth_output.txt | head -1
echo ""
echo "Please open this URL in your browser and complete the authentication."
echo "Then paste the verification code below:"

# Wait for user input
read -p "Enter verification code: " CODE

# Kill the background process if still running
kill $PID 2>/dev/null

# Now authenticate with the code
echo "$CODE" | gcloud auth login --no-launch-browser
