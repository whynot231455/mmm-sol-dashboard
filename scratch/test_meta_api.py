import urllib.request
import json
import urllib.parse
from datetime import datetime, timedelta

account_id = "2278328539154000"
token = "EAAU35YmLwX0BRVL3js3ehlXtwDVrjTWwJqA7hu4cSrSImkEbpnfKkxVxiDRXOB0pP0q08ubN9ZCp5HTVV8eZBgcl21bDN1MCGb6VZBDFoZCjAEMWy2jZCW5KaQG2xISB445L0NWaBS5MST7Pu5dZCsBnNUIdPQSiTo1ZCYeqZC3fagd6nTsdDZAXcd9pBXpxjvbsQ"

# 1. Check insights for the last 90 days
now = datetime.now()
start = (now - timedelta(days=90)).strftime('%Y-%m-%d')
end = now.strftime('%Y-%m-%d')
time_range = json.dumps({"since": start, "until": end})
insights_url = f"https://graph.facebook.com/v19.0/act_{account_id}/insights?fields=campaign_name,spend,impressions,clicks&level=campaign&time_increment=1&time_range={urllib.parse.quote(time_range)}&limit=10&access_token={token}"

try:
    print("Testing /insights endpoint...")
    req = urllib.request.urlopen(insights_url)
    res = json.loads(req.read())
    print("Insights:", json.dumps(res, indent=2))
except Exception as e:
    print("Error fetching insights:", e)

# 2. Check basic campaigns endpoint
campaigns_url = f"https://graph.facebook.com/v19.0/act_{account_id}/campaigns?fields=name,status&limit=10&access_token={token}"
try:
    print("\nTesting /campaigns endpoint...")
    req = urllib.request.urlopen(campaigns_url)
    res = json.loads(req.read())
    print("Campaigns:", json.dumps(res, indent=2))
except Exception as e:
    print("Error fetching campaigns:", e)
