def calc_semester_avg(subject_scores, score_types):
    """
    subject_scores = {"TX1": 8.5, "TX2": None, "GK": 7.0, "CK": None}
    score_types    = {"TX1": 1,   "TX2": 1,    "GK": 2,   "CK": 3}
    """
    total_weighted = 0
    total_weight   = 0

    for col, diem in subject_scores.items():
        if diem is not None:                                # bỏ qua cột chưa có điểm
            total_weighted += diem * score_types[col]
            total_weight   += score_types[col]

    if total_weight == 0:                    # chưa có điểm nào hết
        return None

    return round(total_weighted / total_weight, 2)



def calc_needed_score(subject_scores, score_types, target):
    """
    Tính điểm cần đạt ở cột còn None để đạt target
    Chỉ tính được nếu còn đúng 1 cột None thôi!
    """
    null_cols = []
    total_weighted = 0
    total_weight_all = sum(score_types.values())  # tổng hệ số TẤT CẢ cột

    for col, diem in subject_scores.items():
        if diem is None:
            null_cols.append(col)        # gom các cột chưa có điểm
        else:
            total_weighted += diem * score_types[col]

    if len(null_cols) >1:            # còn nhiều hơn 1 cột trống
        return "too_many_nulls"

    if len(null_cols) == 0:            # không có cột nào trống
        return "complete"

    # Còn đúng 1 cột trống → tính được!
    needed = (target * total_weight_all - total_weighted) / score_types[null_cols[0]]
    return needed

def calc_year_avg(avg_hk1, avg_hk2, year_formula):
    """
    avg_hk1, avg_hk2: điểm TB từng học kỳ (float hoặc None)
    year_formula = {"HK1_weight": 1, "HK2_weight": 2}
    """
    if avg_hk1 is None or avg_hk2 is None:
        return None

    w1 = year_formula["HK1_weight"]
    w2 = year_formula["HK2_weight"]

    return (avg_hk1 * w1 + avg_hk2 * w2) / (w1 + w2)


def check_goals(subjects_avg, goals):
    """
    subjects_avg = {"Toán": 8.5, "Văn": 7.0, "Anh": None}
    goals        = {"Toán": 9.0, "Văn": 7.0}
    return: list các môn CHƯA đạt mục tiêu
    """
    not_met = []

    for subject, muc_tieu in goals.items():
        avg = subjects_avg.get(subject, None)  # .get() để không bị lỗi nếu môn chưa có điểm

        if avg is None:
            not_met.append(f"{subject}: chưa có điểm")
        elif avg < muc_tieu:
            not_met.append(f"{subject}: cần {muc_tieu}, hiện có {avg:.2f}")

    return not_met