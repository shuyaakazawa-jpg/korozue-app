import { createClient } from '@supabase/supabase-js'

// さっき.env.localに書いた「秘密の合言葉」を読み込みます
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// これがSupabaseと会話するための「道具」です。
// これを「supabase」という名前でエクスポート（公開）します。
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
