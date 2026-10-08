# BoulderAI: AI-Powered Climbing Technique Analyzer

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=FastAPI&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)
![Nginx](https://img.shields.io/badge/nginx-%23009639.svg?style=for-the-badge&logo=nginx&logoColor=white)

> **Live Demo & API Docs**
> * **Frontend Dashboard (React):** [https://climb-app-three.vercel.app/](https://climb-app-three.vercel.app/)
> * **Backend API & Swagger Docs (FastAPI):** [https://climbapp-vr7c.onrender.com](https://climbapp-vr7c.onrender.com)

BoulderAI is an advanced, full-stack web application designed to automatically analyze bouldering and rock climbing technique using Computer Vision and Machine Learning. By extracting pose data from climbing videos, the system calculates critical biomechanical metrics to help athletes optimize their performance.

---

## Core AI & Biomechanics Features

The core of this project is a custom data processing pipeline built with Python, OpenCV, and MediaPipe. 
* **Automated Pose Estimation:** Utilizes MediaPipe for high-performance, frame-by-frame skeletal tracking of the climber.
* **Center of Mass (CoM) Tracking:** Calculates dynamic shifts in the climber's center of gravity (`biomechanics.py`).
* **Time Under Tension (TUT):** Algorithmically separates active climbing phases (moving) from resting phases (static).
* **Symmetry & Balance Analysis:** Evaluates limb positioning to determine left/right body symmetry and calculates off-balance percentages.
* **Dynamic Movement Detection (Dynos):** Analyzes velocity spikes (`vision.py` & `analytics.py`) to count dynamic leaps and calculate maximum reach.

---

## Tech Stack

### AI & Backend Pipeline
* **Python 3.11** (Optimized for MediaPipe compatibility)
* **FastAPI:** High-performance async API for serving the ML pipeline.
* **OpenCV & MediaPipe:** Core computer vision libraries for video processing and pose extraction.
* **NumPy:** Mathematical transformations and filtering (`filters.py`).

### Frontend & Architecture
* **React + TypeScript + Vite:** Fast, strictly typed user interface.
* **Tailwind CSS & Lucide React:** Modern, responsive dashboard design.
* **IndexedDB & SessionStorage:** Advanced browser state management for caching heavy video files.
* **Supabase (PostgreSQL):** Secure user authentication (OAuth) and persistent storage.

### DevOps & Infrastructure 
* **Docker:** Multi-stage builds for optimized, production-ready images.
* **Kubernetes (K8s):** Local orchestration, deployments, and service management.
* **NGINX Ingress:** Advanced routing, serving static frontend files, and managing domain access (`app.boulderai.local`).

---

## ML Pipeline Structure

The backend is highly modularized, demonstrating a clear separation of concerns typical for production-ready AI systems:

```text
backend/
├── src/
│   ├── pipeline/
│   │   ├── biomechanics.py   # Center of mass and physics calculations
│   │   ├── data_loader.py    # Video ingestion and frame extraction
│   │   └── filters.py        # Signal smoothing for trajectory data
│   ├── analytics.py          # High-level metric aggregation (TUT, Dynos)
│   └── vision.py             # OpenCV/MediaPipe inference wrappers
├── main.py                   # FastAPI application and endpoint routing
└── requirements.txt          # Python project dependencies
```

---

## Advanced Local Deployment (Kubernetes & Docker)

For a production-like environment, the application can be deployed on a local Kubernetes cluster using NGINX Ingress and multi-stage Docker builds.

**1. Build Docker Images**
```bash
# Frontend (Multi-stage build with NGINX, injecting Supabase keys via ARG)
docker build \
  --build-arg VITE_SUPABASE_URL="your_supabase_url" \
  --build-arg VITE_SUPABASE_ANON_KEY="your_supabase_key" \
  -t local-frontend:latest ./frontend

# Backend (FastAPI with updated CORS configuration)
docker build -t local-backend:latest ./backend
```

**2. Deploy to Kubernetes**
```bash
# Apply declarative configuration (Deployments, Services, NGINX Ingress)
kubectl apply -f kubernetes/
```
*Note: Ensure `app.boulderai.local` and `api.boulderai.local` are mapped to `127.0.0.1` in your system's `hosts` file.*

---

## Standard Development Setup

If you want to run the application in a standard development mode (without Docker/K8s):

**1. Backend Setup**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**2. Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

---

## Database Setup (Supabase)

This project relies on Supabase for authentication and database management. To set up the environment locally:

1. Create a new project on [Supabase](https://supabase.com/).
2. Navigate to the **SQL Editor** in your Supabase dashboard.
3. Copy the entire contents of the `schema.sql` file located in the root of this repository.
4. Run the query to automatically generate the required tables (`profiles`, `analyses`) and OAuth triggers.
5. Make sure to add your deployment domains (e.g., `http://app.boulderai.local/**`) to the **Redirect URLs** in the Supabase Authentication settings.

---

## Deployment & Environment Setup

This project uses environment variables to seamlessly switch between local development and cloud deployment. 

### Frontend Variables (`frontend/.env`)
```env
# API URL (Use http://127.0.0.1:8000 for local dev or your cloud URL for production)
VITE_API_URL=http://127.0.0.1:8000

# Supabase Client Authentication
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend Variables (`backend/.env`)
```env
# Supabase Admin Connection
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

### Cloud Hosting Architecture

This application is built with a decoupled architecture, optimizing both the client-side delivery and heavy server-side AI processing:

*   **Frontend (Client):** Hosted on **[Vercel](https://vercel.com/)**. 
    *   Ensure all frontend `.env` variables are added to the Vercel project settings.
*   **Backend (API & AI Pipeline):** Hosted on **[Render](https://render.com/)**. 
    *   > **Critical Deployment Notes for Render:** To ensure the stability of underlying C++ modules used by MediaPipe, the environment variable `PYTHON_VERSION` must be explicitly set to `3.11.0` in the Render dashboard. Furthermore, the deployment strictly relies on `opencv-python-headless` to bypass the need for GUI libraries on the cloud server.

---

## Future Roadmap
* Implementation of custom TensorFlow/PyTorch models for specific climbing hold recognition.
* 3D pose estimation integration.
* Automated route grade estimation based on movement complexity.