#nhớ cài đặt thư viện keyboard trước khi chạy chương trình
# gõ lệnh terminal: pip install keyboard


import tkinter as tk
from tkinter import messagebox
import keyboard
import sys

PASSWORD = "140113" #MẬT KHẨU MỞ KHÓA, TỰ CHỈNH LẠI MẬT KHẨU NẾU MUỐN

# ===== HÀM THOÁT AN TOÀN =====
def exit_program():
    keyboard.unhook_all()
    root.destroy()
    sys.exit()

# ===== VÔ HIỆU HÓA PHÍM HỆ THỐNG =====
keyboard.block_key('windows') #win key
keyboard.block_key('esc') #esc key
keyboard.block_key('left windows') #left win ke
keyboard.block_key('right windows') #right win key  
keyboard.add_hotkey('alt+tab', lambda: None, suppress=True) #alt+tab
keyboard.add_hotkey('ctrl+esc', lambda: None, suppress=True) #ctrl+esc
keyboard.add_hotkey("ctrl+alt+del", lambda: None, suppress=True)

# ===== KIỂM TRA MẬT KHẨU =====
def check_password(event=None):
    if entry.get() == PASSWORD:
        exit_program()
    else:
        messagebox.showerror("Error", "Wrong password")

# ===== TẠO CỬA SỔ =====
root = tk.Tk()
root.title("Locked")
root.attributes("-fullscreen", True)
root.configure(bg="black")
root.protocol("WM_DELETE_WINDOW", lambda: None)  # chặn nút X

# ===== FRAME CĂN GIỮA =====
center_frame = tk.Frame(root, bg="black")
center_frame.place(relx=0.5, rely=0.5, anchor="center")

font_title = ("Courier New", 28, "bold")
font_text = ("Courier New", 16)

tk.Label(
    center_frame,
    text="Your PC is Locked by Nguyên Khang",
    bg="black",
    fg="white",
    font=font_title
).pack(pady=20)

tk.Label(
    center_frame,
    text="Password for unlock or Reboot your PC now",
    bg="black",
    fg="white",
    font=font_text
).pack(pady=10)

entry = tk.Entry(
    center_frame,
    show="*",
    font=("Courier New", 18),
    justify="center",
    width=20,
    bg="black",
    fg="white",
    insertbackground="white"
)
entry.pack(pady=10)
entry.focus()
entry.bind("<Return>", check_password)

tk.Button(
    center_frame,
    text="Unlock",
    font=font_text,
    bg="black",
    fg="white",
    activebackground="white",
    activeforeground="black",
    command=check_password
).pack(pady=15)

# ===== CHẠY CHƯƠNG TRÌNH =====
root.mainloop()
