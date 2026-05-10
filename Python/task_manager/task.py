import shutil
from datetime import datetime
import os
import json
from colorama import Fore, Style, init
init(autoreset=True)

today = datetime.now().strftime("%Y-%m-%d")

def clear():
    os.system("cls" if os.name == "nt" else "clear")

# Lấy độ rộng terminal để căn giữa text cho đẹp
width = shutil.get_terminal_size().columns

def add_task():
    print("Please enter your TASK name!".center(width))
    task_name = input(">>>")
    
    while True:
        print(f"Please enter deadline for '{task_name}'. Ex: 14/01/2013-23:00".center(width))
        task_deadline = input(">>>")
        try:
            deadline = datetime.strptime(task_deadline, "%d/%m/%Y-%H:%M")
            break  # nhập đúng → thoát
    
        except ValueError as e:
            print(f"Error found: {e}") 
    print(f"Saved your task: " + repr(task_deadline).center(width))
    save_task(task_name, deadline)
	
def save_task(task_name, deadline):
    try:
        with open("tasks.json", 'r') as file:
            updated_tasks = json.load(file)
    except FileNotFoundError:
        updated_tasks = []
    except ValueError:
        updated_tasks = []

    updated_tasks.append({
        "name": task_name,
        "deadline": str(deadline),
        "done": False
    })

    with open("tasks.json", 'w') as file:
        json.dump(updated_tasks, file, indent=4)


def list_file():
    os.system("cls")
    try:
        with open("tasks.json", 'r') as file: 
            list_tasks = json.load(file)     
    except FileNotFoundError:
        list_tasks = []
    except json.JSONDecodeError:
        list_tasks = []
    
    for task in list_tasks:
        name = task["name"]
        done = task["done"]  # True hoặc False
        deadline = datetime.fromisoformat(task["deadline"])
        delta = deadline - datetime.now()
        day_left = delta.days
        if day_left <= 0:
            print(Fore.RED + f'{name} → {day_left} left (Deadline: "{deadline}") \n ---- DONE?: {done}')
        elif day_left <= 3:
            print(Fore.YELLOW + f'{name} → {day_left} left (Deadline: "{deadline}") \n ---- DONE?: {done}')
        else:
            print(Fore.GREEN + f'{name} → {day_left} left (Deadline: "{deadline}") \n ---- DONE?: {done}')
    input()
    os.system("cls")
    
def mark_done():
    with open("tasks.json", "r") as file:
        list_tasks = json.load(file)
    
    for i, task in enumerate(list_tasks): 
        print(f"{i+1}. {task['name']} - ({task['done']})")


    choice = int(input("Choose your task to mark it as done: "))
    list_tasks[choice - 1]["done"] = True
    os.system("cls")
    print(f"Marked!".center(width))
    input()

    with open("tasks.json", 'w') as file:
        json.dump(list_tasks, file, indent=4)
def menu():
    while True:
        os.system("cls")
        print("Please enter your choice!".center(width))
        print("1. Add tasks")
        print("2. To view tasks")
        print("3. Mark done")
        choice = input(">>>")
        if choice == "1":
            add_task()
        elif choice == "2":
            list_file()
        elif choice == "3":
            mark_done()


menu()


#⬜ Check task đã done chưa
#    ├── Option 1: Delete + set deadline mới (replace)
#    └── Option 2: Gia hạn thêm ngày