const STORAGE_KEYS = {
  products: "farmdirect-products-v2",
  orders: "farmdirect-orders-v2",
  users: "farmdirect-users-v2",
  session: "farmdirect-session-v2",
  basket: "farmdirect-basket-v2",
};

const starterProducts = [
  { id: "tomatoes", name: "Heirloom tomatoes", category: "Vegetables", price: 4.5, unit: "lb", farm: "Meadow & Moss Farm", farmId: "farm-meadow", tag: "Just picked", description: "Sun-warmed, sweet, and a little bit wild.", image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=800&q=85", active: true },
  { id: "strawberries", name: "Field strawberries", category: "Fruit", price: 6, unit: "pint", farm: "Sunny Acres", farmId: "farm-sunny", tag: "In season", description: "Small-batch berries with a big-summer flavor.", image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=800&q=85", active: true },
  { id: "carrots", name: "Rainbow carrots", category: "Vegetables", price: 3.75, unit: "bunch", farm: "Meadow & Moss Farm", farmId: "farm-meadow", tag: "Good roots", description: "Pulled this morning, tops and all.", image: "https://images.unsplash.com/photo-1445282768818-728615cc910a?auto=format&fit=crop&w=800&q=85", active: true },
  { id: "greens", name: "Tender salad greens", category: "Vegetables", price: 5, unit: "bag", farm: "Three Sisters Farm", farmId: "farm-sisters", tag: "Organic", description: "A crisp, peppery mix for everyday salads.", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=85", active: true },
  { id: "apples", name: "Orchard apples", category: "Fruit", price: 4, unit: "lb", farm: "Old Mill Orchard", farmId: "farm-mill", tag: "Orchard pick", description: "Crunchy, rosy apples from a family orchard.", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=85", active: true },
  { id: "blueberries", name: "Wild blueberries", category: "Fruit", price: 7, unit: "pint", farm: "Sunny Acres", farmId: "farm-sunny", tag: "Small batch", description: "Sweet little berries, picked by hand.", image: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=800&q=85", active: true },
  { id: "corn", name: "Sweet summer corn", category: "Vegetables", price: 1.5, unit: "ear", farm: "Three Sisters Farm", farmId: "farm-sisters", tag: "Harvest favorite", description: "Tender kernels, best enjoyed right away.", image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=85", active: true },
  { id: "honey", name: "Wildflower honey", category: "Pantry", price: 9, unit: "jar", farm: "Golden Hour Apiary", farmId: "farm-golden", tag: "Farm pantry", description: "A floral, golden spoonful from local blooms.", image: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=800&q=85", active: true },
];

const starterOrders = [
  { id: "FD-1048", customerId: "demo-customer", customer: "Alex Green", farmId: "farm-meadow", farm: "Meadow & Moss Farm", items: [{ name: "Heirloom tomatoes", quantity: 2, price: 4.5 }], total: 9, status: "Preparing", createdAt: "2026-10-28T10:00:00.000Z" },
  { id: "FD-1044", customerId: "demo-customer", customer: "Alex Green", farmId: "farm-sunny", farm: "Sunny Acres", items: [{ name: "Field strawberries", quantity: 1, price: 6 }], total: 6, status: "Completed", createdAt: "2026-10-24T11:00:00.000Z" },
  { id: "FD-1042", customerId: "customer-jamie", customer: "Jamie Rivera", farmId: "farm-meadow", farm: "Meadow & Moss Farm", items: [{ name: "Rainbow carrots", quantity: 2, price: 3.75 }, { name: "Heirloom tomatoes", quantity: 1, price: 4.5 }], total: 12, status: "Ready for pickup", createdAt: "2026-10-23T09:00:00.000Z" },
];

function readStorage(key, fallback) {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;
  try {
    return JSON.parse(saved);
  } catch (error) {
    console.error(`FarmDirect could not read saved data for "${key}".`, error);
    return fallback;
  }
}

let products = readStorage(STORAGE_KEYS.products, starterProducts);
let orders = readStorage(STORAGE_KEYS.orders, starterOrders);
let users = readStorage(STORAGE_KEYS.users, []);
let currentUser = readStorage(STORAGE_KEYS.session, null);
let basket = readStorage(STORAGE_KEYS.basket, []);
let activeCategory = "All";
let currentProductId = null;
let authMode = "register";
let pendingRole = "customer";
let activeAdminTab = "orders";
let toastTimer;

const screens = [...document.querySelectorAll("[data-screen]")];
const topNav = document.querySelector("#top-nav");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`FarmDirect could not save data for "${key}".`, error);
    showToast("Your browser couldn’t save this change. Check its local storage settings.");
  }
}

function money(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function safeImage(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return ["http:", "https:", "file:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
}

function setScreen(screenName) {
  screens.forEach((screen) => {
    screen.hidden = screen.dataset.screen !== screenName;
  });
  document.querySelector("#top-nav").hidden = !currentUser || screenName === "auth" || screenName === "welcome";
  document.querySelectorAll("#top-nav [data-nav]").forEach((item) => {
    item.hidden = !currentUser || item.dataset.nav !== currentUser.role;
  });
  document.querySelector("#header-basket").hidden = !currentUser || currentUser.role !== "customer";
  document.querySelector("#signed-in").hidden = !currentUser;
  document.querySelector("#signed-in").textContent = currentUser
    ? `Hi, ${currentUser.role === "farmer" ? currentUser.farm : currentUser.name}`
    : "";
  const accountAction = document.querySelector("#account-action");
  accountAction.textContent = currentUser ? "Sign out" : "Sign in";
  accountAction.dataset.go = currentUser ? "signout" : "auth";
  document.querySelector("#basket-count").textContent = String(
    basket.reduce((total, item) => total + item.quantity, 0),
  );
  document.querySelector("#current-year").textContent = String(new Date().getFullYear());
  document.body.dataset.role = currentUser?.role ?? "guest";
  if (currentUser && ["farmer-dashboard", "add-product", "manage-products", "manage-orders"].includes(screenName)) {
    renderFarmerWorkspace();
  }
  if (currentUser && screenName === "admin-dashboard") renderAdminDashboard();
  if (screenName === "explore") renderProducts();
  if (screenName === "details") renderProductDetails();
  if (screenName === "cart") renderCart();
  if (screenName === "orders") renderCustomerOrders();
  if (!window.location.hash || window.location.hash === `#${screenName}`) {
    window.scrollTo({ top: 0, behavior: "instant" });
  } else {
    window.location.hash = screenName;
  }
}

function navigate(screenName) {
  if (screenName === "signout") {
    currentUser = null;
    persist(STORAGE_KEYS.session, null);
    setScreen("welcome");
    showToast("You’ve signed out. See you again soon.");
    return;
  }
  if (["explore", "cart", "orders"].includes(screenName) && currentUser?.role !== "customer") {
    if (!currentUser) {
      pendingRole = "customer";
      setScreen("auth");
    } else {
      showToast("Sign in with a customer account to open that page.");
    }
    return;
  }
  if (["farmer-dashboard", "add-product", "manage-products", "manage-orders"].includes(screenName) && currentUser?.role !== "farmer") {
    if (!currentUser) {
      pendingRole = "farmer";
      setScreen("auth");
    } else {
      showToast("Sign in with a farmer account to open that page.");
    }
    return;
  }
  if (screenName === "admin-dashboard" && currentUser?.role !== "admin") {
    if (!currentUser) {
      pendingRole = "admin";
      setScreen("auth");
    } else {
      showToast("The admin dashboard is available to admin demo accounts.");
    }
    return;
  }
  if (!screens.some((screen) => screen.dataset.screen === screenName)) return;
  setScreen(screenName);
}

function slugify(value) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === "register";
  document.querySelector("#register-tab").classList.toggle("is-active", isRegister);
  document.querySelector("#login-tab").classList.toggle("is-active", !isRegister);
  document.querySelector("#register-tab").setAttribute("aria-selected", String(isRegister));
  document.querySelector("#login-tab").setAttribute("aria-selected", String(!isRegister));
  document.querySelector("#auth-title").textContent = isRegister ? "Create your account" : "Welcome back";
  document.querySelector("#name-label").hidden = !isRegister;
  document.querySelector("#auth-name").hidden = !isRegister;
  document.querySelector("#auth-name").required = isRegister;
  document.querySelector("#farm-label").hidden = !isRegister || document.querySelector("#auth-role").value !== "farmer";
  document.querySelector("#auth-farm").hidden = !isRegister || document.querySelector("#auth-role").value !== "farmer";
  document.querySelector("#auth-farm").required = isRegister && document.querySelector("#auth-role").value === "farmer";
  document.querySelector("#auth-password").autocomplete = isRegister ? "new-password" : "current-password";
  document.querySelector("#auth-submit").innerHTML = `${isRegister ? "Create account" : "Sign in"} <span>→</span>`;
  document.querySelector("#auth-error").hidden = true;
}

function setAuthRole(role) {
  const roleSelect = document.querySelector("#auth-role");
  if (["customer", "farmer", "admin"].includes(role)) roleSelect.value = role;
  pendingRole = roleSelect.value;
  setAuthMode(authMode);
}

function startSession(user) {
  currentUser = user;
  persist(STORAGE_KEYS.session, currentUser);
  if (user.role === "customer") {
    navigate("explore");
  } else if (user.role === "farmer") {
    navigate("farmer-dashboard");
  } else {
    navigate("admin-dashboard");
  }
}

function createDemoUser(role) {
  const demoUsers = {
    customer: { id: "demo-customer", role: "customer", name: "Alex Green", email: "alex@demo.farmdirect", farm: "", farmId: "" },
    farmer: { id: "demo-farmer", role: "farmer", name: "Morgan Lee", email: "morgan@demo.farmdirect", farm: "Meadow & Moss Farm", farmId: "farm-meadow" },
    admin: { id: "demo-admin", role: "admin", name: "FarmDirect Admin", email: "admin@demo.farmdirect", farm: "", farmId: "" },
  };
  startSession(demoUsers[role]);
}

function productCard(product, index) {
  const image = safeImage(product.image);
  const card = document.createElement("article");
  card.className = "product-card";
  card.style.animationDelay = `${Math.min(index, 9) * 35}ms`;
  card.innerHTML = `
    <button class="product-image-button" type="button" data-detail="${escapeHtml(product.id)}" aria-label="View ${escapeHtml(product.name)} details">
      ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)} grown by ${escapeHtml(product.farm)}" loading="lazy" />` : '<span class="product-placeholder" aria-hidden="true">✳</span>'}
      <span class="product-tag">${escapeHtml(product.tag || "Farm fresh")}</span>
    </button>
    <div class="product-card-body">
      <div class="product-title-row"><button class="product-title" type="button" data-detail="${escapeHtml(product.id)}">${escapeHtml(product.name)}</button><strong>${money(product.price)} <small>/ ${escapeHtml(product.unit)}</small></strong></div>
      <span class="product-origin"><span aria-hidden="true">⌖</span> ${escapeHtml(product.farm)}</span>
      <p>${escapeHtml(product.description)}</p>
      <button class="add-button" type="button" data-add="${escapeHtml(product.id)}">Add to basket <span>＋</span></button>
    </div>`;
  return card;
}

function renderProducts() {
  const query = document.querySelector("#product-search").value.trim().toLocaleLowerCase();
  const availableProducts = products.filter((product) => product.active !== false);
  const matches = availableProducts.filter((product) => {
    const categoryMatches = activeCategory === "All" || product.category === activeCategory;
    const searchable = `${product.name} ${product.farm} ${product.description} ${product.category}`;
    return categoryMatches && searchable.toLocaleLowerCase().includes(query);
  });
  document.querySelector("#product-grid").replaceChildren(...matches.map(productCard));
  document.querySelector("#empty-products").hidden = matches.length > 0;
  document.querySelector("#product-result-count").textContent = `${matches.length} ${matches.length === 1 ? "farm favorite" : "farm favorites"}`;
}

function addToBasket(productId, quantity = 1) {
  const product = products.find((item) => item.id === productId && item.active !== false);
  if (!product) {
    showToast("That harvest is no longer available.");
    return;
  }
  const existing = basket.find((item) => item.productId === productId);
  if (existing) existing.quantity += quantity;
  else basket.push({ productId, quantity });
  persist(STORAGE_KEYS.basket, basket);
  document.querySelector("#basket-count").textContent = String(basket.reduce((total, item) => total + item.quantity, 0));
  showToast(`${product.name} added to your basket.`);
}

function renderProductDetails() {
  const product = products.find((item) => item.id === currentProductId);
  const detail = document.querySelector("#product-detail");
  if (!product) {
    detail.innerHTML = '<div class="empty-state"><span>✳</span><h2>Product not found</h2><p>This listing may have been removed.</p><button class="button button-primary" type="button" data-go="explore">Back to products</button></div>';
    return;
  }
  const image = safeImage(product.image);
  detail.innerHTML = `
    <div class="detail-image">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)} from ${escapeHtml(product.farm)}" />` : '<span class="product-placeholder" aria-hidden="true">✳</span>'}<span class="product-tag">${escapeHtml(product.tag || "Farm fresh")}</span></div>
    <div class="detail-copy">
      <div class="eyebrow"><span class="eyebrow-dot"></span> ${escapeHtml(product.category)} · LOCAL HARVEST</div>
      <h1>${escapeHtml(product.name)}.</h1>
      <div class="detail-price">${money(product.price)} <small>/ ${escapeHtml(product.unit)}</small></div>
      <p class="detail-description">${escapeHtml(product.description)}</p>
      <div class="grower-card"><span class="grower-avatar">${escapeHtml(product.farm.slice(0, 1))}</span><span><small>GROWN BY</small><strong>${escapeHtml(product.farm)}</strong><small>Independent local farm</small></span><span class="verified-mark">✓</span></div>
      <div class="detail-meta"><span>Seasonal and locally grown</span><span>Listed direct by the farm</span><span>Pickup arranged with your grower</span></div>
      <button class="button button-primary detail-add" type="button" data-add="${escapeHtml(product.id)}">Add to basket <span>＋</span></button>
      <button class="text-button" type="button" data-go="explore">← Continue exploring</button>
    </div>`;
}

function getBasketLines() {
  return basket.map((entry) => ({
    ...entry,
    product: products.find((product) => product.id === entry.productId),
  })).filter((entry) => entry.product);
}

function renderCart() {
  const lines = getBasketLines();
  const linesContainer = document.querySelector("#cart-lines");
  const summary = document.querySelector("#order-summary");
  if (!lines.length) {
    linesContainer.innerHTML = '<div class="empty-state"><span>⌑</span><h2>Your basket is waiting.</h2><p>Find something fresh from a local farm to get started.</p><button class="button button-primary" type="button" data-go="explore">Explore products <span>→</span></button></div>';
    summary.innerHTML = "";
    return;
  }
  linesContainer.innerHTML = lines.map(({ product, quantity }) => {
    const image = safeImage(product.image);
    return `<article class="cart-line">
      ${image ? `<img src="${escapeHtml(image)}" alt="" />` : '<span class="cart-line-placeholder">✳</span>'}
      <div class="cart-line-info"><span class="product-origin">${escapeHtml(product.farm)}</span><h2>${escapeHtml(product.name)}</h2><small>${money(product.price)} / ${escapeHtml(product.unit)}</small>
        <div class="quantity-control"><button type="button" data-quantity="-1" data-id="${escapeHtml(product.id)}" aria-label="Remove one ${escapeHtml(product.name)}">−</button><span>${quantity}</span><button type="button" data-quantity="1" data-id="${escapeHtml(product.id)}" aria-label="Add one ${escapeHtml(product.name)}">＋</button></div>
      </div>
      <strong class="cart-line-total">${money(product.price * quantity)}</strong>
      <button class="remove-line" type="button" data-remove="${escapeHtml(product.id)}" aria-label="Remove ${escapeHtml(product.name)} from basket">×</button>
    </article>`;
  }).join("");
  const subtotal = lines.reduce((total, line) => total + line.product.price * line.quantity, 0);
  const farms = new Set(lines.map((line) => line.product.farmId)).size;
  summary.innerHTML = `<span class="eyebrow"><span class="eyebrow-dot"></span> YOUR ORDER</span><h2>Order summary</h2>
    <div class="summary-row"><span>${lines.reduce((total, line) => total + line.quantity, 0)} items</span><strong>${money(subtotal)}</strong></div>
    <div class="summary-row"><span>Farm partners</span><span>${farms}</span></div>
    <div class="summary-divider"></div><div class="summary-row summary-total"><strong>Subtotal</strong><strong>${money(subtotal)}</strong></div>
    <p>Pickup and delivery details are arranged directly with each farm.</p>
    <button class="button button-primary checkout-button" id="place-order" type="button">Place demo order <span>→</span></button>
    <small class="demo-note">Demo checkout only. No payment is collected.</small>`;
}

function placeOrder() {
  const lines = getBasketLines();
  if (!lines.length || !currentUser) return;
  const grouped = new Map();
  lines.forEach(({ product, quantity }) => {
    const group = grouped.get(product.farmId) ?? { farm: product.farm, items: [] };
    group.items.push({ name: product.name, quantity, price: product.price });
    grouped.set(product.farmId, group);
  });
  const newOrders = [...grouped.entries()].map(([farmId, group], index) => ({
    id: `FD-${String(Date.now()).slice(-6)}-${index + 1}`,
    customerId: currentUser.id,
    customer: currentUser.name,
    farmId,
    farm: group.farm,
    items: group.items,
    total: group.items.reduce((total, item) => total + item.quantity * item.price, 0),
    status: "New",
    createdAt: new Date().toISOString(),
  }));
  orders = [...newOrders, ...orders];
  basket = [];
  persist(STORAGE_KEYS.orders, orders);
  persist(STORAGE_KEYS.basket, basket);
  document.querySelector("#basket-count").textContent = "0";
  showToast(`${newOrders.length} farm ${newOrders.length === 1 ? "order" : "orders"} placed. Thank you for shopping direct!`);
  navigate("orders");
}

function statusClass(status) {
  return `status-pill status-${slugify(status)}`;
}

function dateLabel(dateString) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(dateString));
}

function renderCustomerOrders() {
  const customerOrders = orders.filter((order) => order.customerId === currentUser?.id);
  const history = document.querySelector("#order-history");
  if (!customerOrders.length) {
    history.innerHTML = '<div class="empty-state"><span>✳</span><h2>Your story starts with a first order.</h2><p>Explore the harvest and shop directly from a local farm.</p><button class="button button-primary" type="button" data-go="explore">Explore products <span>→</span></button></div>';
    return;
  }
  history.innerHTML = customerOrders.map((order) => `<article class="history-card">
    <div class="history-top"><div><span class="eyebrow">ORDER ${escapeHtml(order.id)}</span><small>Placed ${dateLabel(order.createdAt)}</small></div><span class="${statusClass(order.status)}">${escapeHtml(order.status)}</span></div>
    <div class="history-main"><span class="history-farm-mark">✳</span><div><h2>${escapeHtml(order.farm)}</h2><p>${order.items.map((item) => `${item.quantity} × ${escapeHtml(item.name)}`).join(", ")}</p></div><strong>${money(order.total)}</strong></div>
    <div class="history-bottom"><span>Pickup or delivery arranged with your farm</span><button class="inline-action" type="button" data-go="explore">Shop this farm →</button></div>
  </article>`).join("");
}

function farmerOrders() {
  if (currentUser?.role !== "farmer") return [];
  return orders.filter((order) => order.farmId === currentUser.farmId);
}

function farmerProducts() {
  if (currentUser?.role !== "farmer") return [];
  return products.filter((product) => product.farmId === currentUser.farmId);
}

function setFarmerLabels() {
  const name = currentUser?.farm || "Your farm";
  document.querySelectorAll(".farm-sidebar-label").forEach((label) => {
    label.textContent = name;
  });
  document.querySelectorAll(".workspace-avatar:not(.admin-avatar)").forEach((avatar) => {
    avatar.textContent = name.slice(0, 1).toUpperCase();
  });
  document.querySelector("#farmer-sidebar-name").textContent = name;
  document.querySelector("#farmer-greeting").textContent = `${currentUser?.name || "farmer"}.`;
}

function renderFarmerWorkspace() {
  setFarmerLabels();
  const myProducts = farmerProducts();
  const myOrders = farmerOrders();
  const revenue = myOrders.reduce((total, order) => total + order.total, 0);
  const pending = myOrders.filter((order) => order.status === "New" || order.status === "Preparing").length;
  document.querySelector("#farmer-metrics").innerHTML = [
    ["Listed products", myProducts.filter((product) => product.active !== false).length, "Available in your farm stall", "▦"],
    ["Orders received", myOrders.length, "Across your farm listings", "⌑"],
    ["To prepare", pending, "Orders that need your attention", "◷"],
    ["Order value", money(revenue), "Value of orders placed", "↗"],
  ].map(([label, value, note, icon]) => `<article class="metric-card"><span class="metric-icon">${icon}</span><span class="metric-label">${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("");

  const recentProducts = myProducts.slice(0, 4);
  document.querySelector("#farmer-recent-products").innerHTML = recentProducts.length
    ? `<div class="mini-list">${recentProducts.map((product) => `<div class="mini-row"><span class="mini-product-icon">✳</span><span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.category)} · ${money(product.price)} / ${escapeHtml(product.unit)}</small></span><span class="${product.active === false ? "status-pill status-paused" : "status-pill status-active"}">${product.active === false ? "Paused" : "Live"}</span></div>`).join("")}</div>`
    : '<div class="compact-empty">Your first product listing will show up here.</div>';
  const recentOrders = myOrders.slice(0, 4);
  document.querySelector("#farmer-recent-orders").innerHTML = recentOrders.length
    ? `<div class="mini-list">${recentOrders.map((order) => `<div class="mini-row"><span class="order-id">${escapeHtml(order.id)}</span><span><strong>${escapeHtml(order.customer)}</strong><small>${order.items.reduce((total, item) => total + item.quantity, 0)} items · ${money(order.total)}</small></span><span class="${statusClass(order.status)}">${escapeHtml(order.status)}</span></div>`).join("")}</div>`
    : '<div class="compact-empty">Your customer orders will show up here.</div>';

  renderManageProducts(myProducts);
  renderManageOrders(myOrders);
  document.querySelector("#farmer-order-date").textContent = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date());
}

function renderManageProducts(myProducts) {
  const rows = document.querySelector("#manage-product-rows");
  document.querySelector("#manage-product-count").textContent = `${myProducts.length} ${myProducts.length === 1 ? "product" : "products"}`;
  document.querySelector("#manage-products-empty").hidden = myProducts.length > 0;
  rows.innerHTML = myProducts.map((product) => `<tr>
    <td><span class="table-product"><span class="table-product-icon">✳</span><strong>${escapeHtml(product.name)}</strong></span></td>
    <td>${escapeHtml(product.category)}</td><td>${money(product.price)} / ${escapeHtml(product.unit)}</td>
    <td><span class="${product.active === false ? "status-pill status-paused" : "status-pill status-active"}">${product.active === false ? "Paused" : "Live"}</span></td>
    <td><div class="row-actions"><button type="button" data-toggle-product="${escapeHtml(product.id)}">${product.active === false ? "Publish" : "Pause"}</button><button class="action-danger" type="button" data-delete-product="${escapeHtml(product.id)}">Remove</button></div></td>
  </tr>`).join("");
}

function renderManageOrders(myOrders) {
  const rows = document.querySelector("#manage-order-rows");
  document.querySelector("#manage-order-count").textContent = `${myOrders.length} ${myOrders.length === 1 ? "order" : "orders"}`;
  document.querySelector("#manage-orders-empty").hidden = myOrders.length > 0;
  const statuses = ["New", "Preparing", "Ready for pickup", "Completed"];
  rows.innerHTML = myOrders.map((order) => `<tr>
    <td><strong class="order-id">${escapeHtml(order.id)}</strong><small class="table-subtext">${dateLabel(order.createdAt)}</small></td>
    <td>${escapeHtml(order.customer)}</td>
    <td>${order.items.map((item) => `${item.quantity} × ${escapeHtml(item.name)}`).join("<br />")}</td>
    <td><strong>${money(order.total)}</strong></td>
    <td><span class="${statusClass(order.status)}">${escapeHtml(order.status)}</span></td>
    <td><select class="status-select" data-order-status="${escapeHtml(order.id)}" aria-label="Update status for order ${escapeHtml(order.id)}">${statuses.map((status) => `<option ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}</select></td>
  </tr>`).join("");
}

function adminFarmers() {
  const farms = new Map();
  products.forEach((product) => {
    if (!farms.has(product.farmId)) farms.set(product.farmId, { id: product.farmId, farm: product.farm, listings: 0 });
    farms.get(product.farmId).listings += 1;
  });
  users.filter((user) => user.role === "farmer").forEach((user) => {
    if (!farms.has(user.farmId)) farms.set(user.farmId, { id: user.farmId, farm: user.farm, listings: 0 });
  });
  return [...farms.values()];
}

function renderAdminDashboard() {
  const activeProducts = products.filter((product) => product.active !== false);
  const farms = adminFarmers();
  const revenue = orders.reduce((total, order) => total + order.total, 0);
  document.querySelector("#admin-metrics").innerHTML = [
    ["Farm partners", farms.length, "Independent growers represented", "♧"],
    ["Available products", activeProducts.length, "Fresh listings in the marketplace", "▦"],
    ["Orders placed", orders.length, "Across the FarmDirect community", "⌑"],
    ["Order value", money(revenue), "Total demo marketplace value", "↗"],
  ].map(([label, value, note, icon]) => `<article class="metric-card"><span class="metric-icon">${icon}</span><span class="metric-label">${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("");
  renderAdminTable(activeAdminTab);
}

function renderAdminTable(tab) {
  activeAdminTab = tab;
  document.querySelectorAll(".admin-tab").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.adminTab === tab);
  });
  const title = document.querySelector("#admin-table-title");
  const head = document.querySelector("#admin-table-head");
  const rows = document.querySelector("#admin-table-rows");
  let headings;
  let content;
  if (tab === "farmers") {
    title.textContent = "Farm partners";
    headings = ["FARM", "FARM ID", "PRODUCT LISTINGS"];
    content = adminFarmers().map((farm) => `<tr><td><strong>${escapeHtml(farm.farm)}</strong></td><td><span class="order-id">${escapeHtml(farm.id)}</span></td><td>${farm.listings} listings</td></tr>`);
  } else if (tab === "products") {
    title.textContent = "All products";
    headings = ["PRODUCT", "FARM", "CATEGORY", "PRICE", "STATUS"];
    content = products.map((product) => `<tr><td><strong>${escapeHtml(product.name)}</strong></td><td>${escapeHtml(product.farm)}</td><td>${escapeHtml(product.category)}</td><td>${money(product.price)} / ${escapeHtml(product.unit)}</td><td><span class="${product.active === false ? "status-pill status-paused" : "status-pill status-active"}">${product.active === false ? "Paused" : "Live"}</span></td></tr>`);
  } else {
    title.textContent = "Recent orders";
    headings = ["ORDER", "CUSTOMER", "FARM", "ITEMS", "TOTAL", "STATUS"];
    content = orders.map((order) => `<tr><td><strong class="order-id">${escapeHtml(order.id)}</strong></td><td>${escapeHtml(order.customer)}</td><td>${escapeHtml(order.farm)}</td><td>${order.items.reduce((total, item) => total + item.quantity, 0)} items</td><td>${money(order.total)}</td><td><span class="${statusClass(order.status)}">${escapeHtml(order.status)}</span></td></tr>`);
  }
  head.innerHTML = `<tr>${headings.map((heading) => `<th>${heading}</th>`).join("")}</tr>`;
  rows.innerHTML = content.join("");
  document.querySelector("#admin-table-empty").hidden = content.length > 0;
}

function submitAuth(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const email = document.querySelector("#auth-email").value.trim().toLocaleLowerCase();
  const password = document.querySelector("#auth-password").value;
  const role = document.querySelector("#auth-role").value;
  const error = document.querySelector("#auth-error");

  if (authMode === "login") {
    const account = users.find((user) => user.email === email && user.password === password && user.role === role);
    if (!account) {
      error.textContent = "We couldn’t find a matching account. Check your details or try a demo workspace.";
      error.hidden = false;
      return;
    }
    startSession(account);
    return;
  }

  if (users.some((user) => user.email === email)) {
    error.textContent = "An account with that email already exists. Choose Sign in instead.";
    error.hidden = false;
    return;
  }
  const name = document.querySelector("#auth-name").value.trim();
  const farm = document.querySelector("#auth-farm").value.trim();
  const account = {
    id: `user-${Date.now()}`,
    name,
    email,
    password,
    role,
    farm: role === "farmer" ? farm : "",
    farmId: role === "farmer" ? `farm-${slugify(farm)}-${Date.now().toString().slice(-5)}` : "",
  };
  users = [...users, account];
  persist(STORAGE_KEYS.users, users);
  startSession(account);
  showToast("Your FarmDirect demo account is ready.");
}

function toggleProduct(productId) {
  const product = products.find((item) => item.id === productId && item.farmId === currentUser?.farmId);
  if (!product) return;
  product.active = product.active === false;
  persist(STORAGE_KEYS.products, products);
  renderFarmerWorkspace();
  showToast(`${product.name} is ${product.active ? "back in the farm stall" : "paused"}.`);
}

function removeProduct(productId) {
  const product = products.find((item) => item.id === productId && item.farmId === currentUser?.farmId);
  if (!product) return;
  products = products.filter((item) => item.id !== productId);
  basket = basket.filter((item) => item.productId !== productId);
  persist(STORAGE_KEYS.products, products);
  persist(STORAGE_KEYS.basket, basket);
  document.querySelector("#basket-count").textContent = String(basket.reduce((total, item) => total + item.quantity, 0));
  renderFarmerWorkspace();
  showToast(`${product.name} was removed from your listings.`);
}

function saveProduct(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity() || currentUser?.role !== "farmer") return;
  const values = new FormData(form);
  const price = Number(values.get("price"));
  if (!Number.isFinite(price) || price <= 0) {
    showToast("Enter a product price greater than zero.");
    return;
  }
  const enteredImage = String(values.get("image") || "").trim();
  if (enteredImage && !safeImage(enteredImage)) {
    showToast("Use a valid http or https image address.");
    return;
  }
  const product = {
    id: `product-${Date.now()}`,
    name: String(values.get("name")).trim(),
    category: String(values.get("category")),
    price,
    unit: String(values.get("unit")),
    farm: currentUser.farm,
    farmId: currentUser.farmId,
    tag: String(values.get("tag") || "Farm fresh").trim(),
    description: String(values.get("description")).trim(),
    image: enteredImage || "",
    active: true,
  };
  products = [product, ...products];
  persist(STORAGE_KEYS.products, products);
  form.reset();
  showToast(`${product.name} is now listed in the marketplace.`);
  navigate("manage-products");
}

function updateOrderStatus(orderId, status) {
  const order = orders.find((item) => item.id === orderId && item.farmId === currentUser?.farmId);
  if (!order) return;
  order.status = status;
  persist(STORAGE_KEYS.orders, orders);
  renderFarmerWorkspace();
  showToast(`Order ${order.id} updated to ${status.toLowerCase()}.`);
}

document.addEventListener("click", (event) => {
  const target = event.target;
  const goButton = target.closest("[data-go]");
  const enterButton = target.closest("[data-enter]");
  const demoButton = target.closest("[data-demo]");
  const detailButton = target.closest("[data-detail]");
  const addButton = target.closest("[data-add]");
  const categoryButton = target.closest("[data-category]");
  const quantityButton = target.closest("[data-quantity]");
  const removeButton = target.closest("[data-remove]");
  const toggleButton = target.closest("[data-toggle-product]");
  const deleteButton = target.closest("[data-delete-product]");
  const adminButton = target.closest("[data-admin-tab]");

  if (enterButton) {
    pendingRole = enterButton.dataset.enter;
    document.querySelector("#auth-role").value = pendingRole;
    setAuthMode("register");
    setScreen("auth");
  } else if (demoButton) {
    createDemoUser(demoButton.dataset.demo);
  } else if (goButton) {
    navigate(goButton.dataset.go);
  } else if (detailButton) {
    currentProductId = detailButton.dataset.detail;
    navigate("details");
  } else if (addButton) {
    addToBasket(addButton.dataset.add);
  } else if (categoryButton) {
    activeCategory = categoryButton.dataset.category;
    document.querySelectorAll("[data-category]").forEach((button) => {
      const active = button === categoryButton;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderProducts();
  } else if (quantityButton) {
    const line = basket.find((item) => item.productId === quantityButton.dataset.id);
    if (line) {
      line.quantity += Number(quantityButton.dataset.quantity);
      if (line.quantity <= 0) basket = basket.filter((item) => item !== line);
      persist(STORAGE_KEYS.basket, basket);
      document.querySelector("#basket-count").textContent = String(basket.reduce((total, item) => total + item.quantity, 0));
      renderCart();
    }
  } else if (removeButton) {
    basket = basket.filter((item) => item.productId !== removeButton.dataset.remove);
    persist(STORAGE_KEYS.basket, basket);
    document.querySelector("#basket-count").textContent = String(basket.reduce((total, item) => total + item.quantity, 0));
    renderCart();
  } else if (toggleButton) {
    toggleProduct(toggleButton.dataset.toggleProduct);
  } else if (deleteButton) {
    removeProduct(deleteButton.dataset.deleteProduct);
  } else if (adminButton) {
    renderAdminTable(adminButton.dataset.adminTab);
  }
});

document.querySelector("#auth-form").addEventListener("submit", submitAuth);
document.querySelector("#register-tab").addEventListener("click", () => setAuthMode("register"));
document.querySelector("#login-tab").addEventListener("click", () => setAuthMode("login"));
document.querySelector("#auth-role").addEventListener("change", (event) => setAuthRole(event.currentTarget.value));
document.querySelector("#product-search").addEventListener("input", renderProducts);
document.querySelector("#product-form").addEventListener("submit", saveProduct);
document.querySelector("#order-summary").addEventListener("click", (event) => {
  if (event.target.closest("#place-order")) placeOrder();
});
document.querySelector("#manage-order-rows").addEventListener("change", (event) => {
  const select = event.target.closest("[data-order-status]");
  if (select) updateOrderStatus(select.dataset.orderStatus, select.value);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
  const target = event.target;
  if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
  if (!document.querySelector("#screen-explore").hidden) {
    event.preventDefault();
    document.querySelector("#product-search").focus();
  }
});

if (!Array.isArray(products) || !Array.isArray(orders) || !Array.isArray(users) || !Array.isArray(basket)) {
  console.error("FarmDirect local demo data has an unexpected format; resetting invalid collections.");
  products = Array.isArray(products) ? products : starterProducts;
  orders = Array.isArray(orders) ? orders : starterOrders;
  users = Array.isArray(users) ? users : [];
  basket = Array.isArray(basket) ? basket : [];
}

setAuthRole(pendingRole);
if (currentUser && ["customer", "farmer", "admin"].includes(currentUser.role)) {
  navigate(currentUser.role === "customer" ? "explore" : currentUser.role === "farmer" ? "farmer-dashboard" : "admin-dashboard");
} else {
  currentUser = null;
  setScreen("welcome");
}
