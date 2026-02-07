# DAD GYM 🏋️

An **evidence-based workout tracking app** that uses exercise science research to help you build muscle, get stronger, and stay consistent.

---

## ✨ Features

### 🎯 Database-Driven Program Engine
- **18+ Training Programs** across 7 categories (Strength, Bodybuilding, Athletic, Power, Endurance, Flexibility, General)
- **A/B Day Differentiation** – Distinct exercise pools for each workout day to prevent plateaus
- **Goal-Based Programming** – Experience-aware set/rep adjustments with gender-responsive defaults
- **Scientific Exercise Selection** – Each exercise includes rationale based on peer-reviewed research
- **Equipment-Aware Generation** – Programs adapt to your available equipment (full gym, dumbbells only, bodyweight, etc.)

### 📈 Progressive Overload Engine
| Feature | How It Works |
|---------|-------------|
| **Double Progression Model** | Analyzes last 2 sessions per exercise to determine recommendations |
| **Smart Weight Suggestions** | Pre-fills recommended weight on next workout based on performance |
| **RPE-Aware Decisions** | Factors in RPE (Rate of Perceived Exertion) when deciding to increase weight |
| **Deload Detection** | Recommends deloads when RPE is consistently high or reps are declining |
| **Next Session Targets** | Shows upcoming weight targets on the Progress page |

**Decision matrix:**
- All reps hit at RPE ≤ 8 → **Increase weight** (+5 lbs)
- All reps hit at RPE 9+ → **Maintain weight** (getting closer)
- Missed reps → **Maintain** and work up
- RPE 10 + missed reps across sessions → **Deload** (-10%)

### 🔥 Streak & Gamification System
- **Week-Based Streaks** – Tracks consecutive training weeks (not days), so missing a day doesn't break your streak
- **PR Detection** – Automatically detects personal records after every workout completion
- **PR Celebration Overlay** – Fullscreen confetti animation when you hit a new PR
- **52-Week Activity Heatmap** – GitHub-style contribution graph showing your training consistency
- **Exercise History Sparklines** – Mini trend charts for each exercise showing weight progression over time

### 🔔 Smart Notification System
- **Contextual Dashboard Banners** – Dynamic banners based on your state:
  - 🎉 First workout? → Welcome encouragement
  - 🔥 On a streak? → Streak celebration
  - 💪 Hit a PR? → PR acknowledgment
  - 👋 Been away? → Comeback motivation
- **Training Day Scheduler** – Select which days of the week you train
- **Preferred Time Picker** – Set your ideal workout reminder time
- **Email Reminder Toggle** – Opt in/out of email notifications
- **Edge Functions** – `workout-reminder` and `weekly-recap` serverless functions deployed on Supabase

### 📊 Progress Analytics
- **Streak Stats** – Current streak, best streak, total workouts, PR count
- **Activity Heatmap** – 52-week visual training log with intensity scaling
- **Exercise History** – All exercises logged with weight, date, and volume
- **Next Session Targets** – Upcoming progression recommendations per exercise

### 🎤 Voice-First Input
- **Voice Dictation** – Log weight and reps hands-free mid-set
- **Voice Notes** – Record form cues, equipment used, or tempo notes per exercise

### 🔄 Flexible Training
- **Exercise Swap** – Substitute exercises with alternatives targeting the same muscle group
- **Exercise Info** – Tap the info icon to see the scientific rationale behind each exercise
- **Rest Timer** – Goal-based automatic rest timer (3min strength / 90s hypertrophy / 60s general)
- **RPE Tracking** – Rate effort on a 6-10 scale per set to inform progression decisions

### ⚙️ Settings & Profile
- **Profile Management** – Edit name, experience level, training frequency, and goals
- **Equipment Configuration** – Update available equipment to regenerate programs
- **Program Regeneration** – Switch training programs or adjust parameters and regenerate
- **Notification Preferences** – Configure training days, reminder time, and email opt-in

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | CSS Variables (Neon Noir design system) |
| **Backend** | Supabase (Auth, PostgreSQL, Edge Functions) |
| **Deployment** | Netlify |
| **Design** | Glassmorphism, gradient accents, micro-animations |

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase URL and anon key

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 📁 Project Structure

```
src/
├── app/                          # Next.js app router pages
│   ├── dashboard/                # Main dashboard with stats, banners, next workout
│   ├── workout/[id]/             # Workout recording page with RPE + voice input
│   ├── progress/                 # Progress analytics (heatmap, streaks, history)
│   ├── settings/                 # Profile, program, and notification settings
│   └── onboarding/               # Multi-step new user setup flow
├── components/ui/                # Reusable UI components
│   ├── RestTimer.tsx             # Goal-based rest timer
│   ├── RPESelector.tsx           # Effort tracking (6-10 scale)
│   ├── PRCelebration.tsx         # Fullscreen PR confetti overlay
│   ├── ExerciseInfo.tsx          # Exercise rationale popover
│   ├── ExerciseSwap.tsx          # Exercise substitution drawer
│   ├── VoiceInput.tsx            # Voice dictation for weight/reps
│   └── VoiceNoteInput.tsx        # Voice notes per exercise
├── features/
│   ├── workouts/                 # Workout domain logic
│   │   ├── actions/
│   │   │   ├── generateProgram.ts       # Database-driven program generation
│   │   │   ├── computeProgression.ts    # Double progression engine
│   │   │   ├── progressiveOverload.ts   # Weight suggestion computation
│   │   │   └── streaksAndPRs.ts         # Streak calculation & PR detection
│   │   └── components/
│   │       └── WorkoutRecorder.tsx      # Main workout recording UI
│   └── settings/                 # Settings management
│       └── components/
│           └── SettingsForm.tsx          # Profile + notification preferences form
└── lib/supabase/                 # Supabase client (server + client + middleware)
```

---

## 🗄 Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Profile, onboarding data, notification preferences, last workout timestamp |
| `exercises` | Exercise catalog (name, muscle group, equipment, alternatives) |
| `training_programs` | Program definitions (18+ programs across 7 categories) |
| `program_workouts` | Workout templates per program per day count |
| `program_workout_exercises` | Exercise assignments per program workout |
| `workouts` | Generated user workouts |
| `workout_exercises` | Exercises assigned to a user's workout |
| `workout_logs` | Completed workout sessions |
| `logs` | Individual set logs (weight, reps, RPE) |
| `progression_recommendations` | Computed next-session weight targets |
| `user_achievements` | Personal records and milestones |

---

## 🔬 The Science

This app is built on evidence from meta-analyses and peer-reviewed research:

| Principle | Recommendation | Source |
|-----------|---------------|--------|
| **Weekly Volume** | 10-20 sets per muscle group | Schoenfeld et al. meta-analysis |
| **Training Frequency** | 2x/week per muscle minimum | NIH research |
| **Rest Periods** | 90-180s hypertrophy, 3-5min strength | 2024 systematic review |
| **Progressive Overload** | Increase load when all reps achieved at manageable RPE | ACSM guidelines |
| **RPE/Effort** | Train near failure (RPE 7-9) for hypertrophy | Resistance training research |
| **Double Progression** | Increase reps first, then weight | Applied strength coaching |
| **Deload Protocol** | Reduce by 10% when effort is maximal with declining reps | Periodization literature |

---

## 📱 Design

The app features a premium **Neon Noir** design system:

- 🖤 Dark mode optimized with deep backgrounds
- 💎 Glassmorphism cards with backdrop blur
- 🌈 Gradient accents (cyan → purple → green)
- ✨ Smooth micro-animations and slide-ups
- 🎯 Monospace typography for data-dense elements
- 🎆 PR celebration overlay with confetti particles
- 📊 GitHub-style activity heatmap with intensity scaling

---

## 🔐 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📄 License

MIT
