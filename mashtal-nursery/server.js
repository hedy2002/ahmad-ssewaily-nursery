const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
  secret: 'mashtal-nursery-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 12 }
}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '.png');
    const filename = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, filename);
  }
});
const upload = multer({ storage });

function readJson(file) {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return [];
  }
}

function writeJson(file, data) {
  fs.writeFileSync(path.join(dataDir, file), JSON.stringify(data, null, 2));
}

const adminUser = {
  username: 'admin',
  password: 'admin123'
};

app.get('/', (req, res) => {
  const products = readJson('products.json');
  res.render('storefront/index', {
    title: 'Mashtal Nursery',
    products,
    cart: req.session.cart || []
  });
});

app.get('/shop', (req, res) => {
  const products = readJson('products.json');
  res.render('storefront/shop', {
    title: 'Shop - Mashtal Nursery',
    products,
    cart: req.session.cart || []
  });
});

app.get('/product/:id', (req, res) => {
  const products = readJson('products.json');
  const product = products.find(p => String(p.id) === String(req.params.id));
  if (!product) return res.status(404).send('Product not found');

  res.render('storefront/product-details', {
    title: product.title,
    product,
    cart: req.session.cart || []
  });
});

app.post('/cart/add', (req, res) => {
  const products = readJson('products.json');
  const { productId } = req.body;
  const product = products.find(p => String(p.id) === String(productId));

  if (!product) return res.json({ success: false, message: 'Product not found' });

  if (!req.session.cart) req.session.cart = [];

  const existingIndex = req.session.cart.findIndex(item => item.id === product.id);
  if (existingIndex >= 0) {
    req.session.cart[existingIndex].qty += 1;
  } else {
    req.session.cart.push({ id: product.id, title: product.title, price: product.price, qty: 1, image: product.image });
  }

  res.json({ success: true, cartCount: req.session.cart.reduce((total, item) => total + item.qty, 0) });
});

app.get('/cart', (req, res) => {
  res.render('storefront/cart', {
    title: 'Your Cart',
    cart: req.session.cart || [],
    total: (req.session.cart || []).reduce((sum, item) => sum + item.price * item.qty, 0)
  });
});

app.post('/cart/update', (req, res) => {
  const { id, qty } = req.body;
  if (!req.session.cart) req.session.cart = [];
  req.session.cart = req.session.cart.map(item => {
    if (String(item.id) === String(id)) {
      return { ...item, qty: Math.max(1, Number(qty) || 1) };
    }
    return item;
  });
  res.redirect('/cart');
});

app.post('/cart/remove', (req, res) => {
  const { id } = req.body;
  if (!req.session.cart) req.session.cart = [];
  req.session.cart = req.session.cart.filter(item => String(item.id) !== String(id));
  res.redirect('/cart');
});

app.get('/checkout', (req, res) => {
  const cart = req.session.cart || [];
  if (!cart.length) return res.redirect('/shop');

  res.render('storefront/checkout', {
    title: 'Checkout',
    cart,
    total: cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  });
});

app.post('/checkout', (req, res) => {
  const { customerName, phone, address } = req.body;
  const cart = req.session.cart || [];

  if (!cart.length) return res.redirect('/shop');

  const orders = readJson('orders.json');
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  orders.push({
    id: Date.now(),
    customerName,
    phone,
    address,
    items: cart,
    total,
    createdAt: new Date().toISOString()
  });

  writeJson('orders.json', orders);
  req.session.cart = [];
  res.render('storefront/order-success', {
    title: 'Order Placed',
    order: { customerName, total, id: Date.now() }
  });
});

app.post('/contact', (req, res) => {
  const { name, email, phone, message } = req.body;
  const contacts = readJson('contacts.json');
  contacts.unshift({
    id: Date.now(),
    name,
    email,
    phone,
    message,
    createdAt: new Date().toISOString()
  });
  writeJson('contacts.json', contacts);
  res.redirect('/');
});

app.get('/admin/login', (req, res) => {
  res.render('admin/login', { title: 'Admin Login', error: null });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === adminUser.username && password === adminUser.password) {
    req.session.admin = true;
    return res.redirect('/admin');
  }

  res.render('admin/login', { title: 'Admin Login', error: 'Invalid username or password.' });
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

function requireAdmin(req, res, next) {
  if (req.session.admin) return next();
  res.redirect('/admin/login');
}

app.get('/admin', requireAdmin, (req, res) => {
  const products = readJson('products.json');
  const orders = readJson('orders.json');
  const contacts = readJson('contacts.json');
  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    products,
    orders,
    contacts
  });
});

app.get('/admin/products/new', requireAdmin, (req, res) => {
  res.render('admin/product-form', { title: 'Add Product', product: null, error: null });
});

app.post('/admin/products/new', requireAdmin, upload.single('image'), (req, res) => {
  const products = readJson('products.json');
  const { title, category, price, description, stock } = req.body;

  const imagePath = req.file ? '/uploads/' + req.file.filename : '/public/images/placeholder-plant.jpg';

  products.push({
    id: Date.now(),
    title,
    category,
    price: Number(price),
    description,
    stock: Number(stock),
    image: imagePath,
    featured: false
  });

  writeJson('products.json', products);
  res.redirect('/admin');
});

app.get('/admin/products/edit/:id', requireAdmin, (req, res) => {
  const products = readJson('products.json');
  const product = products.find(p => String(p.id) === String(req.params.id));
  if (!product) return res.redirect('/admin');
  res.render('admin/product-form', { title: 'Edit Product', product, error: null });
});

app.post('/admin/products/edit/:id', requireAdmin, upload.single('image'), (req, res) => {
  const products = readJson('products.json');
  const id = Number(req.params.id);
  const productIndex = products.findIndex(p => p.id === id);

  if (productIndex === -1) return res.redirect('/admin');

  const updated = {
    ...products[productIndex],
    title: req.body.title,
    category: req.body.category,
    price: Number(req.body.price),
    description: req.body.description,
    stock: Number(req.body.stock)
  };

  if (req.file) {
    updated.image = '/uploads/' + req.file.filename;
  }

  products[productIndex] = updated;
  writeJson('products.json', products);
  res.redirect('/admin');
});

app.post('/admin/products/delete/:id', requireAdmin, (req, res) => {
  let products = readJson('products.json');
  products = products.filter(p => String(p.id) !== String(req.params.id));
  writeJson('products.json', products);
  res.redirect('/admin');
});

app.listen(PORT, () => {
  console.log(`Mashtal Nursery app running at http://localhost:${PORT}`);
});
