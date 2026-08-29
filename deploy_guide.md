# CareerLens AI - Startup Setup & Deployment Guide

This guide provides simple, step-by-step instructions to run your backend and frontend servers locally, connect them, and deploy them to production.

---

## 1. Local Development Setup

Follow these steps to run both services on your local machine.

### Part A: Running the Backend (FastAPI)

1. **Open your terminal** and navigate to the backend folder:
   ```powershell
   cd c:/hackathon/backend
   ```

2. **Create a Python virtual environment** (if not already done):
   ```powershell
   python -m venv venv
   ```

3. **Activate the virtual environment**:
   * **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **Windows (CMD)**:
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   * **Mac/Linux**:
     ```bash
     source venv/bin/activate
     ```

4. **Install backend dependencies**:
   ```powershell
   pip install -r requirements.txt
   ```

5. **Configure environment variables**:
   Create a `.env` file inside the `backend` folder (or set them directly in your shell):
   ```ini
   # Replace with your actual Gemini API key from Google AI Studio
   GEMINI_API_KEY=your_gemini_api_key_here
   JWT_SECRET=super_secret_jwt_signing_key_change_me
   ```

6. **Start the FastAPI server**:
   ```powershell
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   * The API server will boot on `http://127.0.0.1:8000`.
   * Interactive Swagger API docs are available at `http://127.0.0.1:8000/docs`.

---

### Part B: Running the Frontend (Vite + React)

1. **Open a new terminal window** and navigate to the frontend folder:
   ```powershell
   cd c:/hackathon/frontend
   ```

2. **Install node packages** (updates lockfile caches):
   ```powershell
   npm install
   ```

3. **Start the development server**:
   ```powershell
   npm run dev
   ```
   * The UI will launch on `http://localhost:5173/`.
   * Any change made in the code will hot-reload in the browser instantly.

---

### Part C: Connecting Frontend to Backend

* **Automatic Connection**: The frontend `AppContext.tsx` is pre-configured to point to `http://localhost:8000/api` for API base fetches. As long as the backend server is running on port `8000` and the frontend on port `5173`, they will auto-connect.
* **CORS Settings**: The backend `main.py` is configured to allow requests from `http://localhost:5173` out of the box.

---

## 2. Production Deployment Steps

To show off your startup project live to hackathon judges or users, deploy both layers to the cloud for free using the following pathways:

### Option 1: Deploying the Backend (API & SQLite Database)
Use **Render** (render.com) or **Railway** (railway.app):

1. **Push your code to a Git repository** (GitHub/GitLab).
2. **Create a new Web Service** on Render/Railway.
3. Select your repository and configure these service settings:
   * **Environment/Runtime**: `Python`
   * **Build Command**: `pip install -r backend/requirements.txt`
   * **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. **Add Environment Variables** in the hosting dashboard settings:
   * `GEMINI_API_KEY` = *(your Google AI key)*
   * `JWT_SECRET` = *(a secure randomly generated text string)*
5. **Database persistence**: The SQLite database will be written to `careerlens.db` by default. On Render/Railway, attach a small **Persistent Disk** (e.g. mount path `/data`) and update your connection URI in `backend/app/database/connection.py` to write the `.db` file on the persistent mount so database changes survive service restarts.

---

### Option 2: Deploying the Frontend (Static Web Hosting)
Use **Vercel** (vercel.com) or **Netlify** (netlify.app):

1. **Create a new Project** on Vercel or Netlify.
2. Select your git repository.
3. Configure the frontend build directory settings:
   * **Root Directory**: `frontend`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. **Set Production API URL**:
   * If you deployed your backend to Render (e.g. `https://careerlens-api.onrender.com`), configure it in your frontend environment variable or update `API_BASE` in `frontend/src/context/AppContext.tsx` to point to your live backend endpoint.
5. Click **Deploy**. Vercel/Netlify will give you a public URL (e.g. `https://careerlens-ai.vercel.app`) to share with the judges!

---

## 3. Demo Mode (Offline Testing)

If you don't have internet access or want to test without an active backend/API key connection:
1. Open the app on `http://localhost:5173/`.
2. Click **Launch Demo** or **Try Demo Analysis** on the landing page.
3. This will bypass all network fetches, populate mock metrics, and let you test the **scoring engine, simulator checkboxes, roadmaps, and custom project boards** offline instantly!
