# 🦷 DentAge — AI-Powered Dental Age Estimation

A clinical dental age estimation app built with **React Native (Expo)** and **Supabase**. Upload an OPG (orthopantomogram) radiograph and get an AI-powered age estimation using Demirjian's development stages of 7 mandibular left permanent teeth.

---

## ✨ Features

- 📸 **OPG Radiograph Upload** — Pick or capture dental X-rays from device
- 🤖 **AI Analysis (Gemini 2.5 Flash)** — Automated Demirjian stage classification for 7 teeth
- 🎯 **Stage Classification** — Interactive tooth-by-tooth review with AI confidence scores
- 📊 **Results Dashboard** — Estimated dental age, maturity score, age range, and clinical insights
- 🔐 **Authentication** — Supabase Auth with email/password, password reset via deep linking
- 📶 **Offline Support** — Queues actions locally and syncs when network is available
- ☁️ **Cloud Storage** — OPG images stored in Supabase Storage (`opg-images` bucket)

---

## 📱 Screens

| Screen | File | Description |
|--------|------|-------------|
| Login | `screens/LoginScreen.js` | Email/password login with "Trust device" option |
| Sign Up | `screens/SignUpScreen.js` | Professional registration with license ID |
| Forgot Password | `screens/ForgotPasswordScreen.js` | Password reset via email |
| Home (Dashboard) | `screens/HomeScreen.js` | Hero stats, recent assessments, FAB, bottom nav |
| X-Ray Analysis | `screens/XRayAnalysisScreen.js` | Radiograph viewport with AI overlay & tooth detection |
| Stage Classification | `screens/StageClassificationScreen.js` | Demirjian stage picker (A–H) with AI confidence |
| Results Dashboard | `screens/ResultsDashboardScreen.js` | Age comparison, maturity score, clinical insights |
| Settings | `screens/SettingsScreen.js` | Profile, clinical preferences, app settings |
| Change Password | `screens/ChangePasswordScreen.js` | Update account password |
| Delete Account | `screens/DeleteAccountScreen.js` | Account deletion flow |

---

## 🧭 Navigation Flow

```
Login → Home
Login → SignUp → Home
Login → ForgotPassword → Login
Home → XRayAnalysis → StageClassification → Results
Home → Settings → ChangePassword
Home → Settings → DeleteAccount
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- A [Supabase](https://supabase.com/) project
- A [Google AI (Gemini)](https://aistudio.google.com/apikey) API key

### 1. Clone & Install

```bash
git clone https://github.com/codewithvis/OPG-Age-Detector.git
cd OPG-Age-Detector
npm install
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> Get these from your Supabase dashboard → **Settings → API**.

### 3. Supabase Setup

#### Database & Storage

Run the SQL in `supabase-setup.sql` in your Supabase SQL Editor. This creates:

- **`patients`** table — Patient records (name, DOB, notes)
- **`analyses`** table — AI analysis results (dental age, confidence, stages, etc.)
- **`opg-images`** storage bucket — For uploaded radiograph images
- **RLS policies** — Row-level security for authenticated users

#### Edge Functions

Deploy the Supabase Edge Functions:

```bash
supabase functions deploy radiograph_upload_and_analyze
supabase functions deploy calculate-age
supabase functions deploy save-analysis
supabase functions deploy manage-patients
supabase functions deploy get-analyses
```

#### Edge Function Secrets

Set the Gemini API key as a secret for the edge functions:

```bash
supabase secrets set GEMINI_API_KEY=your-gemini-api-key
```

### 4. Run the App

```bash
npx expo start
```

Scan the QR code with **Expo Go** on your device, or press `a` to open in an Android emulator.

---

## 🏗️ Project Structure

```
DentAge/
├── App.js                    # Navigation setup & deep linking
├── theme.js                  # Design tokens (colors, spacing, shadows)
├── api/
│   ├── analyze.js            # Client-side API calls (analyzeOPG, finalizeAnalysis)
│   └── profile.ts            # Profile API
├── screens/                  # All app screens (see table above)
├── components/               # Reusable UI components
├── services/
│   └── supabase.ts           # Supabase client, offline queue & sync
├── provider/
│   ├── AuthProvider.js       # Authentication context
│   └── QueryProvider.js      # React Query provider
├── constants/
│   └── layout.js             # Responsive layout constants
├── utils/
│   └── responsive.js         # Screen scaling utilities
├── supabase/
│   └── functions/            # Supabase Edge Functions (Deno)
│       ├── radiograph_upload_and_analyze/  # Main analysis pipeline
│       ├── calculate-age/                  # Age calculation from AI stages
│       ├── save-analysis/                  # Persist analysis to DB
│       ├── manage-patients/                # Patient CRUD
│       └── get-analyses/                   # Fetch analysis history
├── supabase-setup.sql        # Database schema & RLS policies
└── package.json
```

---

## 🔬 How It Works

1. **Upload** — User picks/captures an OPG radiograph from their device
2. **Edge Function** — Image is sent to `radiograph_upload_and_analyze`, which:
   - Validates the request and authenticates the user
   - Uploads the image to Supabase Storage (`opg-images` bucket)
   - Sends the image to **Gemini 1.5 Flash** with a dental radiology prompt
   - Parses and validates the AI response (Demirjian stages A–H for 7 teeth)
   - Stores the analysis result in the `analyses` table
3. **Review** — User reviews tooth-by-tooth stage classifications
4. **Results** — App displays estimated dental age, confidence score, maturity score, and age range

---

## 🗄️ Database Schema

### `patients`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `name` | TEXT | Patient name |
| `date_of_birth` | DATE | Date of birth |
| `notes` | TEXT | Clinical notes |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

### `analyses`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `case_id` | TEXT | Unique case identifier |
| `patient_id` | UUID (FK) | References `patients.id` |
| `image_url` | TEXT | Public URL of uploaded OPG |
| `dental_age` | NUMERIC | AI-estimated dental age (years) |
| `ai_confidence` | NUMERIC | Overall confidence (0.0–1.0) |
| `maturity_score` | NUMERIC | Dental maturity percentage |
| `age_range` | TEXT | Estimated range (e.g. "8-10") |
| `tooth_development_stage` | TEXT | JSON of per-tooth Demirjian stages |
| `analysis` | TEXT | Summary description |
| `user_id` | UUID (FK) | References `auth.users.id` |
| `created_at` | TIMESTAMPTZ | Analysis timestamp |

---

## 🎨 Design Tokens

All colors, spacing, border radii, and shadows are defined in `theme.js`. Modify there to retheme the entire app.

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo` (~55) | React Native framework |
| `@supabase/supabase-js` | Database, auth, storage, edge functions |
| `@react-navigation/native` | Navigation |
| `@tanstack/react-query` | Server state management |
| `expo-image-picker` | Camera/gallery image selection |
| `expo-file-system` | Local file I/O (base64 encoding) |
| `expo-print` / `expo-sharing` | PDF report generation & sharing |
| `react-native-toast-message` | In-app notifications |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

> **Note for collaborators:** If git asks for credentials on push, run:
> ```bash
> git config --global credential.helper manager
> ```
> Then use your GitHub username + a [Personal Access Token](https://github.com/settings/tokens) (not your password).

---

## 📄 License

ISC

---

## 🔗 Links

- **Repository:** [github.com/codewithvis/OPG-Age-Detector](https://github.com/codewithvis/OPG-Age-Detector)
- **Issues:** [github.com/codewithvis/OPG-Age-Detector/issues](https://github.com/codewithvis/OPG-Age-Detector/issues)
