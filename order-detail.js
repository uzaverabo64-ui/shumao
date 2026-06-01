const orderDetail = document.getElementById("orderDetail");
const orderNotFound = document.getElementById("orderNotFound");
const detailOrderNo = document.getElementById("detailOrderNo");
const detailStatus = document.getElementById("detailStatus");
const infoOrderNo = document.getElementById("infoOrderNo");
const infoProduct = document.getElementById("infoProduct");
const infoEmail = document.getElementById("infoEmail");
const infoQuantity = document.getElementById("infoQuantity");
const infoAmount = document.getElementById("infoAmount");
const infoCreatedAt = document.getElementById("infoCreatedAt");
const payMethod = document.getElementById("payMethod");
const payStatus = document.getElementById("payStatus");
const payTxHash = document.getElementById("payTxHash");
const payWallet = document.getElementById("payWallet");
const deliveryBox = document.getElementById("deliveryBox");
const copyWallet = document.getElementById("copyWallet");
const copyDelivery = document.getElementById("copyDelivery");

async function getRemoteOrder(orderNo) {
  if (!window.SupabaseOrders) {
    throw new Error("Supabase 查询服务未配置。");
  }

  return window.SupabaseOrders.findOrder(orderNo);
}

function formatTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getOrderNo() {
  const params = new URLSearchParams(window.location.search);
  const queryValue = params.get("sn") || params.get("orderNo") || "";
  const pathValue = window.location.pathname.split("/").filter(Boolean).pop() || "";
  const value = queryValue || (pathValue.endsWith(".html") ? "" : pathValue);
  return decodeURIComponent(value).toUpperCase();
}

function buildDelivery(order) {
  if (order.delivery) {
    return order.delivery;
  }

  return [
    "订单尚未完成支付，暂无账号资料。",
    `订单编号：${order.orderNo}`,
    `订单状态：${order.status || "等待支付"}`
  ].join("\n");
}

async function copyText(text, button, doneText) {
  try {
    await navigator.clipboard.writeText(text);
    const oldText = button.textContent;
    button.textContent = doneText;
    window.setTimeout(() => {
      button.textContent = oldText;
    }, 1600);
  } catch {
    button.textContent = "复制失败";
  }
}

function renderOrder(order) {
  document.title = `${order.orderNo} - 订单详情`;
  detailOrderNo.textContent = order.orderNo;
  detailStatus.textContent = order.status || "等待支付";
  infoOrderNo.textContent = order.orderNo;
  infoProduct.textContent = order.productName;
  infoEmail.textContent = order.email;
  infoQuantity.textContent = order.quantity;
  infoAmount.textContent = order.amountText;
  infoCreatedAt.textContent = formatTime(order.createdAt);
  payMethod.textContent = order.network;
  payStatus.textContent = order.status || "等待支付";
  payTxHash.textContent = order.txHash || "未填写";
  payWallet.textContent = order.walletAddress;
  deliveryBox.textContent = buildDelivery(order);

  copyWallet.addEventListener("click", () => {
    copyText(order.walletAddress, copyWallet, "已复制");
  });

  copyDelivery.addEventListener("click", () => {
    copyText(deliveryBox.textContent, copyDelivery, "已复制");
  });
}

function showNotFound() {
  orderDetail.hidden = true;
  orderNotFound.hidden = false;
}

async function initOrderDetail() {
  const orderNo = getOrderNo();
  if (!orderNo) {
    showNotFound();
    return;
  }

  let order = null;
  try {
    order = await getRemoteOrder(orderNo);
  } catch (error) {
    console.warn("Supabase detail lookup failed.", error);
  }

  if (order) {
    renderOrder(order);
  } else {
    showNotFound();
  }
}

initOrderDetail();
