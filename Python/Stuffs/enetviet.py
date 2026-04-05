import requests
from bs4 import BeautifulSoup

URL = "https://thongke.enetviet.com/ThongKeBangDiem/GetC23GDTX_BangDiem_Ajax?HocKyKey=2&key=bWFfaG9jcZOaQhoKzX3Npbmg9nQWeEYIruNzk0MTzCq90qKAnAxMTQ2OCZtYV9uYW1faG9jPTIwMjUmbWFfc289NzkmbWFfdHJ1b25nPTc5NzY2NTAxJm1hX2NhcF9ob2M9MiZ0b2tlbj1leUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKbmRXbGtJam9pWkdGbU16WmlNemN0TlRCak5TMHhNV1ZoTFdFMU5EY3RNREkwTW1Gak1URXdNREF6SWl3aWFXRjBJam94TnpjMU1Ua3hOREE0TENKbGVIQWlPakUzTnpVeU1UTXdNRGdzSW1semN5STZJbUpoWTJ0bGJtUXRibTlrWlNKOS5ydzQzSmVDa0JRVHRmNm4wTEJsbEhCSFByWW9NQU5iMExwWERUb3Y3OExZJnNvX2RpZW5fdGhvYWk9MDkwOTQ3NTA5OSZleHBpcmVfdGltZT0xNzc1MjIwNTI4Jm1hX3NvX2Vudj1zaGNtJnRodV9waGk9MSZtYV9raG9pPTA3JmlkX2xvcD02MzU2NiZ0b2tlbl9mdWxsPUJlYXJlciBleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKbmRXbGtJam9pWkdGbU16WmlNemN0TlRCak5TMHhNV1ZoTFdFMU5EY3RNREkwTW1Gak1URXdNREF6SWl3aWFXRjBJam94TnpjMU1Ua3hOREE0TENKbGVIQWlPakUzTnpVeU1UTXdNRGdzSW1semN5STZJbUpoWTJ0bGJtUXRibTlrWlNKOS5ydzQzSmVDa0JRVHRmNm4wTEJsbEhCSFByWW9NQU5iMExwWERUb3Y3OExZ&maHocSinhComBo=7941011468&maNamHocCombo=2025&maSoComBo=79&maTruongComBo=79766501&maCapHocComBo=2"  # URL của bro

headers = {
    "accept": "text/html, */*; q=0.01",
    "x-requested-with": "XMLHttpRequest",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "referer": "https://thongke.enetviet.com/"
}

response = requests.get(URL, headers=headers)
soup = BeautifulSoup(response.text, "html.parser")

SUBJECTS = ["Toán", "Ngữ văn", "Ngoại ngữ", "GDCD",
            "Công nghệ", "Tin học", "KHTN", "Sử-Địa",
            "GDTC", "Nghệ thuật", "HĐTN", "GDĐP"]

print("=== BẢNG ĐIỂM LỚP 7 - HỌC KỲ II 2025 ===\n")

rows = soup.select(".monhs858")

for i, row in enumerate(rows):
    if i >= len(SUBJECTS):
        break
    
    scores = [d.text.strip() for d in row.select(".iteam-headertable67")]
    scores = [s for s in scores if s]  # bỏ ô trống
    
    print(f"📚 {SUBJECTS[i]}: {scores}")