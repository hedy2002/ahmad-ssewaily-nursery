const CART_KEY = 'ahmad-siwaily-cart';
const FREE_DELIVERY_THRESHOLD = 15000;
const DELIVERY_FEE = 2000;
const WHATSAPP_NUMBER = '9647500000000';

const escapeHtml = (value) => String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const formatPrice = (value) => `${Number(value || 0).toLocaleString()} IQD`;
const getCart = () => JSON.parse(localStorage.getItem(CART_KEY) || '[]');
const saveCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function careBadges(product) {
  return `<div class="care-badges"><span title="Sunlight">☀️ ${escapeHtml(product.sunlight || 'Indirect')}</span><span title="Watering">💧 ${escapeHtml(product.watering || 'Weekly')}</span><span title="Temperature">🌡️ ${escapeHtml(product.temperature || '18-30°C')}</span></div>`;
}

function productCard(product) {
  const orderText = encodeURIComponent(`Hello Ahmad Siwaily Nursery, I want to order ${product.title}.`);
  return `<article class="product-card"><div class="product-image-wrap"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" loading="lazy" />${product.featured ? `<span class="tag">${siteT('featuredLabel', 'Featured')}</span>` : ''}</div><div class="product-content"><div class="product-meta"><span class="product-category">${escapeHtml(product.category)}</span><span class="product-price">${formatPrice(product.price)}</span></div><h3>${escapeHtml(product.title)}</h3><p>${escapeHtml(product.description)}</p>${careBadges(product)}<div class="card-actions"><a class="link-btn secondary" href="/product/${encodeURIComponent(product.id)}">${siteT('details', 'View Details')}</a><button class="link-btn primary" type="button" data-add-cart="${escapeHtml(product.id)}" ${product.inStock ? '' : 'disabled'}>${product.inStock ? siteT('add', 'Add to Cart') : siteT('out', 'Out of Stock')}</button></div>${product.inStock ? `<a class="whatsapp-link" href="https://wa.me/${WHATSAPP_NUMBER}?text=${orderText}" target="_blank" rel="noreferrer">Order directly via WhatsApp</a>` : ''}</div></article>`;
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id);
  if (existing) existing.quantity += 1;
  else cart.push({ id: product.id, title: product.title, price: product.price, image: product.image, quantity: 1 });
  saveCart(cart); updateCartBadge(); renderCartWidget(); renderCartPage(); document.getElementById('floatingCartButton')?.classList.add('bump'); showToast(`${product.title} ${siteT('addedMessage', 'added to cart.')}`);
}

async function loadProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  const params = new URLSearchParams();
  ['search', 'category', 'sunlight', 'watering', 'season'].forEach((key) => {
    const value = document.getElementById(`${key}Filter`)?.value || (key === 'search' ? document.getElementById('searchInput')?.value : '');
    if (value) params.set(key, value);
  });
  try {
    const response = await fetch(`/api/products?${params}`);
    const products = await response.json();
    grid.innerHTML = products.length ? products.map(productCard).join('') : `<div class="panel"><p>${siteT('noProducts', 'No matching products found.')}</p></div>`;
    grid.querySelectorAll('[data-add-cart]').forEach((button) => button.addEventListener('click', async () => addToCart(await fetch(`/api/products/${button.dataset.addCart}`).then((res) => res.json()))));
  } catch (error) { grid.innerHTML = `<div class="panel"><p>${siteT('unableProducts', 'Unable to load products.')}</p></div>`; }
}

function setupFilters() {
  ['searchInput', 'searchFilter', 'categoryFilter', 'sunlightFilter', 'wateringFilter', 'seasonFilter'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', loadProducts);
    document.getElementById(id)?.addEventListener('change', loadProducts);
  });
}

async function loadProductDetails() {
  const container = document.getElementById('productDetail');
  if (!container) return;
  const id = location.pathname.split('/').filter(Boolean).pop();
  const productResponse = await fetch(`/api/products/${id}`);
  if (!productResponse.ok) return (container.innerHTML = `<p>${siteT('productNotFound', 'Product not found.')}</p>`);
  const product = await productResponse.json();
  const reviews = await fetch(`/api/products/${id}/reviews`).then((res) => res.json());
  const message = encodeURIComponent(`Hello, I want to order ${product.title}.`);
  container.innerHTML = `<div class="product-layout"><div class="product-gallery"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" /></div><div class="product-details"><div class="detail-category">${escapeHtml(product.category)}</div><h1>${escapeHtml(product.title)}</h1><div class="price">${formatPrice(product.price)}</div>${careBadges(product)}<p>${escapeHtml(product.description)}</p><div class="care-box"><h3>Plant Care Guide</h3><p>${escapeHtml(product.careGuide)}</p></div><div class="primary-action">${product.inStock ? `<button class="btn btn-primary" id="detailAdd" type="button">Add to Cart</button><a class="btn btn-secondary" href="https://wa.me/${WHATSAPP_NUMBER}?text=${message}" target="_blank" rel="noreferrer">Order directly via WhatsApp</a>` : '<span class="status-pill out">Out of Stock</span>'}</div>${product.inStock ? '' : `<form id="notifyForm" class="notify-form"><h3>Notify me when available</h3><input name="email" type="email" placeholder="Email address"><input name="phone" type="tel" placeholder="Phone number"><button class="btn btn-primary" type="submit">Notify Me</button></form>`}<section class="reviews"><h2>Customer Reviews</h2><div>${reviews.length ? reviews.map((review) => `<article class="review"><strong>${escapeHtml(review.name)}</strong><span>${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span><p>${escapeHtml(review.comment)}</p></article>`).join('') : '<p class="muted">No approved reviews yet.</p>'}</div><form id="reviewForm" class="review-form"><h3>Share your experience</h3><input name="name" placeholder="Your name" required><select name="rating" required><option value="">Rating</option><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select><textarea name="comment" placeholder="Your review" required></textarea><button class="btn btn-primary" type="submit">Submit Review</button></form></section></div></div>`;
  document.getElementById('detailAdd')?.addEventListener('click', () => addToCart(product));
  document.getElementById('notifyForm')?.addEventListener('submit', async (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); data.productId = product.id; const response = await fetch('/api/availability-notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); const result = await response.json(); showToast(result.message); if (response.ok) event.target.reset(); });
  document.getElementById('reviewForm')?.addEventListener('submit', async (event) => { event.preventDefault(); const response = await fetch(`/api/products/${product.id}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(event.target))) }); const result = await response.json(); showToast(result.message); if (response.ok) event.target.reset(); });
}

function cartTotals(items = getCart()) { return { count: items.reduce((sum, item) => sum + item.quantity, 0), total: items.reduce((sum, item) => sum + item.price * item.quantity, 0) }; }

function changeCartQuantity(id, amount) {
  const cart = getCart().map((item) => item.id === id ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0);
  saveCart(cart);
  renderCartWidget();
  renderCartPage();
}

function removeFromCart(id) {
  saveCart(getCart().filter((item) => item.id !== id));
  renderCartWidget();
  renderCartPage();
}

function clearCart() {
  saveCart([]);
  renderCartWidget();
  renderCartPage();
}

function getCartPricing(items = getCart()) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = Number(sessionStorage.getItem('cart-discount') || 0);
  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  return { subtotal, discount, delivery, total: Math.max(0, subtotal + delivery - discount) };
}

function renderCartWidget() {
  const widget = document.getElementById('floatingCart');
  if (!widget) return;
  const cart = getCart();
  const totals = cartTotals(cart);
  const pricing = getCartPricing(cart);
  const items = cart.length ? cart.map((item) => `<div class="drawer-item"><img src="${escapeHtml(item.image)}" alt=""><div class="drawer-item-main"><strong>${escapeHtml(item.title)}</strong><span>${formatPrice(item.price)}</span><div class="quantity-controls"><button type="button" data-cart-minus="${escapeHtml(item.id)}" aria-label="Decrease quantity">-</button><span>${item.quantity}</span><button type="button" data-cart-plus="${escapeHtml(item.id)}" aria-label="Increase quantity">+</button></div></div><button type="button" class="cart-remove" data-cart-remove="${escapeHtml(item.id)}" aria-label="Remove">🗑</button></div>`).join('') : `<p class="drawer-empty">${siteT('emptyCart', 'Your cart is empty.')}</p>`;
  const deliveryMessage = pricing.subtotal >= FREE_DELIVERY_THRESHOLD ? siteT('freeDelivery', 'Free delivery unlocked') : `${siteT('addMore', 'Add')} ${formatPrice(Math.max(0, FREE_DELIVERY_THRESHOLD - pricing.subtotal))} ${siteT('freeDeliveryMore', 'more for free delivery')}`;
  widget.innerHTML = `<button type="button" class="floating-cart-button" id="floatingCartButton" aria-label="${siteT('cart', 'Cart')}"><span class="cart-icon">🛒</span><span><b>${siteT('cart', 'Cart')}</b><small>${totals.count} ${siteT('items', 'items')}</small></span><strong>${formatPrice(pricing.total)}</strong><em>${totals.count}</em></button><aside class="cart-drawer" id="cartDrawer" aria-hidden="true"><div class="drawer-head"><div><span class="eyebrow">${siteT('cart', 'Cart')}</span><h2>${siteT('cart', 'Cart')}</h2></div><button type="button" class="drawer-close" id="drawerClose" aria-label="Close">×</button></div><div class="delivery-progress"><div><span>${deliveryMessage}</span><strong>${Math.min(100, Math.round(pricing.subtotal / FREE_DELIVERY_THRESHOLD * 100))}%</strong></div><progress max="100" value="${Math.min(100, pricing.subtotal / FREE_DELIVERY_THRESHOLD * 100)}"></progress></div><div class="drawer-items">${items}</div><div class="drawer-footer"><div><span>${siteT('subtotal', 'Subtotal')}</span><strong>${formatPrice(pricing.subtotal)}</strong></div><div><span>${siteT('delivery', 'Delivery')}</span><strong>${pricing.delivery ? formatPrice(pricing.delivery) : siteT('free', 'Free')}</strong></div><div><span>${siteT('total', 'Total')}</span><strong>${formatPrice(pricing.total)}</strong></div><button type="button" class="clear-cart" id="clearCart">${siteT('clearCart', 'Clear all items')}</button><a class="btn btn-primary full" href="/checkout.html" ${cart.length ? '' : 'aria-disabled="true"'}>${siteT('checkout', 'Continue to Checkout')}</a></div></aside>`;
  widget.querySelector('#floatingCartButton').addEventListener('click', () => { widget.classList.add('open'); widget.querySelector('#cartDrawer').setAttribute('aria-hidden', 'false'); });
  widget.querySelector('#drawerClose').addEventListener('click', () => { widget.classList.remove('open'); widget.querySelector('#cartDrawer').setAttribute('aria-hidden', 'true'); });
  widget.querySelectorAll('[data-cart-minus]').forEach((button) => button.addEventListener('click', () => changeCartQuantity(button.dataset.cartMinus, -1)));
  widget.querySelectorAll('[data-cart-plus]').forEach((button) => button.addEventListener('click', () => changeCartQuantity(button.dataset.cartPlus, 1)));
  widget.querySelectorAll('[data-cart-remove]').forEach((button) => button.addEventListener('click', () => removeFromCart(button.dataset.cartRemove)));
  widget.querySelector('#clearCart').addEventListener('click', clearCart);
}

function renderCartPage() {
  const itemsTarget = document.getElementById('cartItems');
  const summaryTarget = document.getElementById('cartSummary');
  if (!itemsTarget || !summaryTarget) return;
  const cart = getCart();
  itemsTarget.innerHTML = cart.length ? cart.map((item) => `<article class="cart-line"><img src="${escapeHtml(item.image)}" alt=""><div><h3>${escapeHtml(item.title)}</h3><p>${formatPrice(item.price)}</p><div class="quantity-controls"><button type="button" data-cart-minus="${escapeHtml(item.id)}">-</button><span>${item.quantity}</span><button type="button" data-cart-plus="${escapeHtml(item.id)}">+</button></div></div><strong>${formatPrice(item.price * item.quantity)}</strong></article>`).join('') : `<div class="empty-state">${siteT('emptyCart', 'Your cart is empty.')}</div>`;
  const pricing = getCartPricing(cart);
  summaryTarget.innerHTML = `<h3>${siteT('summary', 'Order Summary')}</h3><div class="row"><span>${siteT('subtotal', 'Subtotal')}</span><strong>${formatPrice(pricing.subtotal)}</strong></div><div class="row"><span>${siteT('delivery', 'Delivery')}</span><strong>${pricing.delivery ? formatPrice(pricing.delivery) : siteT('free', 'Free')}</strong></div><div class="row"><span>${siteT('discount', 'Discount')}</span><strong>-${formatPrice(pricing.discount)}</strong></div><div class="row total"><span>${siteT('total', 'Total')}</span><strong>${formatPrice(pricing.total)}</strong></div><a class="btn btn-primary full" href="/checkout.html" ${cart.length ? '' : 'aria-disabled="true"'}>${siteT('checkout', 'Continue to Checkout')}</a>`;
  document.querySelectorAll('#cartItems [data-cart-minus], #cartItems [data-cart-plus]').forEach((button) => button.addEventListener('click', () => changeCartQuantity(button.dataset.cartMinus || button.dataset.cartPlus, button.dataset.cartMinus ? -1 : 1)));
}

function initCart() {
  if (!document.getElementById('floatingCart')) {
    const widget = document.createElement('div');
    widget.id = 'floatingCart';
    widget.className = 'floating-cart';
    document.body.appendChild(widget);
  }
  renderCartWidget();
  renderCartPage();
}

window.addEventListener('site-language-change', () => {
  loadProducts();
  loadProductDetails();
  renderCartWidget();
  renderCartPage();
});

function renderSummary(items, target) { const pricing = getCartPricing(items); target.innerHTML = items.length ? `<div class="checkout-items">${items.map((item) => `<div class="checkout-line"><span>${escapeHtml(item.title)} <b>× ${item.quantity}</b></span><strong>${formatPrice(item.price * item.quantity)}</strong></div>`).join('')}</div><div class="pricing-breakdown"><div class="row"><span>${siteT('subtotal', 'Subtotal')}</span><strong>${formatPrice(pricing.subtotal)}</strong></div><div class="row"><span>${siteT('delivery', 'Delivery')}</span><strong>${pricing.delivery ? formatPrice(pricing.delivery) : siteT('free', 'Free')}</strong></div><div class="row"><span>${siteT('discount', 'Discount')}</span><strong>-${formatPrice(pricing.discount)}</strong></div></div><div class="checkout-total"><span>${siteT('total', 'Total')}</span><strong>${formatPrice(pricing.total)}</strong></div>` : `<p>${siteT('emptyCart', 'Your cart is empty.')}</p>`; return pricing.total; }

function initCheckout() {
  const form = document.getElementById('checkoutForm');
  const summary = document.getElementById('checkoutSummary');
  if (!form || !summary) return;
  const cart = getCart();
  let promoCode = '';
  renderSummary(cart, summary);
  document.getElementById('applyPromo')?.addEventListener('click', async () => {
    const code = document.getElementById('promoCode').value;
    const response = await fetch(`/api/promos/validate?code=${encodeURIComponent(code)}`);
    const result = await response.json();
    promoCode = response.ok ? result.code : '';
    sessionStorage.setItem('cart-discount', response.ok ? String(result.type === 'percentage' ? Math.round(cartTotals(cart).total * result.value / 100) : result.value) : '0');
    document.getElementById('promoMessage').textContent = result.message || (response.ok ? siteT('discountApplied', 'Discount applied.') : siteT('invalidPromo', 'Invalid coupon.'));
    renderSummary(cart, summary);
  });
  if (window.L && document.getElementById('deliveryMap')) {
    const map = L.map('deliveryMap').setView([36.19, 44.01], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    let marker;
    map.on('click', (event) => { if (marker) marker.setLatLng(event.latlng); else marker = L.marker(event.latlng).addTo(map); document.getElementById('latitude').value = event.latlng.lat; document.getElementById('longitude').value = event.latlng.lng; });
  }
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const customer = { name: values.customerName, phone: values.phone, address: values.address, notes: values.notes, latitude: values.latitude, longitude: values.longitude };
    const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer, items: cart, promoCode }) });
    const result = await response.json();
    if (!response.ok) return showToast(result.message);
    sessionStorage.setItem('last-order', JSON.stringify(result));
    sessionStorage.removeItem('cart-discount');
    saveCart([]);
    window.location.href = `/success.html?order=${encodeURIComponent(result.id)}`;
  });
}

function initSuccess() {
  const target = document.getElementById('successOrder');
  const order = JSON.parse(sessionStorage.getItem('last-order') || 'null');
  if (!target || !order) return;
  target.innerHTML = `<p>${siteT('orderNumber', 'Order')}: <strong>${escapeHtml(order.id)}</strong></p><div class="success-receipt">${order.items.map((item) => `<div class="checkout-line"><span>${escapeHtml(item.title)} × ${item.quantity}</span><strong>${formatPrice(item.price * item.quantity)}</strong></div>`).join('')}<div class="checkout-total"><span>${siteT('total', 'Total')}</span><strong>${formatPrice(order.total)}</strong></div></div><div class="success-actions"><button class="btn btn-secondary" type="button" onclick="window.print()">${siteT('printInvoice', 'Print invoice')}</button><a class="btn btn-primary" href="${escapeHtml(order.managerWhatsAppUrl || '#')}" target="_blank" rel="noreferrer">${siteT('notifyManager', 'Send order to nursery')}</a></div>`;
}

async function initAdmin() { const list = document.getElementById('inventoryList'); if (!list) return; const load = async () => { const [products, orders, reviews, notifications, lowStock] = await Promise.all([fetch('/api/products').then((r) => r.json()), fetch('/api/admin/orders').then((r) => r.json()), fetch('/api/admin/reviews').then((r) => r.json()), fetch('/api/admin/availability-notifications').then((r) => r.json()), fetch('/api/admin/low-stock').then((r) => r.json())]); list.innerHTML = `${lowStock.products.length ? `<div class="low-stock-alert"><strong>Low stock alert:</strong> ${lowStock.products.map((p) => escapeHtml(p.title)).join(', ')} (${lowStock.threshold} or fewer remaining)</div>` : ''}<h2>Inventory</h2>${products.map((p) => `<div class="inventory-item"><img src="${escapeHtml(p.image)}" alt=""><div><strong>${escapeHtml(p.title)}</strong><p>${formatPrice(p.price)} · ${p.stockQuantity} remaining · ${p.inStock ? 'In stock' : 'Out of stock'}</p></div></div>`).join('')}<h2>Orders</h2>${orders.length ? orders.map((o) => `<div class="admin-row"><strong>${escapeHtml(o.id)}</strong><span>${escapeHtml(o.customer.name)} · ${formatPrice(o.total)}</span><select data-order-status="${o.id}"><option ${o.status === 'Pending' ? 'selected' : ''}>Pending</option><option ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option><option ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option></select><a class="small-btn" target="_blank" href="/admin/invoice/${o.id}">Invoice PDF</a></div>`).join('') : '<p>No orders yet.</p>'}<h2>Reviews Awaiting Approval</h2>${reviews.map((r) => `<div class="admin-row"><span>${escapeHtml(r.name)} · ${'★'.repeat(r.rating)}<br>${escapeHtml(r.comment)}</span><button class="small-btn success" data-review-id="${r.id}" data-approved="${!r.approved}">${r.approved ? 'Unapprove' : 'Approve'}</button></div>`).join('') || '<p>No reviews.</p>'}<h2>Availability Notifications</h2>${notifications.map((n) => `<div class="admin-row"><span>${escapeHtml(n.productTitle)}</span><span>${escapeHtml(n.email || n.phone)}</span></div>`).join('') || '<p>No notification requests.</p>'}`; list.querySelectorAll('[data-order-status]').forEach((select) => select.addEventListener('change', async () => { await fetch(`/api/admin/orders/${select.dataset.orderStatus}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: select.value }) }); showToast('Order status updated.'); })); list.querySelectorAll('[data-review-id]').forEach((button) => button.addEventListener('click', async () => { await fetch(`/api/admin/reviews/${button.dataset.reviewId}/approval`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approved: button.dataset.approved === 'true' }) }); load(); })); }; await load(); document.getElementById('logoutBtn')?.addEventListener('click', async () => { await fetch('/admin/logout', { method: 'POST' }); location.href = '/admin/login'; }); }

function initAdminProductForm() { const form = document.getElementById('productForm'); if (!form) return; form.addEventListener('submit', async (event) => { event.preventDefault(); const response = await fetch('/api/products', { method: 'POST', body: new FormData(form) }); const result = await response.json(); showToast(response.ok ? 'Product saved.' : result.message); if (response.ok) form.reset(); }); }

function initTheme() { const button = document.createElement('button'); button.className = 'theme-toggle'; button.type = 'button'; button.title = 'Toggle dark mode'; button.textContent = localStorage.getItem('theme') === 'dark' ? '☀️' : '🌙'; if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode'); button.addEventListener('click', () => { const dark = document.body.classList.toggle('dark-mode'); localStorage.setItem('theme', dark ? 'dark' : 'light'); button.textContent = dark ? '☀️' : '🌙'; }); document.body.appendChild(button); }

document.addEventListener('DOMContentLoaded', () => { updateCartBadge(); setupFilters(); loadProducts(); loadProductDetails(); initCart(); initCheckout(); initSuccess(); initAdmin(); initAdminProductForm(); initTheme(); document.getElementById('adminLoginForm')?.addEventListener('submit', async (event) => { event.preventDefault(); const response = await fetch('/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(event.target))) }); const result = await response.json(); if (response.ok) location.href = result.redirect; else showToast(result.message); }); });
