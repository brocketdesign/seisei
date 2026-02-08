-- Add notification_preferences JSONB column to profiles table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"generation_complete": true, "campaign_report": true, "plan_reminder": false, "new_features": true}'::jsonb;
