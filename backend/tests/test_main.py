import pytest
from fastapi.testclient import TestClient
import pandas as pd
import io
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app, detect_media_columns

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "Meridian MMM Backend is live"

def test_detect_media_columns():
    df = pd.DataFrame({
        "time": ["2024-01-01"],
        "revenue": [100],
        "fb_spend": [50],
        "google_ads": [30],
        "organic": [10]
    })
    cols = detect_media_columns(df)
    assert "fb_spend" in cols
    assert "google_ads" in cols
    assert "revenue" not in cols
    assert "time" not in cols

def test_import_data_missing_kpi():
    df = pd.DataFrame({"time": ["2024-01-01"], "fb_spend": [50]})
    csv_str = df.to_csv(index=False)
    file_content = io.BytesIO(csv_str.encode("utf-8"))
    
    response = client.post(
        "/import",
        files={"file": ("test.csv", file_content, "text/csv")}
    )
    # Should fail due to missing KPI
    assert response.status_code == 400
    assert "Missing required columns" in response.json()["detail"]

def test_import_data_success():
    df = pd.DataFrame({
        "time": ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04"],
        "revenue": [100, 110, 105, 120],
        "fb_spend": [50, 60, 55, 65]
    })
    csv_str = df.to_csv(index=False)
    file_content = io.BytesIO(csv_str.encode("utf-8"))
    
    response = client.post(
        "/import",
        files={"file": ("test.csv", file_content, "text/csv")}
    )
    assert response.status_code == 200
    assert response.json()["success"] == True

def test_get_latest_results():
    response = client.get("/results/latest")
    assert response.status_code == 200
    assert "metrics" in response.json()
    assert "chartData" in response.json()

def test_manual_sync_no_data():
    # If no predictions exist, sync should fail gracefully
    response = client.post("/sync")
    assert response.status_code == 200
    # Current behavior returns success: False if file missing
    assert "success" in response.json()

def test_import_fuzzy_mapping():
    # Test fuzzy mapping with slightly different names
    df = pd.DataFrame({
        "Date": ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04"],
        "Sales": [100, 110, 120, 115],
        "Ads_USD": [50, 55, 60, 58]
    })
    csv_str = df.to_csv(index=False)
    file_content = io.BytesIO(csv_str.encode("utf-8"))
    
    response = client.post(
        "/import",
        files={"file": ("test.csv", file_content, "text/csv")}
    )
    assert response.status_code == 200
    assert response.json()["success"] == True
