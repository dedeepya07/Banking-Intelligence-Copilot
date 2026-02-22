import requests

r_login = requests.post("http://localhost:8000/api/auth/login", json={"username": "admin", "password": "admin123"})
print("Login status:", r_login.status_code)
if not r_login.ok:
    print(r_login.text)
    exit(1)

token = r_login.json()["access_token"]

try:
    r = requests.post("http://localhost:8000/api/voice-transcribe", headers={"Authorization": f"Bearer {token}"}, files={"file": ("test.wav", b"123", "audio/wav")})
    print("transcribe:", r.status_code, r.text)
except Exception as e:
    print("Error:", e)
