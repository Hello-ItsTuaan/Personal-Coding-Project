import os                      # Thư viện để thao tác với hệ điều hành (clear màn hình, v.v.)
import sys                     # Import sys (hiện tại chưa dùng, có thể bỏ nếu muốn gọn)
import shutil                  # Dùng để lấy kích thước terminal
import string                  # Cung cấp ascii_letters, digits,...
from datetime import datetime  # Lấy thời gian hiện tại
import time                    # Dùng sleep()   
import random                  # Dùng random.choice()


width = shutil.get_terminal_size().columns  # Lấy chiều rộng terminal để căn giữa text
os.system("cls")  # Xóa màn hình (Windows)

def check_password():
    print("PLEASE ENTER YOUR PASSWORD".center(width))
    password = input(">>>")  # Nhập password
    length = len(password)   # Tính độ dài password
    score = 0                # Điểm ban đầu
    has_upper = has_digit = has_lower = has_symbol = False  # 4 cờ kiểm tra
    
    # Duyệt từng ký tự trong password (chỉ 1 vòng lặp duy nhất)
    for char in password:
        if not char.isalnum() and not char.isspace():  # Nếu không phải chữ/số và không phải khoảng trắng → symbol
            has_symbol = True
        if char.isdigit():   # Nếu là số
            has_digit = True
        if char.isupper():   # Nếu là chữ hoa
            has_upper = True
        if char.islower():   # Nếu là chữ thường
            has_lower = True
        
    # Cộng điểm từng tiêu chí riêng (hệ thống A: mỗi cái đúng +1)
    if has_lower:
        score += 1
    if has_upper:
        score += 1
    if has_digit:
        score += 1
    if has_symbol:
        score += 1
    if length >= 8:   # Nếu độ dài >= 8 thì +1
        score += 1
         
    os.system("cls")
    print(f'Your password is "{password}"'.center(width))
    print(f"Your password length is: {length}".center(width))
    print(f"Your score is: {score}/5".center(width))
    time.sleep(1)
    print ("------------------".center(width))
    
    # Phân loại độ mạnh dựa vào điểm
    if score <= 2:
        print("❌ Weak password".center(width))
    elif score <= 4:
        print("⚠ Medium password".center(width))
    else:
        print("✅ Strong password".center(width))
        time.sleep(0.5)
        print("---Programme finished---".center(width))
        
    input("Press Enter to return to menu...".center(width))
    os.system("cls")

def generate_password():
    print("Enter how many password you would want the programme to generate: ".center(width))

    user2 = input(">>>")
    try: 
        amount = int(user2)  # Chuyển input thành số nguyên

        if amount <= 0:
            os.system("cls")
            print("Don't enter a negative number here!".center(width))
            return
        print("Please enter your password length:".center(width))
        length = int(input(">>>"))
        if length <= 0:
            print("Length must be greater than 0")
            return
        
        # Tập hợp ký tự dùng để random password
        char = string.ascii_letters + string.digits + "!@#$%^&*"  
        print("Your generated passwords:")
    
        # Lặp amount lần để tạo nhiều password
        for i in range(amount):
            password = ""
            for abc in range(length):  # Lặp length lần để tạo từng ký tự
                password += random.choice(char)  # Chọn ngẫu nhiên 1 ký tự
        
            print(f"{i+1}. {password}")  # In password đã tạo
            
        print(f"Succesfully generated {amount} password(s)".center(width))

    except ValueError:
        print("Invalid input!")  # Nếu người dùng nhập không phải số
    print("---------------------".center(width))
    input("Press Enter to return to menu...".center(width))
    
def save_users():
    exists = False
    user_username = input("Please enter your user name: ")
    user_password = input(f"Please enter your password for {user_username}: ")
    try:
        with open("accounts.txt", "r") as file: #
            for line in file:
                stored_user = line.strip().split(", ")[0]
                if stored_user == user_username:
                    exists = True
                    break
    except FileNotFoundError:
        pass  # nếu file chưa tồn tại thì coi như chưDa có user nào

    if exists:
        print("Username already exists!".center(width))
    elif " " in user_password: 
       print("Password cannot have spaces!".center(width))
    elif not user_password:
        print("Password cannot be empty!".center(width))
    else:
        with open("accounts.txt", "a") as file:
            file.write(user_username + ", " + user_password + "\n")
        for domodmyesyes in range(3):
            success_save = "Account saved!"   #Tạo biến để sử dụng sau này nha, nhớ xài:)))))
            print(success_save.center(width))
            time.sleep(0.2)

def view_accounts():
    try:
        with open("accounts.txt", "r") as file:
            for line in file:
                user, passwords = line.strip().split(", ")
                os.system("cls")
                print("Username:", user, "| Password:", passwords)
                idk =input()
                os.system("cls")
                

    
    except FileNotFoundError:
        for error in range(3):
            print("Cannot locate files".center(width))
            time.sleep(0.2)
    
    
    except ValueError:
        os.system("cls")
        print("File format is corrupted.".center(width))
        print("We've deleted accounts.txt and restart the program.".center(width))
        os.remove("accounts.txt")

    except KeyboardInterrupt:  #FUN only, it won't work nvm ;-;
        os.system("cls")
        print("Haizz".center(width))
        print("Do you want to really quit?".center(width))
        userinput = input("y/n")
        if userinput == "y":
            print("Okey...")
            sys.exit()
        else:
            os.system("cls")
            print("Yoo, thank you ^^".center(width))
            time.sleep(1) 

            

while True:
    try:
        print("_____________________".center(width))
        print(("Time: " + datetime.now().strftime("%H:%M:%S")).center(width))
        print("Please choose an option below".center(width))
        print("1. Check your password")
        print("2. Generate random password")
        print("3. Save passwords")
        print("4. View passwords")
        print("5. exit")
        print("__________________".center(width))
        user = input("My choice: ")
        
        if user == "1":
            os.system("cls")
            check_password()
            
        elif user == "2":
            os.system("cls")
            generate_password()
        elif user == "3":
            save_users()

        elif user == "4":
            view_accounts()


        elif user == "5":
            break  # Thoát chương trình
            
        else: 
            os.system("cls")
            for skibidi in range(5):  # In lỗi 5 lần cho vui =))
                print("Invalid input!".center(width))
                time.sleep(0.2)
            time.sleep(1)
            os.system("cls")
            #Chạy lại choices()
    
    except KeyboardInterrupt:
        os.system("cls")
        
        print("Did you just press Ctrl + C?".center(width))
        innput = input()
