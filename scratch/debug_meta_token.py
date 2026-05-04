#!/usr/bin/env python3
"""
seed_meta_sandbox.py  (v5 — campaign + adset + ad with test creative)
──────────────────────────────────────────────────────────────────────
Works in Development Mode by using Meta's built-in test image asset
instead of a real creative or Page.

IMPORTANT about insights:
  Meta insights only reflect REAL ad delivery (actual impressions/spend).
  A paused/draft sandbox campaign will always return 0 rows from /insights.
  This is a Meta platform limitation — you cannot inject fake impressions
  via the API.

  For the MMM dashboard demo, the connector should fall back to mock data
  when insights returns 0 rows (which the MetaAdsConnector already does).

What this script seeds:
    ✅ Campaign   — "Test Ad Campaign", 10 AED daily, PAUSED
    ✅ Ad Set     — UAE geo, REACH, Highest Volume
    ✅ Creative   — uses Meta's test image (works in dev mode, no Page needed)
    ✅ Ad         — attached to the creative above

Run:
    python seed_meta_sandbox.py
    python seed_meta_sandbox.py --verify
    python seed_meta_sandbox.py --teardown
"""

import os, sys, json, argparse, datetime, pathlib, requests
from typing import Optional

try:
    from dotenv import load_dotenv; load_dotenv()
except ImportError:
    pass

ACCESS_TOKEN  = os.environ.get("META_ACCESS_TOKEN", "EAAU35YmLwX0BRciBBIxcQ8hE9EJ3v7nW8ohdDApupnYX3DWWe5kJly4LyKHIkkwvoRnxlqTMjzxTe98wE4jRlpMOjIn06JQVYej9P8qh3HZCNrtObhQWJPZAaQq2qNZByzPtmIln4DJ8uuZCwK022PfZCncdwZCXDdULMnEZAWpQFMlfQgZBOUNESttOzkPbstheLgPxToAl82733NaVWvv0z6ZC0YZBTN2WZCEFMlxVXKYum319xq6ZAm9ZCOf3C8HOQgHZAycFqPZBaTHnE4ZD")
AD_ACCOUNT_ID = os.environ.get("META_AD_ACCOUNT_ID", "act_2278328539154000")   # e.g. act_2278328539154000
API_VERSION   = os.environ.get("META_API_VERSION", "v25.0")
BASE_URL      = f"https://graph.facebook.com/{API_VERSION}"
SEED_FILE     = pathlib.Path(__file__).parent / "seed_meta_ids.json"

# Meta's hosted test image — publicly accessible, no Page/app approval needed
TEST_IMAGE_URL = "https://www.facebook.com/images/fb_icon_325x325.png"


def validate_env():
    missing = [k for k, v in [("META_ACCESS_TOKEN", ACCESS_TOKEN), ("META_AD_ACCOUNT_ID", AD_ACCOUNT_ID)] if not v]
    if missing:
        print("❌  Missing env vars:", missing); sys.exit(1)
    if not AD_ACCOUNT_ID.startswith("act_"):
        print(f"❌  AD_ACCOUNT_ID must start with 'act_'  (got: {AD_ACCOUNT_ID})")
        sys.exit(1)


def graph_post(endpoint: str, payload: dict) -> dict:
    resp = requests.post(
        f"{BASE_URL}/{endpoint}",
        params={"access_token": ACCESS_TOKEN},
        json=payload, timeout=30,
    )
    data = resp.json()
    if not resp.ok or "error" in data:
        err    = data.get("error", {})
        detail = err.get("error_user_msg") or err.get("message") or resp.text
        raise RuntimeError(
            f"POST /{endpoint} failed [{err.get('code')}/{err.get('error_subcode')}]: {detail}"
        )
    return data


def graph_post_multipart(endpoint: str, files: dict, data: dict) -> dict:
    """For image uploads which require multipart/form-data."""
    resp = requests.post(
        f"{BASE_URL}/{endpoint}",
        params={"access_token": ACCESS_TOKEN},
        files=files,
        data=data,
        timeout=30,
    )
    result = resp.json()
    if not resp.ok or "error" in result:
        err    = result.get("error", {})
        detail = err.get("error_user_msg") or err.get("message") or resp.text
        raise RuntimeError(f"POST multipart /{endpoint} failed: {detail}")
    return result


def graph_get(endpoint: str, fields: Optional[list] = None, extra: Optional[dict] = None) -> dict:
    params = {"access_token": ACCESS_TOKEN}
    if fields: params["fields"] = ",".join(fields)
    if extra:  params.update(extra)
    resp = requests.get(f"{BASE_URL}/{endpoint}", params=params, timeout=30)
    data = resp.json()
    if not resp.ok or "error" in data:
        err = data.get("error", {})
        raise RuntimeError(f"GET /{endpoint} failed: {err.get('message', resp.text)}")
    return data


def graph_delete(object_id: str) -> dict:
    resp = requests.delete(
        f"{BASE_URL}/{object_id}",
        params={"access_token": ACCESS_TOKEN}, timeout=30
    )
    return resp.json()


def save_ids(data: dict):
    SEED_FILE.write_text(json.dumps(data, indent=2))
    print(f"\n📄  IDs saved → {SEED_FILE}")


def load_ids() -> dict:
    if not SEED_FILE.exists():
        print("❌  seed_meta_ids.json not found. Run seed first.")
        sys.exit(1)
    return json.loads(SEED_FILE.read_text())


# ─────────────────────────────────────────────────────────────────────────────
# Step 1: Upload a test image to the ad account's image library
# ─────────────────────────────────────────────────────────────────────────────

def upload_test_image() -> str:
    """
    Downloads Meta's test image and uploads it to the ad account image library.
    Returns the image hash needed for the creative.
    """
    print("     Downloading test image…")
    img_resp = requests.get(TEST_IMAGE_URL, timeout=15)
    if not img_resp.ok:
        raise RuntimeError(f"Could not download test image: {img_resp.status_code}")

    print("     Uploading to ad account image library…")
    result = graph_post_multipart(
        f"{AD_ACCOUNT_ID}/adimages",
        files={"filename": ("test_image.png", img_resp.content, "image/png")},
        data={},
    )
    # Response shape: {"images": {"test_image.png": {"hash": "...", "url": "..."}}}
    images = result.get("images", {})
    first  = next(iter(images.values()), {})
    image_hash = first.get("hash")
    if not image_hash:
        raise RuntimeError(f"Image upload succeeded but no hash returned: {result}")

    print(f"     Image hash: {image_hash}")
    return image_hash


# ─────────────────────────────────────────────────────────────────────────────
# Step 2: Create creative using the uploaded image hash (no Page needed)
# ─────────────────────────────────────────────────────────────────────────────

def create_creative(image_hash: str) -> str:
    """
    Creates an ad creative using object_story_spec with the image hash.
    This path works in dev mode without a real Page association.
    """
    print("     Creating ad creative with image hash…")
    c = graph_post(f"{AD_ACCOUNT_ID}/adcreatives", {
        "name": "Test Ad Creative",
        "object_story_spec": {
            "link_data": {
                "image_hash":  image_hash,
                "link":        "https://example.com",
                "message":     "Sol Analytics MMM Dashboard — test ad",
                "call_to_action": {"type": "LEARN_MORE"},
            },
        },
    })
    return c["id"]


# ─────────────────────────────────────────────────────────────────────────────
# Seed
# ─────────────────────────────────────────────────────────────────────────────

def seed():
    print("[SEED] Seeding Meta sandbox account (v5)...\n")
    print(f"  Account : {AD_ACCOUNT_ID}")
    print(f"  API     : {API_VERSION}\n")

    now_utc = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S+0000")

    # ── 1. Campaign ───────────────────────────────────────────────────────────
    print("1/4  Creating campaign…")
    campaign = graph_post(f"{AD_ACCOUNT_ID}/campaigns", {
        "name":                  "Test Ad Campaign",
        "objective":             "OUTCOME_AWARENESS",
        "status":                "PAUSED",
        "daily_budget":          1000,                       # 10.00 AED
        "bid_strategy":          "LOWEST_COST_WITHOUT_CAP",  # "Highest volume" in UI
        "special_ad_categories": [],
    })
    campaign_id = campaign["id"]
    print(f"     [OK] Campaign ID: {campaign_id}")

    # ── 2. Ad Set ─────────────────────────────────────────────────────────────
    print("2/4  Creating ad set…")
    adset = graph_post(f"{AD_ACCOUNT_ID}/adsets", {
        "name":              "Test Ad Set",
        "campaign_id":       campaign_id,
        "status":            "PAUSED",
        "billing_event":     "IMPRESSIONS",
        "optimization_goal": "REACH",
        "targeting": {
            "geo_locations":       {"countries": ["AE"]},
            "age_min":             18,
            "age_max":             65,
            "publisher_platforms": ["facebook", "instagram"],
            "facebook_positions":  ["feed"],
            "instagram_positions": ["stream"],
        },
        "start_time": now_utc,
    })
    adset_id = adset["id"]
    print(f"     [OK] Ad Set ID: {adset_id}")

    # ── 3. Creative (image upload → creative) ─────────────────────────────────
    print("3/4  Creating ad creative…")
    try:
        image_hash  = upload_test_image()
        creative_id = create_creative(image_hash)
        print(f"     [OK] Creative ID: {creative_id}")
    except RuntimeError as e:
        print(f"     ⚠️  Creative failed: {e}")
        print("     Falling back — saving campaign+adset only (still enough for insights test)")
        save_ids({
            "seeded_at":   datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "account_id":  AD_ACCOUNT_ID,
            "campaign_id": campaign_id,
            "adset_id":    adset_id,
            "creative_id": None,
            "ad_id":       None,
        })
        print("\n✅  Partial seed complete (campaign + adset). Run --verify to test insights.\n")
        return

    # ── 4. Ad ─────────────────────────────────────────────────────────────────
    print("4/4  Creating ad…")
    ad = graph_post(f"{AD_ACCOUNT_ID}/ads", {
        "name":     "Test Ad",
        "adset_id": adset_id,
        "status":   "PAUSED",
        "creative": {"creative_id": creative_id},
    })
    ad_id = ad["id"]
    print(f"     [OK] Ad ID: {ad_id}")

    save_ids({
        "seeded_at":   datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "account_id":  AD_ACCOUNT_ID,
        "campaign_id": campaign_id,
        "adset_id":    adset_id,
        "creative_id": creative_id,
        "ad_id":       ad_id,
    })

    print("\n" + "─" * 50)
    print("✅  Full seed complete!")
    print(f"   Campaign  : Test Ad Campaign  ({campaign_id})")
    print(f"   Ad Set    : Test Ad Set       ({adset_id})")
    print(f"   Creative  : Test Ad Creative  ({creative_id})")
    print(f"   Ad        : Test Ad           ({ad_id})")
    print()
    print("NOTE: Insights will return 0 rows because the campaign is PAUSED.")
    print("      This is expected — Meta only records impressions for ACTIVE ads.")
    print("      The MMM connector's mock data layer handles this for the demo.")
    print()
    print("Run --verify to confirm all endpoints are reachable.\n")


# ─────────────────────────────────────────────────────────────────────────────
# Verify
# ─────────────────────────────────────────────────────────────────────────────

def verify():
    ids = load_ids()
    print("🔍  Verifying MMM connector endpoints...\n")

    c = graph_get(ids["campaign_id"],
        fields=["id","name","status","effective_status","daily_budget","bid_strategy"])
    print("✅  /campaigns")
    print(f"   name     : {c['name']}")
    print(f"   status   : {c['status']}  ({c['effective_status']})")
    print(f"   budget   : {int(c.get('daily_budget',0))/100:.2f} AED/day")
    print(f"   bid      : {c.get('bid_strategy')}")

    a = graph_get(ids["adset_id"],
        fields=["id","name","status","effective_status","optimization_goal"])
    print("\n✅  /adsets")
    print(f"   name     : {a['name']}")
    print(f"   status   : {a['status']}  ({a['effective_status']})")
    print(f"   opt goal : {a.get('optimization_goal')}")

    if ids.get("ad_id"):
        d = graph_get(ids["ad_id"], fields=["id","name","status","effective_status"])
        print("\n✅  /ads")
        print(f"   name     : {d['name']}")
        print(f"   status   : {d['status']}  ({d['effective_status']})")
    else:
        print("\n⚠️  /ads — skipped (creative failed in dev mode, expected)")

    today = datetime.date.today()
    since = (today - datetime.timedelta(days=30)).isoformat()
    insights = graph_get(f"{ids['campaign_id']}/insights", extra={
        "fields":         "campaign_id,campaign_name,impressions,reach,clicks,spend,cpm,cpc,ctr,date_start,date_stop",
        "time_range":     json.dumps({"since": since, "until": today.isoformat()}),
        "time_increment": "1",
        "level":          "campaign",
    })
    rows = insights.get("data", [])
    print(f"\n✅  /insights endpoint reachable — {len(rows)} rows")
    print(   "   0 rows is correct for a paused sandbox campaign.")
    print(   "   The connector's mock layer provides demo data when rows = 0.")

    print("\n" + "─" * 50)
    print("✅  All endpoints confirmed. Connector is ready.\n")


# ─────────────────────────────────────────────────────────────────────────────
# Teardown
# ─────────────────────────────────────────────────────────────────────────────

def teardown():
    ids = load_ids()
    print("🗑️  Teardown...\n")
    for key, label in [("ad_id","Ad"), ("adset_id","Ad Set"), ("campaign_id","Campaign")]:
        obj_id = ids.get(key)
        if obj_id:
            print(f"  Deleting {label} {obj_id}…")
            result = graph_delete(obj_id)
            print(f"  {'✓ deleted' if result.get('success') else '⚠  ' + str(result)}")
    SEED_FILE.unlink(missing_ok=True)
    print("\n✅  Done.\n")


# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify",   action="store_true")
    parser.add_argument("--teardown", action="store_true")
    args = parser.parse_args()
    validate_env()
    if args.teardown: teardown()
    elif args.verify: verify()
    else: seed()