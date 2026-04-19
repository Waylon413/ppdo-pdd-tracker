# PPDO-PDD Task Tracker

A comprehensive task management system for the Provincial Planning and Development Office (PPDO) - Project Development Division of the Province of Agusan del Norte.

## Features

✅ **Multi-user Task Management** - Supervisor and staff-level access with role-based permissions
✅ **Real-time Synchronization** - Firebase Realtime Database keeps all users in sync
✅ **Kanban Board View** - Visual task management with drag-and-drop functionality
✅ **Analytics Dashboard** - Performance metrics, task completion rates, and recommendations
✅ **Goal Tracking** - Set and monitor monthly/quarterly goals
✅ **ELA Target Management** - Track Executive Legislative Agenda targets
✅ **Activity Logging** - Complete audit trail of all actions
✅ **Mobile Responsive** - Works seamlessly on phones, tablets, and desktop
✅ **PIN Security** - Secure login system with customizable PINs

## Tech Stack

- **Frontend**: React 18 with Vite
- **Database**: Firebase Realtime Database
- **Styling**: Inline CSS (no external dependencies)
- **Deployment**: Vercel (recommended) or any static hosting

---

## 🚀 DEPLOYMENT GUIDE

### Option 1: Deploy to Vercel (Recommended - Easiest)

Vercel is a free hosting platform perfect for React apps. It's the easiest option.

#### Step 1: Create a GitHub Account (if you don't have one)
1. Go to https://github.com
2. Click "Sign up" and create a free account

#### Step 2: Upload Your Project to GitHub
1. Go to https://github.com/new
2. Name your repository: `ppdo-pdd-tracker`
3. Keep it **Public** (for free hosting)
4. Click "Create repository"
5. Download this project folder to your computer
6. Follow GitHub's instructions to upload your code:
   ```bash
   # If you have git installed on your computer:
   cd path/to/ppdo-pdd-tracker
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/ppdo-pdd-tracker.git
   git push -u origin main
   ```

**Don't have Git?** You can upload files manually:
- Click "uploading an existing file"
- Drag and drop all your project files
- Click "Commit changes"

#### Step 3: Deploy to Vercel
1. Go to https://vercel.com
2. Click "Sign Up" and choose "Continue with GitHub"
3. After signing in, click "Add New..." → "Project"
4. Select your `ppdo-pdd-tracker` repository
5. Vercel will auto-detect it's a Vite project
6. Click "Deploy"
7. Wait 1-2 minutes for deployment to complete
8. You'll get a live URL like: `https://ppdo-pdd-tracker.vercel.app`

**That's it!** Your app is now live and accessible from any device!

---

### Option 2: Deploy to Netlify (Alternative)

1. Go to https://netlify.com and sign up
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub account and select the repository
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click "Deploy site"
6. Your app will be live at a URL like: `https://ppdo-pdd-tracker.netlify.app`

---

## 🔧 LOCAL DEVELOPMENT

If you want to run the project on your computer for testing:

### Prerequisites
- Install Node.js from https://nodejs.org (Download the LTS version)

### Setup Steps

1. **Download the project** (if you haven't already)

2. **Open Terminal/Command Prompt** and navigate to the project folder:
   ```bash
   cd path/to/ppdo-pdd-tracker
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** to `http://localhost:5173`

The app will automatically reload when you make changes!

---

## 📱 ACCESSING THE APP

### Default Login Credentials

**Supervisor Account:**
- Select: "Supervisor — Waylon"
- PIN: `0000`

**Staff Accounts:**
- Select any staff member (Peter, Alyssa, etc.)
- Default PIN for all staff: `1234`

### Changing PINs (Supervisor Only)

1. Log in as Supervisor
2. Click the menu icon (☰)
3. Go to "Settings" → "Manage PINs"
4. Update PINs for any account
5. Click "Save"

---

## 🗄️ FIREBASE DATABASE

Your data is stored in Firebase Realtime Database. The database structure is:

```
ppdopdd/
  ├── tasks/           # All tasks
  ├── supTasks/        # Supervisor's personal tasks
  ├── requests/        # Approval requests
  ├── goals/           # Goal tracking
  ├── log/             # Activity log
  ├── pins/            # PIN codes (encrypted)
  ├── staff/           # Staff list and roles
  └── ela/             # ELA targets
```

### Viewing Your Data in Firebase

1. Go to https://console.firebase.google.com
2. Select your project: `ppdo-pdd-tracker`
3. Click "Realtime Database" in the left menu
4. You can view/edit all data directly

### Backup Your Data

In Firebase Console:
1. Go to Realtime Database
2. Click the three dots (⋮) → "Export JSON"
3. Save the file to your computer

---

## 🛠️ CUSTOMIZATION

### Adding New Staff Members

As Supervisor:
1. Menu → Settings → Manage Staff
2. Scroll to "Add New Staff"
3. Enter name, role, and group
4. Click "+ Add Staff"
5. Click "Save All"

### Changing ELA Acronym

1. Log in as Supervisor
2. Go to "ELA / AKSYON"
3. Click "Manage Targets"
4. Update the acronym field
5. Click "Save"

### Modifying Task Types

Edit the `TASK_TYPES` object in `src/App.jsx`:

```javascript
const TASK_TYPES = {
  activity: ["Activity Processing", "Disbursement", "Meeting"],
  // Add more types here...
};
```

---

## 📊 FEATURES GUIDE

### Dashboard
- Overview of all tasks across teams
- Staff performance cards with progress rings
- Filter by department/group
- Quick task creation

### Kanban Board
- Visual task management
- Organized by status columns
- Real-time updates across all users

### Analytics
- Completion rate tracking
- Overdue task monitoring
- Cost aggregation
- AI-powered recommendations
- Export to CSV
- Print/PDF reports

### Goal Tracker
- Set monthly/quarterly goals
- Assign to staff members
- Track progress with visual bars
- Filter by period

### Approval System
- PDO staff can forward tasks to Activity Processing
- Supervisor approves/rejects requests
- Notifications for pending approvals

---

## 🔒 SECURITY NOTES

1. **Firebase Security Rules** (Important!)

Your Firebase database is currently open for this deployment. For production use, update your Firebase Security Rules:

```json
{
  "rules": {
    "ppdopdd": {
      ".read": true,
      ".write": true
    }
  }
}
```

For better security, implement authentication-based rules.

2. **PIN Storage**
   - PINs are stored in Firebase
   - For production, consider adding encryption
   - Change default PINs immediately after deployment

---

## 📞 SUPPORT

### Common Issues

**App not loading?**
- Check if Firebase config is correct
- Check browser console for errors (F12)
- Clear browser cache and reload

**Data not syncing?**
- Check internet connection
- Verify Firebase Realtime Database is enabled
- Check Firebase console for database status

**Can't log in?**
- Try default credentials (Supervisor: 0000, Staff: 1234)
- Check if PINs were changed
- Contact admin to reset PINs in Firebase

---

## 📝 PROJECT STRUCTURE

```
ppdo-pdd-tracker/
├── src/
│   ├── App.jsx           # Main application component
│   ├── main.jsx          # React entry point
│   └── firebase.js       # Firebase configuration
├── index.html            # HTML template
├── package.json          # Dependencies
├── vite.config.js        # Vite build config
├── vercel.json           # Vercel deployment config
└── README.md             # This file
```

---

## 🎯 NEXT STEPS AFTER DEPLOYMENT

1. **Test the deployment** - Open the Vercel URL on your phone
2. **Change default PINs** - Update supervisor and staff PINs
3. **Add your staff** - Go to Manage Staff and add real team members
4. **Customize ELA** - Update the ELA acronym and targets
5. **Share the URL** - Send the link to your team
6. **Bookmark it** - Add to home screen on mobile devices

---

## 📱 MOBILE APP EXPERIENCE

To make it feel like a native app on phones:

**On iPhone:**
1. Open the website in Safari
2. Tap the Share icon
3. Tap "Add to Home Screen"
4. Name it "PPDO Task Tracker"

**On Android:**
1. Open the website in Chrome
2. Tap the three dots (⋮)
3. Tap "Add to Home screen"
4. Name it "PPDO Task Tracker"

Now it will open like a regular app!

---

## 🆘 TROUBLESHOOTING

### "Loading from Firebase..." stuck forever
- Check Firebase credentials in `src/firebase.js`
- Verify Firebase Realtime Database is enabled
- Check browser console (F12) for errors

### Changes not appearing for other users
- Firebase syncs in real-time
- If delayed, check internet connection
- Try refreshing the page

### Deployment failed on Vercel
- Check if all files are uploaded to GitHub
- Verify `package.json` exists
- Check build logs in Vercel dashboard

---

## 💡 TIPS FOR BEST EXPERIENCE

1. **Use Chrome or Safari** for best compatibility
2. **Enable notifications** (if implemented) for deadline alerts
3. **Regular backups** - Export Firebase data monthly
4. **Mobile-first** - Design works great on phones
5. **Collaborative** - All updates sync instantly across devices

---

## 📄 LICENSE

This project is developed for the Provincial Planning and Development Office (PPDO) - Project Development Division, Province of Agusan del Norte.

---

**Made with ❤️ for PPDO-PDD**

For questions or support, contact your system administrator.
