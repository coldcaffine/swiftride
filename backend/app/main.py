
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models.user import User
from app.models.driver import Driver
from app.models.ride import Ride
from app.routes import auth, drivers, rides

app = FastAPI(
    title="SwiftRide API",
    description="Full-stack ride-hailing platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://swiftride-dwcnalfio-c-8b09.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(drivers.router)
app.include_router(rides.router)


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "SwiftRide API is running",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
