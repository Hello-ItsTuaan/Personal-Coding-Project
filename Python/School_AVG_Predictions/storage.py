import json
import os

DEFAULT_DATA = {
    "semesters": {},
    "year_formula": {"HK1_weight": 1, "HK2_weight": 2},
    "goals": {}
}

def load_data(filename):
    if not os.path.exists(filename):
        return DEFAULT_DATA.copy()

    with open(filename, "r", encoding="utf-8") as f:
        return json.load(f)
    

def save_data(filename, data):
    with open(filename, "w", encoding="utf-8") as f: 
        json.dump(data, f, indent= 2)