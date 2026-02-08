-- Seisei AI Database Schema
-- Run this in your Supabase SQL Editor

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  brand_name TEXT,
  website TEXT,
  description TEXT,
  categories TEXT[],
  target_audience TEXT[],
  price_range TEXT,
  monthly_volume TEXT,
  styles TEXT[],
  platforms TEXT[],
  plan TEXT DEFAULT 'starter',
  billing_interval TEXT DEFAULT 'month',
  notification_preferences JSONB DEFAULT '{"generation_complete": true, "campaign_report": true, "plan_reminder": false, "new_features": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('active', 'scheduled', 'completed', 'draft')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generations table (for storing generated images)
CREATE TABLE IF NOT EXISTS public.generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  original_image_url TEXT,
  generated_image_url TEXT,
  model_type TEXT,
  background TEXT,
  aspect_ratio TEXT DEFAULT '1:1',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table (for storing product images linked to campaigns)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Models table (for storing user's custom AI models)
CREATE TABLE IF NOT EXISTS public.ai_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  thumbnail_url TEXT,
  model_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Campaigns policies
DROP POLICY IF EXISTS "Users can view own campaigns" ON public.campaigns;
CREATE POLICY "Users can view own campaigns" ON public.campaigns
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own campaigns" ON public.campaigns;
CREATE POLICY "Users can create own campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own campaigns" ON public.campaigns;
CREATE POLICY "Users can update own campaigns" ON public.campaigns
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own campaigns" ON public.campaigns;
CREATE POLICY "Users can delete own campaigns" ON public.campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Generations policies
DROP POLICY IF EXISTS "Users can view own generations" ON public.generations;
CREATE POLICY "Users can view own generations" ON public.generations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own generations" ON public.generations;
CREATE POLICY "Users can create own generations" ON public.generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own generations" ON public.generations;
CREATE POLICY "Users can update own generations" ON public.generations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own generations" ON public.generations;
CREATE POLICY "Users can delete own generations" ON public.generations
  FOR DELETE USING (auth.uid() = user_id);

-- AI Models policies
DROP POLICY IF EXISTS "Users can view own models" ON public.ai_models;
CREATE POLICY "Users can view own models" ON public.ai_models
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own models" ON public.ai_models;
CREATE POLICY "Users can create own models" ON public.ai_models
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own models" ON public.ai_models;
CREATE POLICY "Users can update own models" ON public.ai_models
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own models" ON public.ai_models;
CREATE POLICY "Users can delete own models" ON public.ai_models
  FOR DELETE USING (auth.uid() = user_id);

-- Products policies
DROP POLICY IF EXISTS "Users can view own products" ON public.products;
CREATE POLICY "Users can view own products" ON public.products
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own products" ON public.products;
CREATE POLICY "Users can create own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own products" ON public.products;
CREATE POLICY "Users can update own products" ON public.products
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own products" ON public.products;
CREATE POLICY "Users can delete own products" ON public.products
  FOR DELETE USING (auth.uid() = user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Checkout sessions table (for Stripe → Supabase auto-login bridge)
CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  session_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  temp_password TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for checkout_sessions (only service role should access)
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

-- No public policies — accessed only via service role key in API routes

-- Add ai_model_id to generations table (for tracking which model was used)
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS ai_model_id UUID REFERENCES public.ai_models(id) ON DELETE SET NULL;

-- Video generations table (for storing generated videos from images)
CREATE TABLE IF NOT EXISTS public.video_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  generation_id UUID REFERENCES public.generations(id) ON DELETE SET NULL,
  ai_model_id UUID REFERENCES public.ai_models(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  source_image_url TEXT NOT NULL,
  video_url TEXT,
  prompt TEXT,
  template TEXT,
  duration INTEGER DEFAULT 5,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for video_generations
ALTER TABLE public.video_generations ENABLE ROW LEVEL SECURITY;

-- Video generations policies
DROP POLICY IF EXISTS "Users can view own video generations" ON public.video_generations;
CREATE POLICY "Users can view own video generations" ON public.video_generations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own video generations" ON public.video_generations;
CREATE POLICY "Users can create own video generations" ON public.video_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own video generations" ON public.video_generations;
CREATE POLICY "Users can update own video generations" ON public.video_generations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own video generations" ON public.video_generations;
CREATE POLICY "Users can delete own video generations" ON public.video_generations
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_campaign_id ON public.generations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_generations_ai_model_id ON public.generations(ai_model_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_user_id ON public.ai_models(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_campaign_id ON public.products(campaign_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id ON public.checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_user_id ON public.video_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_ai_model_id ON public.video_generations(ai_model_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_generation_id ON public.video_generations(generation_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_campaign_id ON public.video_generations(campaign_id);

-- Storage bucket for generation images and videos
-- Run this in the Supabase SQL editor or via the dashboard:
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('generation-images', 'generation-images', true, 52428800, ARRAY['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm'])
-- ON CONFLICT (id) DO NOTHING;
