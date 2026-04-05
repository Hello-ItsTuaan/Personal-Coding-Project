import random
import shutil
import os
import time

width = shutil.get_terminal_size().columns
os.system("cls")

print("First, what is your name?".center(width))
name = input(">>> ")

os.system("cls")
print("Please enter your guessing range".center(width))

# kiểm tra input range
while True:
    try:
        here = int(input("From: "))
        to = int(input("To: "))
        if here >= to:
            print("Range không hợp lệ bro 😭 (From < To)")
            continue
        break
    except ValueError:
        print("Phải nhập số!")

os.system("cls")
print(f"Chào Mừng {name} đến với trò chơi đoán số!".center(width))
time.sleep(1)

usercount = 0
robotcount = 0


def guessing():
    number = random.randint(here, to)
    attempts = 0

    while True:
        try:
            guess = int(input(f"Đoán số từ {here} - {to}: "))
        except ValueError:
            print("Phải nhập số bro 😭")
            continue

        attempts += 1

        if guess > number:
            print("📈 Cao quá")
            input("Enter để tiếp tục...")
            os.system("cls")

        elif guess < number:
            print("📉 Thấp quá")
            input("Enter để tiếp tục...")
            os.system("cls")

        else:
            print("🎯 ĐÚNG RỒI!".center(width))
            print(f"Số đúng là: {number}")
            print(f"Số lần đoán: {attempts}")
            input("Enter để tiếp tục...")
            os.system("cls")
            break

    return attempts


# game loop
while True:
    attempts = guessing()

    # logic tính điểm chuẩn hơn
    if attempts == 1:
        usercount += 1
        print("💀 One shot luôn, ghê vậy bro")
    else:
        robotcount += 1
        print("🤖 Robot thắng round này")

    print(f"Current score — You: {usercount} | Robot: {robotcount}")
    input("Enter để tiếp tục...")

    print("Do you want to try again? Y/N".center(width))
    again = input(">>> ")

    if again.lower() != "y":
        print("Cảm ơn đã chơi! 👋".center(width))
        break