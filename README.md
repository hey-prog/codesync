# CodeSync 🚀

CodeSync is a real-time collaborative coding platform where multiple developers can write, run, and share code in a synchronized workspace. It supports multiple languages with real-time editing and code execution capabilities.

## 🌟 Features

- 👥 Multi-user collaborative editing via WebSockets
- 🖥️ Live code execution in C++, Python, JavaScript using Judge0 API
- ⚙️ MERN-based full-stack architecture
- 🐳 Dockerized for consistent development & deployment
- 🔁 CI/CD pipeline using GitHub Actions
- 🚀 Unified app runs on port 3000 via `npm start`

## 🧱 Tech Stack

- Frontend: React.js
- Backend: Node.js, Express.js
- Real-time: WebSockets
- Code Execution: Judge0 API
- Database: MongoDB (optional)
- DevOps: Docker, GitHub Actions

## 🐳 Run Locally with Docker

To build and run:

```bash
docker build -t codesync .
docker run -p 3000:3000 codesync
