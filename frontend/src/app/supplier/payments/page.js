// Supplier Payments Page
'use client'
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import '@/styles/payments.css';

export default function SupplierPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'SUPPLIER') {
      fetchSupplierPayments();
    }
  }, [user]);

  const fetchSupplierPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`${process.env.NEXT_PUBLIC_API_PAYMENT_SERVICE}/api/supplier-payments?supplierId=${user._id}`);
      setPayments(res.data || []);
    } catch (err) {
      setPayments([]);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="users-title mb-6">My Supplier Payments</h1>
      <div className="users-table-container">
        {loading ? (
          <div className="users-loading">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="users-empty">No payments found.</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Restock Request</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Paid At</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment._id}>
                  <td>{payment._id.slice(-8)}</td>
                  <td>{payment.restockRequestId?.slice ? payment.restockRequestId.slice(-8) : payment.restockRequestId}</td>
                  <td>{payment.amount}</td>
                  <td>{payment.paymentMethod}</td>
                  <td>{payment.status}</td>
                  <td>{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
