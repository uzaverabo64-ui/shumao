(function () {
  const config = window.SUPABASE_CONFIG || {};
  const restUrl = String(config.restUrl || "").replace(/\/+$/, "");
  const apiKey = config.apiKey || "";
  const functionsUrl = config.functionsUrl || restUrl.replace(/\/rest\/v1$/, "/functions/v1/orders");

  function isConfigured() {
    return Boolean(functionsUrl && apiKey);
  }

  function fromRow(row) {
    if (!row) {
      return null;
    }

    return {
      orderNo: row.order_no,
      productId: row.product_id,
      productName: row.product_name,
      category: row.category,
      quantity: row.quantity,
      amount: Number(row.amount || 0),
      baseAmount: Number(row.base_amount || row.amount || 0),
      amountText: row.amount_text,
      email: row.email,
      network: row.network,
      walletAddress: row.wallet_address,
      status: row.status,
      delivery: row.delivery,
      txHash: row.tx_hash,
      paymentVerifiedAt: row.payment_verified_at,
      createdAt: row.created_at,
      paidAt: row.paid_at
    };
  }

  async function request(action, payload = {}) {
    if (!isConfigured()) {
      throw new Error("Supabase function is not configured.");
    }

    const response = await fetch(functionsUrl, {
      method: "POST",
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ action, ...payload })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Supabase function failed: ${response.status}`);
    }

    return data;
  }

  async function saveOrder(order) {
    const data = await request("createOrder", { order });
    return fromRow(data.order) || order;
  }

  async function verifyPayment(orderNo) {
    const data = await request("verifyPayment", { orderNo });
    return {
      order: fromRow(data.order),
      paidAmount: Number(data.paidAmount || 0),
      matched: Boolean(data.matched)
    };
  }

  async function searchOrders(value) {
    const data = await request("searchOrders", { value });
    return (data.orders || []).map(fromRow).filter(Boolean);
  }

  async function findOrder(orderNo) {
    const data = await request("findOrder", { orderNo });
    return fromRow(data.order);
  }

  window.SupabaseOrders = {
    isConfigured,
    saveOrder,
    verifyPayment,
    searchOrders,
    findOrder
  };
})();
