# GuzoMate AI-ML Pipeline

**Owner:** Member 2  
**Tech:** Python 3.11+

This directory contains GuzoMate's offline AI/ML workflows, multilingual evaluation benchmarks, and vector embedding utilities.

---

## Structure

```
ai-ml/
├── src/
│   ├── eval/
│   │   ├── benchmark_queries.json  # 30+ benchmark queries (English, Amharic, Afaan Oromo)
│   │   └── evaluate_rag.py         # Automated evaluation & language detection runner
│   ├── rag/                        # Offline RAG pipeline & experiments
│   ├── embeddings/                 # Text embedding wrappers & data loaders
│   └── datasets/                   # Curated travel training & evaluation data
├── pyproject.toml                  # Project metadata & dependencies
└── requirements.txt                # Python dependencies
```

---

## Quick Start & Evaluation

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Multilingual Benchmark Evaluation
Evaluates query intent handling, language identification accuracy, and anti-hallucination checks across English (`en`), Amharic (`am`), and Afaan Oromo (`om`):

```bash
python3 src/eval/evaluate_rag.py
```
