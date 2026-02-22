#!/usr/bin/env python3
"""
Google Analytics Client using Service Account
Uses key.json for authentication
"""
import os
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Metric,
    RunReportRequest,
)

# Path to service account key file
KEY_FILE = 'key.json'

# Scopes needed
SCOPES = [
    'https://www.googleapis.com/auth/analytics',
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/analytics.edit',
    'https://www.googleapis.com/auth/analytics.manage.users',
]

def get_credentials():
    """Load service account credentials from key.json."""
    if not os.path.exists(KEY_FILE):
        print(f"ERROR: {KEY_FILE} not found!")
        return None
    
    credentials = service_account.Credentials.from_service_account_file(
        KEY_FILE,
        scopes=SCOPES
    )
    return credentials

def list_accounts(credentials):
    """List all Google Analytics accounts."""
    try:
        service = build('analyticsadmin', 'v1beta', credentials=credentials)
        response = service.accounts().list().execute()
        
        print("\n" + "="*60)
        print("GOOGLE ANALYTICS ACCOUNTS")
        print("="*60)
        
        accounts = response.get('accounts', [])
        if accounts:
            for account in accounts:
                print(f"\n📊 Account: {account['name']}")
                print(f"   Display Name: {account.get('displayName', 'N/A')}")
                print(f"   Region: {account.get('regionCode', 'N/A')}")
                
                # List properties for this account
                list_properties(service, account['name'])
        else:
            print("\n⚠️  No accounts found.")
            print("\nThe service account needs to be granted access to GA properties.")
            print(f"\nService Account Email: {credentials.service_account_email}")
            print("\nTo grant access:")
            print("1. Go to https://analytics.google.com")
            print("2. Click Admin (gear icon)")
            print("3. Under Account/Property, click 'Access Management'")
            print("4. Click '+' → Add users")
            print(f"5. Add: {credentials.service_account_email}")
            print("6. Assign role: Viewer (or higher)")
        
        return accounts
    except Exception as e:
        print(f"Error listing accounts: {e}")
        return None

def list_properties(service, account_name):
    """List properties for an account."""
    try:
        response = service.properties().list(
            filter=f"parent:{account_name}"
        ).execute()
        
        properties = response.get('properties', [])
        if properties:
            print(f"   Properties ({len(properties)}):")
            for prop in properties:
                print(f"      🏠 {prop['name']}")
                print(f"         Display Name: {prop.get('displayName', 'N/A')}")
                print(f"         Industry: {prop.get('industryCategory', 'N/A')}")
                print(f"         Timezone: {prop.get('timeZone', 'N/A')}")
                print(f"         Currency: {prop.get('currencyCode', 'N/A')}")
        else:
            print("   Properties: None")
    except Exception as e:
        print(f"   Error listing properties: {e}")

def create_property(credentials, account_name, display_name, timezone="America/Los_Angeles", currency="USD"):
    """Create a new GA4 property."""
    try:
        service = build('analyticsadmin', 'v1beta', credentials=credentials)
        
        property_body = {
            'displayName': display_name,
            'timeZone': timezone,
            'currencyCode': currency,
        }
        
        response = service.properties().create(
            parent=account_name,
            body=property_body
        ).execute()
        
        print(f"\n✅ Created property: {response['name']}")
        print(f"   Display Name: {response['displayName']}")
        return response
    except Exception as e:
        print(f"Error creating property: {e}")
        return None

def create_data_stream(credentials, property_name, display_name, website_url):
    """Create a web data stream for a property."""
    try:
        service = build('analyticsadmin', 'v1beta', credentials=credentials)
        
        stream_body = {
            'displayName': display_name,
            'type': 'WEB_DATA_STREAM',
            'webStreamData': {
                'defaultUri': website_url,
            }
        }
        
        response = service.properties().dataStreams().create(
            parent=property_name,
            body=stream_body
        ).execute()
        
        print(f"\n✅ Created data stream: {response['name']}")
        print(f"   Display Name: {response['displayName']}")
        print(f"   Measurement ID: {response['webStreamData'].get('measurementId', 'N/A')}")
        return response
    except Exception as e:
        print(f"Error creating data stream: {e}")
        return None

def run_report(credentials, property_id, start_date="7daysAgo", end_date="today"):
    """Run a basic analytics report."""
    try:
        client = BetaAnalyticsDataClient(credentials=credentials)
        
        request = RunReportRequest(
            property=f"properties/{property_id}",
            dimensions=[Dimension(name="city")],
            metrics=[Metric(name="activeUsers")],
            date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
        )
        
        response = client.run_report(request)
        
        print(f"\n📈 Report Results (Property: {property_id})")
        print("="*60)
        print(f"{'City':<30} {'Active Users':>15}")
        print("-"*60)
        
        for row in response.rows:
            city = row.dimension_values[0].value
            users = row.metric_values[0].value
            print(f"{city:<30} {users:>15}")
        
        return response
    except Exception as e:
        print(f"Error running report: {e}")
        return None

def main():
    print("="*60)
    print("Google Analytics Client")
    print("="*60)
    
    creds = get_credentials()
    if not creds:
        return
    
    print(f"\n✓ Loaded service account: {creds.service_account_email}")
    
    # List accounts
    accounts = list_accounts(creds)
    
    print("\n" + "="*60)
    print("Available Operations:")
    print("="*60)
    print("1. List accounts (done above)")
    print("2. Create property")
    print("3. Create data stream")
    print("4. Run report")
    print("\nNote: Service account needs GA access to perform operations.")

if __name__ == '__main__':
    main()
