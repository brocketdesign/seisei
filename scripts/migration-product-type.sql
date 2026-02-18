-- Migration: Add product_type column to products table
-- This column specifies the garment/accessory type so Seedream 4.5 can build accurate prompts.

-- Add the product_type column with a CHECK constraint
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'top'
  CHECK (product_type IN ('top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory'));

-- Backfill: set existing products based on their category text (best effort)
UPDATE public.products SET product_type = 'dress'
  WHERE product_type = 'top'
    AND (lower(category) LIKE '%ドレス%' OR lower(category) LIKE '%ワンピース%' OR lower(category) LIKE '%dress%' OR lower(category) LIKE '%jumpsuit%');

UPDATE public.products SET product_type = 'bottom'
  WHERE product_type = 'top'
    AND (lower(category) LIKE '%パンツ%' OR lower(category) LIKE '%スカート%' OR lower(category) LIKE '%ボトム%' OR lower(category) LIKE '%pants%' OR lower(category) LIKE '%skirt%' OR lower(category) LIKE '%shorts%' OR lower(category) LIKE '%bottom%' OR lower(category) LIKE '%デニム%' OR lower(category) LIKE '%jeans%');

UPDATE public.products SET product_type = 'outerwear'
  WHERE product_type = 'top'
    AND (lower(category) LIKE '%コート%' OR lower(category) LIKE '%ジャケット%' OR lower(category) LIKE '%ブレザー%' OR lower(category) LIKE '%coat%' OR lower(category) LIKE '%jacket%' OR lower(category) LIKE '%blazer%' OR lower(category) LIKE '%parka%' OR lower(category) LIKE '%アウター%' OR lower(category) LIKE '%outerwear%');

UPDATE public.products SET product_type = 'shoes'
  WHERE product_type = 'top'
    AND (lower(category) LIKE '%シューズ%' OR lower(category) LIKE '%靴%' OR lower(category) LIKE '%ブーツ%' OR lower(category) LIKE '%サンダル%' OR lower(category) LIKE '%shoes%' OR lower(category) LIKE '%boots%' OR lower(category) LIKE '%sneakers%' OR lower(category) LIKE '%footwear%');

UPDATE public.products SET product_type = 'accessory'
  WHERE product_type = 'top'
    AND (lower(category) LIKE '%バッグ%' OR lower(category) LIKE '%アクセサリー%' OR lower(category) LIKE '%帽子%' OR lower(category) LIKE '%ハット%' OR lower(category) LIKE '%ジュエリー%' OR lower(category) LIKE '%bag%' OR lower(category) LIKE '%hat%' OR lower(category) LIKE '%accessory%' OR lower(category) LIKE '%jewelry%' OR lower(category) LIKE '%scarf%' OR lower(category) LIKE '%cup%' OR lower(category) LIKE '%マグ%');
