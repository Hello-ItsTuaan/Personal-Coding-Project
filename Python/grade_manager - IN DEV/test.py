# test_json.py

import json

# Bước 1: Tạo list 2 học sinh
students = [
    {"name": "abc", "grade": 10},  # điền tên + điểm
    {"name": "abc", "grade": 9},
]

# Bước 2: Lưu xuống file "test.json"
with open("test.json", "w") as w:  # "r" hay "w" ở đây?
    json.dump(students, w, indent=4)  # dump hay load?

# Bước 3: Đọc lại từ file
with open("test.json", "r") as r:  # "r" hay "w" ở đây?
    loaded = json.load(r)             # dump hay load?

# Bước 4: In ra tên của học sinh đầu tiên
print(loaded[0]["name"])  # index mấy?