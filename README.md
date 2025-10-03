# PDF Extracter

Complete source code for **PDF Extracter**, a project to extract and normalize data from PDFs.  
Frontend is built with **Next.js**, and backend is powered by **FastAPI**.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Models](#models)
5. [Setup Instructions](#setup-instructions)
6. [Running Locally](#running-locally)
7. [Deployment](#deployment)
8. [Environment Variables](#environment-variables)
9. [License](#license)

---

## Project Overview
PDF Extracter allows users to upload PDF documents and extract structured data using multiple extraction models. The system normalizes the extracted data into a consistent format for downstream usage.

---

## Features
- Upload PDF files from frontend  
- Choose extraction model (`OmniDocs` or `Docling`)  
- Backend processing with FastAPI  
- Normalized output for easy consumption  
- OAuth login support via Google (NextAuth.js)  
- Supports multiple file uploads  
- Handles complex layouts and tables  

---

## Architecture
```text
PDF Extracter
│
├── backend (FastAPI)
│   ├── app
│   │   ├── main.py              # FastAPI entrypoint
│   │   ├── extractor_factory.py # Factory for model selection
│   │   ├── facade.py            # Facade for extraction pipeline
│   │   ├── utils                # Helper functions, normalization
│   │   └── models               # Model handlers (OmniDocs, Docling)
│   ├── requirements.txt
│   └── deploy.py                # Modal deployment script
│
├── frontend (Next.js)
│   ├── app          # Pages and API routes
│   ├── components   # UI components
│   ├── lib          # API functions, utilities
│   ├── public
│   ├── .env.local   # Local environment variables
│   ├── package.json
│   └── next.config.mjs
│
└── README.md
```

---

## Models

### OmniDocs
- Proprietary PDF extraction model
- Handles structured and semi-structured documents
- Returns normalized JSON output

### Docling
- Open-source document extraction model
- Good for text-heavy PDFs
- Returns normalized JSON output

---

## Setup Instructions

### Backend
```bash
cd backend
python -m venv venv

# Activate the virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

Create a `.env.local` file with the following variables:
```env
NEXTAUTH_URL=https://<your-vercel-subdomain>.vercel.app
NEXTAUTH_SECRET=<random-string>
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
```

---

## Running Locally

### Backend
```bash
uvicorn app.main:app --reload
```
Access at: http://localhost:8000

### Frontend
```bash
npm run dev
```
Access at: http://localhost:3000

---

## Deployment

### Frontend (Vercel)
1. Go to Vercel dashboard → Import Project from GitHub
2. Set Root Directory: `frontend`
3. Add environment variables (see above)
4. Deploy the project

Access live app at:
```
https://<your-vercel-subdomain>.vercel.app
```

### Backend
- Deploy with Modal (`deploy.py`) or any cloud provider
- Ensure frontend points to the backend API URL

---

## Environment Variables

### Frontend (.env.local)
```env
NEXTAUTH_URL=https://<your-vercel-subdomain>.vercel.app
NEXTAUTH_SECRET=<random-string>
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
```

### Backend (.env)
Add backend-specific credentials if needed.

**Note:** Ensure Google OAuth redirect URIs match your deployed domain:
```
https://<your-vercel-subdomain>.vercel.app/api/auth/callback/google
```

---

## .gitignore
Ensure `.gitignore` excludes:
- `node_modules`
- `.next`
- `venv`
- `__pycache__`
- `*.pyc`
- `.env.local`
- `.env`

---

## License
MIT License © Suhas-30

---

**Need help?** Open an issue or reach out to the maintainer.