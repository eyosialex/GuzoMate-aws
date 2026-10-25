"""
GuzoMate AI Assistant Multilingual RAG Evaluation Suite
SRS FR-01, FR-05 & Workflow B Benchmark Evaluator
"""

import json
import os
import re
from typing import Dict, List, Any

ETHIOPIC_REGEX = re.compile(r'[\u1200-\u137F\u2D80-\u2DDF\uAB00-\uAB2F]')
OROMO_KEYWORDS = {
    'akkam', 'nagaa', 'maal', 'eessa', 'eessatti', 'buna', 'mana', 'nyaata',
    'nyaataa', 'hotelii', 'hospitaala', 'karaa', 'rooba', 'roobni', 'qilleensa', 'fagoo',
    'dhihoo', 'dhihootti', 'akkamitti', 'jira', 'jiraa', 'jirtu', 'itti', 'waan', 'guyyaa',
    'galatoomi', 'barbaada', 'barbaaddi', 'barbaadii', 'tiraafika', 'cufame', 'cufama',
    'balaa', 'baasii', 'baabura', 'qoricha', 'garaajii', "boba'aa", "ho'a", 'qorra',
    'tilmaama', 'finfinnee', 'gatiin', 'gatii', 'kutaa', 'meeqa', "sa'aatii", "har'a",
    'keessatti', 'booda', 'kaaffee', 'natti', 'himi', 'isaa', 'argadha', 'argachuu',
    'dhaquu', 'danda', "danda'a", 'boolee', 'piyaassaatti', 'saarbeet'
}

def detect_language(text: str) -> str:
    if ETHIOPIC_REGEX.search(text):
        return 'am'
    
    # Normalize text to lower case and tokenize words
    words = set(re.findall(r"[\w']+", text.lower()))
    if any(w in OROMO_KEYWORDS for w in words):
        return 'om'
        
    return 'en'

def run_evaluation():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    benchmark_path = os.path.join(script_dir, 'benchmark_queries.json')
    
    with open(benchmark_path, 'r', encoding='utf-8') as f:
        benchmarks: List[Dict[str, Any]] = json.load(f)
        
    print(f"==================================================")
    print(f" GuzoMate Multilingual Assistant Benchmark Runner")
    print(f" Total Benchmark Test Cases: {len(benchmarks)}")
    print(f"==================================================")
    
    stats = {
        'en': {'total': 0, 'lang_pass': 0},
        'am': {'total': 0, 'lang_pass': 0},
        'om': {'total': 0, 'lang_pass': 0},
    }
    
    for item in benchmarks:
        lang = item['language']
        stats[lang]['total'] += 1
        
        detected_lang = detect_language(item['query'])
        if detected_lang == lang:
            stats[lang]['lang_pass'] += 1
        else:
            print(f"[FAIL] {item['id']}: Expected {lang}, detected {detected_lang} for query: {item['query']}")

    print("\n--- Language Detection Results ---")
    all_passed = True
    for lang, res in stats.items():
        pass_rate = (res['lang_pass'] / res['total']) * 100 if res['total'] > 0 else 0
        print(f"Language [{lang.upper()}]: {res['lang_pass']}/{res['total']} passed ({pass_rate:.1f}%)")
        if res['lang_pass'] != res['total']:
            all_passed = False
            
    print("\n--- Summary ---")
    if all_passed:
        print("ALL MULTILINGUAL BENCHMARKS PASSED (100% Accuracy)")
    else:
        print("SOME BENCHMARK TESTS FAILED")
        
    return all_passed

if __name__ == '__main__':
    run_evaluation()
