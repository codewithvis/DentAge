-- Step 1: Create tables if they don't exist
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date_of_birth DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id TEXT NOT NULL,
  patient_id UUID,
  image_url TEXT,
  dental_age NUMERIC NOT NULL,
  ai_confidence NUMERIC NOT NULL CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  maturity_score NUMERIC,
  age_range TEXT NOT NULL,
  tooth_development_stage TEXT NOT NULL,
  analysis TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users(id)
);

-- Step 2: Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('opg-images', 'opg-images', true)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Set up RLS policies for storage
CREATE POLICY "Users can upload their own images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'opg-images' AND auth.uid()::text IS NOT NULL);

CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'opg-images');

-- Step 4: Enable RLS on tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for tables
DROP POLICY IF EXISTS "Users can view their own patients" ON patients;
CREATE POLICY "Users can view their own patients" ON patients
  FOR SELECT USING (auth.uid() = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own patients" ON patients;
CREATE POLICY "Users can insert their own patients" ON patients
  FOR INSERT WITH CHECK (auth.uid() = auth.uid());

DROP POLICY IF EXISTS "Users can view their own analyses" ON analyses;
CREATE POLICY "Users can view their own analyses" ON analyses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own analyses" ON analyses;
CREATE POLICY "Users can insert their own analyses" ON analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analyses_patient_id ON analyses(patient_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);