# Complete Deployment Guide for PPDO-PDD Task Tracker

## Prerequisites

1. **Node.js** installed (v18 or higher)
2. **Git** installed
3. **Vercel account** (free) - sign up at https://vercel.com
4. **GitHub account** (optional but recommended)

---

## Method 1: Quick Deploy via Vercel CLI (Recommended)

### Step 1: Install Dependencies

```bash
cd ppdo-pdd-tracker
npm install
```

### Step 2: Test Locally

```bash
npm run dev
```

Visit `http://localhost:5173` to verify the app works.

### Step 3: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 4: Deploy

```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No
- **What's your project's name?** → `ppdo-pdd-tracker` (or your choice)
- **In which directory is your code located?** → `./`
- **Want to override settings?** → No

Vercel will:
1. Build your project
2. Deploy to a live URL
3. Give you a production URL like: `https://ppdo-pdd-tracker-xyz.vercel.app`

### Step 5: Deploy Updates

Whenever you make changes:

```bash
vercel --prod
```

---

## Method 2: Deploy via GitHub (Most Common)

### Step 1: Create GitHub Repository

1. Go to https://github.com and create a new repository
2. Name it `ppdo-pdd-tracker`
3. Keep it private for internal use
4. Don't initialize with README (we already have one)

### Step 2: Push Code to GitHub

```bash
cd ppdo-pdd-tracker

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial deployment"

# Add your GitHub repo as remote (replace with your URL)
git remote add origin https://github.com/YOUR-USERNAME/ppdo-pdd-tracker.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Connect to Vercel

1. Go to https://vercel.com
2. Click **"New Project"**
3. Click **"Import Git Repository"**
4. Find your `ppdo-pdd-tracker` repo and click **"Import"**
5. Vercel will auto-detect settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Click **"Deploy"**

Wait 1-2 minutes for deployment to complete.

### Step 4: Get Your Live URL

Once deployed, you'll get a URL like:
```
https://ppdo-pdd-tracker.vercel.app
```

### Step 5: Deploy Updates

After making changes:

```bash
git add .
git commit -m "Description of changes"
git push
```

Vercel automatically redeploys on every push to `main` branch.

---

## Post-Deployment Steps

### 1. Test the Live App

Visit your Vercel URL and:
- Login as Supervisor (PIN: `0000`)
- Create a test task
- Login as a staff member (PIN: `1234`)
- Verify real-time sync

### 2. Set Up Custom Domain (Optional)

In Vercel Dashboard:
1. Go to your project
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain (e.g., `tracker.ppdo-agusandelnorte.gov.ph`)
4. Follow DNS configuration instructions

### 3. Configure Supervisor PIN

1. Login as supervisor
2. Go to **Settings → Manage PINs**
3. Change supervisor PIN from `0000` to something secure
4. Change staff PINs as needed

### 4. Set Up Staff Accounts

1. Go to **Settings → Manage Staff**
2. Add/edit staff members
3. Assign correct roles and groups

---

## Firebase Database Security (Important!)

### Current Setup
Your Firebase Realtime Database is currently **open** for development.

### Recommended Production Rules

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: `ppdo-pdd-tracker`
3. Go to **Realtime Database → Rules**
4. Replace with:

```json
{
  "rules": {
    ".read": true,
    ".write": true,
    "ppdopdd": {
      ".read": true,
      ".write": true
    }
  }
}
```

For better security (requires Firebase Authentication):

```json
{
  "rules": {
    "ppdopdd": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

---

## Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Firebase Connection Issues

Check Firebase config in `src/firebase.js`:
- Ensure `databaseURL` is correct
- Verify project exists in Firebase Console

### Vercel Deployment Stuck

1. Check Vercel dashboard for error logs
2. Verify `package.json` scripts are correct
3. Ensure all dependencies are listed in `dependencies` (not `devDependencies`)

### Real-time Sync Not Working

1. Check Firebase Realtime Database rules
2. Verify internet connection
3. Check browser console for errors (F12)

---

## Monitoring & Maintenance

### View Deployment Logs

1. Go to Vercel Dashboard
2. Select your project
3. Click on a deployment
4. View **"Build Logs"** and **"Function Logs"**

### Monitor Firebase Usage

1. Go to Firebase Console
2. Check **"Realtime Database → Usage"**
3. Monitor reads/writes (free tier: 100k reads/day)

### Backup Database

Firebase automatically backs up your data, but for manual backup:

1. Go to Firebase Console
2. **Realtime Database → Data**
3. Click ⋮ menu → **Export JSON**

---

## Environment Variables (If Needed)

If you want to use environment variables instead of hardcoded Firebase config:

### 1. Create `.env.local`

```env
VITE_FIREBASE_API_KEY=AIzaSyAiH06gCSNmQ4_k3qLhwzlachdgRmmpcQs
VITE_FIREBASE_AUTH_DOMAIN=ppdo-pdd-tracker.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://ppdo-pdd-tracker-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=ppdo-pdd-tracker
VITE_FIREBASE_STORAGE_BUCKET=ppdo-pdd-tracker.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=671124008549
VITE_FIREBASE_APP_ID=1:671124008549:web:9a84d083258ee16f9ea08c
```

### 2. Update `src/firebase.js`

```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  // ... etc
};
```

### 3. Add to Vercel

In Vercel Dashboard:
1. Go to **Settings → Environment Variables**
2. Add each variable
3. Redeploy

---

## Quick Reference

### Local Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Deployment
```bash
vercel              # Deploy to preview
vercel --prod       # Deploy to production
```

### Git Commands
```bash
git add .
git commit -m "message"
git push            # Auto-deploys to Vercel
```

---

## Support Contacts

- **Vercel Support**: https://vercel.com/support
- **Firebase Support**: https://firebase.google.com/support
- **PPDO IT Team**: (internal contact)

---

## Success Checklist

- [ ] Code deployed to Vercel
- [ ] App accessible via live URL
- [ ] Firebase real-time sync working
- [ ] Supervisor PIN changed from default
- [ ] Staff accounts configured
- [ ] Custom domain configured (optional)
- [ ] Firebase security rules updated
- [ ] Team members can access the app
- [ ] Backup procedures documented

---

**Congratulations!** Your PPDO-PDD Task Tracker is now live and ready to use. 🎉
