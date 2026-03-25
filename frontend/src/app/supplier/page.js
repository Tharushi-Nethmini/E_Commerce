"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import api from "@/lib/api";
import styles from "@/styles/supplier-panel.module.css";
import { FaBox, FaShoppingCart , FaBell, FaChartLine } from "react-icons/fa";
import { useRouter as useNextRouter } from "next/navigation";

export default function SupplierHomePage() {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    productCount: 0,
    unreadNotifications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (user.role !== "SUPPLIER") {
      router.push("/");
    } else {
      fetchStats();
    }
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    setStats((prev) => ({ ...prev, unreadNotifications: notifications.filter(n => !n.read).length }));
  }, [notifications]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch products
      const prodRes = await api.get(`${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/products`);
      const supplierProducts = prodRes.data.filter(p => p.supplier === user._id);
      // Fetch orders
      const orderRes = await api.get(`${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/orders`);
      const supplierProductIds = new Set(supplierProducts.map(p => p._id));
      const supplierOrders = orderRes.data.filter(o => supplierProductIds.has(o.productId));
      // Active orders (not FULFILLED or PAID)
      const activeOrders = supplierOrders.filter(o => o.status !== "FULFILLED" && o.status !== "PAID");
      setStats({
        totalOrders: supplierOrders.length,
        activeOrders: activeOrders.length,
        productCount: supplierProducts.length,
        unreadNotifications: notifications.filter(n => !n.read).length,
      });
    } catch (err) {
      // fallback to zeros
      setStats({
        totalOrders: 0,
        activeOrders: 0,
        productCount: 0,
        unreadNotifications: notifications.filter(n => !n.read).length,
      });
    }
    setLoading(false);
  };

  const quickActions = [
    {
      icon: <FaShoppingCart style={{ color: "#10b981" }} />, label: "My Orders", desc: "Track your orders", href: "/supplier/orders"
    },
    {
      icon: <FaBell style={{ color: "#ff4d6d" }} />, label: "Notifications", desc: "View all notifications", href: "/supplier/notifications"
    },
    {
      icon: <FaBox style={{ color: "#3a2fa4" }} />, label: "Profile", desc: "Edit your profile", href: "/supplier/profile"
    },
  ];

  const nextRouter = useNextRouter();

  return (
    <div className={styles.supplierPanelContainer}>
      <div className={styles.supplierPanelInner}>
        <div className={styles.supplierPanelHero}>
          <div>
            <h1>Welcome back, {user?.username}!</h1>
            <div className={styles.supplierPanelHeroText}>
              Here&apos;s what&apos;s happening with your account today.
            </div>
          </div>
          <FaBox size={80} style={{ opacity: 0.15 }} />
        </div>
        {/* Help Section */}
        <div style={{ margin: '32px 0 24px 0', background: '#f9fafb', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px #7c3aed11' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Need Help?</h2>
          <div style={{ color: '#555', marginBottom: 8 }}>
            If you have any questions or need support, please check our
            <a href="/supplier/guide" style={{ color: '#7c3aed', textDecoration: 'underline', marginLeft: 4 }}>Supplier Guide</a>
            or
            <a href="/supplier/support" style={{ color: '#7c3aed', textDecoration: 'underline', marginLeft: 4 }}>contact support</a>.
          </div>
        </div>

        {/* Announcements Section */}
        <div style={{ margin: '0 0 24px 0', background: '#fef9c3', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px #f59e4211' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Announcements</h2>
          <ul style={{ color: '#7c3aed', margin: 0, padding: 0, listStyle: 'disc inside' }}>
            <li>New product approval workflow launched!</li>
            <li>Contact support for onboarding help.</li>
          </ul>
        </div>

        
        <div className={styles.supplierPanelQuickActionsTitle}>Quick Actions</div>
        <div className={styles.supplierPanelQuickActions}>
          {quickActions.map((action, idx) => (
            <div
              key={action.label}
              className={styles.supplierPanelQuickAction}
              onClick={() => nextRouter.push(action.href)}
            >
              <div className={styles.supplierPanelQuickActionTitle}>{action.icon} {action.label}</div>
              <div className={styles.supplierPanelQuickActionDesc}>{action.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
