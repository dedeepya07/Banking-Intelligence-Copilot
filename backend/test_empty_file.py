import requests

r_login = requests.post("http://localhost:8000/api/auth/login", json={"username": "admin", "password": "admin123"})
token = r_login.json()["access_token"]

r = requests.post("http://localhost:8000/api/voice-transcribe", headers={"Authorization": f"Bearer {token}"}, files={"file": ("test.wav", b"123", "audio/wav")})
print("transcribe:", r.status_code, r.text)
