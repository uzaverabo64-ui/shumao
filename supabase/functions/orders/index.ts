import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const walletAddress = "TZA2Gv2CoWFRRNjcoPwEkjvxwd7WyiRyBW";
const usdtTrc20Contract = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const paymentTolerance = 0.000001;

const products: Record<string, { name: string; category: string; price: number }> = {
  "domestic-month-pack": { name: "5 个满月实名微信号套餐", category: "国内微信号", price: 16.88 },
  "domestic-three-month": { name: "三月实名绑卡微信号", category: "国内微信号", price: 11.23 },
  "domestic-half-year": { name: "半年实名微信老号", category: "国内微信号", price: 13.21 },
  "domestic-one-year": { name: "一年实名微信老号", category: "国内微信号", price: 22.3 },
  "domestic-two-year": { name: "两年实名稳定微信老号", category: "国内微信号", price: 27.66 },
  "domestic-five-year": { name: "五年实名微信老号", category: "国内微信号", price: 98.99 },
  "hk-month": { name: "香港满月实名微信号", category: "海外微信号", price: 13.26 },
  "hk-one-year": { name: "香港一年实名微信号", category: "海外微信号", price: 30.88 },
  "hk-two-year": { name: "香港两年微信老号", category: "海外微信号", price: 35.98 },
  "vn-month": { name: "越南满月实名微信号", category: "海外微信号", price: 13.26 },
  "vn-one-year": { name: "越南一年实名微信号", category: "海外微信号", price: 30.88 },
  "vn-two-year": { name: "越南两年微信老号", category: "海外微信号", price: 35.98 },
  "mm-month": { name: "缅甸满月实名微信号", category: "海外微信号", price: 13.26 },
  "mm-one-year": { name: "缅甸一年实名微信号", category: "海外微信号", price: 30.88 },
  "mm-two-year": { name: "缅甸两年微信老号", category: "海外微信号", price: 35.98 },
  "th-month": { name: "泰国满月实名微信号", category: "海外微信号", price: 13.26 },
  "th-one-year": { name: "泰国一年实名微信号", category: "海外微信号", price: 30.88 },
  "th-two-year": { name: "泰国两年微信老号", category: "海外微信号", price: 35.98 },
  "my-month": { name: "马来西亚满月实名微信号", category: "海外微信号", price: 13.26 },
  "my-one-year": { name: "马来西亚一年实名微信号", category: "海外微信号", price: 30.88 },
  "my-two-year": { name: "马来西亚两年微信老号", category: "海外微信号", price: 35.98 },
  "sg-month": { name: "新加坡满月实名微信号", category: "海外微信号", price: 13.26 },
  "sg-one-year": { name: "新加坡一年实名微信号", category: "海外微信号", price: 30.88 },
  "sg-two-year": { name: "新加坡两年微信老号", category: "海外微信号", price: 35.98 },
  "jp-month": { name: "日本满月实名微信号", category: "海外微信号", price: 13.26 },
  "jp-one-year": { name: "日本一年实名微信号", category: "海外微信号", price: 30.88 },
  "jp-two-year": { name: "日本两年微信老号", category: "海外微信号", price: 35.98 },
  "kr-month": { name: "韩国满月实名微信号", category: "海外微信号", price: 13.26 },
  "kr-one-year": { name: "韩国一年实名微信号", category: "海外微信号", price: 30.88 },
  "kr-two-year": { name: "韩国两年微信老号", category: "海外微信号", price: 35.98 },
  "us-month": { name: "美国满月实名微信号", category: "海外微信号", price: 13.26 },
  "us-one-year": { name: "美国一年实名微信号", category: "海外微信号", price: 30.88 },
  "us-two-year": { name: "美国两年实名微信号", category: "海外微信号", price: 35.98 },
  "ca-month": { name: "加拿大满月实名微信号", category: "海外微信号", price: 13.26 },
  "ca-one-year": { name: "加拿大一年实名微信号", category: "海外微信号", price: 30.88 },
  "ca-two-year": { name: "加拿大两年微信老号", category: "海外微信号", price: 35.98 },
  "ph-month": { name: "菲律宾满月实名微信号", category: "海外微信号", price: 13.26 },
  "ph-one-year": { name: "菲律宾一年实名微信号", category: "海外微信号", price: 30.88 },
  "ph-two-year": { name: "菲律宾两年微信老号", category: "海外微信号", price: 35.98 },
  "kh-month": { name: "柬埔寨满月实名微信号", category: "海外微信号", price: 13.26 },
  "android-device-short": { name: "安卓原机 1-5 个月实名微信号", category: "原机微信号", price: 108 },
  "iphone-device-short": { name: "苹果原机 1-5 个月实名微信号", category: "原机微信号", price: 118 },
  "android-device-middle": { name: "安卓原机 6-11 个月实名微信号", category: "原机微信号", price: 128 },
  "iphone-device-middle": { name: "苹果原机 6-11 个月实名微信号", category: "原机微信号", price: 148 },
  "device-old": { name: "原机 1-5 年实名微信老号", category: "原机微信号", price: 178 },
  "device-lqt-card": { name: "原机实名绑卡带零钱通微信号", category: "原机微信号", price: 178 },
  "device-dual-account": { name: "原机一机两号微信小号", category: "原机微信号", price: 139 }
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

function createUniquePayAmount(baseAmount: number) {
  const suffix = (Date.now() % 999 + 1) / 1000000;
  return Number((baseAmount + suffix).toFixed(6));
}

function formatPayAmount(value: number) {
  return `${Number(value).toFixed(6)} USDT`;
}

async function findMatchingTronPayment(order: any) {
  const params = new URLSearchParams({
    limit: "50",
    only_confirmed: "true",
    contract_address: usdtTrc20Contract
  });
  const endpoint = `https://api.trongrid.io/v1/accounts/${encodeURIComponent(walletAddress)}/transactions/trc20?${params}`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`TRON query failed: ${response.status}`);
  }

  const result = await response.json();
  const orderCreatedAt = new Date(order.created_at).getTime();

  return (result.data || []).find((transfer: any) => {
    const tokenAddress = transfer.token_info && transfer.token_info.address;
    const decimals = Number((transfer.token_info && transfer.token_info.decimals) || 6);
    const paidAmount = Number(transfer.value || 0) / 10 ** decimals;
    const isAmountMatch = Math.abs(paidAmount - Number(order.amount || 0)) <= paymentTolerance;
    const isRecentEnough = Number(transfer.block_timestamp || 0) >= orderCreatedAt - 10 * 60 * 1000;
    return tokenAddress === usdtTrc20Contract && String(transfer.to || "") === walletAddress && isAmountMatch && isRecentEnough;
  }) || null;
}

async function createOrder(input: any) {
  const productId = String(input.productId || "");
  const product = products[productId];
  if (!product) {
    throw new Error("Product does not exist.");
  }

  const quantity = Math.max(1, Math.min(99, Number.parseInt(String(input.quantity || "1"), 10) || 1));
  const baseAmount = Number((product.price * quantity).toFixed(6));
  const amount = createUniquePayAmount(baseAmount);
  const orderNo = String(input.orderNo || `DM${Date.now().toString().slice(-10)}`).replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const email = String(input.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Email format is invalid.");
  }

  const row = {
    order_no: orderNo,
    product_id: productId,
    product_name: product.name,
    category: product.category,
    quantity,
    amount,
    base_amount: baseAmount,
    amount_text: formatPayAmount(amount),
    email,
    network: "USDT-TRC20",
    wallet_address: walletAddress,
    status: "\u7b49\u5f85\u652f\u4ed8",
    delivery: null,
    tx_hash: null,
    payment_verified_at: null,
    created_at: new Date().toISOString(),
    paid_at: null
  };

  const { data, error } = await supabase.from("orders").upsert(row, { onConflict: "order_no" }).select("*").single();
  if (error) throw error;
  return data;
}

async function verifyPayment(orderNo: string) {
  const { data: order, error } = await supabase.from("orders").select("*").eq("order_no", String(orderNo || "").toUpperCase()).single();
  if (error || !order) {
    throw new Error("Order does not exist.");
  }

  if (order.status === "\u5df2\u5b8c\u6210") {
    return { order, matched: true, paidAmount: Number(order.amount || 0) };
  }

  const transfer = await findMatchingTronPayment(order);
  if (!transfer) {
    return { order, matched: false, paidAmount: 0 };
  }

  const decimals = Number((transfer.token_info && transfer.token_info.decimals) || 6);
  const paidAmount = Number(transfer.value || 0) / 10 ** decimals;
  const paidAt = transfer.block_timestamp ? new Date(transfer.block_timestamp).toISOString() : new Date().toISOString();
  const { data: txOwner, error: txOwnerError } = await supabase
    .from("orders")
    .select("order_no")
    .eq("tx_hash", transfer.transaction_id)
    .maybeSingle();
  if (txOwnerError) throw txOwnerError;
  if (txOwner && txOwner.order_no !== order.order_no) {
    return { order, matched: false, paidAmount: 0 };
  }

  const { data, error: completeError } = await supabase.rpc("complete_paid_order", {
    p_order_no: order.order_no,
    p_product_id: order.product_id,
    p_quantity: order.quantity,
    p_tx_hash: transfer.transaction_id,
    p_paid_at: paidAt
  });
  if (completeError) throw completeError;
  return { order: data, matched: true, paidAmount };
}

async function searchOrders(value: string) {
  const keyword = String(value || "").trim().toLowerCase();
  if (!keyword) return [];

  const query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data, error } = keyword.includes("@")
    ? await query.eq("email", keyword)
    : await query.eq("order_no", keyword.toUpperCase());
  if (error) throw error;
  return data || [];
}

async function findOrder(orderNo: string) {
  const { data, error } = await supabase.from("orders").select("*").eq("order_no", String(orderNo || "").toUpperCase()).maybeSingle();
  if (error) throw error;
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    switch (body.action) {
      case "createOrder":
        return json({ order: await createOrder(body.order || {}) });
      case "verifyPayment":
        return json(await verifyPayment(body.orderNo));
      case "searchOrders":
        return json({ orders: await searchOrders(body.value) });
      case "findOrder":
        return json({ order: await findOrder(body.orderNo) });
      default:
        return json({ error: "Unknown action." }, 400);
    }
  } catch (error) {
    return json({ error: error.message || "Request failed." }, 400);
  }
});
