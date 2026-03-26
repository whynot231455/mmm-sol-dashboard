# Saved Metrics for Bot Testing (All Pages)

These metrics were calculated from `MMM_Measure_Daily_synthetic_10k.csv` to verify the bot's responses across different dashboard views.

## 1. Measure Page
- **Total Revenue**: $14,470,606,969.75
- **Total Spend**: $96,798,651.84
- **Average ROAS**: 149.49
- **Top 5 Channels**: Digital, Events, Programmatic, OOH, Others.

## 2. Predict Page (Simulation: Spend Change 0%, Normal Seasonality)
- **Predicted Revenue (Next 3 Months)**: $1,148,096,889.79
- **Predicted ROAS**: 149.49
- **Efficiency**: 0.5 (Demo fixed value)
- **Confidence**: 0.95 (Demo fixed value)

## 3. Optimize Page (Simulation: Total Budget $10,000,000)
- **Projected Revenue**: $1,494,918,234.36
- **Projected Revenue Lift**: -89.67% (Due to budget decrease from ~$96.8M to $10M)
- **Baseline Revenue**: $14,470,606,969.75
- **Forecast CPA**: $2.1 (Demo fixed value)

## 4. Validate Page
- **R-Squared**: 0.967
- **MAPE**: 2.476%
- **Status**: VALIDATED (v2.4)
- **Durbin-Watson**: 1.95 (Demo fixed value)

## Dashboard Configuration (Defaults)
- **Primary Metric**: spend
- **Aggregation Method**: sum
- **Adstock Decay Rate**: 0.65
- **Date Range**: 2023-01-01 to 2024-01-01
- **MMM Components**: Base Sales, Incremental Sales
