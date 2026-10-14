# SwiftRide 🚗
### Full-Stack Cab Booking Platform

SwiftRide is a full-stack cab-booking application built with React and FastAPI. It provides a foundation for riders to book rides and drivers to manage ride requests through a web interface.

The project was developed to practice full-stack development, REST API integration, database management, authentication, and deployment.

## 🌐 Live Demo

- **Frontend:** https://swiftride-drab.vercel.app/
- **Backend API:** https://swiftride-backend-tqzf.onrender.com/
- **API Documentation:** https://swiftride-backend-tqzf.onrender.com/docs

## ✨ Features

- **User Authentication:** Account registration, login, and authenticated API requests.
- **Ride Booking:** Create ride requests through the application.
- **Ride History:** View previously booked rides.
- **Driver Dashboard:** Driver-side functionality for managing rides.
- **Ride Matching:** Basic logic for finding available rides.
- **Fare Calculation:** A basic fare calculation service.
- **REST API:** FastAPI endpoints connecting the frontend and backend.
- **Database Integration:** PostgreSQL database connectivity.
- **Deployment:** Frontend deployed on Vercel and backend deployed on Render.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Python | Backend programming |
| FastAPI | REST API development |
| SQLAlchemy | Database ORM |
| PostgreSQL | Relational database |
| React | Frontend interface |
| Vite | Frontend development and production builds |
| JavaScript | Frontend logic |
| CSS | Styling and responsive interface |
| Git & GitHub | Version control and source code hosting |
| Vercel | Frontend deployment |
| Render | Backend deployment |
| Neon | Managed PostgreSQL database |

## 🏗️ Project Structure

```text
cab-booking-platform/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── database.py
│   │   └── main.py
│   ├── requirements.txt
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── package.json
│   └── index.html
│
└── README.md
```

## ⚙️ Run Locally

### Prerequisites

Make sure you have installed:

- Python 3.10 or newer
- Node.js and npm
- PostgreSQL or a configured PostgreSQL database
- Git

### 1. Clone the repository

```bash
git clone https://github.com/coldcaffine/swiftride.git
cd swiftride
```

### 2. Set up the backend

```bash
cd backend

python3 -m venv env
source env/bin/activate

pip install -r requirements.txt
```

Configure the required environment variables using the settings defined in `backend/app/core/config.py`. These include your database connection and any authentication secrets required by the application.

Create a local `backend/.env` file for these values. **Never commit `.env` files or secret credentials to GitHub.**

Start the backend:

```bash
uvicorn app.main:app --reload
```

The API should be available at:

`http://127.0.0.1:8000`

Interactive API documentation:

`http://127.0.0.1:8000/docs`

### 3. Set up the frontend

Open another terminal:

```bash
cd frontend

npm install
npm run dev
```

Open the local URL printed by Vite in your terminal, usually:

`http://localhost:5173`

Ensure the frontend API client is configured to use your local backend URL when developing locally.

## 🔌 API Documentation

FastAPI provides interactive API documentation for exploring available endpoints and trying requests.

- **Local:** http://127.0.0.1:8000/docs
- **Production:** https://swiftride-backend-tqzf.onrender.com/docs

The available endpoints cover the application's implemented authentication, ride, and driver functionality.

## 🧪 Production Build

To build the frontend for production:

```bash
cd frontend
npm run build
```

The generated production files are placed in `frontend/dist/`.

## 🚀 Deployment

SwiftRide uses the following deployment setup:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Neon PostgreSQL

Configure the required environment variables in the deployment platform's settings. Keep database credentials and authentication secrets private.

## 🔮 Future Improvements

Potential future enhancements include:

- Live ride tracking with WebSockets.
- Google Maps integration for distance and travel-time estimates.
- Stripe payment processing and webhook handling.
- Redis-based caching and real-time messaging.
- Celery background jobs and automated receipts.
- Geospatial driver matching using PostGIS.
- Automated API tests and Docker-based development.

These are planned enhancements, not claims that they are already implemented.

## 🎯 Learning Outcomes

This project provided practical experience with:

- Building REST APIs using FastAPI.
- Connecting a React frontend to a Python backend.
- Working with relational databases and SQLAlchemy.
- Implementing authentication and role-based application flows.
- Organizing code into routes, schemas, models, and services.
- Building a frontend production bundle.
- Deploying a full-stack application.
- Managing source code with Git and GitHub.

## 👩‍💻 Author

**Aditi Dharme**

GitHub: https://github.com/coldcaffine

## 📄 License

No license has been specified yet. Add a `LICENSE` file if you decide to distribute the project under an open-source license.
