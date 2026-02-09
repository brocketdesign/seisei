-- Migration: Add billing_interval column to profiles table
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'month';


