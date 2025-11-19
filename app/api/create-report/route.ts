export const dynamic = 'force-dynamic';

import { Stripe } from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});
const productId = process.env.STRIPE_PRODUCT_ID!;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.json();
    // 1. ⬇️ フォームから category_id も受け取る
    const { title, free_summary, paid_content, price, userId, category_id } = formData;

    if (!userId) {
      return new NextResponse('認証されていません (User IDがありません)', { status: 401 });
    }
    // 2. ⬇️ category_id があるかもチェック
    if (!category_id) {
      return new NextResponse('カテゴリが選択されていません', { status: 400 });
    }

    // 3. 【Stripe】Price IDを自動作成
    const priceInJpy = parseInt(price, 10);
    const newPrice = await stripe.prices.create({
      currency: 'jpy',
      unit_amount: priceInJpy,
      product: productId,
    });
    const stripePriceId = newPrice.id;

    // 4. 【Supabase】DBにレポートを保存
    const { data, error: insertError } = await supabase
      .from('reports')
      .insert({
        title: title,
        free_summary: free_summary,
        paid_content: paid_content,
        price: priceInJpy,
        user_id: userId,
        stripe_price_id: stripePriceId,
        category_id: category_id // ⬅️ ⭐️ カテゴリIDも保存！
      })
      .select();

    if (insertError) {
      console.error('Supabase挿入エラー:', insertError);
      throw new Error('DBへの保存に失敗: ' + insertError.message);
    }

    return NextResponse.json({ success: true, report: data });

  } catch (error: any) {
    console.error('レポート作成APIエラー:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}
