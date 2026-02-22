import requests

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTc3MTY5MjM5M30.ynY8emrN7xcv4sykm99yWfUlJk6DNePwQm4VyPRfx0w"
with open("test.wav", "rb") as f:
    files = {"file": ("test.wav", f.read(), "audio/wav")}
r = requests.post("http://localhost:8000/api/voice-transcribe", headers={"Authorization": f"Bearer {token}"}, files=files)
print(r.status_code, r.text)
