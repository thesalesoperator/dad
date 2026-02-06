# RevPilot Gym 🏋️

An **evidence-based workout tracking app** that uses exercise science research to help you build muscle and get stronger consistently.

## ✨ Features

### 🎯 Smart Workout Generation
- **A/B Day Differentiation** – Distinct exercise pools for each workout day to prevent plateaus
- **Goal-Based Programming** – Strength, hypertrophy, or general fitness optimization
- **Scientific Exercise Selection** – Each exercise includes rationale based on peer-reviewed research

### 📊 Evidence-Based Training
| Feature | Science Behind It |
|---------|------------------|
| **Rest Timer** (3min strength / 90s hypertrophy / 60s general) | 2024 meta-analysis: >60s rest = better hypertrophy |
| **RPE Tracking** (6-10 scale) | ACSM: Effort near failure drives muscle growth |
| **Progressive Overload** | Suggests +2.5-5 lbs when all target reps are hit |
| **Volume Targets** | 10-20 sets/muscle/week (Schoenfeld meta-analysis) |

### 🎤 Voice-First Input
- **Voice Dictation** – Log weight and reps hands-free
- **Voice Notes** – Record form cues, equipment, or tempo notes per exercise

### 🔄 Flexible Training
- **Exercise Swap** – Substitute exercises with alternatives for the same muscle group
- **Exercise Info** – Tap the "?" icon to see why each exercise was selected
- **Settings Page** – Edit profile, goals, and regenerate your program anytime

---

## 🛠 Tech Stack

- **Frontend:** Next.js 16, React, TypeScript
- **Styling:** Tailwind CSS (Neon Noir design system)
- **Backend:** Supabase (Auth, Database, Edge Functions)
- **Deployment:** Netlify

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
├── app/                    # Next.js app router pages
│   ├── dashboard/          # Main dashboard
│   ├── workout/[id]/       # Workout recording page
│   ├── progress/           # Progress analytics
│   ├── settings/           # Profile & program settings
│   └── onboarding/         # New user setup
├── components/ui/          # Reusable UI components
│   ├── RestTimer.tsx       # Goal-based rest timer
│   ├── RPESelector.tsx     # Effort tracking (6-10 scale)
│   ├── ExerciseInfo.tsx    # Exercise rationale popover
│   ├── ExerciseSwap.tsx    # Exercise substitution
│   └── VoiceInput.tsx      # Voice dictation input
├── features/
│   ├── workouts/           # Workout logic & components
│   │   ├── actions/
│   │   │   ├── generateProgram.ts      # AI program generation
│   │   │   └── progressiveOverload.ts  # Weight suggestions
│   │   └── components/
│   │       └── WorkoutRecorder.tsx     # Main workout UI
│   └── settings/           # Settings management
└── lib/supabase/           # Supabase client
```

---

## 🔬 The Science

This app is built on evidence from meta-analyses and peer-reviewed research:

| Principle | Recommendation | Source |
|-----------|---------------|--------|
| **Weekly Volume** | 10-20 sets per muscle group | Schoenfeld et al. meta-analysis |
| **Training Frequency** | 2x/week per muscle minimum | NIH research |
| **Rest Periods** | 90-180s hypertrophy, 3-5min strength | 2024 systematic review |
| **Progressive Overload** | Increase load when all reps achieved | ACSM guidelines |
| **RPE/Effort** | Train near failure (RPE 7-9) | Resistance training research |

---

## 📱 Screenshots

The app features a premium **Neon Noir** design with:
- Glassmorphism cards
- Gradient accents
- Smooth micro-animations
- Dark mode optimized

---

## 🔐 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📄 License

MIT
