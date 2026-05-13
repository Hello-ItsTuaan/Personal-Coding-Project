#student.py

def calculate_gpa(grades):
    all_scores = list(grades.values())
    gpa = sum(all_scores) / len(all_scores)
    return gpa



def get_ranK(gpa):
    if gpa >= 9:
        return "HSXS"
    elif gpa >= 8:
        return "HSG"
    elif gpa >= 6:
        return "HSK"
    elif gpa < 6:
        return "HỌC SINH CHƯA ĐẠT"
    else: 
        print("invalid input!")
        return
    