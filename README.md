# 🛡️ CyberShield AI - Password Strength Checker & Smart Generator

> **Live Application Demo:** [https://team-6-o37q.onrender.com](https://team-6-o37q.onrender.com)

CyberShield AI is a modern, high-performance web application designed to evaluate password strength using real-time entropy calculation, dictionary pattern detection, and time-to-crack estimations. It also features a Smart Password Generator for generating secure, customizable passwords.

---

## ✨ Features

- **⚡ Real-Time Entropy Calculation**: Measures true cryptographic information density in bits.
- **⏳ Time-to-Crack Estimator**: Calculates estimated offline brute-force hack duration based on modern 100 Billion guess/sec GPU clusters.
- **🧠 Pattern & Dictionary Attack Detection**: Identifies common passwords, keyboard patterns (e.g. `qwerty`, `123456`), repeating sequences, and leetspeak substitutions.
- **🔐 Smart Password Generator**: Generates high-entropy random passwords or personalized passwords based on custom parameters.
- **🚀 Flask Backend & Gunicorn Integration**: REST API integration with a Python Flask server ready for cloud deployment.
- **🎨 Glassmorphic Cyber Security UI**: Cyberpunk-inspired responsive dark theme with smooth micro-animations.

---

## 🌐 Live Demo

Visit the deployed app on Render:
👉 **[https://team-6-o37q.onrender.com](https://team-6-o37q.onrender.com)**

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Glassmorphism Design System), JavaScript (ES6+)
- **Backend**: Python 3, Flask, Gunicorn
- **Deployment**: Render.com Blueprint (`render.yaml` & `Procfile`)

---

## 💻 Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.name.git
   cd "Password strength cheacker"
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Flask Backend Server:**
   ```bash
   python server.py
   ```

4. **Open in Browser:**
   Navigate to `http://localhost:5000`

---

## 🚀 Deployment to Render.com

This project is pre-configured for **Render** using `render.yaml` and `Procfile`.

1. Push this repository to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) -> **New Web Service**.
3. Select your repository.
4. Set Build Command: `pip install -r requirements.txt`
5. Set Start Command: `gunicorn server:app`
6. Click **Deploy**!
