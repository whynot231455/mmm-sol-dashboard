import json

metrics = {
    "measure": {
        "kpi": {
            "roas": 149.49,
            "spend": 96798651.84,
            "revenue": 14470606969.75,
            "roi": 149.49 * 100 # Assuming ROAS is % or similar, but ROI = Revenue/Spend * 100
        },
        "channels": [
            {"channel": "Digital", "spend": 0, "revenue": 0},
            {"channel": "Events", "spend": 0, "revenue": 0},
            {"channel": "Programmatic", "spend": 0, "revenue": 0},
            {"channel": "OOH", "spend": 0, "revenue": 0},
            {"channel": "Others", "spend": 0, "revenue": 0}
        ]
    },
    "predict": {
        "metrics": {
            "predictedROAS": 149.49,
            "revenue": 1148096889.79,
            "efficiency": 0.5,
            "confidence": 0.95,
            "lift": 0.0 # Not specified in MD for Predict but usually present
        },
        "forecast": [] # MD didn't specify chart data
    },
    "optimize": {
        "metrics": {
            "projectedRevenue": 1494918234.36,
            "projectedRevenueLift": -89.67,
            "baselineRevenue": 14470606969.75,
            "forecastCPA": 2.1,
            "roasDelta": 0,
            "periodImpact": 0
        },
        "topChannels": []
    },
    "validation": {
        "metrics": {
            "rSquared": 0.967,
            "mape": 2.476,
            "durbinWatson": 1.95
        },
        "modelInfo": {
            "status": "VALIDATED",
            "version": "v2.4",
            "lastUpdated": "Mar 22, 2026"
        }
    }
}

settings = {
    "filters": {
        "channel": "All",
        "country": "All",
        "dateRange": "Last 30 Days"
    },
    "transformSettings": {
        "adstock": {"type": "geometric", "decayRate": 0.65},
        "metrics": {"r2": 0.967, "rss": "N/A", "vif": 1.0},
        "currency": "USD ($)",
        "dateRange": {"start": "2023-01-01", "end": "2024-01-01"},
        "dataSource": "All Sources",
        "saturation": {"slope": 1.0, "active": True, "curveType": "hill", "inflection": 0.5},
        "aggregation": {"method": "sum", "granularity": "daily", "weekStarting": "monday"},
        "primaryMetric": "spend",
        "controlVariables": {}
    }
}

dashboard_data = {
    "metrics": metrics,
    "settings": settings,
    "activePage": "chat",
    "lastUpdated": "2026-03-22T14:34:26.000Z"
}

print(json.dumps(dashboard_data))
