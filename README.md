# Mwenezi High Fees Management PWA

A comprehensive Progressive Web Application for managing school fees at Mwenezi High School. The application integrates with ZbPay Payment Gateway for secure online payments and provides role-based access for administrators, bursars, and students.

## 🌟 Features

### Admin Features
- **Dashboard**: Interactive overview with payment trends and statistics
- **Student Management**: Complete student enrollment and profile management
- **Financial Activity**: Transaction monitoring and reporting
- **Fee Configuration**: Term and fee structure management
- **Notifications**: Real-time system notifications

### Bursar Features
- **Payment Processing**: Cash payment handling with receipt generation
- **Daily Reconciliation**: Financial reporting and transaction summaries
- **Fee Adjustments**: Authorized fee modifications and waivers

### Student Features
- **Payment Dashboard**: Outstanding balance and payment history
- **Online Payments**: Secure ZbPay integration for fee payments
- **Payment Status**: Real-time payment confirmation and receipts
- **Account Overview**: Term-by-term fee breakdown

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Framer Motion** for animations
- **Zustand** for state management
- **React Router** for navigation
- **React Hook Form + Zod** for forms

### Backend
- **Netlify Functions** for serverless API
- **Firebase Realtime Database** for data storage
- **ZbPay Payment Gateway** integration

### PWA Features
- **Service Worker** for offline functionality
- **Web App Manifest** for installability
- **Push Notifications** support
- **Responsive Design** for all devices

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Realtime Database
- Netlify account for deployment
- ZbPay sandbox credentials

### 1. Clone and Install
```bash
git clone <repository-url>
cd mwenezi-high-fees-management
npm install
```

### 2. Firebase Configuration
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Realtime Database
3. The app uses these Firebase credentials (already configured):
```javascript
{
  apiKey: "AIzaSyDW_D4-2Tw6TTDhI7WyTtwVCZWn_i52ECY",
  authDomain: "mwenezihigh.firebaseapp.com",
  databaseURL: "https://mwenezihigh-default-rtdb.firebaseio.com",
  projectId: "mwenezihigh",
  storageBucket: "mwenezihigh.firebasestorage.app",
  messagingSenderId: "588608479487",
  appId: "1:588608479487:web:6e5c057d0978769862acca"
}
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
# Firebase Admin SDK (for Netlify Functions)
FIREBASE_PROJECT_ID=mwenezihigh
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-service-account-private-key
FIREBASE_DATABASE_URL=https://mwenezihigh-default-rtdb.firebaseio.com
```

### 4. ZbPay Integration
The app is pre-configured with ZbPay sandbox credentials:
- **API Key**: `3f36fd4b-3b23-4249-b65d-f39dc9df42d4`
- **API Secret**: `2f2c32d7-7a32-4523-bcde-1913bf7c171d`
- **Base URL**: `https://zbnet.zb.co.zw/wallet_sandbox_api/payments-gateway`

### 5. Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

### 6. Build for Production
```bash
npm run build
```

### 7. Deploy to Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. The app will be available at: `https://mghpayfees.netlify.app/`

## 👥 Demo Credentials

### Admin Access
- **Username**: `admin`
- **Password**: `admin123`

### Bursar Access
- **Username**: `bursar`
- **Password**: `bursar123`

### Student Access
- **Username**: `MHS-001`
- **Password**: `student123`

Additional student:
- **Username**: `MHS-002`
- **Password**: `student456`

## 💳 ZbPay Payment Testing

The application uses ZbPay's sandbox environment for testing payments:

1. **Student Login**: Use student credentials to access the dashboard
2. **Initiate Payment**: Click "Pay Fees Now" and select a term
3. **ZbPay Redirect**: You'll be redirected to ZbPay's payment page
4. **Test Payment**: Use ZbPay's test card details in sandbox
5. **Confirmation**: Return to the app for payment confirmation

### ZbPay Sandbox Details
- Environment: Sandbox/Testing
- Currency: USD (Code: 840)
- Webhook URL: `https://mghpayfees.netlify.app/.netlify/functions/zbPayWebhookHandler`
- Return URL: `https://mghpayfees.netlify.app/#/student/payment-status`

## 📱 PWA Installation

### Desktop
1. Visit the app in Chrome/Edge
2. Click the install icon in the address bar
3. Follow the installation prompts

### Mobile
1. Open the app in mobile browser
2. Tap "Add to Home Screen" in the browser menu
3. The app icon will appear on your home screen

## 🔄 Offline Functionality

The PWA provides limited offline functionality:
- **Cached Content**: App shell and static assets
- **Read-Only Data**: Previously viewed student/payment data
- **Offline Indicator**: Visual feedback when offline
- **Background Sync**: Automatic sync when connection restored

## 🏗 Database Structure

```
/config
  /fees (fee structure by grade/type)
  /activeTerms (current billing terms)
  /currencyCode (840 for USD)

/users
  /{userId} (admin, bursar, student accounts)

/students
  /{studentId}
    /financials
      /balance (calculated server-side)
      /terms/{termKey}
        /fee
        /paid

/transactions
  /{transactionId} (all payment records)

/notifications
  /{notificationId} (system notifications)

/bursar_activity
  /{activityId} (bursar transaction logs)

/fee_adjustments
  /{adjustmentId} (fee modification records)
```

## 🔐 Security Features

- **Role-based Access Control**: Strict role separation
- **Server-side Validation**: All financial operations validated
- **Secure Payment Processing**: ZbPay PCI-compliant integration
- **Atomic Database Operations**: Prevents data corruption
- **Audit Trails**: Complete transaction logging

## 📊 Payment Flow

1. **Student Initiates**: Selects term and amount
2. **Server Validation**: Netlify function validates request
3. **ZbPay Request**: Creates payment session with ZbPay
4. **User Redirect**: Student redirected to ZbPay
5. **Payment Processing**: ZbPay handles payment
6. **Webhook Notification**: ZbPay notifies app of result
7. **Status Check**: App polls for payment confirmation
8. **Account Update**: Student balance updated atomically
9. **Notification**: Admin notified of successful payment

## 🛠 Netlify Functions

### `initiateZbPayTransaction`
- Validates payment request
- Creates pending transaction record
- Initiates ZbPay payment session
- Returns payment URL for redirect

### `checkZbPaymentStatus`
- Polls ZbPay for payment status
- Updates transaction records
- Processes successful payments
- Updates student financial records

### `zbPayWebhookHandler`
- Receives ZbPay payment confirmations
- Processes webhook notifications
- Updates payment status
- Creates admin notifications

## 🎨 Design System

### Color Palette
- **Primary Background**: `#0f172a` (slate-900)
- **Secondary Background**: `#1e293b` (slate-800)
- **Primary Accent**: `#6D282C` (maroon)
- **Secondary Accent**: `#f59e0b` (amber)
- **Text Primary**: `#e2e8f0` (slate-200)
- **Text Secondary**: `#94a3b8` (slate-400)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800, 900
- **Line Heights**: 150% (body), 120% (headings)

### Spacing System
- **Base Unit**: 8px
- **Grid**: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

## 🔧 Troubleshooting

### Common Issues

#### 1. Firebase Connection Error
- **Cause**: Invalid Firebase configuration
- **Solution**: Verify Firebase credentials in environment variables

#### 2. ZbPay Payment Fails
- **Cause**: Network issues or invalid API credentials
- **Solution**: Check ZbPay sandbox status and API keys

#### 3. Student Balance Not Updating
- **Cause**: Webhook not received or processing error
- **Solution**: Check Netlify function logs and manual status check

#### 4. PWA Not Installing
- **Cause**: Missing manifest or HTTPS requirement
- **Solution**: Verify manifest.json and use HTTPS

#### 5. Offline Mode Not Working
- **Cause**: Service worker registration failure
- **Solution**: Check service worker registration in browser dev tools

### Debug Steps
1. Check browser console for JavaScript errors
2. Verify network requests in dev tools
3. Check Netlify function logs
4. Validate Firebase database rules
5. Test ZbPay API endpoints directly

## 📈 Performance Optimization

- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: WebP format with fallbacks
- **Caching Strategy**: Aggressive caching of static assets
- **Bundle Analysis**: Regular bundle size monitoring
- **Database Indexing**: Optimized Firebase queries

## 🔄 Future Enhancements

- **Bulk Payment Processing**: Multiple student payments
- **Advanced Reporting**: Detailed financial analytics
- **SMS Notifications**: Payment reminders and confirmations
- **Mobile App**: Native iOS/Android applications
- **Multi-currency Support**: Support for ZWL and other currencies
- **Advanced Security**: Two-factor authentication
- **API Integration**: Third-party accounting systems

## 📞 Support

For technical support or questions:
- **Email**: support@mwenezihigh.edu.zw
- **Phone**: +263 XX XXX XXXX
- **Documentation**: This README file
- **Firebase Console**: [Firebase Console](https://console.firebase.google.com/)
- **Netlify Dashboard**: [Netlify Dashboard](https://app.netlify.com/)

## 📄 License

© 2025 Mwenezi High School. All rights reserved.

---

**"Relevant Education for Livelihood"** - Mwenezi High School