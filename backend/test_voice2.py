import requests

# get token
r_login = requests.post("http://localhost:8000/api/auth/login", json={"username": "admin", "password": "admin123"})
if not r_login.ok:
    print("Login err:", r_login.text)
    exit(1)
token = r_login.json()["access_token"]

with open("test.wav", "rb") as f:
    files = {"file": ("test.wav", f.read(), "audio/wav")}

r = requests.post("http://localhost:8000/api/voice-transcribe", headers={"Authorization": f"Bearer {token}"}, files=files)
print("transcribe:", r.status_code, r.text)
