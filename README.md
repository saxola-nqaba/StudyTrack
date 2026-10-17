# StudyTrack 📊

A mobile academic performance tracker for students — built with React Native, Expo, and Firebase.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

---

## Overview

StudyTrack helps students take control of their academic performance. Instead of manually calculating weighted averages and guessing whether goals are still achievable, StudyTrack does it automatically — and tells you exactly what score you need on remaining assessments to reach your target.

Built from a high-fidelity prototype originally designed as a final-year university project (INSY7311 — Interaction Design), and developed into a full production mobile app as a portfolio piece.

---

## Features

### Marks
- Track modules and assessments with weighted mark calculations
- Automatic weighted average per module and overall
- Direction indicator (↑ improving / ↓ declining / → stable) based on recent assessment history

### Goals
- Set a target percentage per module
- Feasibility status calculated automatically:
  - ✅ **Reached** — current average meets or exceeds target
  - 🟢 **On Track** — achievable with ≤70% on remaining assessments
  - 🟡 **At Risk** — requires 70–85% on remaining assessments
  - 🟠 **Unlikely** — requires 85–100% on remaining assessments
  - 🔴 **Impossible** — would require more than 100%

### Deadlines
- Track assignment and assessment due dates
- Automatic categorisation into Overdue / Upcoming / Completed
- Mark as done toggle

### Insights
- Overall academic summary at a glance
- Module ranking (highest to lowest average)
- Focus recommendation (module furthest from its goal)
- Goal feasibility overview across all modules
- Weighting completeness check per module
- Deadline summary with counts and next due date

### Profile
- User profile management
- Dark mode toggle (persisted across sessions)
- Notification preferences

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (Expo SDK 57) |
| Language | TypeScript |
| Database | Firebase Firestore |
| Authentication | Firebase Auth |
| State Management | Zustand |
| Navigation | React Navigation v7 (Bottom Tabs + Stack) |
| Date Handling | date-fns |
| Icons | @expo/vector-icons (Ionicons) |

---

## Business Logic

All calculations are performed client-side from raw assessment data. No averages are cached in the database.

### Weighted Average
```
weightedAverage = (Σ(mark / outOf × weighting) / Σ(weighting)) × 100
```

### Required Score to Reach Goal
```
requiredScore = ((target × totalWeighting) - currentWeightedScore) / remainingWeighting
```

### Goal Feasibility Thresholds
```
required > 100%  →  Impossible
required > 85%   →  Unlikely
required > 70%   →  At Risk
required ≤ 70%   →  On Track
current ≥ target →  Reached
```

---

## Project Structure

```
src/
├── components/
│   ├── cards/          # ModuleCard, AssessmentCard, GoalCard, DeadlineCard
│   ├── common/         # ProgressBar, StatusBadge, DirectionIndicator, EmptyState
│   └── forms/          # FormInput, PrimaryButton, SecondaryButton
├── constants/          # colours, typography, spacing
├── firebase/           # Firebase config (gitignored)
├── navigation/         # AppNavigator, MainNavigator, tab stack navigators
├── screens/
│   ├── auth/           # Login, Register
│   ├── marks/          # Dashboard, ModuleDetail, Add/Edit Module, Add/Edit Assessment
│   ├── goals/          # Goals, EditGoal
│   ├── deadlines/      # Deadlines, AddDeadline
│   ├── insights/       # Insights
│   └── profile/        # Profile
├── services/           # Firestore CRUD operations per entity
├── store/              # Zustand stores (auth, modules, goals, deadlines)
├── types/              # TypeScript interfaces
└── utils/              # calculations, validation, dates
```

---

## Firestore Schema

```
users/{userId}
  └── modules/{moduleId}
        ├── assessments/{assessmentId}
        └── goal (single document)
  └── deadlines/{deadlineId}
```

---

## Getting Started

### Prerequisites
- Node.js LTS
- Expo CLI
- Expo Go app on your phone
- Firebase project with Email/Password Auth and Firestore enabled

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/StudyTrack.git
cd StudyTrack
npm install
```

### Firebase Setup

Create `src/firebase/config.ts` with your Firebase project credentials:

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

### Run

```bash
npx expo start
```

Scan the QR code with Expo Go on your phone.

---

## Development Status

| Phase | Description | Status |
|---|---|---|
| 1 | Foundation — project setup, navigation scaffold, theme | ✅ Complete |
| 2 | Auth — Login and Register screens with Firebase Auth | ⏳ Deferred to end (iOS Expo Go limitation) |
| 3 | Marks — Dashboard, Add/Edit Module, Module Detail | ✅ Complete |
| 4 | Marks — Add/Edit Assessment screens | 🔄 In Progress |
| 5 | Goals — Goal setting and feasibility calculation | ⏳ Pending |
| 6 | Deadlines — Deadline tracking and status logic | ⏳ Pending |
| 7 | Insights — Analytics and performance summary | ⏳ Pending |
| 8 | Profile — User profile and settings | ⏳ Pending |
| 9 | Auth — Custom dev build with Firebase Auth | ⏳ Pending |
| 10 | Polish — Empty states, loading, error handling | ⏳ Pending |

---

## Design

Designed from scratch as a high-fidelity mobile prototype applying Nielsen's usability heuristics, Norman's design principles, and Shneiderman's Eight Golden Rules. Colour system uses semantic colour coding throughout — green for success/reached goals, amber for at-risk, red for overdue/impossible — always paired with text labels for accessibility.

Primary colour: `#1A5276`

---

## Author

**Saxola Nqaba**
IIE BCIS Application Development — Varsity College