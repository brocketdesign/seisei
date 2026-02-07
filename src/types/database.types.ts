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
                    created_at?: string
                    updated_at?: string
                }
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
            }
            generations: {
                Row: {
                    id: string
                    user_id: string
                    campaign_id: string | null
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
                    original_image_url?: string | null
                    generated_image_url?: string | null
                    model_type?: string | null
                    background?: string | null
                    aspect_ratio?: string | null
                    status?: 'pending' | 'processing' | 'completed' | 'failed'
                    created_at?: string
                }
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
