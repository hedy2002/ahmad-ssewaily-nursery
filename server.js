const express = require('express');
const session = require('express-session');
let multer;
try {
  multer = require('multer');
} catch (error) {
  multer = () => ({ single: () => (req, res, next) => next() });
  multer.diskStorage = () => null;
}
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD || 3);
const FREE_DELIVERY_THRESHOLD = 15000;
const DELIVERY_FEE = 2000;
const MANAGER_WHATSAPP = process.env.MANAGER_WHATSAPP || '9647500000000';

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

const DEFAULT_ADMINS = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'superadmin', password: 'superadmin123', role: 'superadmin' },
  { username: 'chnar', password: '2003', role: 'superadmin' }
];
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'availability-notifications.json');
const PROMOS_FILE = path.join(DATA_DIR, 'promos.json');
const ACTIVITY_LOG_FILE = path.join(DATA_DIR, 'activity-log.json');

const DEFAULT_PRODUCTS = [
  {
    id: 'monstera-deliciosa',
    title: 'Monstera Deliciosa',
    category: 'Indoor Plants',
    price: 280000,
    description: 'A lush tropical plant with large split leaves that adds instant texture to any indoor space.',
    careGuide: 'Water every 7-10 days, keep in bright indirect sunlight, and maintain temperatures between 18-30°C.',
    sunlight: 'Indirect',
    watering: 'Weekly',
    temperature: '18-30°C',
    season: 'All seasons',
    image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80',
    inStock: true,
    featured: true
  },
  {
    id: 'peace-lily',
    title: 'Peace Lily',
    category: 'Indoor Plants',
    price: 220000,
    description: 'An elegant foliage plant prized for its white blooms and easy-care nature.',
    careGuide: 'Keep soil lightly moist, provide filtered light, and avoid cold drafts.',
    sunlight: 'Indirect',
    watering: 'Weekly',
    temperature: '18-28°C',
    season: 'All seasons',
    image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80',
    inStock: true,
    featured: true
  },
  {
    id: 'zz-plant',
    title: 'ZZ Plant',
    category: 'Indoor Plants',
    price: 260000,
    description: 'A resilient plant perfect for beginners and low-light rooms.',
    careGuide: 'Water every 2-3 weeks, keep in low to medium indirect light, and protect from overwatering.',
    sunlight: 'Shade',
    watering: 'Low',
    temperature: '15-30°C',
    season: 'All seasons',
    image: 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=900&q=80',
    inStock: true,
    featured: false
  },
  {
    id: 'peat-moss',
    title: 'Peat Moss',
    category: 'Soil & Conditioners',
    price: 9000,
    description: 'Excellent moisture retention for healthy root development and seed starting.',
    careGuide: 'Mix into potting soil for better aeration and moisture retention in containers.',
    sunlight: 'N/A',
    watering: 'N/A',
    temperature: 'N/A',
    season: 'All seasons',
    image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80',
    inStock: true,
    featured: false
  },
  {
    id: 'leca-stones',
    title: 'LECA Stones',
    category: 'Soil & Conditioners',
    price: 12000,
    description: 'Inert clay pebbles that improve drainage and support hydroponic plant care.',
    careGuide: 'Rinse before use, then soak and use in hydroponic or semi-hydro setups.',
    sunlight: 'N/A',
    watering: 'N/A',
    temperature: 'N/A',
    season: 'All seasons',
    image: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=900&q=80',
    inStock: true,
    featured: false
  },
  {
    id: 'organic-fertilizer',
    title: 'Organic Fertilizer',
    category: 'Soil & Conditioners',
    price: 15000,
    description: 'Natural nutrient blend to support healthy foliage, roots, and flowering.',
    careGuide: 'Use every 4-6 weeks during active growing periods and reduce during dormancy.',
    sunlight: 'N/A',
    watering: 'N/A',
    temperature: 'N/A',
    season: 'All seasons',
    image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80',
    inStock: false,
    featured: false
  }
];

function ensureSeedFile(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  }
}

ensureSeedFile(ADMIN_FILE, DEFAULT_ADMINS);
ensureSeedFile(PRODUCTS_FILE, DEFAULT_PRODUCTS);
ensureSeedFile(ORDERS_FILE, []);
ensureSeedFile(REVIEWS_FILE, []);
ensureSeedFile(NOTIFICATIONS_FILE, []);
ensureSeedFile(PROMOS_FILE, [
  { code: 'GREEN10', type: 'percentage', value: 10, active: true },
  { code: 'WELCOME5000', type: 'fixed', value: 5000, active: true }
]);
ensureSeedFile(ACTIVITY_LOG_FILE, []);

function getAdmins() {
  const stored = readJson(ADMIN_FILE, DEFAULT_ADMINS);
  return Array.isArray(stored) ? stored : [{ ...stored, role: stored.role || 'admin' }];
}

function logActivity(req, action, details = {}) {
  const logs = getJsonCollection(ACTIVITY_LOG_FILE);
  logs.unshift({ id: `log-${Date.now()}`, actor: req.session?.adminUsername || 'customer', role: req.session?.adminRole || 'customer', action, details, createdAt: new Date().toISOString() });
  writeJson(ACTIVITY_LOG_FILE, logs.slice(0, 1000));
}

function backupDatabase() {
  const snapshot = { createdAt: new Date().toISOString(), products: getProducts(), orders: getJsonCollection(ORDERS_FILE), reviews: getJsonCollection(REVIEWS_FILE), notifications: getJsonCollection(NOTIFICATIONS_FILE), promos: getJsonCollection(PROMOS_FILE), activityLog: getJsonCollection(ACTIVITY_LOG_FILE) };
  const filePath = path.join(BACKUP_DIR, `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeJson(filePath, snapshot);
  return filePath;
}

function readJson(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getProducts() {
  return readJson(PRODUCTS_FILE, DEFAULT_PRODUCTS).map((product) => ({
    ...product,
    title: product.title || product.name || 'Unnamed product',
    description: product.description || product.care || 'A nursery product from Ahmad Siwaily Nursery.',
    careGuide: product.careGuide || product.care || 'Follow the care guidance from the nursery team.',
    category: {
      Indoor: 'Indoor Plants',
      Outdoor: 'Outdoor Trees & Shrubs',
      Flowers: 'Seasonal & Miniature Flowers',
      'Soil/Pots': 'Soil & Conditioners',
      Tools: 'Pots, Tools & Garden Accessories'
    }[product.category] || product.category || 'Indoor Plants',
    sunlight: product.sunlight || (product.category === 'Outdoor' ? 'Direct' : 'Indirect'),
    watering: product.watering && ['Daily', 'Weekly', 'Low'].includes(product.watering) ? product.watering : 'Weekly',
    temperature: product.temperature || '18-30°C',
    season: product.season === 'Year-round' ? 'All seasons' : (product.season || 'All seasons'),
    stockQuantity: Number(product.stockQuantity ?? (product.inStock === false ? 0 : 99)),
    inStock: product.inStock !== false,
    featured: Boolean(product.featured)
  }));
}

function saveProducts(products) {
  writeJson(PRODUCTS_FILE, products);
}

function getJsonCollection(filePath) {
  return readJson(filePath, []);
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(PUBLIC_DIR));
app.use('/uploads', express.static(UPLOAD_DIR));

app.use(session({
  secret: 'ahmad-siwaily-nursery-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    secure: false
  }
}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/\s+/g, '-').toLowerCase();
    const ext = path.extname(cleanName) || '.jpg';
    const base = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    cb(null, base + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  }
});

const isAuthenticated = (req, res, next) => {
  if (req.session.isAuthenticated && req.session.adminUsername) {
    return next();
  }
  return res.redirect('/admin/login');
};

const isSuperAdmin = (req, res, next) => {
  if (req.session.adminRole === 'superadmin') return next();
  return res.status(403).json({ message: 'Super admin permission required.' });
};

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.get('/product/:id', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'product.html'));
});

app.get('/admin/login', (req, res) => {
  if (req.session.isAuthenticated) return res.redirect('/admin/dashboard');
  res.sendFile(path.join(PUBLIC_DIR, 'admin-login.html'));
});

app.get('/admin/dashboard', isAuthenticated, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'admin-dashboard.html'));
});

app.get('/api/admin/session', (req, res) => {
  if (req.session.isAuthenticated) {
    return res.json({ authenticated: true, username: req.session.adminUsername });
  }
  res.json({ authenticated: false });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const admin = getAdmins().find((item) => item.username === username && item.password === password);

  if (admin) {
    req.session.isAuthenticated = true;
    req.session.adminUsername = username;
    req.session.adminRole = admin.role || 'admin';
    req.session.loginTime = new Date();
    logActivity(req, 'login');
    return res.json({ success: true, redirect: '/admin/dashboard' });
  }

  return res.status(401).json({ success: false, message: 'Invalid username or password.' });
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ success: false, message: 'Logout failed.' });
    }
    res.json({ success: true, redirect: '/admin/login' });
  });
});

app.get('/api/products', (req, res) => {
  const { search, category, sunlight, watering, season } = req.query;
  const normalizedSearch = String(search || '').trim().toLowerCase();
  const products = getProducts().filter((product) => {
    const matchesSearch = !normalizedSearch || [product.title, product.description, product.category]
      .some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
    return matchesSearch
      && (!category || product.category === category)
      && (!sunlight || product.sunlight === sunlight)
      && (!watering || product.watering === watering)
      && (!season || product.season === season);
  });
  res.json(products);
});

app.get('/api/promos/validate', (req, res) => {
  const promo = getJsonCollection(PROMOS_FILE).find((item) => item.code.toUpperCase() === String(req.query.code || '').trim().toUpperCase() && item.active);
  if (!promo) return res.status(404).json({ message: 'Invalid or expired promo code.' });
  res.json(promo);
});

app.get('/api/admin/low-stock', isAuthenticated, (req, res) => {
  const products = getProducts().filter((product) => Number(product.stockQuantity ?? (product.inStock ? 99 : 0)) <= LOW_STOCK_THRESHOLD);
  res.json({ threshold: LOW_STOCK_THRESHOLD, products });
});

app.get('/api/products/:id', (req, res) => {
  const product = getProducts().find((item) => item.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  res.json(product);
});

app.post('/api/products', isAuthenticated, upload.single('image'), (req, res) => {
  try {
    const products = getProducts();
    const payload = req.body;
    const newProduct = {
      id: payload.id || `product-${Date.now()}`,
      title: payload.title || 'New Product',
      category: payload.category || 'Indoor Plants',
      price: Number(payload.price) || 0,
      description: payload.description || 'No description provided.',
      careGuide: payload.careGuide || 'Use as guided by the nursery team.',
      sunlight: payload.sunlight || 'Indirect',
      watering: payload.watering || 'Weekly',
      temperature: payload.temperature || '18-30°C',
      season: payload.season || 'All seasons',
      stockQuantity: Math.max(0, Number(payload.stockQuantity ?? 0)),
      image: req.file ? `/uploads/${req.file.filename}` : (payload.image || 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80'),
      inStock: payload.inStock === 'true' || payload.inStock === true || true,
      featured: payload.featured === 'true' || payload.featured === true || false
    };

    products.unshift(newProduct);
    saveProducts(products);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: 'Unable to add product.' });
  }
});

app.put('/api/products/:id', isAuthenticated, upload.single('image'), (req, res) => {
  try {
    const products = getProducts();
    const index = products.findIndex((product) => product.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Product not found.' });

    const current = products[index];
    const updatedProduct = {
      ...current,
      title: req.body.title || current.title,
      category: req.body.category || current.category,
      price: Number(req.body.price) || current.price,
      description: req.body.description || current.description,
      careGuide: req.body.careGuide || current.careGuide,
      sunlight: req.body.sunlight || current.sunlight,
      watering: req.body.watering || current.watering,
      temperature: req.body.temperature || current.temperature,
      season: req.body.season || current.season,
      stockQuantity: Math.max(0, Number(req.body.stockQuantity ?? current.stockQuantity)),
      inStock: req.body.inStock === 'true' || req.body.inStock === true ? true : false,
      featured: req.body.featured === 'true' || req.body.featured === true ? true : false,
      image: req.file ? `/uploads/${req.file.filename}` : (req.body.image || current.image)
    };

    products[index] = updatedProduct;
    saveProducts(products);
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update product.' });
  }
});

app.patch('/api/products/:id/availability', isAuthenticated, (req, res) => {
  const products = getProducts();
  const product = products.find((item) => item.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found.' });

  product.inStock = req.body.inStock !== undefined ? Boolean(req.body.inStock) : !product.inStock;
  if (req.body.stockQuantity !== undefined) product.stockQuantity = Math.max(0, Number(req.body.stockQuantity));
  saveProducts(products);
  res.json(product);
});

app.delete('/api/products/:id', isAuthenticated, (req, res) => {
  const products = getProducts();
  const filtered = products.filter((item) => item.id !== req.params.id);
  if (filtered.length === products.length) return res.status(404).json({ message: 'Product not found.' });

  saveProducts(filtered);
  res.json({ success: true, message: 'Product deleted.' });
});

app.get('/api/products/:id/reviews', (req, res) => {
  const reviews = getJsonCollection(REVIEWS_FILE)
    .filter((review) => review.productId === req.params.id && review.approved);
  res.json(reviews);
});

app.post('/api/products/:id/reviews', (req, res) => {
  const product = getProducts().find((item) => item.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  const rating = Number(req.body.rating);
  if (!req.body.name || !req.body.comment || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Name, comment, and a rating from 1 to 5 are required.' });
  }
  const reviews = getJsonCollection(REVIEWS_FILE);
  const review = {
    id: `review-${Date.now()}`,
    productId: req.params.id,
    name: String(req.body.name).trim(),
    rating,
    comment: String(req.body.comment).trim(),
    approved: false,
    createdAt: new Date().toISOString()
  };
  reviews.unshift(review);
  writeJson(REVIEWS_FILE, reviews);
  res.status(201).json({ message: 'Review submitted for approval.' });
});

app.post('/api/availability-notifications', (req, res) => {
  const product = getProducts().find((item) => item.id === req.body.productId);
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  if (!req.body.email && !req.body.phone) return res.status(400).json({ message: 'Email or phone is required.' });
  const notifications = getJsonCollection(NOTIFICATIONS_FILE);
  notifications.unshift({
    id: `notify-${Date.now()}`,
    productId: product.id,
    productTitle: product.title,
    email: String(req.body.email || '').trim(),
    phone: String(req.body.phone || '').trim(),
    createdAt: new Date().toISOString(),
    notified: false
  });
  writeJson(NOTIFICATIONS_FILE, notifications);
  res.status(201).json({ message: 'We will notify you when this product is available.' });
});

app.post('/api/orders', (req, res) => {
  const { customer, items, promoCode } = req.body;
  if (!customer || !customer.name || !customer.phone || !customer.address || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'Customer details and cart items are required.' });
  }
  const products = getProducts();
  const pricedItems = items.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    if (!product || !product.inStock || product.stockQuantity < Number(item.quantity || 1)) return null;
    return { id: product.id, title: product.title, price: product.price, quantity: Math.max(1, Number(item.quantity || 1)) };
  });
  if (pricedItems.some((item) => !item)) return res.status(409).json({ message: 'One or more products are unavailable or have insufficient stock.' });
  const subtotal = pricedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const promo = getJsonCollection(PROMOS_FILE).find((item) => item.active && item.code.toUpperCase() === String(promoCode || '').trim().toUpperCase());
  const discount = promo ? (promo.type === 'percentage' ? Math.round(subtotal * promo.value / 100) : Math.min(subtotal, promo.value)) : 0;
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const orders = getJsonCollection(ORDERS_FILE);
  const order = {
    id: `order-${Date.now()}`,
    customer,
    items: pricedItems,
    subtotal,
    discount,
    promoCode: promo?.code || null,
    deliveryFee,
    total: subtotal + deliveryFee - discount,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };
  orders.unshift(order);
  pricedItems.forEach((item) => {
    const product = products.find((entry) => entry.id === item.id);
    product.stockQuantity -= item.quantity;
    product.inStock = product.stockQuantity > 0;
  });
  saveProducts(products);
  writeJson(ORDERS_FILE, orders);
  const itemLines = pricedItems.map((item) => `${item.title} x${item.quantity} = ${item.price * item.quantity} IQD`).join('\n');
  const managerMessage = `New order ${order.id}\nCustomer: ${customer.name}\nPhone: ${customer.phone}\nAddress: ${customer.address}\n${customer.notes ? `Notes: ${customer.notes}\n` : ''}Items:\n${itemLines}\nTotal: ${order.total} IQD`;
  logActivity(req, 'order-created', { orderId: order.id, customer: customer.name, managerWhatsAppMessage: managerMessage });
  res.status(201).json({ ...order, managerWhatsAppUrl: `https://wa.me/${MANAGER_WHATSAPP}?text=${encodeURIComponent(managerMessage)}` });
});

app.get('/api/admin/orders', isAuthenticated, (req, res) => res.json(getJsonCollection(ORDERS_FILE)));
app.patch('/api/admin/orders/:id/status', isAuthenticated, (req, res) => {
  const allowedStatuses = ['Pending', 'Shipped', 'Delivered'];
  if (!allowedStatuses.includes(req.body.status)) return res.status(400).json({ message: 'Invalid order status.' });
  const orders = getJsonCollection(ORDERS_FILE);
  const order = orders.find((item) => item.id === req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  order.status = req.body.status;
  writeJson(ORDERS_FILE, orders);
  logActivity(req, 'order-status-updated', { orderId: order.id, status: order.status });
  res.json(order);
});

app.get('/api/admin/reviews', isAuthenticated, (req, res) => res.json(getJsonCollection(REVIEWS_FILE)));
app.patch('/api/admin/reviews/:id/approval', isAuthenticated, (req, res) => {
  const reviews = getJsonCollection(REVIEWS_FILE);
  const review = reviews.find((item) => item.id === req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found.' });
  review.approved = Boolean(req.body.approved);
  writeJson(REVIEWS_FILE, reviews);
  res.json(review);
});

app.get('/api/admin/availability-notifications', isAuthenticated, (req, res) => res.json(getJsonCollection(NOTIFICATIONS_FILE)));

app.get('/admin/invoice/:id', isAuthenticated, (req, res) => {
  const order = getJsonCollection(ORDERS_FILE).find((item) => item.id === req.params.id);
  if (!order) return res.status(404).send('Invoice not found.');
  res.type('html').send(`<!doctype html><html><head><title>Invoice ${order.id}</title><style>body{font-family:Arial;max-width:800px;margin:40px auto;color:#163d2b}table{width:100%;border-collapse:collapse}td,th{padding:10px;border-bottom:1px solid #ddd;text-align:left}button{padding:10px 16px}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Print / Save as PDF</button><h1>Ahmad Siwaily Nursery</h1><p>Invoice: ${order.id}<br>Date: ${order.createdAt}<br>Status: ${order.status}</p><h2>Customer</h2><p>${order.customer.name}<br>${order.customer.phone}<br>${order.customer.address}</p><table><thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead><tbody>${order.items.map((item) => `<tr><td>${item.title}</td><td>${item.quantity}</td><td>${item.price * item.quantity} IQD</td></tr>`).join('')}</tbody></table><p>Subtotal: ${order.subtotal} IQD<br>Discount: ${order.discount} IQD<br><strong>Total: ${order.total} IQD</strong></p></body></html>`);
});

app.get('/api/admin/activity-log', isAuthenticated, (req, res) => res.json(getJsonCollection(ACTIVITY_LOG_FILE)));
app.post('/api/admin/backup', isAuthenticated, isSuperAdmin, (req, res) => res.json({ success: true, file: backupDatabase() }));
setInterval(backupDatabase, 1000 * 60 * 60 * 24);

app.get('/products-manager', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'index.htmml.html'));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ message: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`\n🌿 Ahmad Siwaily Nursery is running on http://localhost:${PORT}`);
  console.log(`📲 Storefront: http://localhost:${PORT}/`);
  console.log(`🔐 Admin: http://localhost:${PORT}/admin/login`);
  console.log('👤 Admin: admin / admin123 | Super admin: superadmin / superadmin123\n');
});
