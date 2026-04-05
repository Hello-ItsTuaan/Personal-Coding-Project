import os                           # Thư viện để chạy lệnh hệ thống (vd: clear màn hình)
import shutil                       # Lấy kích thước terminal để căn giữa
import time                         # Tạo độ trễ (sleep)
import sys                          # Thoát chương trình
from datetime import datetime       #Lấy thời gian hiện tại
from prettytable import prettytable #LÀM CÁI BẢNG ĐẸP =))


width = shutil.get_terminal_size().columns  # Lấy chiều rộng terminal
os.system("cls")  # Xoá màn hình (Windows)


def add_expense():

    # ===== NHẬP CATEGORY =====
    while True:  # Lặp đến khi nhập hợp lệ
        print("Please enter the expense category".center(width))
        category = input("My expense category is: ")

        # Không cho chứa dấu cách
        if " " in category:
            print("Category cannot contain spaces!".center(width))
            time.sleep(1)
            os.system("cls")
        else:
            break  # Hợp lệ thì thoát vòng lặp

    # ===== NHẬP TÊN CHI TIÊU =====
    while True:
        print("Please enter the expense name".center(width))
        name = input("My expense name is: ")

        # Không cho chứa dấu cách
        if " " in name:
            print("Name cannot contain spaces!".center(width))
            time.sleep(1)
            os.system("cls")
        else:
            break

    # ===== NHẬP SỐ LƯỢNG =====
    while True:
        print("Please enter the expense Quantity".center(width))
        amount = input("The Quantity of this expense is: ")

        try:
            amount = int(amount)  # Chuyển sang số nguyên
            break
        except ValueError:  # Nếu nhập không phải số
            print("The amount must be a number!")
            time.sleep(1)
            os.system("cls")
    # ===== NHẬP SỐ TIỀN =====
    while True:
        print(f"Please enter how much money do you want to spend on 1x {name}".center(width))
        price = input(f"Money i want to spend on this {name} is: ")

        try: 
            price = int(price)
            break
        except ValueError: 
            print("Price should be numbers, not characters")
            time.sleep(1)
            os.system("cls")

    # ===== GHI VÀO FILE =====
    # Format lưu: category|name|amount
    # Dùng "|" làm dấu phân cách
    with open("expenses.txt", "a", encoding="utf-8") as file:
        file.write(f"{category}|{name}|{amount}|{price}\n")
    total_price = amount * price

    print(f"Total cost for {amount}x {name} is {total_price} VND")
    print("Expense added successfully!")
    time.sleep(2)
    os.system("cls")


from prettytable import PrettyTable

def view_expenses():
    try:
        table = PrettyTable()
        table.field_names = ["Category", "Name", "Quantity", "Unit Price", "Total (VND)"] #Tạo cột hàng ngang theo từng DANH MỤC

        with open("expenses.txt", "r", encoding="utf-8") as file:
            for line in file:
                line = line.strip()
                if not line:
                    continue

                parts = line.split("|")
                if len(parts) != 4:
                    continue

                category, name, quantity, unit_price = parts

                quantity = int(quantity)
                unit_price = int(unit_price)

                total_price = quantity * unit_price

                table.add_row([category, name, quantity, unit_price, total_price])

        print(table)
        input()

    except FileNotFoundError:
        print("No data found.")

def statistics():
    total_money = 0  # Tổng tiền đã chi
    stats = {}  # Dictionary lưu tổng tiền theo từng category

    try:
        with open("expenses.txt", "r", encoding="utf-8") as file:
            for line in file:
                line = line.strip()

                if not line:
                    continue

                parts = line.split("|")

                if len(parts) != 4:
                    continue

                category, name, amount, price = parts

                amount = int(amount)
                price = int(price)

                total_price = amount * price
                
                
                # Cộng dồn theo category
                # stats.get(category, 0):
                # Nếu đã có category → lấy giá trị cũ
                # Nếu chưa có → mặc định là 0
                
                
                total_money += total_price
                stats[category] = stats.get(category, 0) + total_price


                
                

        print("Total money spent:", total_money, "VND")
        print("\nStatistics by category:")

        # In tổng tiền từng category
        for category, total in stats.items():
            print(category, ":", total)

        # Tìm category chi nhiều nhất
        max_category = None
        max_amount = 0

        for category, total in stats.items():
            if total > max_amount:
                max_amount = total
                max_category = category

        print("\nHighest spending category:", max_category, "=", max_amount, "VND")
        input()

    except FileNotFoundError:
        print("No data found.")
    except ValueError:
        print("Data format error.")


# ===== MENU CHÍNH =====
while True:
    print("_____________________".center(width))
    print(("Time: " + datetime.now().strftime("%H:%M:%S")).center(width))
    print("Welcome to the Family Expense Tracking System!".center(width))
    print("(1) Add expense")
    print("(2) View expenses")
    print("(3) Show statistics")
    print("(4) Exit")

    choice = input("My choice: ")

    if choice == "1":
        os.system("cls")
        print("Loading...".center(width))
        time.sleep(1)
        os.system("cls")
        add_expense()

    elif choice == "2":
        os.system("cls")
        print("Loading...".center(width))
        time.sleep(1)
        os.system("cls")
        view_expenses()

    elif choice == "3":
        os.system("cls")
        print("Loading...".center(width))
        time.sleep(1)
        os.system("cls")
        statistics()

    elif choice == "4":
        os.system("cls")
        print("Goodbye! See you next time.".center(width))
        input()
        sys.exit()  # Thoát chương trình