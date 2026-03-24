"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FaBox, FaShoppingCart, FaCreditCard } from "react-icons/fa";

export default function SupplierHomePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (user.role !== "SUPPLIER") {
      router.push("/");
    }
  }, [user, router]);

  return (
    <div style={{ background: "#f7f7fa", minHeight: "100vh", padding: "2rem 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ background: "#7c3aed", color: "#fff", borderRadius: 24, padding: "2.5rem 2rem", marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 24px #7c3aed22" }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
              Welcome back, {user?.username}!
            </h1>
            <div style={{ fontSize: 18, opacity: 0.95 }}>
              Here&apos;s what&apos;s happening with your account today.
            </div>
          </div>
          <FaBox size={80} style={{ opacity: 0.15 }} />
        </div>

        <div style={{ display: "flex", gap: 24, marginBottom: 32 }}>
          <div style={{ flex: 1, background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px #7c3aed11", display: "flex", alignItems: "center", gap: 16 }}>
            <FaShoppingCart size={32} style={{ color: "#7c3aed" }} />
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>0</div>
              <div style={{ color: "#555" }}>Total Orders</div>
            </div>
          </div>
          <div style={{ flex: 1, background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px #7c3aed11", display: "flex", alignItems: "center", gap: 16 }}>
            <FaBox size={32} style={{ color: "#f59e42" }} />
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>0</div>
              <div style={{ color: "#555" }}>Active Orders</div>
            </div>
          </div>
          <div style={{ flex: 1, background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px #7c3aed11", display: "flex", alignItems: "center", gap: 16 }}>
            <FaCreditCard size={32} style={{ color: "#10b981" }} />
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>Rs. 0.00</div>
              <div style={{ color: "#555" }}>Total Spent</div>
            </div>
          </div>
        </div>

        <div style={{ fontWeight: 600, fontSize: 22, marginBottom: 16 }}>Quick Actions</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
          <div style={{ flex: "1 1 320px", background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px #7c3aed11", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontWeight: 600, fontSize: 18 }}>
              <FaBox style={{ color: "#7c3aed" }} /> Browse Products
            </div>
            <div style={{ color: "#888", marginTop: 4 }}>Explore our full catalog</div>
          </div>
          <div style={{ flex: "1 1 320px", background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px #7c3aed11", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontWeight: 600, fontSize: 18 }}>
              <FaShoppingCart style={{ color: "#10b981" }} /> My Orders
            </div>
            <div style={{ color: "#888", marginTop: 4 }}>Track your orders</div>
          </div>
          <div style={{ flex: "1 1 320px", background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px #7c3aed11", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontWeight: 600, fontSize: 18 }}>
              <FaCreditCard style={{ color: "#10b981" }} /> My Payments
            </div>
            <div style={{ color: "#888", marginTop: 4 }}>View payment history</div>
          </div>
        </div>
      </div>
    </div>
  );
}
