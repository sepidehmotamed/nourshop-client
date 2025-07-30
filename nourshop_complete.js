// File: app.js
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

// Routes
const productRoutes = require('./routes/productRoutes')
const orderRoutes = require('./routes/orderRoutes')
const adminRoutes = require('./routes/adminRoutes')

app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/admin', adminRoutes)

// Start server
const PORT = process.env.PORT || 5000
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch(err => console.error(err))


// File: models/Product.js
const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  image: String,
  description: String,
  category: String
})

module.exports = mongoose.model('Product', productSchema)


// File: models/Order.js
const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
  name: String,
  phone: String,
  address: String,
  items: [
    {
      _id: String,
      name: String,
      price: Number,
      qty: Number,
      image: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Order', orderSchema)


// File: models/Admin.js
const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
  username: String,
  password: String // hashed password
})

module.exports = mongoose.model('Admin', adminSchema)


// File: middleware/auth.js
const jwt = require('jsonwebtoken')

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Access denied' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.admin = decoded
    next()
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' })
  }
}

module.exports = authMiddleware


// File: routes/productRoutes.js
const express = require('express')
const router = express.Router()
const Product = require('../models/Product')
const auth = require('../middleware/auth')

// GET all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find()
    res.json(products)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

// GET product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    res.json(product)
  } catch (err) {
    res.status(404).json({ error: 'Product not found' })
  }
})

// POST create new product (protected)
router.post('/', auth, async (req, res) => {
  try {
    const newProduct = new Product(req.body)
    const savedProduct = await newProduct.save()
    res.json(savedProduct)
  } catch (err) {
    res.status(400).json({ error: 'Failed to save product' })
  }
})

module.exports = router


// File: routes/orderRoutes.js
const express = require('express')
const router = express.Router()
const Order = require('../models/Order')
const auth = require('../middleware/auth')

// POST create order
router.post('/', async (req, res) => {
  try {
    const order = new Order(req.body)
    const savedOrder = await order.save()
    res.status(201).json(savedOrder)
  } catch (err) {
    res.status(400).json({ error: 'Failed to create order' })
  }
})

// GET all orders (protected)
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

module.exports = router


// File: routes/adminRoutes.js
const express = require('express')
const router = express.Router()
const Admin = require('../models/Admin')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  try {
    const admin = await Admin.findOne({ username })
    if (!admin) return res.status(404).json({ error: 'Admin not found' })

    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) return res.status(401).json({ error: 'Wrong password' })

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '2h' })
    res.json({ token })
  } catch (err) {
    res.status(500).json({ error: 'Login failed' })
  }
})

// Optional: create initial admin manually
router.post('/seed', async (req, res) => {
  const { username, password } = req.body
  const hashed = await bcrypt.hash(password, 10)
  const admin = new Admin({ username, password: hashed })
  await admin.save()
  res.json({ message: 'Admin created' })
})

module.exports = router
