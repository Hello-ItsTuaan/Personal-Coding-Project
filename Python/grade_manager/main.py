#main.py 

from file_handler import load_data
from file_handler import save_data
from student import get_ranK
from student import calculate_gpa

FILENAME = "data.json"

def add_student(students):  # nhận LIST vào
    name = input("Tên học sinh: ")
    grade = input("Enter your grades: ")
    
    van   = float(input("Điểm Văn: "))
    toan  = float(input("Điểm Toán: "))
    anh   = float(input("Điểm Anh: "))

    grades = {
        "Van": van,   # điền biến vào
        "Toan": toan,
        "Anh": anh,
    }

    gpa  = calculate_gpa(grades)   # truyền cái gì vào?
    rank = get_ranK(gpa)      # truyền cái gì vào?

    new_student = {
        "name": name,
        "grades": grades,
        "gpa": gpa,
        "rank": rank,
    }

    students.append(___)        # thêm cái gì vào list?
    print("✅ Đã thêm học sinh!")


def view_all(students):
    if len(students) == ___:    # list rỗng thì bằng mấy?
        print("Chưa có học sinh nào!")
        return
    
    for student in students:
        print(f"Tên: {student[___]} | GPA: {student[___]} | Xếp loại: {student[___]}")


def main():
    students = load_data(___)   # load file nào?

    while True:
        print("\n=== GRADE MANAGER ===")
        print("1. Thêm học sinh")
        print("2. Xem danh sách")
        print("0. Thoát")

        choice = input("Chọn: ")

        if choice == "1":
            add_student(___)    # truyền cái gì vào?
        elif choice == "2":
            view_all(___)       # truyền cái gì vào?
        elif choice == "0":
            save_data(___, ___) # 2 tham số là gì?
            break

main()