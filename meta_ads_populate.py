#!/usr/bin/env python3
"""
seed_meta_sandbox.py
────────────────────
Populates a Meta Marketing API TEST ad account with:
  • 1 Campaign  — "Test Ad Campaign", 10 AED daily, PAUSED (In Draft)
  • 1 Ad Set    — UAE geo, REACH optimisation, Highest Volume
  • 1 Ad        — minimal link ad (no Page ID needed in sandbox)

Run:
    pip install requests python-dotenv
    python seed_meta_sandbox.py           # seed
    python seed_meta_sandbox.py --verify  # print what was created
    python seed_meta_sandbox.py --teardown  # delete everything

Env vars (export directly or put in .env):
    META_ACCESS_TOKEN   — System User token with ads_management scope
    META_AD_ACCOUNT_ID  — e.g. act_1234567890  (your TEST account)
"""

import os
import sys
import json
import argparse
import datetime
import pathlib
import requests
from typing import Optional

# ── Optional .env loading ────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed; rely on shell env vars

# ── Config ───────────────────────────────────────────────────────────────────
ACCESS_TOKEN  = os.environ.get("META_ACCESS_TOKEN", "EAAU35YmLwX0BRUc82Do5bMZC9SFZBT5hGSaSOtmIAyJEBG5dkZAEGoaBMzilYbni7hD9qNYS0g4elRLf2qzQUZChCbfJKHl2yTjA4NJOaZBvUP1ZBRgQ1WSvKFYtAW5CGxItTZBlJl46ZBX5Ck0KmwBTcWidoOM7G000nsZCblwBVGNrHNvYDmwZBNzspwYNqF6AEBU2sbtaqByx7ZCYBM9tkkyXekhfWLkCuMyPXzdlYqZAbYNcXGhTAprSpGeMj2PQ4YGpPeuDyh8n0mR3qnM5jE7T")
AD_ACCOUNT_ID = os.environ.get("META_AD_ACCOUNT_ID", "act_2278328539154000")  # e.g. act_XXXXXXXX
API_VERSION   = os.environ.get("META_API_VERSION", "v25.0")
BASE_URL      = f"https://graph.facebook.com/{API_VERSION}"

SEED_FILE     = pathlib.Path(__file__).parent / "seed_meta_ids.json"


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def validate_env() -> None:
    missing = []
    if not ACCESS_TOKEN:
        missing.append("META_ACCESS_TOKEN")
    if not AD_ACCOUNT_ID:
        missing.append("META_AD_ACCOUNT_ID")
    if missing:
        print("❌  Missing required environment variables:")
        for v in missing:
            print(f"   • {v}")
        print("\nExport them or add them to a .env file.")
        sys.exit(1)


def graph_post(endpoint: str, payload: dict) -> dict:
    """POST to the Graph API and return parsed JSON. Raises on error."""
    url = f"{BASE_URL}/{endpoint}"
    params = {"access_token": ACCESS_TOKEN}
    resp = requests.post(url, params=params, json=payload, timeout=30)
    data = resp.json()
    if not resp.ok or "error" in data:
        msg = data.get("error", {}).get("message", resp.text)
        print(f"DEBUG: Full Error Data: {json.dumps(data, indent=2)}")
        raise RuntimeError(f"Graph API error on POST /{endpoint}: {msg}")
    return data


def graph_get(endpoint: str, fields: Optional[list] = None, extra: Optional[dict] = None) -> dict:
    """GET from the Graph API."""
    url = f"{BASE_URL}/{endpoint}"
    params = {"access_token": ACCESS_TOKEN}
    if fields:
        params["fields"] = ",".join(fields)
    if extra:
        params.update(extra)
    resp = requests.get(url, params=params, timeout=30)
    data = resp.json()
    if not resp.ok or "error" in data:
        msg = data.get("error", {}).get("message", resp.text)
        raise RuntimeError(f"Graph API error on GET /{endpoint}: {msg}")
    return data


def graph_delete(object_id: str) -> dict:
    url = f"{BASE_URL}/{object_id}"
    params = {"access_token": ACCESS_TOKEN}
    resp = requests.delete(url, params=params, timeout=30)
    return resp.json()


def save_ids(data: dict) -> None:
    SEED_FILE.write_text(json.dumps(data, indent=2))
    print(f"\n[FILE] IDs saved -> {SEED_FILE}")


def load_ids() -> dict:
    if not SEED_FILE.exists():
        print("❌  seed_meta_ids.json not found. Run without --teardown first.")
        sys.exit(1)
    return json.loads(SEED_FILE.read_text())


# ─────────────────────────────────────────────────────────────────────────────
# Seed
# ─────────────────────────────────────────────────────────────────────────────

def seed() -> None:
    print("[SEED] Seeding Meta sandbox account...\n")
    print(f"  Account : {AD_ACCOUNT_ID}")
    print(f"  API     : {API_VERSION}\n")

    # ── 1. Campaign ───────────────────────────────────────────────────────────
    # Mirrors the screenshot exactly:
    #   Name         → "Test Ad Campaign"
    #   Budget       → 10.00 AED daily  (Meta stores in minor units: 1000 fils)
    #   Status       → PAUSED  (toggle is OFF / "In Draft" in the UI)
    #   Objective    → OUTCOME_AWARENESS
    #   Bid strategy → LOWEST_COST_WITHOUT_CAP  ("Highest volume" in the UI)
    #   No stop_time → "Ongoing" in the Ends column
    print("1/3  Creating campaign…")
    campaign = graph_post(
        f"{AD_ACCOUNT_ID}/campaigns",
        {
            "name": "Test Ad Campaign",
            "objective": "OUTCOME_AWARENESS",
            "status": "PAUSED",
            "daily_budget": 1000,                      # 10.00 AED (fils)
            "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
            "special_ad_categories": [],
        },
    )
    campaign_id = campaign["id"]
    print(f"     [OK] Campaign ID: {campaign_id}")

    # ── 2. Ad Set ─────────────────────────────────────────────────────────────
    print("2/3  Creating ad set…")
    adset = graph_post(
        f"{AD_ACCOUNT_ID}/adsets",
        {
            "name": "Test Ad Set",
            "campaign_id": campaign_id,
            "status": "PAUSED",
            "billing_event": "IMPRESSIONS",
            "optimization_goal": "REACH",
            "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
            "targeting": {
                "age_min": 18,
                "age_max": 65,
                "geo_locations": {"countries": ["AE"]},
                "publisher_platforms": ["facebook", "instagram"],
                "facebook_positions": ["feed"],
                "instagram_positions": ["stream"],
            },
            "start_time": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S+0000"),
            # Omitting end_time → "Ongoing" in the dashboard
        },
    )
    adset_id = adset["id"]
    print(f"     [OK] Ad Set ID: {adset_id}")

    # ── 3. Ad Creative ────────────────────────────────────────────────────────
    # Standard ads require a creative. In sandbox, we try a minimal link creative.
    # Note: Using a dummy Page ID. If this fails, a real Page ID must be provided.
    print("3/4  Creating ad creative...")
    try:
        creative = graph_post(
            f"{AD_ACCOUNT_ID}/adcreatives",
            {
                "name": "Test Creative",
                "object_story_spec": {
                    "page_id": "100493728360490", # why_not_231455_
                    "link_data": {
                        "link": "https://facebook.com",
                        "message": "Test ad from MMM Dashboard",
                    },
                },
            },
        )
        creative_id = creative["id"]
        print(f"     [OK] Creative ID: {creative_id}")
    except Exception as e:
        print(f"     [WARN] Could not create creative: {e}")
        print("     Proceeding without Ad creation...")
        creative_id = None

    # ── 4. Ad ─────────────────────────────────────────────────────────────────
    if creative_id:
        print("4/4  Creating ad...")
        ad = graph_post(
            f"{AD_ACCOUNT_ID}/ads",
            {
                "name": "Test Ad",
                "adset_id": adset_id,
                "creative": {"creative_id": creative_id},
                "status": "PAUSED",
            },
        )
        ad_id = ad["id"]
        print(f"     [OK] Ad ID: {ad_id}")
    else:
        ad_id = "N/A (Creative failed)"

    # ── Persist IDs ───────────────────────────────────────────────────────────
    seed_data = {
        "seeded_at": datetime.datetime.utcnow().isoformat(),
        "account_id": AD_ACCOUNT_ID,
        "campaign_id": campaign_id,
        "adset_id": adset_id,
        "ad_id": ad_id,
    }
    save_ids(seed_data)

    print("\n" + "─" * 50)
    print("SUCCESS: Sandbox seeded! Your connector can now retrieve:")
    print(f"   Campaign : Test Ad Campaign  ({campaign_id})")
    print(f"   Ad Set   : Test Ad Set       ({adset_id})")
    print(f"   Ad       : Test Ad           ({ad_id})")
    print("\nTo verify what was created, run:")
    print("   python seed_meta_sandbox.py --verify")
    print("\nTo clean up later:")
    print("   python seed_meta_sandbox.py --teardown\n")


# ─────────────────────────────────────────────────────────────────────────────
# Verify — print the live Graph API data for what was seeded
# ─────────────────────────────────────────────────────────────────────────────

def verify() -> None:
    ids = load_ids()
    print("🔍  Verifying seeded objects via Graph API…\n")

    # Campaign
    c = graph_get(
        ids["campaign_id"],
        fields=["id", "name", "status", "effective_status",
                "daily_budget", "bid_strategy", "objective"],
    )
    print("Campaign:")
    print(f"  id               : {c.get('id')}")
    print(f"  name             : {c.get('name')}")
    print(f"  status           : {c.get('status')}")
    print(f"  effective_status : {c.get('effective_status')}")
    print(f"  daily_budget     : {c.get('daily_budget')} (minor units → {int(c.get('daily_budget', 0)) / 100:.2f} AED)")
    print(f"  bid_strategy     : {c.get('bid_strategy')}")

    # Ad Set
    a = graph_get(
        ids["adset_id"],
        fields=["id", "name", "status", "effective_status",
                "daily_budget", "billing_event", "optimization_goal"],
    )
    print("\nAd Set:")
    print(f"  id               : {a.get('id')}")
    print(f"  name             : {a.get('name')}")
    print(f"  status           : {a.get('status')}")
    print(f"  effective_status : {a.get('effective_status')}")
    print(f"  billing_event    : {a.get('billing_event')}")
    print(f"  optimization     : {a.get('optimization_goal')}")

    # Ad
    d = graph_get(
        ids["ad_id"],
        fields=["id", "name", "status", "effective_status"],
    )
    print("\nAd:")
    print(f"  id               : {d.get('id')}")
    print(f"  name             : {d.get('name')}")
    print(f"  status           : {d.get('status')}")
    print(f"  effective_status : {d.get('effective_status')}")

    # Insights (will be empty for a paused/draft campaign, but confirms the endpoint works)
    today = datetime.date.today()
    since = (today - datetime.timedelta(days=30)).isoformat()
    insights = graph_get(
        f"{ids['campaign_id']}/insights",
        extra={
            "fields": "impressions,reach,clicks,spend,cpm,cpc,ctr",
            "time_range": json.dumps({"since": since, "until": today.isoformat()}),
            "time_increment": "1",
        },
    )
    rows = insights.get("data", [])
    print(f"\nInsights (last 30 days): {len(rows)} day-rows returned")
    if rows:
        for r in rows[:3]:
            print(f"  {r.get('date_start')}  spend={r.get('spend')}  impressions={r.get('impressions')}")
    else:
        print("  (no spend yet — campaign is paused/in-draft, as expected)")

    print("\n✅  Verification complete. Your connector is ready.\n")


# ─────────────────────────────────────────────────────────────────────────────
# Teardown
# ─────────────────────────────────────────────────────────────────────────────

def teardown() -> None:
    ids = load_ids()
    print("🗑️   Teardown: deleting seeded objects…\n")

    for key, label in [("ad_id", "Ad"), ("adset_id", "Ad Set"), ("campaign_id", "Campaign")]:
        obj_id = ids.get(key)
        if obj_id:
            print(f"  Deleting {label} {obj_id}…")
            result = graph_delete(obj_id)
            if result.get("success"):
                print(f"  ✓ {label} deleted")
            else:
                print(f"  ⚠  {label}: {result}")

    SEED_FILE.unlink(missing_ok=True)
    print("\n✅  Teardown complete.\n")


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed / verify / teardown Meta sandbox data")
    parser.add_argument("--verify",   action="store_true", help="Verify seeded objects via Graph API")
    parser.add_argument("--teardown", action="store_true", help="Delete everything created by --seed")
    args = parser.parse_args()

    validate_env()

    if args.teardown:
        teardown()
    elif args.verify:
        verify()
    else:
        seed()