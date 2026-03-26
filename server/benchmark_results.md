# 3-Way Model Benchmark: Gemma 3 vs. Qwen 2.5 vs. Llama 3

| Model | Test Case | Latency (s) | Pass/Fail | Question | Response |
| gemma3 | Metric Accuracy | 41.55 | ✅ | What is my total revenue and total spend? | My current data indicates that your total revenue is $346,629,978.26 and your total spend is $1,667,108.84. |
| gemma3 | RAG Synthesis | 35.52 | ✅ | What are Base Sales and Incremental Sales? | Base Sales represent the natural demand for a product or service, unaffected by marketing efforts like brand equity or seasonality. Incremental Sales,... |
| gemma3 | Instruction Following | 58.01 | ❌ | Give a 3-word summary of ROAS in French. Wait, NO - ONLY ENGLISH, JSON ONLY. | تكلم عن عائد. (Tékoom ‘an ‘a’eed.) - Speak about return. |
| qwen2.5:7b | Metric Accuracy | 32.06 | ✅ | What is my total revenue and total spend? | Your total revenue is $346,629,978.26 and your total spend is $1,667,108.84. |
| qwen2.5:7b | RAG Synthesis | 37.04 | ✅ | What are Base Sales and Incremental Sales? | Base Sales refer to sales that occur naturally without any advertising or marketing stimulation, driven by factors like brand equity and seasonality. ... |
| qwen2.5:7b | Instruction Following | 186.23 | ❌ | Give a 3-word summary of ROAS in French. Wait, NO - ONLY ENGLISH, JSON ONLY. | Return on Ad Spend |
| llama3:latest | Metric Accuracy | 53.14 | ✅ | What is my total revenue and total spend? | Your total revenue is $346,629,978.26 and your total spend is $1,667,108.84.  Sources: [] |
| llama3:latest | RAG Synthesis | 40.91 | ✅ | What are Base Sales and Incremental Sales? | Base Sales and Incremental Sales:  Base Sales refer to sales that occur naturally without any advertising or marketing stimulation, driven by fact... |
| llama3:latest | Instruction Following | 78.83 | ✅ | Give a 3-word summary of ROAS in French. Wait, NO - ONLY ENGLISH, JSON ONLY. | Here is the final, polished answer:  Return on Ad Spend (ROAS): 149.49  Note: The ROAS value provided is based on the current dashboard state an... |
