"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import '@/styles/admin-products.css';
import '@/styles/users.css';
import '@/styles/analytics.css';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { downloadProductsPDF, downloadProductsExcel } from '@/lib/reportGenerator';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [exporting, setExporting] = useState(null); // 'pdf' | 'excel' | null
    // Report export handlers
    const handleExport = async (format) => {
      setExporting(format);
      try {
        // Prepare product data for export
        const exportData = products.map(p => ({
          name: p.name,
          description: p.description,
          category: p.category,
          price: p.price,
          stock: p.quantity,
          supplier: suppliers[p.supplier] || p.supplier || '-',
          status: p.status,
          rejectionReason: p.rejectionReason || '-'
        }));
        const payload = { products: exportData, generatedAt: new Date() };
        if (format === 'pdf')   await downloadProductsPDF(payload);
        if (format === 'excel') await downloadProductsExcel(payload);
      } catch (err) {
        alert('Export failed. Please try again.');
      } finally {
        setExporting(null);
      }
    };
  // Removed add product modal state and form state since admin can't add products

    useEffect(() => {
      fetchProducts();
    }, []);

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all products
        const res = await api.get(`${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/products`);
        setProducts(res.data);
        // Fetch supplier details for each product
        const supplierIds = Array.from(new Set(res.data.map(p => p.supplier).filter(Boolean)));
        const supplierMap = {};
        await Promise.all(supplierIds.map(async (id) => {
          try {
            const userRes = await api.get(`${process.env.NEXT_PUBLIC_API_USER_SERVICE}/api/users/${id}`);
            supplierMap[id] = userRes.data.username || userRes.data.email || id;
          } catch {
            supplierMap[id] = id;
          }
        }));
        setSuppliers(supplierMap);
      } catch (err) {
        setError("Failed to load products");
      }
      setLoading(false);
    };

    const handleAddProduct = async (e) => {
      e.preventDefault();
      setActionLoading(true);
      try {
        await api.post(`${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/products`, {
          ...addForm,
          price: Number(addForm.price),
          quantity: Number(addForm.quantity)
        });
        setShowAddModal(false);
        setAddForm({ name: '', description: '', price: '', quantity: '', category: '', sku: '' });
        fetchProducts();
      } catch (err) {
        alert("Failed to add product");
      }
      setActionLoading(false);
    };

    const handleDelete = async (id) => {
      if (!window.confirm('Delete this product?')) return;
      setActionLoading(true);
      try {
        await api.delete(`${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/products/${id}`);
        fetchProducts();
      } catch (err) {
        alert("Failed to delete product");
      }
      setActionLoading(false);
    };

    const handleApprove = async (id) => {
      setActionLoading(true);
      try {
        await api.put(`${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/products/${id}/approve`);
        fetchProducts();
      } catch (err) {
        alert("Failed to approve product");
      }
      setActionLoading(false);
    };

    const handleReject = async (id) => {
      const reason = prompt("Enter rejection reason:");
      if (!reason) return;
      setActionLoading(true);
      try {
        await api.put(`${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/products/${id}/reject`, { reason });
        fetchProducts();
      } catch (err) {
        alert("Failed to reject product");
      }
      setActionLoading(false);
    };

    return (
      <div className="admin-products-page">
        <div className="users-header" style={{marginBottom:'1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem'}}>
          <h1 className="users-title" style={{marginBottom:0}}>Products Management</h1>
          <div className="analytics-export-group">
            <button
              className="btn-export btn-export-excel"
              onClick={() => handleExport('excel')}
              disabled={!!exporting}
            >
              <FaFileExcel />
              {exporting === 'excel' ? 'Generating…' : 'Export Excel'}
            </button>
            <button
              className="btn-export btn-export-pdf"
              onClick={() => handleExport('pdf')}
              disabled={!!exporting}
            >
              <FaFilePdf />
              {exporting === 'pdf' ? 'Generating…' : 'Export PDF'}
            </button>
          </div>
        </div>
        <div className="users-table-container">
          {loading ? (
            <div className="users-loading">Loading...</div>
          ) : error ? (
            <div className="admin-products-error">{error}</div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>DESCRIPTION</th>
                  <th>CATEGORY</th>
                  <th>PRICE</th>
                  <th>STOCK</th>
                  <th>SUPPLIER</th>
                  <th>STATUS</th>
                  <th>REJECTION REASON</th>
                  <th style={{textAlign:'center'}}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td style={{fontWeight:600}}>{product.name}</td>
                    <td>{product.description}</td>
                    <td>{product.category}</td>
                    <td><span style={{color:'#312e81',fontWeight:600}}>Rs. {Number(product.price).toLocaleString()}</span></td>
                    <td>
                      <span style={{color:product.quantity<=10?'#f59e42':'#059669',fontWeight:600}}>{product.quantity}</span>
                    </td>
                    <td>{suppliers[product.supplier] || '-'}</td>
                    <td>
                      {product.status === 'ACTIVE' && (
                        <span className="user-role-badge badge-admin" style={{background:'#ECFDF5',color:'#047857',fontWeight:700}}>ACTIVE</span>
                      )}
                      {product.status === 'REJECTED' && (
                        <span className="user-role-badge badge-admin" style={{background:'#FEF2F2',color:'#DC2626',fontWeight:700}}>REJECTED</span>
                      )}
                      {product.status === 'PENDING' && (
                        <span className="user-role-badge badge-admin" style={{background:'#FEF9C3',color:'#B45309',fontWeight:700}}>PENDING</span>
                      )}
                    </td>
                    <td>{product.rejectionReason || '-'}</td>
                    <td style={{minWidth:120, textAlign:'center'}}>
                      <div style={{display:'flex', gap:'0.5rem', justifyContent:'center'}}>
                        {product.status === 'PENDING' && (
                          <>
                            <button className="user-edit-btn" onClick={() => handleApprove(product._id)} disabled={actionLoading}>Approve</button>
                            <button className="user-reject-btn" onClick={() => handleReject(product._id)} disabled={actionLoading}>Reject</button>
                          </>
                        )}
                        <button className="user-delete-btn" onClick={() => handleDelete(product._id)} disabled={actionLoading}>Delete</button>
                      </div>
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

