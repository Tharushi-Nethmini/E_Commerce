'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  FaHome, FaBox, FaShoppingCart, FaCreditCard, FaUsers,
  FaSignOutAlt, FaUserCircle, FaChartBar, FaStore
} from 'react-icons/fa'
import NotificationIcon from './NotificationIcon'
import '@/styles/navbar.css'
import '@/styles/notification.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const isActive = (path) => pathname === path ? 'active' : ''
  const isAdmin = user.role === 'ADMIN'
  const isSupplier = user.role === 'SUPPLIER'

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <Link href={isAdmin ? '/admin/analytics' : isSupplier ? '/supplier' : '/home'} className="navbar-logo">
            <FaStore className="navbar-logo-icon" />
            <span>NexMart</span>
          </Link>

          <div className="navbar-menu">
            {/* Admin: Analytics first */}
            {isAdmin && (
              <>
                <Link href="/admin/analytics" className={`navbar-link ${isActive('/admin/analytics')}`}> 
                  <FaChartBar />
                  <span>Analytics</span>
                </Link>
                <Link href="/admin/products" className={`navbar-link ${isActive('/admin/products')}`}> 
                  <FaBox />
                  <span>Products</span>
                </Link>
                <Link href="/admin/orders" className={`navbar-link ${isActive('/admin/orders')}`}> 
                  <FaShoppingCart />
                  <span>Orders</span>
                </Link>
                <Link href="/admin/payments" className={`navbar-link ${isActive('/admin/payments')}`}> 
                  <FaCreditCard />
                  <span>Payments</span>
                </Link>
                <Link href="/admin/users" className={`navbar-link ${isActive('/admin/users')}`}> 
                  <FaUsers />
                  <span>Users</span>
                </Link>
              </>
            )}

            {/* Supplier: Supplier Panel navigation */}
            {isSupplier && (
              <>
                <Link href="/supplier" className={`navbar-link ${isActive('/supplier')}`}> 
                  <FaChartBar />
                  <span>Supplier Panel</span>
                </Link>
                <Link href="/supplier/products" className={`navbar-link ${isActive('/supplier/products')}`}> 
                  <FaBox />
                  <span>Products</span>
                </Link>
                <Link href="/supplier/orders" className={`navbar-link ${isActive('/supplier/orders')}`}> 
                  <FaShoppingCart />
                  <span>Orders</span>
                </Link>
              </>
            )}
            {/* User navigation (not admin, not supplier) */}
            {!isAdmin && !isSupplier && (
              <>
                <Link href="/home" className={`navbar-link ${isActive('/home')}`}>
                  <FaHome />
                  <span>Home</span>
                </Link>
                <Link href="/products" className={`navbar-link ${isActive('/products')}`}>
                  <FaBox />
                  <span>Products</span>
                </Link>
                <Link href="/orders" className={`navbar-link ${isActive('/orders')}`}>
                  <FaShoppingCart />
                  <span>Orders</span>
                </Link>
                <Link href="/payments" className={`navbar-link ${isActive('/payments')}`}>
                  <FaCreditCard />
                  <span>Payments</span>
                </Link>
              </>
            )}

            {/* Cart only for customers */}
            {!isAdmin && !isSupplier && (
              <Link href="/cart" className={`navbar-link ${isActive('/cart')}`}>
                <FaShoppingCart />
                <span>Cart</span>
              </Link>
            )}

            {/* Users link for admin moved above with /admin/users */}
          </div>

          <div className="navbar-right">
            {isSupplier && <NotificationIcon />}
            <Link href="/profile" className={`navbar-profile-link ${isActive('/profile')}`}>
              <FaUserCircle />
              <span>{user.username}</span>
            </Link>
            <button onClick={logout} className="navbar-logout-btn">
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
