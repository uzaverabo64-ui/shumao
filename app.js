const walletAddress = "TZA2Gv2CoWFRRNjcoPwEkjvxwd7WyiRyBW";
const params = new URLSearchParams(window.location.search);
const productId = params.get("id") || "domestic-month-pack";
const product = window.products[productId] || window.products["domestic-month-pack"];

const nameEl = document.getElementById("productName");
const breadcrumbNameEl = document.getElementById("breadcrumbName");
const categoryEl = document.getElementById("productCategory");
const descEl = document.getElementById("productDesc");
const priceEl = document.getElementById("productPrice");
const stockEl = document.getElementById("productStock");
const longDescEl = document.getElementById("productLongDesc");
const specTypeEl = document.getElementById("specType");
const specAgeEl = document.getElementById("specAge");
const specRealnameEl = document.getElementById("specRealname");
const specPayEl = document.getElementById("specPay");
const qtyEl = document.getElementById("quantity");
const emailEl = document.getElementById("email");
const totalEl = document.getElementById("orderTotal");
const form = document.getElementById("orderForm");
const modal = document.getElementById("paymentModal");
const closeModal = document.getElementById("closeModal");
const countdownEl = document.getElementById("countdown");
const orderNoEl = document.getElementById("orderNo");
const payAmountEl = document.getElementById("payAmount");
const payEmailEl = document.getElementById("payEmail");
const payNetworkEl = document.getElementById("payNetwork");
const walletAddressEl = document.getElementById("walletAddress");
const copyAddress = document.getElementById("copyAddress");
const modalQueryLink = document.getElementById("modalQueryLink");
const confirmPaid = document.getElementById("confirmPaid");
const paymentDelivery = document.getElementById("paymentDelivery");
const paymentDeliveryText = document.getElementById("paymentDeliveryText");
const copyPaymentDelivery = document.getElementById("copyPaymentDelivery");
const verifyMessage = document.getElementById("verifyMessage");
const relatedProductsEl = document.getElementById("relatedProducts");

let countdownTimer = null;
let paymentPollTimer = null;
let currentOrder = null;

function getQuantity() {
  const quantity = Number.parseInt(qtyEl.value, 10);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function setVerifyMessage(text, type = "") {
  if (!verifyMessage) {
    return;
  }

  verifyMessage.textContent = text;
  verifyMessage.dataset.type = type;
}

function formatPayAmount(value) {
  return `${Number(value).toFixed(6)} USDT`;
}

function createOrderPayload() {
  const network = document.querySelector("input[name='payMethod']:checked").value;

  return {
    productId,
    quantity: getQuantity(),
    email: emailEl.value.trim().toLowerCase(),
    network
  };
}

async function saveOrder(orderPayload) {
  if (!window.SupabaseOrders || !window.SupabaseOrders.isConfigured()) {
    throw new Error("Supabase 订单服务未配置，暂时不能下单。");
  }

  return window.SupabaseOrders.saveOrder(orderPayload);
}

async function completePaidOrder(order, paidAmount) {
  currentOrder = order;
  window.clearInterval(paymentPollTimer);
  window.clearInterval(countdownTimer);

  countdownEl.textContent = "支付成功";
  paymentDeliveryText.textContent = currentOrder.delivery || "订单已完成，但暂无发货资料，请联系客服处理。";
  paymentDelivery.hidden = false;
  confirmPaid.disabled = true;
  confirmPaid.textContent = "订单已完成";
  setVerifyMessage(`已自动检测到账 ${Number(paidAmount).toFixed(6)} USDT，账号资料已从 Supabase 发放。`, "success");

  if (modalQueryLink) {
    modalQueryLink.href = `success/?sn=${encodeURIComponent(currentOrder.orderNo)}`;
    modalQueryLink.textContent = "查看账号";
  }
}

async function checkPaymentOnce({ silent = false } = {}) {
  if (!currentOrder || currentOrder.status === "已完成") {
    return;
  }

  if (!silent) {
    confirmPaid.disabled = true;
    confirmPaid.textContent = "正在检测到账...";
    setVerifyMessage("正在查询 TRON USDT-TRC20 入账。");
  }

  try {
    if (!window.SupabaseOrders || !window.SupabaseOrders.isConfigured()) {
      throw new Error("支付检测服务未配置。");
    }

    const result = await window.SupabaseOrders.verifyPayment(currentOrder.orderNo);
    if (result.matched && result.order) {
      await completePaidOrder(result.order, result.paidAmount);
      return;
    }

    if (!silent) {
      setVerifyMessage("暂未检测到匹配入账。请确认已按精确金额转账，系统会继续自动检测。", "error");
    }
  } catch (error) {
    if (!silent) {
      setVerifyMessage(error.message || "到账检测失败，请稍后重试。", "error");
    }
  } finally {
    if (currentOrder && currentOrder.status !== "已完成") {
      confirmPaid.disabled = false;
      confirmPaid.textContent = "我已支付";
    }
  }
}

function startPaymentPolling() {
  window.clearInterval(paymentPollTimer);
  paymentPollTimer = window.setInterval(() => {
    checkPaymentOnce({ silent: true });
  }, 15000);
  checkPaymentOnce({ silent: true });
}

function updateTotal() {
  qtyEl.value = getQuantity();
  totalEl.textContent = window.formatUsdt(product.price * getQuantity());
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderRelatedProducts() {
  if (!relatedProductsEl) {
    return;
  }

  const related = (window.PRODUCT_CATALOG || [])
    .filter((item) => item.id !== productId && item.category === product.category)
    .slice(0, 4);
  const fallback = (window.PRODUCT_CATALOG || [])
    .filter((item) => item.id !== productId && !related.some((current) => current.id === item.id))
    .slice(0, Math.max(0, 4 - related.length));

  relatedProductsEl.innerHTML = [...related, ...fallback]
    .map((item) => {
      const href = `product/?id=${encodeURIComponent(item.id)}`;
      return `
        <article class="related-card">
          <div>
            <p>${escapeHtml(item.categoryName)}</p>
            <h3>${escapeHtml(item.name)}</h3>
            <span>${escapeHtml(item.title)}</span>
          </div>
          <div class="related-card-foot">
            <strong>${window.formatUsdt(item.price)}</strong>
            <a href="${href}">立即购买</a>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderProduct() {
  document.title = `${product.name} | 微信号购买 - 微信小号在线自助购买平台`;
  const metaDescription = document.querySelector("meta[name='description']");
  if (metaDescription) {
    metaDescription.setAttribute("content", `${product.name}商品详情，价格 ${window.formatUsdt(product.price)}，库存 ${product.stock} 个。${product.desc} 支持在线下单、USDT-TRC20 自动检测到账、支付成功后资料交付和邮箱查询订单。`);
  }

  const metaKeywords = document.querySelector("meta[name='keywords']");
  if (metaKeywords) {
    metaKeywords.setAttribute("content", `${product.name},微信号购买,微信号出售,实名微信号,微信号批发,微信号自助购买,微信小号购买,海外微信号,原机微信号`);
  }

  const ogTitle = document.querySelector("meta[property='og:title']");
  if (ogTitle) {
    ogTitle.setAttribute("content", `${product.name} - 微信号自助购买`);
  }

  const ogDescription = document.querySelector("meta[property='og:description']");
  if (ogDescription) {
    ogDescription.setAttribute("content", `${product.name}，价格 ${window.formatUsdt(product.price)}，支持 USDT-TRC20 自动检测到账和支付成功后资料交付。`);
  }

  nameEl.textContent = product.name;
  breadcrumbNameEl.textContent = product.name;
  categoryEl.textContent = product.categoryName;
  descEl.textContent = product.desc;
  priceEl.textContent = window.formatUsdt(product.price);
  if (stockEl) {
    stockEl.textContent = product.stock;
  }
  longDescEl.textContent = product.longDesc;
  const specs = product.specs || ["虚拟资料", "满月", "已实名", "支持支付"];
  specTypeEl.textContent = specs[0];
  specAgeEl.textContent = specs[1];
  specRealnameEl.textContent = specs[2];
  specPayEl.textContent = specs[3];
  walletAddressEl.textContent = walletAddress;
  updateTotal();
  renderRelatedProducts();
  renderProductSchema();
}

function renderProductSchema() {
  const oldSchema = document.getElementById("productSchema");
  if (oldSchema) {
    oldSchema.remove();
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.longDesc,
    category: product.categoryName,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };

  const script = document.createElement("script");
  script.id = "productSchema";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

function renderCountdown(secondsLeft) {
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  countdownEl.textContent = `${minutes}:${seconds}`;
}

function startCountdown() {
  window.clearInterval(countdownTimer);
  let secondsLeft = 15 * 60;
  renderCountdown(secondsLeft);

  countdownTimer = window.setInterval(() => {
    secondsLeft -= 1;
    renderCountdown(Math.max(secondsLeft, 0));

    if (secondsLeft <= 0) {
      window.clearInterval(countdownTimer);
      countdownEl.textContent = "已超时";
    }
  }, 1000);
}

function openPayment(order) {
  currentOrder = order;
  orderNoEl.textContent = order.orderNo;
  payAmountEl.textContent = order.amountText;
  payEmailEl.textContent = order.email;
  payNetworkEl.textContent = order.network;
  if (modalQueryLink) {
    modalQueryLink.href = `order-detail/?sn=${encodeURIComponent(order.orderNo)}`;
    modalQueryLink.textContent = "查看订单";
  }
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  if (paymentDelivery) {
    paymentDelivery.hidden = true;
  }
  setVerifyMessage("请按精确金额转账，系统每 15 秒自动检测到账。");
  if (confirmPaid) {
    confirmPaid.disabled = false;
    confirmPaid.textContent = "我已支付";
  }
  startCountdown();
  startPaymentPolling();
}

function hidePayment() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  window.clearInterval(countdownTimer);
  window.clearInterval(paymentPollTimer);
}

renderProduct();

qtyEl.addEventListener("input", updateTotal);
qtyEl.addEventListener("blur", updateTotal);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  updateTotal();

  if (!form.reportValidity()) {
    return;
  }

  const submitButton = form.querySelector("button[type='submit']");
  const oldText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "正在创建订单...";

  try {
    const order = await saveOrder(createOrderPayload());
    openPayment(order);
  } catch (error) {
    window.alert(error.message || "订单创建失败，请稍后重试。");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = oldText;
  }
});

closeModal.addEventListener("click", hidePayment);

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    hidePayment();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("is-open")) {
    hidePayment();
  }
});

copyAddress.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(walletAddress);
    copyAddress.textContent = "已复制";
    window.setTimeout(() => {
      copyAddress.textContent = "复制地址";
    }, 1600);
  } catch {
    copyAddress.textContent = "复制失败";
  }
});

if (confirmPaid) {
  confirmPaid.addEventListener("click", async () => {
    if (!currentOrder) {
      return;
    }

    await checkPaymentOnce();
  });
}

if (copyPaymentDelivery) {
  copyPaymentDelivery.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(paymentDeliveryText.textContent);
      copyPaymentDelivery.textContent = "已复制";
      window.setTimeout(() => {
        copyPaymentDelivery.textContent = "复制资料";
      }, 1600);
    } catch {
      copyPaymentDelivery.textContent = "复制失败";
    }
  });
}
