# Firebase Authentication & MongoDB Integration Setup

## Overview
This project now includes Firebase Authentication with MongoDB backend integration. User profiles are automatically saved to MongoDB after login, and admin privileges are assigned to specific email addresses.

## Features Implemented

### 1. Firebase Authentication
- Google Sign-In integration
- User authentication state management
- Automatic profile synchronization

### 2. MongoDB Integration
- User profile storage in MongoDB
- Settings persistence
- Profile data management

### 3. Admin System
- Admin email: `bhelavevicky66@gmail.com`
- Admin privileges automatically assigned to the specified email
- Admin status stored in MongoDB

### 4. Backend API
- Express server running on port 5000
- RESTful API endpoints for user management
- CORS enabled for frontend communication

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Backend Server
```bash
npm run server
```
The backend server will run on `http://localhost:5000`

### 3. Start the Frontend Development Server
```bash
npm run dev
```
The frontend will run on `http://localhost:3000` (or next available port if 3000 is in use)
- Currently running on: `http://localhost:3004/`

### 4. Or Run Both Simultaneously
```bash
npm run dev:all
```

## API Endpoints

### POST /api/user/profile
Save or update user profile in MongoDB
- Body: `{ firebaseUid, email, name, avatar, providerId, settings, profile }`
- Returns: `{ success: true, user, isAdmin }`

### GET /api/user/:firebaseUid
Get user profile by Firebase UID
- Returns: `{ success: true, user, isAdmin }`

### PUT /api/user/:firebaseUid/settings
Update user settings
- Body: `{ settings }`
- Returns: `{ success: true, user }`

### PUT /api/user/:firebaseUid/profile
Update user profile
- Body: `{ profile }`
- Returns: `{ success: true, user }`

### GET /api/health
Health check endpoint
- Returns: `{ status: 'ok', message: 'Server is running' }`

## Firebase Configuration
Firebase is configured with the following credentials (already set in `src/lib/firebase.ts`):
- API Key: AIzaSyDVFp5Eq8gyLNQqRlUPV2SxTLRAf4OPAVc
- Auth Domain: linkup--app.firebaseapp.com
- Project ID: linkup--app
- Storage Bucket: linkup--app.firebasestorage.app

## MongoDB Configuration
MongoDB is configured in `src/config/db.config.js` with the following connection string:
- Database: Chat-Bot
- User: bhelavevicky66_db_user
- Host: Atlas cluster (replica set)

## Admin System
The admin system automatically assigns admin privileges to users with the email:
- `bhelavevicky66@gmail.com`

Admin status is:
- Checked during Firebase authentication
- Stored in MongoDB
- Available in the VaultContext as `isAdmin`

## User Profile Data
User profiles stored in MongoDB include:
- Firebase UID
- Email
- Name
- Avatar
- Provider ID
- Admin status
- Settings (passcode, auto-lock, theme, etc.)
- Profile (status, online status)

## Usage Flow

1. User clicks "Sign in with Google"
2. Firebase authentication popup appears
3. User authenticates with Google
4. User profile is automatically saved to MongoDB
5. Admin status is checked and assigned
6. User profile is updated in the application state
7. Settings and profile data are synchronized with MongoDB

## Troubleshooting

### Backend Server Not Starting
- Ensure MongoDB is accessible
- Check connection string in `src/config/db.config.js`
- Verify port 5000 is not in use

### Firebase Authentication Not Working
- Check Firebase configuration in `src/lib/firebase.ts`
- Ensure Firebase project is properly set up
- Verify Google Sign-In is enabled in Firebase Console

### MongoDB Connection Issues
- Verify MongoDB Atlas credentials
- Check IP whitelist in MongoDB Atlas
- Ensure network connectivity

## Development Notes

- The backend server (`server.js`) handles all MongoDB operations
- Frontend communicates with backend via REST API
- Firebase authentication is handled client-side
- User data is synchronized between Firebase and MongoDB
- LocalStorage is still used for some client-side data
