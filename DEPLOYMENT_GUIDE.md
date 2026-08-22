# Vanita Maths Classes — Complete Setup & Deployment Guide

## Project Structure

```
vanita-maths/
├── backend/                    # Node.js + Express + MongoDB
│   ├── config/database.js
│   ├── controllers/            # 8 controllers (all business logic)
│   ├── middleware/             # auth, errorHandler, upload, validate
│   ├── models/                 # 8 Mongoose schemas
│   ├── routes/                 # 8 route files
│   ├── utils/                  # logger, helpers, seeder
│   ├── uploads/                # File upload storage (auto-created)
│   ├── logs/                   # Log files (auto-created)
│   ├── app.js
│   └── server.js
│
└── frontend/                   # React + Vite + Tailwind
    ├── src/
    │   ├── components/         # Sidebar, ProtectedRoute, UI library
    │   ├── contexts/           # AuthContext
    │   ├── lib/                # API client, utilities
    │   ├── pages/              # auth/, admin/, student/, teacher/
    │   ├── services/           # All API service modules
    │   └── styles/             # Global CSS design system
    ├── index.html
    └── vite.config.js
```

---

## PART 1 — LOCAL DEVELOPMENT SETUP

### Prerequisites

- Node.js v18+
- npm or yarn
- MongoDB Atlas account (free tier works)

---

### Step 1 — Clone / Extract the Project

```bash
# Navigate to project root
cd vanita-maths
```

---

### Step 2 — Backend Setup

```bash
cd backend
npm install
```

Create your `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/vanita-maths?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_minimum_32_characters_long_key
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
FRONTEND_URL=http://localhost:5173
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
MAX_FILE_SIZE=5242880
```

#### Getting MongoDB Atlas URI

1. Go to https://cloud.mongodb.com
2. Create a free cluster (M0)
3. Create a database user: Database Access → Add New User
4. Allow network access: Network Access → Add IP Address → Allow from Anywhere (0.0.0.0/0)
5. Get connection string: Clusters → Connect → Connect your application → Driver: Node.js

#### Seed the database with sample data

```bash
npm run seed
```

This creates:
- Admin:   admin@vanitamath.com / Admin@1234
- Teacher: teacher@vanitamath.com / Teacher@1234
- Student: student@vanitamath.com / Student@1234

#### Start the backend

```bash
npm run dev       # development (with nodemon)
npm start         # production
```

Backend runs at: http://localhost:5000

---

### Step 3 — Frontend Setup

```bash
cd ../frontend
npm install
```

Create `.env` file:

```bash
cp .env.example .env
```

Contents:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Vanita Maths Classes
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at: http://localhost:5173

---

### Step 4 — Verify Everything Works

1. Open http://localhost:5173
2. Login as Admin: admin@vanitamath.com / Admin@1234
3. Check Dashboard loads with data
4. Login as Student: student@vanitamath.com / Student@1234
5. Verify fee page shows readonly view

---

## PART 2 — PRODUCTION DEPLOYMENT

### Option A — Backend on Render (Free/Paid)

1. Push backend folder to a GitHub repo
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** Node
5. Add all environment variables from `.env` under "Environment"
6. Set `NODE_ENV=production`
7. Set `FRONTEND_URL=https://your-vercel-app.vercel.app`
8. Deploy → Copy the Render URL (e.g. https://vanita-api.onrender.com)

> Note: Free Render instances spin down after 15 mins of inactivity. Upgrade to Starter ($7/mo) for always-on.

---

### Option B — Frontend on Vercel

1. Push frontend folder to a GitHub repo
2. Go to https://vercel.com → New Project → Import repo
3. Configure:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variables:
   - `VITE_API_BASE_URL` = `https://your-render-url.onrender.com/api`
5. Deploy

---

### File Upload Storage in Production

The current setup stores files on the server's filesystem (Render ephemeral storage). **Files will be lost on redeploy.**

For production, integrate **Cloudinary** or **AWS S3**:

**Cloudinary integration (recommended):**

```bash
npm install cloudinary multer-storage-cloudinary
```

Replace `middleware/upload.js` storage with:

```js
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'vanita-receipts', allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'] },
})
```

Add to `.env`:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## PART 3 — API DOCUMENTATION

### Base URL
```
http://localhost:5000/api       (development)
https://your-api.onrender.com/api  (production)
```

### Authentication

All protected routes require:
```
Authorization: Bearer <access_token>
```

---

### Auth Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /auth/login | Public | Login with email + password |
| POST | /auth/register | Public | Student self-registration |
| POST | /auth/logout | Protected | Logout current session |
| GET | /auth/me | Protected | Get current user + profile |
| POST | /auth/refresh-token | Public | Refresh access token |
| POST | /auth/forgot-password | Public | Request password reset |
| POST | /auth/reset-password | Public | Reset with token |
| PUT | /auth/change-password | Protected | Change own password |
| PUT | /auth/profile | Protected | Update name, phone, photo |

**Login request:**
```json
POST /auth/login
{ "email": "admin@vanitamath.com", "password": "Admin@1234" }
```

**Login response:**
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "name": "Vanita Admin", "role": "admin", "email": "...", "profile": null },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### Student Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /students | Admin, Teacher | List all students (paginated, filterable) |
| POST | /students | Admin | Create student |
| GET | /students/:id | Admin, Teacher | Get student by ID |
| PUT | /students/:id | Admin | Update student |
| DELETE | /students/:id | Admin | Deactivate student |
| GET | /students/me | Student | Own profile |
| GET | /students/me/fees | Student | Own fee records |
| GET | /students/me/payments | Student | Own payment history |
| GET | /students/me/attendance | Student | Own attendance |

**Query params for GET /students:**
- `page`, `limit`, `search`, `batch`, `class`, `status`, `feeStatus`

---

### Payment Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /payments | Admin, Teacher | List all payments |
| POST | /payments | Admin only | Record offline payment |
| GET | /payments/stats | Admin | Revenue statistics |
| GET | /payments/my | Student | Own payment history |
| GET | /payments/:id | Admin | Get payment detail |
| PUT | /payments/:id/verify | Admin | Verify a payment |
| PUT | /payments/:id | Admin | Update payment record |
| DELETE | /payments/:id | Admin | Delete payment |

**Record payment (multipart/form-data):**
```
studentId: <student_objectId>
amount: 3000
paymentMethod: cash | upi | bank_transfer | cheque | demand_draft | online
paymentDate: 2025-06-10
month: June 2025
notes: Monthly fee
receiptImage: <file> (optional)
```

---

### Fee Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /fees | Admin, Teacher | List fee records |
| POST | /fees | Admin | Create fee for one student |
| POST | /fees/bulk | Admin | Create fees for batch/class |
| GET | /fees/stats | Admin | Fee collection overview |
| GET | /fees/student/:id | Admin, Teacher | Fees for a student |
| PUT | /fees/:id | Admin | Update fee record |
| DELETE | /fees/:id | Admin | Delete fee record |

---

### Attendance Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /attendance | Admin, Teacher | Mark batch attendance |
| GET | /attendance/batch | Admin, Teacher | Get attendance for batch+date |
| GET | /attendance/summary | Admin, Teacher | Batch attendance summary |
| GET | /attendance/student/:id | Admin, Teacher | Student attendance history |
| PUT | /attendance/:id | Admin, Teacher | Edit single record |

---

### Announcement Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /announcements | All (authenticated) | List visible announcements |
| POST | /announcements | Admin, Teacher | Create announcement |
| PUT | /announcements/:id | Admin, Teacher | Update announcement |
| DELETE | /announcements/:id | Admin | Delete announcement |

---

### Material Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /materials | All (authenticated) | List materials |
| POST | /materials | Admin, Teacher | Upload material (multipart) |
| GET | /materials/:id/download | All (authenticated) | Download file |
| DELETE | /materials/:id | Admin, Teacher | Delete material |

---

### Admin Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /admin/dashboard | Admin | Dashboard statistics |
| GET | /admin/teachers | Admin | List teachers |
| POST | /admin/teachers | Admin | Create teacher |
| PUT | /admin/teachers/:id | Admin | Update teacher |
| DELETE | /admin/teachers/:id | Admin | Deactivate teacher |
| GET | /admin/reports | Admin | Generate reports (type=fees/attendance/revenue/students) |

---

## PART 4 — DATABASE DOCUMENTATION

### Collections Overview

| Collection | Purpose |
|------------|---------|
| users | Authentication + login for all roles |
| students | Student academic/profile data |
| teachers | Teacher profile data |
| fees | Fee records per student per month |
| payments | Actual payment transactions (admin-only entry) |
| attendances | Daily attendance per student per batch |
| announcements | Notices visible to all or specific roles |
| materials | Uploaded study files metadata |

### Indexes

```js
// Fee indexes
{ studentId: 1, month: 1 }
{ paymentStatus: 1 }
{ dueDate: 1 }

// Payment indexes
{ studentId: 1, paymentDate: -1 }
{ receiptNumber: 1 } // unique

// Attendance indexes
{ studentId: 1, date: -1 }
{ batch: 1, date: 1 }
{ studentId: 1, batch: 1, date: 1 } // unique

// Announcement indexes
{ audience: 1, isActive: 1 }
{ createdAt: -1 }

// Material indexes
{ class: 1, subject: 1 }
```

---

## PART 5 — SECURITY CHECKLIST

- [x] Helmet HTTP headers
- [x] CORS restricted to frontend URL
- [x] Rate limiting (200 req/15min global, 20 req/15min on auth)
- [x] MongoDB injection protection (express-mongo-sanitize)
- [x] JWT with access + refresh token rotation
- [x] Passwords hashed with bcrypt (cost 12)
- [x] RBAC — admin/teacher/student role enforcement on every route
- [x] File type and size validation on uploads
- [x] Input validation with express-validator
- [x] Error messages don't leak stack traces in production
- [x] No hardcoded secrets (all in .env)
- [x] Students CANNOT upload receipts — enforced at route level

---

## PART 6 — SAMPLE CREDENTIALS

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vanitamath.com | Admin@1234 |
| Teacher | teacher@vanitamath.com | Teacher@1234 |
| Student | student@vanitamath.com | Student@1234 |
| Student 2 | sneha@vanitamath.com | Student@1234 |
| Student 3 | rahul@vanitamath.com | Student@1234 |

> Run `npm run seed` from the backend directory to create these accounts.

---

## PART 7 — BUILD COMMANDS

### Backend
```bash
cd backend
npm install        # Install dependencies
npm run seed       # Seed sample data (once)
npm run dev        # Development server (nodemon)
npm start          # Production server
```

### Frontend
```bash
cd frontend
npm install        # Install dependencies
npm run dev        # Development server (localhost:5173)
npm run build      # Production build → ./dist
npm run preview    # Preview production build locally
```

---

## PART 8 — TROUBLESHOOTING

### "Cannot connect to MongoDB"
- Check MONGODB_URI in .env is correct
- Ensure IP 0.0.0.0/0 is whitelisted in Atlas Network Access
- Verify username/password in the URI

### "Token expired" errors on frontend
- The app auto-refreshes tokens. If you see this in a loop, clear localStorage and login again.

### Files not found after Render redeploy
- Render's filesystem is ephemeral. Integrate Cloudinary for persistent file storage.

### CORS errors
- Ensure FRONTEND_URL in backend .env matches your exact frontend URL (no trailing slash)

### Port already in use
- Kill the process: `lsof -ti:5000 | xargs kill -9`
