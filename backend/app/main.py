from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import os
from fastapi.staticfiles import StaticFiles

from app.routes.analyze import router as analyze_router

app = FastAPI(title="Document Fraud Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(os.path.join(STATIC_DIR, "heatmaps"), exist_ok=True)
os.makedirs(os.path.join(STATIC_DIR, "reports"), exist_ok=True)
os.makedirs(os.path.join(STATIC_DIR, "uploads"), exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

app.include_router(analyze_router)


@app.get("/")
def health_check():
    return {"status": "Document Fraud Detection API is running"}
