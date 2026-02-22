#!/usr/bin/env python3
import subprocess
import sys
import os
import threading
import queue

# The code from user
AUTH_CODE = "4/0AfrIepBFTS0_4Ea_AzSlzKSSDIHA_zFAlw_cSQm7L-tYNAyEeU_3ogfxQjxLqizY9hE8Qg"

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

output_queue = queue.Queue()
url_found = False

def read_output():
    """Read output from process"""
    for line in process.stdout:
        output_queue.put(line)
        print(line, end='', flush=True)

# Start output reader thread
reader_thread = threading.Thread(target=read_output)
reader_thread.daemon = True
reader_thread.start()

print("Waiting for URL prompt...", flush=True)

# Wait for the prompt
buffer = ""
while True:
    try:
        line = output_queue.get(timeout=0.5)
        buffer += line
        if 'enter the verification code' in buffer.lower():
            break
    except queue.Empty:
        continue

print("\n\nSending verification code...", flush=True)

# Send the code
process.stdin.write(AUTH_CODE + '\n')
process.stdin.flush()

# Wait for completion
process.wait()
reader_thread.join(timeout=5)

print(f"\nProcess exited with code: {process.returncode}")
