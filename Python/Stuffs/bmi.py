import os
import time
import shutil
from datetime import datetime
import sys as sys

width = shutil.get_terminal_size().columns

print("Welcome to our BMI Calculator script".center(width))
print(("Time: " + datetime.now().strftime("%H:%M:%S")).center(width))

def goodbye_message():
    for _ in range(10):
        print("Why don't you use our BMI calculator?")
        time.sleep(0.1)
    sys.exit()

def calculate_BMI():
    Name = str(input("Enter your name: "))
    unit = str(input("Enter your unit (m/cm/ft/in): ")).strip().lower()
    weight = float(input("Enter your weight in kg: "))
    height = float(input(f"Enter your height in {unit}: "))
    if unit == "m":
        height = height
    elif unit == "cm":
        height = height / 100
    elif unit == "ft":
        height = height / 3.281
    elif unit == "in":
        height = height / 39.37
    else:
        for _ in range(10):
            os.system("cls")
            print(f"⚠ ERROR: The unit shouldn't be '{unit}'".center(width))
            print("PLEASE TRY AGAIN!".center(width))
            time.sleep(0.5)
            return
    
    BMI = weight / (height ** 2) 
    BMI = round(BMI, 3)
    print("---Process complete---".center(width))
    print(f"Hi {Name}, your BMI is ~ {BMI}")
    if BMI < 18.5:
        print("You are underweight")
    elif BMI < 25:
        print("You have a normal weight")
    elif BMI < 30:
        print("You are overweight")
    else:
        print("You are obese")

    time.sleep(3)
    print("---Programm end---".center(width))
    

def main():
    ques = str(input("Do you want to calculate your BMI? (yes/no/bye): ")).strip().lower()
    if ques == "yes":
        calculate_BMI()
    elif ques == "no":
        goodbye_message()
    elif ques == "bye":
        print("Thank you for using our script!".center(width))
        sys.exit()
    else:
        print("Invalid input, please try again!")
        main()
    

while True:
    main()
    