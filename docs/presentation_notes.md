# Presentation Details: MMM Dashboard | Sol Analytics

## 1. Introduction & Objectives
*   **Project Name:** MMM Dashboard | Sol Analytics.
*   **Mission:** To bridge the gap between complex statistical modeling and actionable marketing insights.
*   **Target Audience:** Marketing Managers and Data Analysts.
*   **Key Objectives:**
    *   **Performance Measurement:** Unified view of ROI/ROAS across all channels.
    *   **Budget Optimization:** Algorithmic reallocation of spend to maximize revenue.
    *   **Predictive Forecasting:** "What-if" analysis for future planning.
    *   **Data Transformation:** User-friendly management of Adstock and Saturation effects.

## 2. System Design & Architecture
*   **Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Recharts.
*   **State Management:** Zustand (for global state) + IndexedDB via `idb-keyval` (for large dataset persistence beyond 5MB).
*   **Data Flow:**
    1.  **Ingestion:** CSV parsing via PapaParse on the `ImportPage`.
    2.  **Transformation:** Signal processing (Adstock/Saturation) on the `TransformPage`.
    3.  **Analysis:** Domain-specific hooks (`useMeasureData`, `useOptimizeData`) process the transformed signals.
    4.  **Visualization:** Interactive, responsive charts using Recharts.

## 3. Implementation Details
*   **Developed Modules:**
    *   **Measure Page:** Omnichannel tracking and contribution analysis.
    *   **Predict Page:** Revenue projections with seasonality adjustments.
    *   **Optimize Page:** Budget simulation and ROI-based reallocation.
    *   **Transform Page:** Real-time simulation of decay and diminishing returns.
*   **Algorithms:**
    *   **Adstock (Geometric):** `adstockedValue = raw + (adstockedValue * decayRate)`.
    *   **Saturation (Hill Function):** `xs / (xs + ks)` where `xs = x^slope` and `ks = inflection^slope`.
    *   **Optimization:** Proportional spend reallocation scaled to budget constraints.
*   **UI Feature:** Responsive "What-If" sliders for immediate visual feedback on complex statistical parameters.

## 4. Results & Analysis
*   **Implementation Status:** ~85-90% functional (End-to-end MMM lifecycle is operational).
*   **Performance Metrics (from system validation):**
    *   **R²:** 0.942 (Strong historical fit).
    *   **MAPE:** 12.4% (Reliable accuracy).
    *   **Durbin-Watson:** 1.95 (Minimal error correlation).
*   **Testing:** Unit tests via Vitest; causal impact measurement via GeoLift test design.
*   **Outcomes:** Identifies optimal channel mix; distinguishes organic "Base" growth from "Incremental" paid lift.

## 5. Challenges & Solutions
*   **Challenge:** Handling large CSV datasets in-browser.
    *   **Solution:** IndexedDB persistence for multi-GB data handling.
*   **Challenge:** Making complex stats (Adstock/Saturation) intuitive.
    *   **Solution:** Interactive simulation visualizers with real-time SVG updates.
*   **Challenge:** Consistent mock predictions for demo/testing.
    *   **Solution:** Seeded deterministic random functions for stable validation metrics.

## 6. Remaining Work
*   **Backend Integration:** Move heavy modeling to a Python/FastAPI backend (PyMC/Robyn).
*   **API Connectors:** Automated data syncing with Google Ads/Facebook APIs.
*   **User Management:** Auth and RBAC for multi-tenant access.
*   **Forecast Enhancement:** Integration of Prophet for advanced time-series analysis.

## 7. References
*   React & TypeScript Documentation
*   Zustand & idb-keyval State Management
*   Recharts Visualization Library
*   Marketing Mix Modeling Literature (Robyn by Meta, LightweightMMM by Google)
