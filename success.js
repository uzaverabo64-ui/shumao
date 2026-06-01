const successShell = document.getElementById("successShell");
const successNotFound = document.getElementById("successNotFound");
const successOrderNo = document.getElementById("successOrderNo");
const successProduct = document.getElementById("successProduct");
const successEmail = document.getElementById("successEmail");
const successAmount = document.getElementById("successAmount");
const successStatus = document.getElementById("successStatus");
const successNetwork = document.getElementById("successNetwork");
const successPaidAt = document.getElementById("successPaidAt");
const successTxHash = document.getElementById("successTxHash");
const successDelivery = document.getElementById("successDelivery");
const successDetailLink = document.getElementById("successDetailLink");
const copySuccessDelivery = document.getElementById("copySuccessDelivery");

function getOrderNo() {
  const params = new URLSearchParams(window.location.search);
  return String(params.get("sn") || params.get("orderNo") || "").toUpperCase();
}

function formatTime(value) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

async function getRemoteOrder(orderNo) {
  if (!window.SupabaseOrders) {
    throw new Error("Supabase 查询服务未配置。");
  }

  return window.SupabaseOrders.findOrder(orderNo);
}

function showNotFound() {
  successShell.hidden = true;
  successNotFound.hidden = false;
}

function renderOrder(order) {
  document.title = `${order.orderNo} - 支付成功`;
  successOrderNo.textContent = order.orderNo;
  successProduct.textContent = order.productName;
  successEmail.textContent = order.email;
  successAmount.textContent = order.amountText;
  successStatus.textContent = order.status || "已完成";
  successNetwork.textContent = order.network;
  successPaidAt.textContent = formatTime(order.paidAt || order.createdAt);
  successTxHash.textContent = order.txHash || "未填写";
  successDelivery.textContent = order.delivery || "订单已创建，账号资料会在支付确认后显示。";
  successDetailLink.href = `order-detail/?sn=${encodeURIComponent(order.orderNo)}`;
  successDetailLink.target = "_blank";
  successDetailLink.rel = "noopener";
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

async function initSuccessPage() {
  const orderNo = getOrderNo();
  if (!orderNo) {
    showNotFound();
    return;
  }

  let order = null;
  try {
    order = await getRemoteOrder(orderNo);
  } catch (error) {
    console.warn("Supabase success lookup failed.", error);
  }

  if (!order) {
    showNotFound();
    return;
  }

  renderOrder(order);
}

copySuccessDelivery.addEventListener("click", () => {
  copyText(successDelivery.textContent, copySuccessDelivery, "已复制");
});

initSuccessPage();
