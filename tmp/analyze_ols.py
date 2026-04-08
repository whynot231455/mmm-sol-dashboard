import pandas as pd
import numpy as np
import statsmodels.api as sm
from statsmodels.stats.outliers_influence import variance_inflation_factor
import os

print("Starting Advanced OLS analysis...")

# Load Data
file_path = 'backend/data/active_data.csv'
df = pd.read_csv(file_path)

# Pivot and aggregate
df['time'] = pd.to_datetime(df['time'])
df = df.sort_values(by='time')

mentioned_channels = ['Meta', 'Google Search', 'TV', 'Events', 'Radio', 'OOH']
all_channels = df['Channel'].unique()
existing_mentioned = [c for c in mentioned_channels if c in all_channels]

# Wide Format Spend
spend_pivot = df.pivot_table(index='time', columns='Channel', values='SpendUSD', aggfunc='sum').fillna(0)
target = df.groupby('time')['kpi'].mean()

data = spend_pivot.copy()
data['target'] = target

# Feature Engineering
total_spend_by_chan = spend_pivot.sum().sort_values(ascending=False)
top_5 = total_spend_by_chan.head(5).index.tolist()
modeling_channels = list(set(existing_mentioned + top_5))

# Interactions
awareness = [c for c in ['TV', 'Events', 'OOH', 'Radio'] if c in modeling_channels]
performance = [c for c in ['Meta', 'Google Search', 'Digital'] if c in modeling_channels]
interaction_cols = []
for a in awareness:
    for p in performance:
        col_name = f'interaction_{a.replace(" ", "_")}_{p.replace(" ", "_")}'
        data[col_name] = data[a] * data[p]
        interaction_cols.append(col_name)

# Seasonality
data['month'] = data.index.month
month_dummies = pd.get_dummies(data['month'], prefix='month', drop_first=True, dtype=int)
data = pd.concat([data, month_dummies], axis=1)

# Ensure all data for modeling is float
data = data.dropna().astype(float)

# Advanced Global Metrics
mean_kpi = data['target'].mean()
total_kpi = data['target'].sum()

def get_advanced_stats(model, features):
    # VIF
    vifs = []
    if len(features) > 1:
        X_vif = data[features]
        # Only calc VIF for non-constant features
        for i in range(len(features)):
            vifs.append(variance_inflation_factor(X_vif.values, i))
    else:
        vifs = [1.0]

    # MAPE
    preds = model.predict(sm.add_constant(data[features]))
    mape = np.mean(np.abs((data['target'] - preds) / data['target'])) * 100
    
    # Durbin-Watson
    dw = sm.stats.stattools.durbin_watson(model.resid)
    
    # Per-variable stats: Contribution % and Elasticity
    var_stats = []
    for i, feat in enumerate(features):
        coeff = model.params[feat]
        mean_feat = data[feat].mean()
        # Contribution %
        # We sum over the whole period
        total_contribution = (coeff * data[feat]).sum()
        contribution_pct = (total_contribution / total_kpi) * 100
        
        # Elasticity (at mean)
        elasticity = coeff * (mean_feat / mean_kpi)
        
        var_stats.append({
            'Variable': feat,
            'Coefficient': coeff,
            'P-Value': model.pvalues[feat],
            'VIF': vifs[i],
            'Contribution %': contribution_pct,
            'Elasticity': elasticity
        })
        
    return {
        'mape': mape,
        'dw': dw,
        'var_stats': var_stats
    }

def run_labeled_regression(cols, label):
    print(f"Running {label}...")
    X = data[cols]
    X = sm.add_constant(X)
    y = data['target']
    model = sm.OLS(y, X).fit()
    stats = get_advanced_stats(model, cols)
    return model, stats

# Linear Model (Top 5)
model_linear, stats_linear = run_labeled_regression(top_5, "Linear Baseline")

# Full Model
full_features = modeling_channels + interaction_cols + month_dummies.columns.tolist()
model_full, stats_full = run_labeled_regression(full_features, "Full Model")

# Variance contribution from Seasonality
X_no_season = modeling_channels + interaction_cols
model_no_season = sm.OLS(data['target'], sm.add_constant(data[X_no_season])).fit()
variance_seasonality = model_full.rsquared - model_no_season.rsquared

# Report Generation
def get_detailed_report(model, stats, title):
    res_df = pd.DataFrame(stats['var_stats'])
    # formatting for markdown table
    output = f"### {title}\n\n"
    output += f"- **R^2**: {model.rsquared:.4f}\n"
    output += f"- **Adj R^2**: {model.rsquared_adj:.4f}\n"
    output += f"- **MAPE**: {stats['mape']:.2f}%\n"
    output += f"- **Durbin-Watson**: {stats['dw']:.4f}\n\n"
    output += res_df.to_markdown(index=False) + "\n\n"
    return output

report = f"# Advanced OLS Marketing Mix Analysis Report\n\nGenerated: {pd.Timestamp.now()}\n\n"
report += f"## Global Key Insights\n"
report += f"- **External Controls (Seasonality) Impact**: {variance_seasonality*100:.2f}% contribution to R^2\n"
report += f"- **Target Baseline (Unattributed KPI)**: {model_full.params['const'] / mean_kpi * 100:.2f}% of KPI\n\n"

report += get_detailed_report(model_linear, stats_linear, "Model 1: Linear Top-Spenders Baseline")
report += get_detailed_report(model_full, stats_full, "Model 4: Full Multi-Channel & Interaction Model")

# Calculate Marginal ROI (mROI)
# For linear models, mROI is constant = Coefficient (if target is Revenue and spend is USD)
# Let's assume kpi is Revenue.
report += "## Media Performance & Efficiency (mROI)\n\n"
mroi_df = pd.DataFrame([
    {
        'Channel': s['Variable'],
        'Marginal ROI (mROI)': s['Coefficient'],
        'Efficiency (Contribution/Spend)': (s['Contribution %'] / ( (data[s['Variable']].sum() / total_spend_by_chan.sum()) * 100 ) ) if total_spend_by_chan.sum() > 0 else 0
    }
    for s in stats_full['var_stats'] if s['Variable'] in modeling_channels
])
report += mroi_df.to_markdown(index=False) + "\n\n"

with open('ols_analysis_results.md', 'w') as f:
    f.write(report)

print("Advanced Analysis Successfully Completed. Results in ols_analysis_results.md")
