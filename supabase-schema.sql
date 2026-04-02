-- Supabase SQL schema for Dental Age Prediction App

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Patients table
CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date_of_birth DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Analyses table
CREATE TABLE analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id TEXT NOT NULL,
  patient_id UUID REFERENCES patients(id),
  image_url TEXT,
  dental_age NUMERIC NOT NULL,
  ai_confidence NUMERIC NOT NULL CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  maturity_score NUMERIC,
  age_range TEXT NOT NULL,
  tooth_development_stage TEXT NOT NULL,
  analysis TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_analyses_patient_id ON analyses(patient_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX idx_patients_name ON patients(name);

-- RLS Policies
CREATE POLICY "Users can view their own patients" ON patients
  FOR SELECT USING (auth.uid()::text = 'authenticated');

CREATE POLICY "Users can insert their own patients" ON patients
  FOR INSERT WITH CHECK (auth.uid()::text = 'authenticated');

CREATE POLICY "Users can update their own patients" ON patients
  FOR UPDATE USING (auth.uid()::text = 'authenticated');

CREATE POLICY "Users can view their own analyses" ON analyses
  FOR SELECT USING (auth.uid()::text = 'authenticated');

CREATE POLICY "Users can insert their own analyses" ON analyses
  FOR INSERT WITH CHECK (auth.uid()::text = 'authenticated');