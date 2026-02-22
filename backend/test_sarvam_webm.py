import requests
import subprocess
import os

key = "sk_1yfvbyy4_OByoRjubSOlfP3ErDpz9tSEh"
sarvam_url = "https://api.sarvam.ai/speech-to-text-translate"
headers = {"api-subscription-key": key}

subprocess.run("say 'Hello how are you' -o test.aiff", shell=True)
subprocess.run("ffmpeg -y -i test.aiff test.wav", shell=True)
subprocess.run("ffmpeg -y -i test.wav -c:a libopus test.webm", shell=True)

with open('test.webm', 'rb') as f:
    files = {'file': ('test.webm', f.read(), 'audio/webm')}

data = {'prompt': '', 'model': 'saaras:v2.5'}

r = requests.post(sarvam_url, headers=headers, files=files, data=data)
print("Transl WEBM:", r.status_code, r.text)

with open('test.wav', 'rb') as f2:
    files2 = {'file': ('test.wav', f2.read(), 'audio/wav')}
    r2 = requests.post(sarvam_url, headers=headers, files=files2, data=data)
    print("Transl WAV:", r2.status_code, r2.text)
