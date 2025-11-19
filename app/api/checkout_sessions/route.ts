console.log('--- APIキーのデバッグ ---');
console.log('読み込んだキー:', process.env.STRIPE_SECRET_KEY);

import { Stripe } from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

// 1. Stripe（サーバー側）の道具を、シークレットキーで初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10', // Stripeのバージョン
});

// 2. 「購入ボタン」が押された時に、ここが呼び出される
export async function POST(req: NextRequest) {
  try {
    // 3. ブラウザから送られてきた「商品ID(priceId)」と「ユーザーID(userId)」を受け取る
    const { priceId, userId } = await req.json();

    if (!priceId || !userId) {
      return new NextResponse('Price IDとUser IDは必須です', { status: 400 });
    }

    // 4. Stripeに「決済ページ（セッション）」を作って！とお願いする
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // 支払い方法はカード
      mode: 'payment', // 1回きりの支払い
      line_items: [
        {
          price: priceId, // どの商品を
          quantity: 1,    // 何個買うか
        },
      ],
      // 5. 誰が買ったか分かるように「ユーザーID」をこっそり忍ばせる
      client_reference_id: userId,

      // 6. 支払いが成功したら、このURLに戻ってくる
      success_url: `${req.nextUrl.origin}/`,
      // 7. 支払いをキャンセルしたら、このURLに戻ってくる
      cancel_url: `${req.nextUrl.origin}/`,
    });

    // 8. 決済ページの「ID」をブラウザに返す
    if (!session.url) {
      // もしURLがなかったら
      return new NextResponse('StripeセッションURLの作成に失敗しました', { status: 500 });
    }
    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('Stripeセッションの作成に失敗:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}
