-- Migration: Add video_generations table and ai_model_id to generations
-- Run this in your Supabase SQL Editor

-- Add ai_model_id to generations table (for tracking which model was used)
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS ai_model_id UUID REFERENCES public.ai_models(id) ON DELETE SET NULL;

-- Patch existing video_generations table if campaign_id column is missing
ALTER TABLE public.video_generations ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_video_generations_campaign_id ON public.video_generations(campaign_id);

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_generations_ai_model_id ON public.generations(ai_model_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_user_id ON public.video_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_ai_model_id ON public.video_generations(ai_model_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_generation_id ON public.video_generations(generation_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_campaign_id ON public.video_generations(campaign_id);
