-- Migration: Add role column to profiles table for admin access
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT NULL;
