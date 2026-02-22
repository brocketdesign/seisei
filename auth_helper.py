#!/usr/bin/env python3
import subprocess
import sys
import os
import fcntl
import select
import time

# Set up environment
env = os.environ.copy()
env['PATH'] = os.path.expanduser('~/gcloud/google-cloud-sdk/bin') + ':' + env.get('PATH', '')

# Start gcloud auth process
process = subprocess.Popen(
    ['gcloud', 'auth', 'login', '--no-launch-browser'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    env=env,
    text=True,
    bufsize=1
)

# Make stdout non-blocking
fd = process.stdout.fileno()
fl = fcntl.fcntl(fd, fcntl.F_GETFL)
fcntl.fcntl(fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)

url_found = False
buffer = ""

print("Starting authentication...", flush=True)

while True:
    # Try to read output
    try:
        ready, _, _ = select.select([fd], [], [], 0.5)
        if ready:
            data = process.stdout.read(4096)
            if data:
                buffer += data
                print(data, end='', flush=True)
                
                # Check if we found the URL
                if 'https://accounts.google.com' in buffer and not url_found:
                    url_found = True
                    print("\n\n=== FOUND AUTH URL ===")
                    # Extract and display URL
                    import re
                    urls = re.findall(r'https://accounts\.google\.com[^\s]+', buffer)
                    if urls:
                        print(f"URL: {urls[0]}")
                    print("======================\n")
                    print("Please open the URL above in your browser,")
                    print("complete authentication, and paste the code here:")
    except:
        pass
    
    # Check if waiting for input
    if url_found and 'enter the verification code' in buffer:
        # Get code from user
        code = input("\nEnter verification code: ").strip()
        process.stdin.write(code + '\n')
        process.stdin.flush()
        url_found = False  # Reset to continue reading output
        buffer = ""
    
    # Check if process ended
    ret = process.poll()
    if ret is not None:
        # Read any remaining output
        remaining = process.stdout.read()
        if remaining:
            print(remaining, end='')
        print(f"\nProcess exited with code: {ret}")
        break
    
    time.sleep(0.1)
