import shutil
from datetime import datetime
import os
import json
from colorama import Fore, Style, init
from datetime import timedelta
init(autoreset=True)

today = datetime.now().strftime("%Y-%m-%d")

def clear():
    os.system("cls" if os.name == "nt" else "clear")

# Lấy độ rộng terminal để căn giữa text cho đẹp
width = shutil.get_terminal_size().columns

def add_task():
    try:
        updated_task = []
        with open("tasks.json", "r") as file:
            updated_task = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        updated_task = []


    while True: 
        print("Please enter your TASK name!".center(width))
        task_name = input(">>>")
        

        if is_duplicate(task_name):
            print("You have 2 options: ".center(width))
            print(f"1. Set a new task with new deadline ")
            print(f"2. Set a new deadline for task: '{task_name}'")
            
            replace_or_setnew = input(">>>")

            if replace_or_setnew == "1": 
                continue
            elif replace_or_setnew == "2": 
                os.system("cls")
                print("Opsie! There are 2 new options:")
                print(f"1. Add more time to {task_name} ")
                print(f"2. Set a new deadline for task: '{task_name}'")
                choice = input(">>>")
            
            
            if choice == "1":
                
                for task in updated_task:
                    if task['name'] == task_name:
                        current_deadline = task['deadline']
                        break
                
                extra_days = int(input(f"Current deadline: {current_deadline}\nHow many days to add? "))

                for task in updated_task:
                    if task['name'] == task_name:
                        old = datetime.fromisoformat(task['deadline'])
                        task["deadline"] = str(old + timedelta(days=extra_days))
                        
                with open("tasks.json", 'w') as file: 
                    json.dump(updated_task, file, indent=4)
                        
                print(f"Added {extra_days} day(s) to {task_name} sucessfully! ")
                

            
            
            
            
            elif choice == "2":
                while True:
                    new_deadline = input(f"Enter new deadline (Ex: 14/01/2013-23:00): ")
                    try:
                        deadline_parsed = datetime.strptime(new_deadline, "%d/%m/%Y-%H:%M")  # ✅ validate
                        break
                    except ValueError:
                        print("Wrong format!")
                    
                    
                
                try: 
                    for task in updated_task:
                        if task["name"] == task_name:
                            task["deadline"] = str(deadline_parsed)
                    with open("tasks.json", 'w') as file: 
                        json.dump(updated_task, file, indent=4)
                    print(f"Task {task_name} has been updated!")
                    

                except FileNotFoundError:
                    print("File not found!")

            input()
            break
                    
                



        while True:
            print(f"Please enter deadline for '{task_name}'. Ex: 14/01/2013-23:00".center(width))
            task_deadline = input(">>>")
            try:
                deadline = datetime.strptime(task_deadline, "%d/%m/%Y-%H:%M")
                break  # nhập đúng → thoát
        
            except ValueError as e:
                print(f"Error found: {e}")

        print(f"Saved your task: {repr(task_deadline)}".center(width))   # ✅
        save_task(task_name, deadline)
        break


def is_duplicate(task_name):
    try: 
        with open("tasks.json", 'r') as file:
            existing_task = json.load(file)
    except FileNotFoundError:
        return False
    except json.JSONDecodeError:
        return False
    
    
    for task in existing_task:
        if task['name'] == task_name:
            return True
    return False 
    


	
def save_task(task_name, deadline):
    try:
        with open("tasks.json", 'r') as file:
            updated_tasks = json.load(file)
    except FileNotFoundError:
        updated_tasks = []
    except json.JSONDecodeError:
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
            print(Fore.WHITE + f'{name} → {day_left} left (Deadline: "{deadline}") \n ---- DONE?: {done}')
        elif day_left <= 3:
            print(Fore.RED + f'{name} → {day_left} left (Deadline: "{deadline}") \n ---- DONE?: {done}')
        elif day_left <= 7:
            print(Fore.YELLOW + f'{name} → {day_left} left (Deadline: "{deadline}") \n ---- DONE?: {done}')
        else:
            print(Fore.GREEN + f'{name} → {day_left} left (Deadline: "{deadline}") \n ---- DONE?: {done}')
    input()
    os.system("cls")
    
def mark_done():
    while True:
        try: 
            with open("tasks.json", "r") as file:
                list_tasks = json.load(file)
            
            for i, task in enumerate(list_tasks): 
                print(f"{i+1}. {task['name']} - ({task['done']})")


            choice = int(input("Choose your task to mark it as done: "))
            list_tasks[choice - 1]["done"] = True
            with open("tasks.json", 'w') as file:
                json.dump(list_tasks, file, indent=4)
            
            os.system("cls")
            print(f"Marked!".center(width))
            input()
            break


        except FileNotFoundError:
            print("File not found!")
            break
        except ValueError:
            print("Please enter a number!")
            input()
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


