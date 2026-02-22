#!/usr/bin/env python3
"""
Google Analytics OAuth Authentication Script
This script sets up OAuth authentication for Google Analytics API access.
"""
import os
import pickle
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

# Scopes needed for Google Analytics
# - Analytics Admin API: Manage accounts, properties, data streams
# - Analytics Data API: Read reports and metrics
SCOPES = [
    'https://www.googleapis.com/auth/analytics',
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/analytics.edit',
    'https://www.googleapis.com/auth/analytics.manage.users',
]

# Path to store credentials
TOKEN_PATH = 'ga_token.pickle'

def authenticate():
    """Authenticate with Google Analytics using OAuth."""
    creds = None
    
    # Load existing credentials if available
    if os.path.exists(TOKEN_PATH):
        print("Loading existing credentials...")
        with open(TOKEN_PATH, 'rb') as token:
            creds = pickle.load(token)
    
    # If credentials don't exist or are invalid, get new ones
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("Refreshing credentials...")
            creds.refresh(Request())
        else:
            print("Starting OAuth flow...")
            print("A browser window will open for you to authenticate.")
            print("="*50)
            
            # For this to work, we need client credentials
            # You can get these from Google Cloud Console:
            # 1. Go to https://console.cloud.google.com/apis/credentials
            # 2. Create OAuth 2.0 credentials for "Desktop app"
            # 3. Download the client_secret.json file
            
            if not os.path.exists('client_secret.json'):
                print("\nERROR: client_secret.json not found!")
                print("\nPlease create OAuth 2.0 credentials in Google Cloud Console:")
                print("1. Go to: https://console.cloud.google.com/apis/credentials")
                print("2. Click 'Create Credentials' → 'OAuth client ID'")
                print("3. Select 'Desktop app' as Application type")
                print("4. Name it 'Google Analytics CLI'")
                print("5. Download the JSON file and save it as 'client_secret.json' in this directory")
                return None
            
            flow = InstalledAppFlow.from_client_secrets_file(
                'client_secret.json', SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save credentials for future runs
        with open(TOKEN_PATH, 'wb') as token:
            pickle.dump(creds, token)
        print(f"\n✓ Credentials saved to {TOKEN_PATH}")
    
    return creds

def list_accounts(creds):
    """List all Google Analytics accounts."""
    try:
        # Use Analytics Admin API
        service = build('analyticsadmin', 'v1beta', credentials=creds)
        accounts = service.accounts().list().execute()
        
        print("\n" + "="*50)
        print("GOOGLE ANALYTICS ACCOUNTS")
        print("="*50)
        
        if 'accounts' in accounts:
            for account in accounts['accounts']:
                print(f"\nAccount: {account['name']}")
                print(f"  Display Name: {account.get('displayName', 'N/A')}")
                print(f"  Region: {account.get('regionCode', 'N/A')}")
                print(f"  Created: {account.get('createTime', 'N/A')}")
        else:
            print("No accounts found.")
            print("\nTo use Google Analytics:")
            print("1. Go to https://analytics.google.com")
            print("2. Create a new account or use an existing one")
            print("3. Grant access to the service account:")
            print(f"   {creds.service_account_email if hasattr(creds, 'service_account_email') else 'your authenticated user'}")
        
        return accounts
    except Exception as e:
        print(f"Error listing accounts: {e}")
        return None

def main():
    print("="*50)
    print("Google Analytics Authentication")
    print("="*50)
    
    creds = authenticate()
    if creds:
        print("\n✓ Authentication successful!")
        list_accounts(creds)
    else:
        print("\n✗ Authentication failed or not completed.")

if __name__ == '__main__':
    main()
