# BoulderAI: AI-Powered Climbing Technique Analyzer

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=FastAPI&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

BoulderAI is an advanced, full-stack web application designed to automatically analyze bouldering and rock climbing technique using Computer Vision and Machine Learning. By extracting pose data from climbing videos, the system calculates critical biomechanical metrics to help athletes optimize their performance.

## Core AI & Biomechanics Features

The core of this project is a custom data processing pipeline built with Python, OpenCV, and MediaPipe. 

* **Automated Pose Estimation:** Utilizes MediaPipe for high-performance, frame-by-frame skeletal tracking of the climber.
* **Center of Mass (CoM) Tracking:** Calculates dynamic shifts in the climber's center of gravity (`biomechanics.py`).
* **Time Under Tension (TUT):** Algorithmically separates active climbing phases (moving) from resting phases (static).
* **Symmetry & Balance Analysis:** Evaluates limb positioning to determine left/right body symmetry and calculates off-balance percentages.
* **Dynamic Movement Detection (Dynos):** Analyzes velocity spikes (`vision.py` & `analytics.py`) to count dynamic leaps and calculate maximum reach.

## Tech Stack

### AI & Backend Pipeline
* **Python 3.10+**
* **FastAPI:** High-performance async API for serving the ML pipeline.
* **OpenCV & MediaPipe:** Core computer vision libraries for video processing and pose extraction.
* **NumPy:** Mathematical transformations and filtering (`filters.py`).

### Frontend & Architecture
* **React + TypeScript + Vite:** Fast, strictly typed user interface.
* **Tailwind CSS & Lucide React:** Modern, responsive dashboard design.
* **IndexedDB & SessionStorage:** Advanced browser state management for caching heavy video files and preserving ML analysis results without backend re-fetching.
* **Supabase (PostgreSQL):** Secure user authentication (OAuth) and persistent storage for historical climb analytics.

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