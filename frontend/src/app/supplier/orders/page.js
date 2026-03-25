"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import '@/styles/users.css';
import { FaCheck } from 'react-icons/fa';


export default function SupplierOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [restockRequests, setRestockRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    if (user && user.role === "SUPPLIER") {
      fetchOrdersProductsAndRestocks();
    }
  }, [user]);


  const fetchOrdersProductsAndRestocks = async () => {
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

      // Fetch restock requests for this supplier
      const restockRes = await api.get(`${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/restock-requests`);
      setRestockRequests(restockRes.data);
    } catch (err) {
      setError("Failed to load orders or restock requests");
    }
    setLoading(false);
  };

  // Handler for supplier to fulfill restock request
  const handleRestock = async (requestId) => {
    if (!confirm('Mark this restock request as fulfilled?')) return;
    try {
      await api.patch(`${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/restock-requests/${requestId}/fulfill`);
      // Refresh list
      fetchOrdersProductsAndRestocks();
    } catch (err) {
      alert('Failed to fulfill restock request.');
    }
  };

  return (
    <div className="p-6">
      <h1 className="users-title mb-6">Admin Restock Requests</h1>
      <div className="users-table-container">
        {loading ? (
          <div className="users-loading">Loading restock requests...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : restockRequests.length === 0 ? (
          <div className="users-empty">No restock requests for your products.</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Requested At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {restockRequests.map(req => (
                <tr key={req._id}>
                  <td>{req._id.slice(-8)}</td>
                  <td>{req.productId?.name || (req.productId?._id || req.productId)}</td>
                  <td>{req.quantity}</td>
                  <td>{req.status}</td>
                  <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td>
                    {req.status === 'PENDING' ? (
                      <button
                        className="user-edit-btn"
                        title="Mark as Fulfilled"
                        onClick={() => handleRestock(req._id)}
                      >
                        <FaCheck /> Restock
                      </button>
                    ) : (req.status === 'FULFILLED' || req.status === 'PAID') ? (
                      <button
                        className="user-edit-btn"
                        style={{ opacity: 0.6, cursor: 'not-allowed' }}
                        disabled
                        title="Restocked"
                      >
                        <FaCheck /> Restocked
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
