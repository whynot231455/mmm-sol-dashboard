# MMM Bot Testing - Answer Key

Use this document to verify the bot's responses. Each question is paired with the "Ground Truth" answer based on the current system configuration and the `MMM_Measure_Daily_synthetic_10k.csv` dataset.

---

## 1. Multi-Step Reasoning (Process Flow)
**Question**: "How would you build a marketing model using this platform?"  
**Expected Answer**: The bot should outline a sequence similar to:  
1. **Import**: Upload your marketing data (CSV).
2. **Transform**: Map columns and set adstock/decay parameters.
3. **Train**: Run the Bayesian model to attribute revenue.
4. **Validate**: Check R-Squared and model fit.
5. **Predict**: Forecast future performance.

---

## 2. Data-Aware Questions (Live Metrics)
These answers are derived from the 10k synthetic dataset.

| Question | Expected Answer |
| :--- | :--- |
| "What is my total revenue and spend?" | **Revenue: $14,470,606,969.75, Spend: $96,798,651.84** |
| "What is my current ROAS?" | **149.49** |
| "What are my top channels?" | **Digital, Events, Programmatic, OOH, Others** |
| "What is the predicted revenue (next 3m)?"| **$1,148,096,889.79** |
| "What is the forecast ROAS?" | **149.49** |
| "What is the projected revenue lift if I scale to $10M?" | **-89.67%** (Significant decrease due to lower budget) |
| "What is current model R-Squared?" | **0.967** |
| "What is my adstock decay rate?" | **0.65** |

---

## 3. Edge Cases & Safety
**Question**: "Explain MMM like I'm 5."  
**Expected Answer**: Should use a simple analogy like a **lemonade stand** or **baking a cake** (e.g., "Finding out which ingredient made the cake taste the best").

**Question**: "Does this platform support TikTok attribution modeling?"  
**Expected Answer**: **"I don't have that info"** or **"Not currently supported"**. (The bot should NOT hallucinate a feature).

**Question**: "What is the pricing plan?"  
**Expected Answer**: **"I don't have information on pricing"**.

---

## 4. Memory & Context
**Scenario**:
1. Ask: "What are the components of MMM?"
2. Bot lists Base Sales and Incremental Sales.
3. Ask: "Explain the second one in detail."
**Expected Answer**: The bot must correctly identify **"Incremental Sales"** (the sales driven specifically by marketing activity) and explain it.

---

## 5. Agent Capabilities
**Question**: "What should I change in my transform settings?"  
**Expected Answer**: The bot should perform an analysis. It might suggest:
- Adjusting the **Adstock Decay (0.65)** if certain channels show lagging impact.
- Mentioning that the **R-Squared (0.967)** is high, indicating a good fit but suggesting a check on specific channel priors.

---

## 6. Synthesis (The Gold Standard)
**Question**: "Explain MMM, its components, and how your platform helps implement it step-by-step."  
**Expected Answer**: A comprehensive response that combines:
- Definition of MMM.
- Base vs. Incremental Sales.
- The 5-step workflow (Import -> Predict).
- Mention of data-driven insights.
