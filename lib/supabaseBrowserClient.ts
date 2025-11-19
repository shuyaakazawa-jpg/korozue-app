import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // 道具箱を 'nextjs' に戻します

// ブラウザ（クライアントコンポーネント）専用のSupabaseクライアントを作成
// 道具の名前も 'createClientComponentClient' に変えます
export const supabaseBrowserClient = createClientComponentClient();
// この関数は賢いので、.env.localの合言葉を自動で読み込みます
