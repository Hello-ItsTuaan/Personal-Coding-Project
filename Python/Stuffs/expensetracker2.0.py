import os
import shutil
import sys
from datetime import datetime

# Lấy chiều rộng terminal để căn giữa
width = shutil.get_terminal_size().columns

# Xoá màn hình (Windows)
os.system("cls")


# ===================== MAIN MENU =====================
def main():
    while True:  # Loop vô hạn cho tới khi chọn Exit
        print("_____________________".center(width))
        print(("Time: " + datetime.now().strftime("%H:%M:%S")).center(width))
        print("Welcome to the Family Expense Tracking System!".center(width))
        print("(1) Add expense")
        print("(2) View expenses")
        print("(3) Show statistics")
        print("(4) Exit")

        choice = input("Choose: ")

        if choice == "1":
            add_expense()
        elif choice == "2":
            view_expenses()
        elif choice == "3":
            statistics()
        elif choice == "4":
            break
        else:
            print("Invalid choice!")


# ===================== ADD EXPENSE =====================
def add_expense():
    print("Enter category:")
    category = input("Category: ")

    print("Enter product name:")
    name = input("Product name: ")

    # Nhập số lượng (phải là số > 0)
    while True:
        try:
            quantity = int(input("Quantity: "))
            if quantity <= 0:
                print("Quantity must be > 0")
                continue
            break
        except ValueError:
            print("Please enter a valid number!")

    # Nhập giá tiền (phải là số > 0)
    while True:
        try:
            price = int(input("Price per unit: "))
            if price <= 0:
                print("Price must be > 0")
                continue
            break
        except ValueError:
            print("Please enter a valid number!")

    total = quantity * price  # Tính tổng tiền

    # Ghi vào file theo format:
    # category|name|quantity|price|total
    with open("cackhoanchitieu.txt", "a", encoding="utf-8") as file:
        file.write(f"{category}|{name}|{quantity}|{price}|{total}\n")

    print("Added successfully.\n")


# ===================== VIEW EXPENSES =====================
def view_expenses():
    try:
        with open("cackhoanchitieu.txt", "r", encoding="utf-8") as file:
            print("\nAll expenses:\n")

            for line in file:
                line = line.strip()  # Xoá xuống dòng

                if not line:
                    continue  # Bỏ qua dòng trống

                parts = line.split("|")  # Tách theo dấu |

                # Lấy dữ liệu theo thứ tự đã lưu
                category = parts[0]
                name = parts[1]
                quantity = parts[2]
                price = parts[3]
                total = parts[4]

                print(f"{category} | {name} | {quantity} x {price} VND = {total} VND")

    except FileNotFoundError:
        print("No expense file found.\n")


# ===================== STATISTICS =====================
def statistics():
    try:
        total_money = 0  # Tổng tiền toàn bộ
        category_totals = {}  # Dictionary lưu tổng tiền theo từng category

        with open("cackhoanchitieu.txt", "r", encoding="utf-8") as file:
            for line in file:
                line = line.strip()

                if not line:
                    continue

                parts = line.split("|")

                category = parts[0]
                total = int(parts[4])  # Lấy total từ file

                total_money += total  # Cộng vào tổng toàn bộ

                # Cộng dồn theo category
                # Nếu category chưa có trong dict → tạo mới
                # Nếu đã có → cộng thêm
                category_totals[category] = category_totals.get(category, 0) + total

        # Nếu không có dữ liệu
        if not category_totals:
            print("No data available.\n")
            return

        print("\nStatistics by category:")
        for category, money in category_totals.items():
            print(f"{category} : {money} VND")

        # Tìm category chi nhiều nhất
        max_category = None
        max_amount = 0

        for category, money in category_totals.items():
            if money > max_amount:
                max_amount = money
                max_category = category

        print("\nTotal money spent:", total_money, "VND")
        print("Highest spending category:", max_category, "=", max_amount, "VND\n")

    except FileNotFoundError:
        print("No expense file found.\n")
    except ValueError:
        print("Data format error.\n")
    except KeyboardInterrupt:
        print("\nExiting...")
        sys.exit()


# ===================== RUN PROGRAM =====================
main()