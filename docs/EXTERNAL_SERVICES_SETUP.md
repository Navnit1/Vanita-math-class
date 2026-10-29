# Vanita Math Classes (VMC) — External Services & Production Setup Guide

This guide provides instructions for setting up external services, credentials, and production deployments for the upgraded **Vanita Math Classes (VMC)** web application.

---

## 1. System Architecture Overview

- **Frontend**: React 18, Vite, Tailwind CSS, TanStack React Query v5, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT authentication, PDFKit.
- **Identity & Roles**: Exactly **1 Admin** (`admin`), **0 Teachers**, and multiple **Students** (`student`) enrolled across **8th, 9th, 10th, +1, and +2**.
- **Branding**: Official VMC Red (`#E50914`, `#C90019`) & White palette.
- **Storage**: Smart hybrid storage (uses Cloudinary when configured, automatically falls back to local disk storage in `uploads/` for offline/development environments).

---

## 2. Meta WhatsApp Cloud API (Graph API v20.0)

Vanita Math Classes features an official Meta WhatsApp Cloud API integration with an automatic zero-cost direct WhatsApp link (`wa.me`) fallback.

### Option A: Zero-Cost Immediate Fallback (`wa.me` links)
If Meta WhatsApp credentials are not configured, the application **automatically generates pre-composed WhatsApp web/app links** (`https://wa.me/91<phone>?text=...`). When an admin clicks "Send Reminder" or "Share Receipt", WhatsApp opens with the message prefilled for immediate dispatch. **No API keys or credit cards required.**

### Option B: Meta WhatsApp Cloud API Setup (Automated Background Dispatch)
To send background WhatsApp notifications automatically from your official WhatsApp Business phone number:

1. **Create Meta Developer Account**:
   - Go to [developers.facebook.com](https://developers.facebook.com/) and register.
2. **Create a Business App**:
   - Click **My Apps** > **Create App**.
   - Select **Business** as the app type.
   - Enter App Name: `Vanita Math Classes`.
3. **Add WhatsApp Product**:
   - On the App Dashboard, find **WhatsApp** and click **Set up**.
   - Meta will assign a **Test Phone Number** and a temporary access token for initial testing.
4. **Obtain Credentials**:
   - **Phone Number ID**: Listed under "From phone number ID" on the WhatsApp > API Setup screen.
   - **WABA ID (WhatsApp Business Account ID)**: Listed on the same API Setup screen.
   - **Access Token**: For production, create a **System User** in Meta Business Manager (`business.facebook.com`) with `whatsapp_business_messaging` permissions to get a permanent token (temporary tokens expire after 24 hours).
5. **Configure Environment Variables**:
   ```env
   WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_number_id
   WHATSAPP_WABA_ID=your_meta_waba_account_id
   WHATSAPP_ACCESS_TOKEN=your_permanent_system_user_token
   WHATSAPP_API_VERSION=v20.0
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_custom_webhook_secret_string
   ```
6. **Message Templates (Production)**:
   In Meta WhatsApp Manager > Message Templates, submit these template names for approval:
   - `vmc_test_announcement`: For weekly test alerts.
   - `vmc_fee_reminder`: For pending tuition dues.
   - `vmc_fee_receipt`: For fee payment confirmations.
   - `vmc_admission_welcome`: For student credentials on enquiry approval.

---

## 3. Email OTP Password Recovery (Resend / SMTP)

The application implements a secure 6-digit email OTP password reset workflow. Tokens are SHA-256 hashed in the database, expire in 5 minutes, enforce a 60-second re-send rate limit, and allow a maximum of 5 verification attempts.

### Free Tier: Resend (`resend.com`)
1. Create a free account at [resend.com](https://resend.com/).
2. Navigate to **API Keys** > **Create API Key**.
3. Select "Full Access" or "Sending access" and copy the key (starts with `re_`).
4. **Domain Setup**:
   - For quick testing without custom domain: Set `EMAIL_FROM=onboarding@resend.dev`. Resend allows sending test emails to your registered account email.
   - For production: Add your custom domain (e.g. `vanitamathclasses.com`) in Resend > Domains, verify the 3 DNS records (DKIM, SPF), and set `EMAIL_FROM=support@vanitamathclasses.com`.
5. Free tier limits: **100 emails/day, 3,000 emails/month free forever**.
6. Set in `backend/.env`:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=Vanita Math Classes <onboarding@resend.dev>
   ```

### Fallback: Standard SMTP / Gmail App Password
If you prefer standard SMTP:
1. Enable 2-Step Verification on your Gmail account.
2. Go to Google Account > Security > **App passwords** > Generate password for "Mail".
3. Configure:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_16_char_app_password
   EMAIL_FROM=Vanita Math Classes <your_email@gmail.com>
   ```

---

## 4. Online Payments (Razorpay)

For student online fee payments:
1. Log in to [dashboard.razorpay.com](https://dashboard.razorpay.com/).
2. Go to **Account & Settings** > **API Keys**.
3. Generate **Key ID** and **Key Secret**.
4. Configure:
   ```env
   # Backend
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

   # Frontend
   VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
   ```

---

## 5. Cloudinary Storage (Optional)

If `CLOUDINARY_CLOUD_NAME` is omitted, the application seamlessly saves uploaded notes and receipts to the local `backend/uploads/` directory with zero errors.

To enable Cloudinary cloud hosting:
1. Register at [cloudinary.com](https://cloudinary.com/) (free tier gives 25 GB storage / credits).
2. Copy **Cloud Name**, **API Key**, and **API Secret** from Dashboard.
3. Configure:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

---

## 6. Deployment Guide (Render)

Render hosts the backend web service and MongoDB connection.

### Step 1: Push Repository to GitHub
Ensure the latest code is committed and pushed to `main` on your GitHub repository.

### Step 2: Render Backend Web Service Configuration
1. Log in to [render.com](https://render.com/).
2. Click **New** > **Web Service** and connect your GitHub repository.
3. Configure settings:
   - **Name**: `vanita-math-classes-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
4. Add Environment Variables in Render Dashboard:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: `mongodb+srv://<username>:<password>@cluster.mongodb.net/vanita_math_classes?retryWrites=true&w=majority`
   - `JWT_SECRET`: A long random string (min 32 characters)
   - `JWT_EXPIRES_IN`: `7d`
   - `CLIENT_URL`: `https://your-frontend-domain.onrender.com`
   - `ADMIN_EMAIL`: `admin@vanitamathclasses.com`
   - `ADMIN_PASSWORD`: Secure initial admin password
   - `RESEND_API_KEY`: `re_...`
   - `EMAIL_FROM`: `Vanita Math Classes <onboarding@resend.dev>`
   - `RAZORPAY_KEY_ID`: `rzp_test_...`
   - `RAZORPAY_KEY_SECRET`: `...`
   - `WHATSAPP_PHONE_NUMBER_ID`: (Optional)
   - `WHATSAPP_ACCESS_TOKEN`: (Optional)

### Step 3: Render Frontend Static Site Configuration
1. Click **New** > **Static Site**.
2. Connect the same repository.
3. Configure settings:
   - **Name**: `vanita-math-classes-web`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add Environment Variables:
   - `VITE_API_BASE_URL`: `https://vanita-math-classes-api.onrender.com/api`
   - `VITE_RAZORPAY_KEY_ID`: `rzp_test_...`
5. Under **Redirects/Rewrites**, add a rewrite rule for React Router:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`

---

## 7. Database Seeding & Verification

To verify your database connection and seed initial admin and sample class data:
```bash
cd backend
node utils/seed.js
```
The seeder creates:
- 1 Administrator account (`admin@vanitamathclasses.com`)
- 0 Teachers
- Sample students across classes 8th, 9th, 10th, +1, and +2
- Sample weekly test and marks
