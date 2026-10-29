# Vanita Math Classes (VMC) — External Integrations & Manual Setup Guide

This document lists all third-party services and environment variables used by the Vanita Math Classes platform. It provides exact step-by-step instructions for configuring and verifying each integration.

---

## 1. External Service Configuration Matrix

| Feature | Provider / Service | Exact Environment Variable | Where to Obtain the Value | Where to Add It | Required or Optional | Verification Method |
|---|---|---|---|---|---|---|
| **Persistent Database** | MongoDB Atlas | `MONGODB_URI` | [cloud.mongodb.com](https://cloud.mongodb.com) → Cluster → Connect → Drivers → Node.js Connection String | Render Dashboard → Backend Service → Environment | **Required** | `GET /api/health` returns HTTP 200, admin statistics load live data |
| **Admin WhatsApp Recipient** | VMC Institute | `VMC_ADMIN_WHATSAPP_NUMBER` | Institute mobile number with country code (e.g. `919815962612`) | Render Dashboard → Backend Service → Environment | **Optional** (defaults to `919815962612`) | Check recipient in `GET /api/health` -> `whatsapp.adminRecipient` |
| **WhatsApp Auto-Dispatch** | Meta WhatsApp Business Cloud API | `WHATSAPP_PHONE_NUMBER_ID` | [developers.facebook.com](https://developers.facebook.com) → My Apps → WhatsApp → API Setup → Phone number ID | Render Dashboard → Backend Service → Environment | **Optional** (auto falls back to `wa.me` manual links) | `GET /api/health` reports `whatsapp.configured: true` |
| **WhatsApp Access Token** | Meta WhatsApp Business Cloud API | `WHATSAPP_ACCESS_TOKEN` | [developers.facebook.com](https://developers.facebook.com) → WhatsApp → API Setup → Temporary access token (or System User Permanent Token) | Render Dashboard → Backend Service → Environment | **Optional** (required if `WHATSAPP_PHONE_NUMBER_ID` is used) | Trigger fee reminder or enquiry alert; status returns `sent_to_provider` |
| **WhatsApp WABA ID** | Meta WhatsApp Business Cloud API | `WHATSAPP_BUSINESS_ACCOUNT_ID` / `WHATSAPP_WABA_ID` | [developers.facebook.com](https://developers.facebook.com) → WhatsApp → API Setup → WhatsApp Business Account ID | Render Dashboard → Backend Service → Environment | **Optional** | Render environment inspection |
| **WhatsApp API Version** | Meta Graph API | `WHATSAPP_API_VERSION` | Fixed default `v20.0` | Render Dashboard → Backend Service → Environment | **Optional** (defaults to `v20.0`) | Included in `GET /api/health` |
| **Email OTP Recovery** | Resend | `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys → Create API Key (Free: 100 emails/day, 3,000/mo) | Render Dashboard → Backend Service → Environment | **Optional** (Admin-assisted password reset is active without email) | Request OTP on `/forgot-password`, verify 6-digit email arrival |
| **Email Sender Address** | Resend | `EMAIL_FROM` | Verified domain email or Resend testing address (`Vanita Math Classes <onboarding@resend.dev>`) | Render Dashboard → Backend Service → Environment | **Optional** (defaults to `onboarding@resend.dev`) | Sender address in delivered email |
| **Persistent Math Notes** | Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | [cloudinary.com](https://cloudinary.com) → Dashboard → Product Environment Credentials | Render Dashboard → Backend Service → Environment | **Optional** (falls back to persistent local storage on Render with disk) | Upload test PDF in Admin > Math Notes; download succeeds |
| **JWT Signing Secret** | Internal Auth | `JWT_SECRET` | Generate securely: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | Render Dashboard → Backend Service → Environment | **Required** | Student and Admin login token generation succeeds |
| **Frontend Base URL** | Vercel Deployment | `FRONTEND_URL` / `CLIENT_URL` | `https://vanita-math-class.vercel.app` | Render Dashboard → Backend Service → Environment | **Required** | Password reset email links point to correct domain |
| **Vercel API Proxy** | Vercel | None required (rewrites configured in `frontend/vercel.json`) | Built into repository (`vercel.json`) | Vercel Dashboard → Project Settings | **Configured** | Test `https://vanita-math-class.vercel.app/api/health` returns 200 |

---

## 2. Step-by-Step Setup Instructions

### A. Meta WhatsApp Business Cloud API (For Server-Side Auto-Dispatch)

By default, the platform is **100% functional without Cloud API credentials** using direct, pre-filled `https://wa.me/{recipient}?text=...` links clearly labeled as "Manual WhatsApp".

To enable silent, automatic server-side WhatsApp message delivery:

1. Open [https://developers.facebook.com/](https://developers.facebook.com/) and sign in with your Facebook account.
2. Click **My Apps** → **Create App** → Select **Other** → Select **Business** type.
3. Name your app (e.g. `Vanita Math Classes Notifications`) and link your Meta Business Account.
4. On the App Dashboard, scroll to **WhatsApp** and click **Set up**.
5. Under **API Setup**:
   - You will see a **Temporary Access Token** (valid for 24 hours for sandbox testing).
   - You will see **Phone number ID** (e.g. `104928374829102`).
   - You will see **WhatsApp Business Account ID** (e.g. `102938475610293`).
6. Add your test phone number in the **To** recipient dropdown and click **Send test message** to verify Meta accepts messages to your phone.
7. Copy the **Phone number ID** and **Access Token**.
8. Go to your **Render Dashboard** → click your backend web service (`vanita-math-class`) → **Environment** tab.
9. Add the following variables:
   - `WHATSAPP_PHONE_NUMBER_ID` = `[Your Phone number ID]`
   - `WHATSAPP_ACCESS_TOKEN` = `[Your Token]`
   - `WHATSAPP_API_VERSION` = `v20.0`
10. Click **Save Changes**. Render will automatically redeploy the service.
11. **Verification**: Open `https://vanita-math-class.vercel.app/api/health` in your browser. Verify that `"whatsapp": { "configured": true }`.

---

### B. Email OTP Recovery (Resend API)

If an administrator or student forgets their password, the platform supports:
1. **Admin-Assisted Reset (Active by default)**: Administrator opens Manage Students → clicks the key icon to generate a temporary password immediately.
2. **Automated 6-Digit Email OTP (Optional)**:

1. Go to [https://resend.com/](https://resend.com/) and create a free account.
2. Go to **API Keys** → **Create API Key** → Name it `vmc-backend` with Full Access.
3. Copy the key (starts with `re_...`).
4. Go to **Render Dashboard** → Backend Service → **Environment**.
5. Add:
   - `RESEND_API_KEY` = `re_...`
   - `EMAIL_FROM` = `Vanita Math Classes <onboarding@resend.dev>`
6. Click **Save Changes**.
7. **Verification**: Visit `https://vanita-math-class.vercel.app/forgot-password`, enter a registered email, and verify that the 6-digit OTP email is received.

---

### C. Persistent Cloud Storage for Math Notes (Cloudinary)

1. Go to [https://cloudinary.com/](https://cloudinary.com/) and create a free account.
2. On your Cloudinary Dashboard, copy:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
3. Open **Render Dashboard** → Backend Service → **Environment**.
4. Add:
   - `CLOUDINARY_CLOUD_NAME` = `[Your Cloud Name]`
   - `CLOUDINARY_API_KEY` = `[Your API Key]`
   - `CLOUDINARY_API_SECRET` = `[Your API Secret]`
5. Click **Save Changes**.
6. **Verification**: In the Admin Portal, open **Math Notes** → click **Upload Notes** → upload a sample PDF formula sheet. Verify that students of that class can download the note without error.

---

## 3. Safe Health & Diagnostics Endpoints

- **Live Service Health**: `https://vanita-math-class.vercel.app/api/health`
- **Render Direct API Health**: `https://vanita-math-class.onrender.com/api/health`
- **Live Batches & Database Enrollment Counts**: `https://vanita-math-class.vercel.app/api/batches`
