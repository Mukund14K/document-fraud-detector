import json
import httpx
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

image_path = r'e:\document-fraud-detector\sample-documents\genuine\IMG_8763.jpg'
with open(image_path, 'rb') as f:
    response = client.post(
        '/analyze',
        files={'file': ('IMG_8763.jpg', f, 'image/jpeg')}
    )

print("Status Code:", response.status_code)
try:
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print("Response is not JSON:", response.text)
