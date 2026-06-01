const tabButtons = document.querySelectorAll(".category-tabs button");
const productRows = document.getElementById("productRows");
const productsForHome = window.PRODUCT_CATALOG || [];

function renderProductRows(filter = "all") {
  if (!productRows) {
    return;
  }

  const rows = productsForHome
    .filter((product) => filter === "all" || product.category === filter)
    .map((product) => {
      return `
        <tr data-category="${product.category}">
          <td><span class="row-icon" aria-hidden="true"></span>${product.title}</td>
          <td>${product.stock} 个</td>
          <td>${window.formatUsdt(product.price)}</td>
          <td><a class="table-buy" href="product/?id=${encodeURIComponent(product.id)}" target="_blank" rel="noopener">立即购买</a></td>
        </tr>
      `;
    })
    .join("");

  productRows.innerHTML = rows;
}

function renderProductSchema() {
  const oldSchema = document.getElementById("productItemListSchema");
  if (oldSchema) {
    oldSchema.remove();
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: productsForHome.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.name,
        description: product.desc,
        category: product.categoryName,
        offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency: "USD",
          availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
        }
      }
    }))
  };

  const script = document.createElement("script");
  script.id = "productItemListSchema";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

renderProductRows();
renderProductSchema();

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    tabButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", active ? "true" : "false");
    });

    renderProductRows(filter);
  });
});
