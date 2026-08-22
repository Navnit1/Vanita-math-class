# Vanita Maths Classes — Coaching Institute Management System

A complete, production-ready coaching institute management platform for Standards 6th–12th, built with the MERN stack.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT (Access + Refresh tokens) |
| Payments | Razorpay (online) + offline recording |
| File Upload | Multer |

---

## Features

**Public Landing Page**
- Hero, About, Courses (6th–12th), Faculty, Achievers, Testimonials, Gallery, FAQ, Contact form, Map placeholder, Footer
- Responsive (mobile / tablet / desktop), dark/light mode toggle, smooth animations

**Admin Portal**
- Dashboard: Total Students, Active Students, Fees Collected, Pending Fees, Attendance %, Notes Count, Active Notices
- Student Management: auto-generated Student ID (`STD8-2026-001`), username, temp password — credential copy/print/download
- **Pro Feature: Student ID Card Generator** — printable/downloadable ID card per student
- **Pro Feature: Bulk Fee Reminder** — one-click high-priority announcement to all students with pending fees
- Attendance Management: mark by Standard + Batch + Date, all-present/all-absent shortcuts
- Study Materials: upload PDF/DOCX/PPT, scoped by standard
- Announcements: create/edit/delete with standard targeting, priority, expiry — only the right students see them
- Fee Management, Bulk Fee Creation, Payment Management (Razorpay + offline)
- Reports: fees, attendance %, revenue by month
- Settings: profile, password change, Activity/Audit Log (tracks student creation, attendance, announcements, logins)

**Student Portal**
- Dashboard: attendance %, fee status, latest notes, upcoming tests, announcements panel
- Attendance: Calendar view (color-coded by status) + List view + monthly stats
- Study Materials: filtered to student's own standard, searchable/downloadable
- Announcements: unread counter in sidebar, mark-as-read on click, auto-polled every 30 seconds
- Fee history, online payment via Razorpay
- Profile, Password Change, Settings

**Security**
- JWT access + refresh token auth
- Forced password change on first login (admin-created accounts)
- Login via Email, Username, or Student ID
- Role-based access control (admin / teacher / student)
- bcrypt password hashing, CSRF protection, XSS headers, input validation, SQL-injection-safe (MongoDB parameterised queries)
- Audit log of sensitive admin actions

---

## Quick Start (Development)

### Prerequisites
- Node.js ≥ 18
- MongoDB ≥ 6 (local or Atlas)
- Razorpay account (test keys are fine for development)

### 1. Clone / unzip the project

```bash
unzip vanita-maths-final.zip
cd vanita-maths-updated
```

### 2. Configure backend environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

MONGODB_URI=mongodb://localhost:27017/vanita-maths

JWT_SECRET=replace_with_a_long_random_string_at_least_64_chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Optional — only needed for password-reset emails
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

# Razorpay — use test keys for development
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 4. Seed the database (creates demo admin, teacher, and students)

```bash
cd backend && npm run seed
```

Default credentials after seeding:

| Role | Email / Username | Password |
|---|---|---|
| Admin | admin@vanitamath.com / `admin` | Admin@1234 |
| Teacher | teacher@vanitamath.com / `priyasharma` | Teacher@1234 |
| Student | student@vanitamath.com / `arjunpatil` | Student@1234 |
| Student | sneha@vanitamath.com / `snehakulkarni` | Student@1234 |

> Admin-created student accounts use auto-generated passwords. Students must change them on first login.

### 5. Run in development

```bash
# Terminal 1 — backend (port 5000)
cd backend && npm run dev

# Terminal 2 — frontend (port 5173)
cd frontend && npm run dev
```

Open: http://localhost:5173

---

## Production Deployment

### Option A — Self-hosted VPS (Ubuntu / Debian)

#### 1. Install requirements

```bash
sudo apt update && sudo apt install -y nodejs npm mongodb-org nginx
sudo npm install -g pm2
```

#### 2. Upload and configure

```bash
# Upload project to /var/www/vanita-maths
cd /var/www/vanita-maths/backend
cp .env.example .env
nano .env    # fill in production values (set NODE_ENV=production, real MongoDB URI, Razorpay live keys)
```

#### 3. Build frontend

```bash
cd /var/www/vanita-maths/frontend
npm install --production
npm run build
# Built files go into frontend/dist/
```

#### 4. Start backend with PM2

```bash
cd /var/www/vanita-maths/backend
npm install --production
npm run seed    # only on first deploy
pm2 start server.js --name vanita-backend
pm2 save
pm2 startup
```

#### 5. Configure Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Serve React frontend
    root /var/www/vanita-maths/frontend/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API to Express
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded files
    location /uploads {
        alias /var/www/vanita-maths/backend/uploads;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/vanita-maths /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

#### 6. Add HTTPS (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

### Option B — MongoDB Atlas + Render.com (Free tier)

1. Create a MongoDB Atlas cluster, get the connection URI.
2. Deploy backend to Render as a Web Service (set env vars in Render dashboard).
3. Deploy frontend to Render as a Static Site with build command `npm run build` and publish directory `dist`.
4. Set `FRONTEND_URL` in backend env to the Render frontend URL (for CORS).
5. Set `VITE_API_URL` in frontend env (create `frontend/.env.production`) to the Render backend URL:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```

---

### Option C — Docker Compose

A `docker-compose.yml` is not included in this release but the service split is straightforward:

```yaml
services:
  mongo:
    image: mongo:7
    volumes: [mongo_data:/data/db]
  backend:
    build: ./backend
    ports: ["5000:5000"]
    env_file: ./backend/.env
    depends_on: [mongo]
  frontend:
    build: ./frontend
    ports: ["80:80"]
    depends_on: [backend]
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default 5000) |
| `NODE_ENV` | Yes | `development` or `production` |
| `FRONTEND_URL` | Yes | Used for CORS allowlist |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs — min 32 chars, keep private |
| `JWT_ACCESS_EXPIRES` | No | Access token TTL (default `15m`) |
| `JWT_REFRESH_EXPIRES` | No | Refresh token TTL (default `7d`) |
| `EMAIL_HOST` | No | SMTP host for password-reset emails |
| `EMAIL_PORT` | No | SMTP port |
| `EMAIL_USER` | No | SMTP username |
| `EMAIL_PASS` | No | SMTP password or app password |
| `RAZORPAY_KEY_ID` | Yes* | Razorpay Key ID (*required for online payments) |
| `RAZORPAY_KEY_SECRET` | Yes* | Razorpay Key Secret |

---

## Project Structure

```
vanita-maths-updated/
├── backend/
│   ├── controllers/      # Business logic (auth, students, fees, attendance, etc.)
│   ├── models/           # Mongoose schemas (User, Student, Fee, Payment, Attendance, etc.)
│   ├── routes/           # Express routers
│   ├── middleware/       # Auth (protect/authorize), validation, rate-limiting
│   ├── services/         # Razorpay, receipt PDF, email
│   ├── utils/            # Helpers, logger, seed, idGenerator, auditLog
│   ├── uploads/          # Runtime: uploaded files (notes, receipts)
│   ├── app.js            # Express app setup
│   ├── server.js         # Entry point
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── landing/  # Public marketing site
    │   │   ├── auth/     # Login, Register, AdminLogin, SetNewPassword
    │   │   ├── admin/    # All admin dashboard pages
    │   │   ├── student/  # All student dashboard pages
    │   │   └── teacher/  # All teacher dashboard pages
    │   ├── components/
    │   │   ├── ui/       # Design system (Card, Modal, Badge, etc.)
    │   │   ├── layout/   # Sidebar
    │   │   └── shared/   # StudentIdCard, ProtectedRoute, etc.
    │   ├── services/     # API service layer
    │   ├── contexts/     # AuthContext
    │   └── lib/          # Axios instance, utilities
    └── tailwind.config.js
```

---

## Database Schema (Key Collections)

| Collection | Purpose |
|---|---|
| `users` | Shared auth record for all roles (email, username, password hash, role, mustChangePassword) |
| `students` | Extended student profile linked to users (studentId, class, section, batch, fees, parent info) |
| `admins` | Admin profile |
| `teachers` | Teacher profile (subjects, batches, qualification) |
| `attendance` | Daily attendance records (studentId, class, batch, date, status) |
| `materials` | Study notes/files (title, subject, class, batch, file path, uploaded by) |
| `announcements` | Announcements with class/audience targeting, priority, expiry, readBy tracking |
| `fees` | Fee records per student (amount, dueDate, paymentStatus) |
| `payments` | Payment records — Razorpay + offline (receipt, amount, method, verification) |
| `contactinquiries` | Public contact form submissions |
| `auditlogs` | Admin action log (action, performedBy, description, timestamp) |

---

## Support & Customization

- **To change institute name/logo**: update `LandingPage`, `Sidebar`, and `AdminLoginPage` — all reference "Vanita Maths Classes"
- **To add a new standard**: CLASSES arrays are centralized in `ManageStudents.jsx`, `FeeManagement.jsx`, `MaterialsAdmin.jsx`, `AttendanceManager.jsx`, and the landing page `Courses.jsx`
- **To add a new batch type**: update the `BATCHES` arrays in the same files and the backend `Student` model
