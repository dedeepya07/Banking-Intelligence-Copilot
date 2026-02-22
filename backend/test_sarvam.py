import requests

key = "sk_1yfvbyy4_OByoRjubSOlfP3ErDpz9tSEh"
sarvam_url = "https://api.sarvam.ai/speech-to-text-translate"
headers = {"api-subscription-key": key}

files = {'file': ('test.wav', b'RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00', 'audio/wav')}
data = {'prompt': '', 'model': 'saaras:v2.5'}

print("testing translate with saaras:v2.5")
try:
    r = requests.post(sarvam_url, headers=headers, files=files, data=data)
    print("Transl:", r.status_code, r.text)
except Exception as e:
    print("Transl Error:", e)

data2 = {'prompt': '', 'model': 'saaras:v3'}
print("testing translate with saaras:v3")
try:
    r2 = requests.post("https://api.sarvam.ai/speech-to-text", headers=headers, files=files, data=data2)
    print("STT:", r2.status_code, r2.text)
except Exception as e:
    print("STT Error:", e)
