const form = document.getElementById("queryForm");
const queryValue = document.getElementById("queryValue");
const showAll = document.getElementById("showAll");
const orderList = document.getElementById("orderList");
const resultTitle = document.getElementById("resultTitle");
const resultCount = document.getElementById("resultCount");

async function searchRemoteOrders(value) {
  if (!window.SupabaseOrders) {
    throw new Error("Supabase 查询服务未配置。");
  }

  return window.SupabaseOrders.searchOrders(value);
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderEmpty(title, text) {
  orderList.innerHTML = `
    <article class="empty-state">
      <span class="empty-icon">?</span>
      <h3>${title}</h3>
      <p>${text}</p>
    </article>
  `;
}

function renderOrders(orders, title) {
  resultTitle.textContent = title;
  resultCount.textContent = `${orders.length} 条`;

  if (!orders.length) {
    renderEmpty("未找到订单", "请检查邮箱或订单号是否填写正确，或先完成一次下单。");
    return;
  }

  orderList.innerHTML = orders
    .map((order) => {
      const status = escapeHtml(order.status || "等待支付");
      const productName = escapeHtml(order.productName);
      const amountText = escapeHtml(order.amountText);
      const orderNo = escapeHtml(order.orderNo);
      const email = escapeHtml(order.email);
      const quantity = escapeHtml(order.quantity);
      const network = escapeHtml(order.network);
      const createdAt = escapeHtml(formatTime(order.createdAt));
      const walletAddress = escapeHtml(order.walletAddress);
      const detailHref = `order-detail/?sn=${encodeURIComponent(order.orderNo)}`;

      return `
        <article class="order-card">
          <div class="order-card-head">
            <div>
              <p class="section-kicker">${status}</p>
              <h3>${productName}</h3>
            </div>
            <strong>${amountText}</strong>
          </div>
          <dl class="order-meta">
            <div>
              <dt>订单编号</dt>
              <dd>${orderNo}</dd>
            </div>
            <div>
              <dt>接收邮箱</dt>
              <dd>${email}</dd>
            </div>
            <div>
              <dt>购买数量</dt>
              <dd>${quantity}</dd>
            </div>
            <div>
              <dt>支付网络</dt>
              <dd>${network}</dd>
            </div>
            <div>
              <dt>创建时间</dt>
              <dd>${createdAt}</dd>
            </div>
            <div>
              <dt>收款地址</dt>
              <dd>${walletAddress}</dd>
            </div>
          </dl>
          <div class="order-card-actions">
            <a class="query-link" href="${detailHref}" target="_blank" rel="noopener">查看详情</a>
          </div>
        </article>
      `;
    })
    .join("");
}

async function searchOrders(value) {
  const keyword = value.trim().toLowerCase();

  if (!keyword) {
    renderOrders([], "请输入查询条件");
    return;
  }

  try {
    renderOrders(await searchRemoteOrders(keyword), "匹配订单");
  } catch (error) {
    renderEmpty("查询服务异常", error.message || "暂时无法连接 Supabase，请稍后再试。");
    resultTitle.textContent = "查询失败";
    resultCount.textContent = "0 条";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await searchOrders(queryValue.value);
});

showAll.addEventListener("click", () => {
  renderEmpty("请输入邮箱或订单号", "为了保护订单资料，正式环境不公开展示全部订单。");
  resultTitle.textContent = "需要查询条件";
  resultCount.textContent = "0 条";
});

const params = new URLSearchParams(window.location.search);
const email = params.get("email");

if (email) {
  queryValue.value = email;
  searchOrders(email);
}
