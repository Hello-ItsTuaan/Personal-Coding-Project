import os 
import shutil
import sys as skibidi
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

def taking_scores():
        # 1. Nhập dữ liệu từ user
    raw_input_score = input("Please enter raw score, split with 'space': ")
    score_list = raw_input_score.split()
    score = []
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
    
    return score


def findthehighest(score):

    # 4. Gán mốc ban đầu
    highest_score = score[0]

    # 5. So sánh từng phần tử
    for num in score:
        if num > highest_score:
            highest_score = num

    # 6. In kết quả
    print(f"highest score is: {highest_score}")

def findthelowest(score):
    lowest_score = score[0]
    for num in score:
        if num < lowest_score:
            lowest_score = num
    print(f"Lowest score is: {lowest_score}")

def findaverage(score):
    total = sum(score)
    part = len(score)

    average = total / part
    average = round(total / part, 2)

    print(f"Average score: {average}")

    




scores = taking_scores()

if scores is not None:
    findthehighest(scores)
    findthelowest(scores)
    findaverage(scores)