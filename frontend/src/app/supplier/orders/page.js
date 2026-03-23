"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function SupplierOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && user.role === "SUPPLIER") {
      fetchOrdersAndProducts();
    }
  }, [user]);

  const fetchOrdersAndProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get all products for this supplier
      const prodRes = await api.get(`${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/products`);
      const supplierProducts = prodRes.data.filter(p => p.supplier === user._id);
      setProducts(supplierProducts);
      // Get all orders
      const orderRes = await api.get(`${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/orders`);
      // Only show orders for this supplier's products
      const supplierProductIds = new Set(supplierProducts.map(p => p._id));
      const supplierOrders = orderRes.data.filter(o => supplierProductIds.has(o.productId));
      setOrders(supplierOrders);
    } catch (err) {
      setError("Failed to load orders");
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Orders</h1>
      {loading ? (
        <p>Loading orders...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-600">No orders found for your products.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Order ID</th>
                <th className="px-4 py-2 border">Product</th>
                <th className="px-4 py-2 border">Quantity</th>
                <th className="px-4 py-2 border">Total</th>
                <th className="px-4 py-2 border">Status</th>
                <th className="px-4 py-2 border">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const product = products.find(p => p._id === order.productId);
                return (
                  <tr key={order._id}>
                    <td className="px-4 py-2 border">{order._id.slice(-8)}</td>
                    <td className="px-4 py-2 border">{product ? product.name : order.productId}</td>
                    <td className="px-4 py-2 border">{order.quantity}</td>
                    <td className="px-4 py-2 border">Rs. {order.totalAmount?.toFixed(2)}</td>
                    <td className="px-4 py-2 border">{order.status}</td>
                    <td className="px-4 py-2 border">{new Date(order.createdAt).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
