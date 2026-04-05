from storage import load_data, save_data

data = load_data("grades.json")
print(data)  # Lần đầu → in ra DEFAULT_DATA

data["goals"]["Toán"] = 9.0
save_data("grades.json", data)

data2 = load_data("grades.json")
print(data2["goals"])  # Phải in ra {'Toán': 9.0}