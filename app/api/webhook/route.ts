import { Stripe } from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

// ⚠️↓ ここが「../」3回になっているか確認！
import { supabase } from '../../../lib/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as any, // ⬅️ ここに `as any` を追加！
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const reqText = await req.text();
    const signature = req.headers.get('stripe-signature') as string;
    const event = stripe.webhooks.constructEvent(
      reqText,
      signature,
      webhookSecret
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const stripeSessionId = session.id;

      // --- ⬇️ デバッグ開始 ⬇️ ---
      console.log('--- Webhook デバッグ ---');
      console.log('受け取ったUserID:', userId);
      console.log('StripeセッションID:', stripeSessionId);

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id;

      console.log('Stripeが「売れた」と言っているPrice ID:', priceId);
      // --- ⬆️ デバッグここまで ⬆️ ---

      if (!userId || !priceId || !stripeSessionId) {
        throw new Error('必要なセッション情報が見つかりません。');
      }

      // --- ⬇️ ここのエラーを詳しく見る ⬇️ ---
      console.log(`Supabaseで Price ID「${priceId}」を探しに行きます...`);

      const { data: report, error: reportError } = await supabase
        .from('reports')
        .select('report_id')
        .eq('stripe_price_id', priceId)
        .single();

      // ⭐️ もしエラー（reportError）があったら、ここで中身を全部吐き出す
      if (reportError) {
        console.error('Supabase (reports) エラー:', reportError);
        throw new Error(`レポート検索エラー: ${reportError.message}`);
      }

      // ⭐️ もしエラーは無い（reportError=null）のに、レポートが見つからなかった（!report）場合
      if (!report) {
        console.error('レポートが見つかりません。Price IDがDBに登録されているか確認してください。');
        throw new Error('購入されたレポートがDBで見つかりません。');
      }
      // --- ⬆️ エラーチェックここまで ⬆️ ---

      const reportId = report.report_id;
      console.log(`見つけたレポートID: ${reportId}`);

      // 「purchases」テーブルに購入履歴を記録
      const { error: insertError } = await supabase
        .from('purchases')
        .insert({
          user_id: userId,
          report_id: reportId,
          stripe_session_id: stripeSessionId,
        });

      if (insertError) {
        if (insertError.code !== '23505') {
          console.error('Supabase (purchases) エラー:', insertError);
          throw new Error('購入履歴の保存に失敗: ' + insertError.message);
        } else {
          console.log('購入履歴は既に存在していました。（2重登録をスキップ）');
        }
      } else {
        console.log('🎉 購入履歴の保存に成功しました！');
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhookの最終エラー:', error.message);
    return new NextResponse(error.message, { status: 400 });
  }
}
