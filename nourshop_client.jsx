// File: src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import AdminLogin from './pages/AdminLogin'
import AdminPanel from './pages/AdminPanel'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import './index.css'

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/product/:id' element={<ProductDetails />} />
        <Route path='/cart' element={<Cart />} />
        <Route path='/checkout' element={<Checkout />} />
        <Route path='/admin' element={<AdminLogin />} />
        <Route path='/panel' element={<AdminPanel />} />
      </Routes>
      <Footer />
    </Router>
  )
}

export default App


// File: src/components/Navbar.jsx
import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className='p-4 shadow flex justify-between items-center bg-white sticky top-0 z-50'>
      <Link to='/' className='text-xl font-bold'>نورشاپ</Link>
      <Link to='/cart' className='text-sm'>سبد خرید</Link>
    </nav>
  )
}


// File: src/components/Footer.jsx
export default function Footer() {
  return (
    <footer className='p-4 text-center text-sm bg-gray-100 mt-10'>
      © {new Date().getFullYear()} نورشاپ - تمام حقوق محفوظ است.
    </footer>
  )
}


// File: src/pages/Home.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
  }, [])

  return (
    <div className='p-4 grid grid-cols-2 md:grid-cols-4 gap-4'>
      {products.map(p => (
        <Link to={`/product/${p._id}`} key={p._id} className='border rounded p-2'>
          <img src={p.image} alt={p.name} className='w-full h-40 object-cover rounded' />
          <h2 className='text-sm font-bold mt-2'>{p.name}</h2>
          <p className='text-xs'>{p.price} تومان</p>
        </Link>
      ))}
    </div>
  )
}


// File: src/pages/ProductDetails.jsx
import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function ProductDetails() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)

  useEffect(() => {
    fetch(`http://localhost:5000/api/products/${id}`)
      .then(res => res.json())
      .then(data => setProduct(data))
  }, [id])

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || []
    const found = cart.find(item => item._id === product._id)
    if (found) found.qty += 1
    else cart.push({ ...product, qty: 1 })
    localStorage.setItem('cart', JSON.stringify(cart))
    alert('به سبد اضافه شد')
  }

  if (!product) return <p>در حال بارگذاری...</p>

  return (
    <div className='p-4'>
      <img src={product.image} alt={product.name} className='w-full h-60 object-cover rounded mb-4' />
      <h1 className='text-xl font-bold'>{product.name}</h1>
      <p className='text-sm mt-2'>{product.description}</p>
      <p className='text-md font-bold mt-2'>{product.price} تومان</p>
      <button onClick={addToCart} className='mt-4 bg-black text-white px-4 py-2 rounded'>افزودن به سبد</button>
    </div>
  )
}


// File: src/pages/Cart.jsx
import { Link } from 'react-router-dom'

export default function Cart() {
  const cart = JSON.parse(localStorage.getItem('cart')) || []

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold mb-4'>سبد خرید</h1>
      {cart.length === 0 ? <p>سبد خرید خالی است</p> : (
        <div className='space-y-4'>
          {cart.map((item, i) => (
            <div key={i} className='border p-2 rounded'>
              <h2 className='text-sm font-bold'>{item.name}</h2>
              <p className='text-xs'>تعداد: {item.qty}</p>
              <p className='text-xs'>قیمت: {item.price * item.qty} تومان</p>
            </div>
          ))}
          <Link to='/checkout' className='inline-block mt-4 bg-green-600 text-white px-4 py-2 rounded'>ادامه خرید</Link>
        </div>
      )}
    </div>
  )
}


// File: src/pages/Checkout.jsx
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Checkout() {
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const navigate = useNavigate()

  const submitOrder = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || []
    if (cart.length === 0) return alert('سبد خرید خالی است')
    fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items: cart })
    })
      .then(res => res.json())
      .then(() => {
        alert('سفارش با موفقیت ثبت شد')
        localStorage.removeItem('cart')
        navigate('/')
      })
  }

  return (
    <div className='p-4 space-y-4'>
      <h1 className='text-xl font-bold'>تکمیل سفارش</h1>
      <input className='border p-2 w-full' placeholder='نام' onChange={e => setForm({ ...form, name: e.target.value })} />
      <input className='border p-2 w-full' placeholder='شماره تماس' onChange={e => setForm({ ...form, phone: e.target.value })} />
      <textarea className='border p-2 w-full' placeholder='آدرس' onChange={e => setForm({ ...form, address: e.target.value })} />
      <button onClick={submitOrder} className='bg-black text-white px-4 py-2 rounded'>ارسال سفارش</button>
    </div>
  )
}


// File: src/pages/AdminLogin.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = () => {
    fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          localStorage.setItem('token', data.token)
          navigate('/panel')
        } else {
          alert('خطا در ورود')
        }
      })
  }

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold mb-4'>ورود مدیر</h1>
      <input className='border p-2 w-full' placeholder='نام کاربری' onChange={e => setUsername(e.target.value)} />
      <input className='border p-2 w-full mt-2' placeholder='رمز عبور' type='password' onChange={e => setPassword(e.target.value)} />
      <button onClick={handleLogin} className='bg-black text-white px-4 py-2 mt-4 rounded'>ورود</button>
    </div>
  )
}


// File: src/pages/AdminPanel.jsx
import { useEffect, useState } from 'react'

export default function AdminPanel() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('http://localhost:5000/api/orders', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setOrders(data))
  }, [])

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold mb-4'>سفارش‌ها</h1>
      {orders.map((o, i) => (
        <div key={i} className='border p-3 mb-4 rounded'>
          <h2 className='text-sm font-bold'>سفارش توسط: {o.name}</h2>
          <p className='text-xs'>تلفن: {o.phone} - آدرس: {o.address}</p>
          <ul className='text-xs mt-2 list-disc pl-4'>
            {o.items.map((item, j) => (
              <li key={j}>{item.name} × {item.qty}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
