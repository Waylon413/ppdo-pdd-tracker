# PPDO-PDD Task Tracker

A comprehensive task tracking and management system for the Project Development Division (PDD) of the Provincial Planning and Development Office (PPDO), Province of Agusan del Norte.

## Features

- **Real-time Synchronization** with Firebase Realtime Database
- **Multi-user Support** with PIN-based authentication
- **Task Management** with kanban boards, progress tracking, and deadlines
- **Staff Performance Analytics** with charts and reports
- **Goal Tracking** for monthly and quarterly objectives
- **ELA (Executive Legislative Agenda) Tracking**
- **Activity Logging** for audit trails
- **Approval Workflows** for task delegation
- **CSV Export** and **Print/PDF Reports**

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Firebase Realtime Database
- **Deployment**: Vercel

## Local Development

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to link your project

### Option 2: Deploy via GitHub

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. Go to [Vercel](https://vercel.com) and click "New Project"

3. Import your GitHub repository

4. Vercel will auto-detect Vite and configure build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Click "Deploy"

### Environment Configuration

No environment variables needed - Firebase config is already included in the code.

## Default Credentials

- **Supervisor (Waylon)**: PIN `0000`
- **All Staff**: Default PIN `1234`

You can change PINs in the app under **Settings → Manage PINs**

## Firebase Database Structure

```
ppdopdd/
├── tasks/          # Regular tasks
├── supTasks/       # Supervisor tasks
├── requests/       # Pending approvals
├── goals/          # Goal tracker items
├── log/            # Activity log
├── pins/           # User PINs
├── staff/          # Staff list
└── ela/            # ELA targets
```

## Usage

### For Supervisors

- Access all pages: Dashboard, Kanban, Analytics, Staff views, Goals, ELA, Approvals
- Create and manage all tasks
- Approve/reject requests
- Manage staff and PINs
- View comprehensive analytics

### For Staff

- View and manage own tasks
- Create new tasks
- Forward tasks to Activity Processing (PDO staff only)
- Track goals
- View personal analytics

## Key Features Explained

### Task Types

Different task types based on staff group:
- **Activity Processing**: Disbursements, Activity coordination
- **Admin Support**: Letters, memos, documents
- **Project Dev Officers**: Technical documents, project proposals
- **Engineers**: Engineering tasks, surveys, designs
- **GIS**: Map creation, spatial analysis

### Approval Workflow

1. Staff creates task
2. If Admin staff, auto-routes to Supervisor for approval
3. Supervisor can approve or reject
4. Approved tasks appear in staff's task list

### Real-time Sync

All changes sync across all users in real-time using Firebase listeners.

## Support

For issues or questions, contact the PPDO IT team.

## License

Provincial Government of Agusan del Norte - Internal Use Only
