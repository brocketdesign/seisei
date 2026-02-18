export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    brand_name: string | null
                    website: string | null
                    description: string | null
                    categories: string[] | null
                    target_audience: string[] | null
                    price_range: string | null
                    monthly_volume: string | null
                    styles: string[] | null
                    platforms: string[] | null
                    plan: string | null
                    billing_interval: string | null
                    notification_preferences: Record<string, boolean> | null
                    role: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    brand_name?: string | null
                    website?: string | null
                    description?: string | null
                    categories?: string[] | null
                    target_audience?: string[] | null
                    price_range?: string | null
                    monthly_volume?: string | null
                    styles?: string[] | null
                    platforms?: string[] | null
                    plan?: string | null
                    billing_interval?: string | null
                    notification_preferences?: Record<string, boolean> | null
                    role?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    brand_name?: string | null
                    website?: string | null
                    description?: string | null
                    categories?: string[] | null
                    target_audience?: string[] | null
                    price_range?: string | null
                    monthly_volume?: string | null
                    styles?: string[] | null
                    platforms?: string[] | null
                    plan?: string | null
                    billing_interval?: string | null
                    notification_preferences?: Record<string, boolean> | null
                    role?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            checkout_sessions: {
                Row: {
                    session_id: string
                    user_id: string | null
                    email: string
                    temp_password: string
                    processed: boolean
                    created_at: string
                }
                Insert: {
                    session_id: string
                    user_id?: string | null
                    email: string
                    temp_password: string
                    processed?: boolean
                    created_at?: string
                }
                Update: {
                    session_id?: string
                    user_id?: string | null
                    email?: string
                    temp_password?: string
                    processed?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            campaigns: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    status: 'active' | 'scheduled' | 'completed' | 'draft'
                    description: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    status?: 'active' | 'scheduled' | 'completed' | 'draft'
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    status?: 'active' | 'scheduled' | 'completed' | 'draft'
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            generations: {
                Row: {
                    id: string
                    user_id: string
                    campaign_id: string | null
                    ai_model_id: string | null
                    original_image_url: string | null
                    generated_image_url: string | null
                    model_type: string | null
                    background: string | null
                    aspect_ratio: string | null
                    status: 'pending' | 'processing' | 'completed' | 'failed'
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    campaign_id?: string | null
                    ai_model_id?: string | null
                    original_image_url?: string | null
                    generated_image_url?: string | null
                    model_type?: string | null
                    background?: string | null
                    aspect_ratio?: string | null
                    status?: 'pending' | 'processing' | 'completed' | 'failed'
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    campaign_id?: string | null
                    ai_model_id?: string | null
                    original_image_url?: string | null
                    generated_image_url?: string | null
                    model_type?: string | null
                    background?: string | null
                    aspect_ratio?: string | null
                    status?: 'pending' | 'processing' | 'completed' | 'failed'
                    created_at?: string
                }
                Relationships: []
            }
            ai_models: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    type: string
                    thumbnail_url: string | null
                    model_data: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    type: string
                    thumbnail_url?: string | null
                    model_data?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    type?: string
                    thumbnail_url?: string | null
                    model_data?: Json | null
                    created_at?: string
                }
                Relationships: []
            }
            products: {
                Row: {
                    id: string
                    user_id: string
                    campaign_id: string
                    name: string
                    description: string | null
                    image_url: string
                    category: string | null
                    product_type: 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'accessory'
                    tags: string[] | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    campaign_id: string
                    name: string
                    description?: string | null
                    image_url: string
                    category?: string | null
                    product_type?: 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'accessory'
                    tags?: string[] | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    campaign_id?: string
                    name?: string
                    description?: string | null
                    image_url?: string
                    category?: string | null
                    product_type?: 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'accessory'
                    tags?: string[] | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            api_keys: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    key_hash: string
                    key_prefix: string
                    last_used_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    key_hash: string
                    key_prefix: string
                    last_used_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    key_hash?: string
                    key_prefix?: string
                    last_used_at?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            video_generations: {
                Row: {
                    id: string
                    user_id: string
                    generation_id: string | null
                    ai_model_id: string | null
                    campaign_id: string | null
                    source_image_url: string
                    video_url: string | null
                    prompt: string | null
                    template: string | null
                    duration: number
                    status: 'pending' | 'processing' | 'completed' | 'failed'
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    generation_id?: string | null
                    ai_model_id?: string | null
                    campaign_id?: string | null
                    source_image_url: string
                    video_url?: string | null
                    prompt?: string | null
                    template?: string | null
                    duration?: number
                    status?: 'pending' | 'processing' | 'completed' | 'failed'
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    generation_id?: string | null
                    ai_model_id?: string | null
                    campaign_id?: string | null
                    source_image_url?: string
                    video_url?: string | null
                    prompt?: string | null
                    template?: string | null
                    duration?: number
                    status?: 'pending' | 'processing' | 'completed' | 'failed'
                    created_at?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
