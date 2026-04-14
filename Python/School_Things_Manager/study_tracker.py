import os
import shutil
import time
import sys
from datetime import datetime
from prettytable import PrettyTable
import matplotlib.pyplot as plt
import subprocess
import random
from datetime import datetime

today = datetime.now().strftime("%Y-%m-%d")

def clear():
    os.system("cls" if os.name == "nt" else "clear")

width = shutil.get_terminal_size().columns

# ================= LOADING SPINNER ==============
def progress_bar(duration=3):
    total = 100

    for i in range(total + 1):
        bar = "█" * (i // 2)
        print(f"\r[{bar:<50}] {i}%", end="")
        time.sleep(duration / total)

    print("\n✅ Done!")

# ================== CHECK FOR EXISTED ============
def checking_for_exists(subject):
    try: 
        with open("sessions.txt", "r", encoding="utf-8") as file: 
            for line in file: 
                if not line.strip():
                    continue
                
                parts = line.strip().split("|")
                saved_subject = parts[0]
                
                if saved_subject.lower() == subject.lower():
                    return True

    except FileNotFoundError:
        return False

    return False


# ================== ADD SESSION ==================
def add_sessions():
    while True:
        print("Enter your Subject".center(width))
        subject = input(">>> ").strip()

        if subject == "" or " " in subject:
            print("Subject must not be empty or contain spaces!")
            input()
            clear()
            continue

        if checking_for_exists(subject):
            clear()
            print("❌ Subject already exists!".center(width))

            print(f'1. Re-enter new subject (not "{subject}")')
            print(f"2. Add more time to '{subject}'")
            print("3. Cancel")

            while True:
                choice = input(">>> ")
                if choice in ["1", "2", "3"]:
                    break
                print("Invalid choice!")

            if choice == "1":
                clear()
                continue

            elif choice == "2":
                while True:
                    try:
                        extra_time = int(input("Enter extra minutes: "))
                        break
                    except ValueError:
                        print("Must be a number!")

                updated_sessions = []

                with open("sessions.txt", "r", encoding="utf-8") as file:
                    for line in file:
                        if not line.strip():
                            continue

                        s, m, d = line.strip().split("|")
                        m = int(m)

                        if s.lower() == subject.lower():
                            m += extra_time

                        updated_sessions.append((s, m, d))

                with open("sessions.txt", "w", encoding="utf-8") as file:
                    for s, m, d in updated_sessions:
                        file.write(f"{s}|{m}|{d}\n")

                print("✅ Time added successfully!")
                input()
                clear()
                return

            else:
                clear()
                return

        break

    while True:
        print(f"Enter time for '{subject}' (minutes)")
        try:
            minutes = int(input(">>> "))
            break
        except ValueError:
            print("Must be a number!")
            time.sleep(1)
            clear()

    with open("sessions.txt", "a", encoding="utf-8") as file:
        file.write(f"{subject}|{minutes}|{today}\n")

    print(f"Added: {subject} | {minutes} min")
    input()
    clear()


# ================== DELETE =================
def del_sessions():
    try: 
        table = PrettyTable()
        table.field_names = ["Subject", "Time", "Date"]

        sessions = []
        
        with open("sessions.txt", "r", encoding="utf-8") as file: 
            for line in file: 
                if not line.strip():
                    continue

                s, m, d = line.strip().split("|")
                sessions.append((s, m, d))
                table.add_row([s, int(m), d])

        print(table)
        del_subject = input("Enter name of subject to remove: ")

        new_sessions = []
        found = False

        for s, m, d in sessions: 
            if s.lower() != del_subject.lower():
                new_sessions.append((s, m, d))
            else: 
                found = True 

        if not found: 
            print("❌ Subject not found!")
        else: 
            with open("sessions.txt", "w", encoding="utf-8") as file: 
                for s, m, d in new_sessions:
                    file.write(f"{s}|{m}|{d}\n")
            print("✅ Deleted successfully!")

        input()
        clear()

    except FileNotFoundError:
        print("File doesn't exist!")
        input()


# ================== VIEW ==================
def view_sessions():
    try:
        table = PrettyTable()
        table.field_names = ["Subject", "Time", "Date"]

        with open("sessions.txt", "r", encoding="utf-8") as file:
            for line in file:
                if not line.strip():
                    continue

                s, m, d = line.strip().split("|")
                table.add_row([s, int(m), d])

        print(table)
        input()
        clear()

    except FileNotFoundError:
        print("No data yet 😴")
        input()


# ================== STATS ==================
def stats():
    subjects = {}

    try:
        with open("sessions.txt", "r", encoding="utf-8") as file:
            for line in file:
                if not line.strip():
                    continue

                s, m, d = line.strip().split("|")

                if d == today:
                    s = s.lower()
                    m = int(m)

                    if s in subjects:
                        subjects[s] += m
                    else:
                        subjects[s] = m

        if not subjects:
            print("No data for graph 😴")
            input()
            return

        x = list(subjects.keys())
        y = list(subjects.values())

        plt.bar(x, y)
        plt.title("Study Progress (Today)")
        plt.xlabel("Subjects")
        plt.ylabel("Minutes")
        plt.show()

    except FileNotFoundError:
        print("No sessions found 😭")
        input()

# ================== BEWARE! ===============
def reset():
    file_path = "sessions.txt"

    if os.path.isfile(file_path):
        os.remove(file_path)
        print("File deleted.")
    else:
        print("File not found.")

# ================== MENU ==================
def menu():
    clear()
    progress_bar(1)
    
    while True:
        print("_____________________".center(width))
        print(("Time: " + datetime.now().strftime("%H:%M:%S")).center(width))
        print("Study Tracker".center(width))
        print("(1) Add session")
        print("(2) View sessions")
        print("(3) Show graph stats")
        print("(4) Delete sessions")
        print("(5) Exit")

        choice = input(">>> ")

        if choice == "1":
            clear()
            add_sessions()

        elif choice == "2":
            clear()
            view_sessions()

        elif choice == "3":
            clear()
            stats()

        elif choice == "4":
            clear()
            del_sessions()

        elif choice == "5":
            print("Bye 👋")
            sys.exit()
        
        elif choice == "rl":
            clear()
            progress_bar(1)
            subprocess.run(["python", "study_tracker.py"])
        
        elif choice == "del":
            print("Do you really want to reset the data? ALL DATA WILL BE LOST!".center(width))
            user_confirm = input("MY CHOICE (y/n): ").lower() 
            
            if user_confirm == "y":
                reset()
                print("Data has been reset!".center(width))
            else:
                print("Phew! That was close. Nice choice!".center(width))
                return

        else:
            print("Invalid choice")
            time.sleep(1)
            clear()


menu()