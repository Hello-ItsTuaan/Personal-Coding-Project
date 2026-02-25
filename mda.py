import os 
import shutil
import time
from datetime import datetime

width = shutil.get_terminal_size().columns
os.system("cls")

print("Welcome to our Mini Data Analyzer".center(width))
print("1 .Please choose your option: ")
print("2. Find the highest_score point ")
print("3. Find the lowest point ")
print("4. Find the average: ")
print("uhh, quit:  ")



def findthehighest():
    # 1. Nhập dữ liệu từ user
    raw_input_score = input("Please enter raw score, split with 'space': ")
    score_list = raw_input_score.split()

    score = []

    # 2. Convert sang số nguyên và bắt lỗi nhập sai
    try:
        for item in score_list:
            score.append(int(item))
    except ValueError:
        print("Invalid input! Please enter numbers only.")
        return

    # 3. Kiểm tra list rỗng
    if not score:
        print("No data to analyze.")
        return

    # 4. Gán mốc ban đầu
    highest_score = score[0]

    # 5. So sánh từng phần tử
    for num in score:
        if num > highest_score:
            highest_score = num

    # 6. In kết quả
    print(f"highest score is: {highest_score}")

def findthelowest():
    # 1. Nhập dữ liệu từ user
    raw_input_score1 = input("Please enter raw score, split with 'space': ")
    score_list1 = raw_input_score1.split()
    score1 = []
    try:
        for item1 in score_list1:
            score1.append(int(item1))
    except ValueError:
        print("Invalid input! Please enter numbers only.")
        return
    

    if not score1:
        print("No data to analyze!")
        return 
    

    lowest_score = score1[0]
    for num1 in score1:
        if num1 < lowest_score:
            lowest_score = num1

    print(f"Lowest score is: {lowest_score}")


findthelowest()