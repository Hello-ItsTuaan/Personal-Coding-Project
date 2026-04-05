import os                           # Thư viện để chạy lệnh hệ thống (vd: clear màn hình)
import shutil                       # Lấy kích thước terminal để căn giữa
import time                         # Tạo độ trễ (sleep)
import sys                          # Thoát chương trình
from datetime import datetime       #Lấy thời gian hiện tại
from prettytable import prettytable #LÀM CÁI BẢNG ĐẸP =))


width = shutil.get_terminal_size().columns  # Lấy chiều rộng terminal
os.system("cls")  # Xoá màn hình (Windows)


def add_sessions():
    # ================== ADD SUBJECT ===============
    while True:
        print("Enter your Subject".center(width))
        subjectINPUT = input(">>>")

        #No space
        if " " in subjectINPUT:
            print(f"{subjectINPUT} should not containing space!")
            enter = input()
            os.system("cls")

        else: 
            break

    # ================== ADD learningTIME ===============

    while True:
            print(f"Enter your time for subject '{subjectINPUT}'")
            learningtime = input(">>>")

            try:
                learningtime = int(learningtime) 
                break
            except ValueError:  # Nếu nhập không phải số
                print("Time must be a number!")
                time.sleep(1)
                os.system("cls")
    
    with open("sessions.txt", "a", encoding="utf-8") as file:
        file.write(f"{subjectINPUT}-{learningtime}\n")
    

    print(f"Added {subjectINPUT} --- Using {learningtime}")
    print("Expense added successfully!")
    enter=input()
    os.system("cls")


from prettytable import PrettyTable

def view_sessions():
    try: 
        table = PrettyTable()
        table.field_names = ["Subject", "Time"]
        with open("sessions.txt", "r", encoding="utf-8") as file: 
            for line in file: 
                if not line:
                    continue

                parts = line.split("-")
                if len(parts) != 2:
                    continue
                
                subject, learningtime = parts
                learningtime = int(learningtime.strip())

                table.add_row([subject, learningtime])

        print(table)
        input()

    except FileNotFoundError:
        print("No data found")


while True:
    print("_____________________".center(width))
    print(("Time: " + datetime.now().strftime("%H:%M:%S")).center(width))
    print("Welcome to the Family Expense Tracking System!".center(width))
    print("(1) Add sessions")
    print("(2) View sessions")
    print("(3) Exit")


    choice = input("My choice: ")

    if choice == "1":
        os.system("cls")
        print("Loading...".center(width))
        time.sleep(1)
        os.system("cls")
        add_sessions()

    elif choice == "2":
        os.system("cls")
        print("Loading...".center(width))
        time.sleep(1)
        os.system("cls")
        view_sessions()
    
    elif choice == "3":
        os.system("cls")
        print("Goodbye! See you next time.".center(width))
        input()
        sys.exit()  # Thoát chương trình