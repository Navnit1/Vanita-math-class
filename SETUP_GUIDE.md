# Vanita Maths Classes — Complete Setup Guide
## Hybrid Fee Management System with Razorpay

---

## 1. FILES MODIFIED

### Backend
| File | Change |
|------|--------|
| `backend/models/Payment.js` | Added `paymentType`, `transactionId`, `gatewayOrderId`, `gatewayPaymentId`, `receiptImage`, `approvalStatus` |
| `backend/controllers/paymentController.js` | Full rewrite — offline entry, Razorpay order/verify, receipt PDF, stats |
| `backend/controllers/adminController.js` | Added `onlineRevenue`, `offlineRevenue`, `typeBreakdown`, monthly chart |
| `backend/routes/payments.js` | Added `/online/order`, `/online/verify`, `/:id/receipt` endpoints |
| `backend/package.json` | Added `razorpay`, `pdfkit` |
| `backend/.env.example` | Added Razorpay env vars |

### Backend — NEW FILES
| File | Purpose |
|------|---------|
| `backend/services/razorpayService.js` | Create orders, verify signatures, fetch payments |
| `backend/services/receiptService.js` | Generate professional PDF receipts via PDFKit |

### Frontend
| File | Change |
|------|--------|
| `frontend/src/pages/student/StudentFees.jsx` | Full rewrite — Pay Now button, instalment modal, Razorpay flow |
| `frontend/src/pages/student/StudentPayments.jsx` | Full rewrite — type badges, CSV export, PDF receipt download |
| `frontend/src/pages/student/StudentDashboard.jsx` | Added fee cards: Total/Paid/Pending/Status, Pay Now banner |
| `frontend/src/pages/admin/AdminDashboard.jsx` | Added Online/Offline revenue cards, stacked bar chart |
| `frontend/src/pages/admin/PaymentManagement.jsx` | Full rewrite — type filter, offline modal, verify, receipt download |
| `frontend/src/services/index.js` | Added `createOnlineOrder`, `verifyOnlinePayment`, `receiptUrl` |
| `frontend/package.json` | Added `razorpay` |
| `frontend/.env.example` | Added `VITE_RAZORPAY_KEY_ID` |

### Frontend — NEW FILES
| File | Purpose |
|------|---------|
| `frontend/src/hooks/useRazorpay.js` | Dynamically loads Razorpay SDK, exposes `openCheckout()` |

---

## 2. RAZORPAY SETUP

### Step 1 — Create Razorpay Account
1. Go to https://dashboard.razorpay.com/
2. Sign up / log in
3. Complete KYC (for live mode)

### Step 2 — Get API Keys
1. Dashboard → Settings → API Keys
2. Generate Key ID & Key Secret
3. For testing use **Test Mode** keys (prefix `rzp_test_`)
4. For production use **Live Mode** keys (prefix `rzp_live_`)

### Step 3 — Set Environment Variables

**Backend `.env`:**
```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

**Frontend `.env`:**
```
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
VITE_API_BASE_URL=http://localhost:5000/api
```

> ⚠️ VITE_RAZORPAY_KEY_ID is not actually used in code — the key is fetched securely from the backend during order creation. You do NOT need to put it in the frontend env.

---

## 3. ENVIRONMENT VARIABLES

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/vanita-maths
JWT_SECRET=your_very_long_random_secret_here_min_32_chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=yourapppassword
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 4. MONGODB CHANGES

No schema migration needed. The Payment model is backward compatible:

- `paymentType` defaults to `'offline'` — existing records are unaffected
- `transactionId`, `gatewayOrderId`, `gatewayPaymentId` default to `null`
- `approvalStatus` defaults to `'pending'`
- `receiptImage` defaults to `null`

**New indexes added automatically on first start:**
- `paymentType: 1`
- `gatewayOrderId: 1`

---

## 5. INSTALLATION

```bash
# Clone / extract project
cd vanita-maths

# Backend
cd backend
cp .env.example .env        # fill in your values
npm install
npm run dev

# Frontend (new terminal)
cd ../frontend
cp .env.example .env        # fill in your values
npm install
npm run dev
```

---

## 6. DEPLOYMENT

### Backend (e.g. Railway / Render / VPS)

```bash
cd backend
npm install --production
NODE_ENV=production npm start
```

Set all env vars in your hosting dashboard. Ensure MongoDB Atlas URI is used in production.

### Frontend (e.g. Vercel / Netlify)

```bash
cd frontend
npm run build
# deploy the dist/ folder
```

Set `VITE_API_BASE_URL=https://your-backend-domain.com/api` in your hosting env vars.

### Nginx (if self-hosting)

```nginx
# Serve frontend build
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/vanita/dist;
    index index.html;
    location / { try_files $uri /index.html; }
    location /api { proxy_pass http://localhost:5000; }
    location /uploads { proxy_pass http://localhost:5000; }
}
```

---

## 7. PAYMENT WORKFLOW SUMMARY

### Online Payment (Student → Razorpay)

```
Student Dashboard / Fees page
    ↓ clicks [Pay Now]
    ↓ enters amount (partial or full)

Frontend → POST /api/payments/online/order
    ↓ Backend creates Razorpay order
    ↓ Returns orderId + keyId to frontend

Frontend opens Razorpay Checkout modal
    ↓ Student pays via UPI / Card / NetBanking
    ↓ Razorpay calls handler with { orderId, paymentId, signature }

Frontend → POST /api/payments/online/verify
    ↓ Backend verifies HMAC-SHA256 signature
    ↓ Creates Payment record (paymentType: 'online')
    ↓ Increments student.paidFee
    ↓ Updates student.feeStatus
    ↓ Updates Fee.paidAmount + Fee.paymentStatus
    ↓ Returns receipt number

Student Dashboard refreshes → shows updated balances
```

### Offline Payment (Admin Entry)

```
Admin → Payments page → [Add Offline Payment]
    ↓ Select student (shows live pending fee)
    ↓ Enter amount, method, date, notes
    ↓ Upload receipt image (optional)

Frontend → POST /api/payments (multipart/form-data)
    ↓ Backend creates Payment record (paymentType: 'offline')
    ↓ Increments student.paidFee
    ↓ Updates student.feeStatus
    ↓ Updates Fee.paidAmount + Fee.paymentStatus
    ↓ Returns receipt number

Admin can then:
    - Verify the payment (marks status: 'verified')
    - Download PDF receipt
    - Delete payment (reverses fee balance)
```

---

## 8. RECEIPT PDF

Receipts are generated on-the-fly by PDFKit. No file storage needed.

- **URL:** `GET /api/payments/:id/receipt`
- **Auth required:** Yes (student sees own receipts, admin sees all)
- **Format:** A4 PDF, professional layout with coaching branding
- **Contents:** Student details, amount, method, type, transaction ID, fee summary

---

## 9. TEST CARDS (Razorpay Test Mode)

| Card Number | Expiry | CVV | Result |
|-------------|--------|-----|--------|
| 4111 1111 1111 1111 | Any future | Any | Success |
| 5267 3181 8797 5449 | Any future | Any | Success |
| 4000 0000 0000 0002 | Any future | Any | Failure |

**Test UPI:** `success@razorpay` (success), `failure@razorpay` (failure)

---

## 10. SUPPORT

- Razorpay Docs: https://razorpay.com/docs/
- Razorpay Test Dashboard: https://dashboard.razorpay.com/
- MongoDB Atlas: https://cloud.mongodb.com/
