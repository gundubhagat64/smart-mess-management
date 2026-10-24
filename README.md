# MessMate – Smart Mess Management

## Stack
- React + Vite frontend
- Spring Boot 4 / Java 21 backend
- MySQL database

## Start the backend
1. Install Java 21 and MySQL.
2. Create/use a MySQL user and password. Set environment variables `DB_USERNAME` and `DB_PASSWORD` to match your local MySQL account. Defaults are `root` and an empty password.
3. Open `messmate-backend/messmate-backend` in VS Code or a terminal.
4. Run `mvn spring-boot:run` (or use `mvnw.cmd spring-boot:run` on Windows).
5. The app creates/updates tables in `smart_mess_management` using JPA. Health check: `http://localhost:8080/api/health`.

## Start the frontend
1. Install Node.js 20.19+ or 22.12+.
2. Open the project root (folder containing `package.json`).
3. Run `npm install`, then `npm run dev`.
4. Open the Vite URL, normally `http://localhost:5173`.

## Implemented database endpoints
- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/students`
- `GET /api/menus/today`, `GET /api/menus`, `POST /api/menus`, `PUT /api/menus/{id}/availability`
- `POST /api/attendance`, `GET /api/attendance/student/{studentId}`
- `POST /api/feedback`, `GET /api/feedback`, `GET /api/feedback/student/{id}`
- `GET /api/payments`, `PUT /api/payments/{id}/status`

## Notes
- Student registration/login, menu reads/writes, attendance, student listing and feedback use Spring Boot/MySQL.
- Owner accounts and payment settings still use browser localStorage. Payment status records are stored in MySQL; the current-month fee is initialized as ₹3,000 per registered student and can be adjusted in code.
- The UPI/QR settings are display/configuration only. No actual payment gateway is integrated.
- Authentication is a basic college-project login flow; do not expose it publicly without proper authorization, session/token security, and validation.
