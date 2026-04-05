import shutil
import os
import time
width = shutil.get_terminal_size().columns
os.system("cls")

def check_password():
    print("Please enter your password".center(width))
    password = input(">>>")
    length = len(password)
    score = 0 
    has_upper = has_digit = has_lower = has_symbol = False
    for char in password: 
        if not char.isalnum() and not char.isspace():
            has_symbol = True
        if char.isdigit():
            has_digit = True
        if char.isupper():
            has_upper = True
        if char.islower:
            has_lower = True

    if has_lower:
        score += 1
    if has_digit:
        score += 1
    if has_symbol:
        score += 1
    if has_upper:
        score += 1
    if length >= 8:
        score += 1


    os.system("cls")
    print(f"Your password is {password}")
    print(f"Your password ({password}) length is: {length}".center(width))
    print(f"Your score is: {score}/5".center(width))
    time.sleep("1")

    print("-------------------".center(width))