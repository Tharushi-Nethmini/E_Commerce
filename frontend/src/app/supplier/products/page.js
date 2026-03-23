"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { FaPlus, FaEdit, FaTrash, FaImage } from "react-icons/fa";
import "@/styles/supplier-products.css";
import "@/styles/products.css";

function SupplierProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    category: "",
    sku: ""
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && user.role === "SUPPLIER") {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/products`);
      console.log("Supplier products:", res.data); // DEBUG LOG
      setProducts(res.data);
    } catch (err) {
      setError("Failed to load products");
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (productId) => {
    if (!imageFile) return;
    const formDataImg = new FormData();
    formDataImg.append("image", imageFile);
    await api.post(
      `${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/products/${productId}/image`,
      formDataImg,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      for (const key of ["name", "description", "price", "quantity", "category", "sku"]) {
        if (!formData[key]) {
          setFormError("All fields are required.");
          setSubmitting(false);
          return;
        }
      }
      // Ensure price and quantity are numbers
      const submitData = {
        ...formData,
        price: Number(formData.price),
        quantity: Number(formData.quantity)
      };
      let productId;
      if (editingProduct) {
        productId = editingProduct._id;
        await api.put(
          `${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/products/${productId}`,
          submitData
        );
      } else {
        const response = await api.post(
          `${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/products`,
          submitData
        );
        productId = response.data._id || response.data.id;
      }
      if (imageFile && productId) {
        await uploadImage(productId);
      }
      setShowModal(false);
      setEditingProduct(null);
      setFormData({ name: "", description: "", price: "", quantity: "", category: "", sku: "" });
      setImageFile(null);
      setImagePreview(null);
      fetchProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save product");
    }
    setSubmitting(false);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
      category: product.category,
      sku: product.sku
    });
    setImageFile(null);
    setImagePreview(product.imageUrl || null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await api.delete(`${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/products/${id}`);
        fetchProducts();
      } catch (err) {
        alert("Failed to delete product");
      }
    }
  };

  return (
    <div className="supplier-products-page">
      <div className="products-header">
        <h1 className="products-title">My Products</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({ name: "", description: "", price: "", quantity: "", category: "", sku: "" });
            setImageFile(null);
            setImagePreview(null);
            setShowModal(true);
          }}
          className="products-add-btn"
        >
          <FaPlus style={{ marginRight: 6, fontSize: 16 }} /> Add Product
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: "#ef4444" }}>{error}</div>
      ) : products.length === 0 ? (
        <div>No products found.</div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product._id} className="product-card">
              {product.imageUrl ? (
                <div className="product-image-container">
                  <img src={product.imageUrl} alt={product.name} className="product-image" />
                </div>
              ) : (
                <div className="product-image-container">
                  <div className="product-image-placeholder">
                    <FaImage />
                  </div>
                </div>
              )}
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-details">
                  <p>
                    <span className="product-detail-label">Price</span>
                    <span className="product-detail-value price">Rs. {product.price}</span>
                  </p>
                  <p>
                    <span className="product-detail-label">Stock</span>
                    <span className={product.quantity <= 10 ? "product-detail-value low-stock" : "product-detail-value"}>{product.quantity} units</span>
                  </p>
                  <p>
                    <span className="product-detail-label">Category</span>
                    <span className="product-detail-value">{product.category}</span>
                  </p>
                  <p>
                    <span className="product-detail-label">SKU</span>
                    <span className="product-detail-value sku">{product.sku}</span>
                  </p>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span className={`product-detail-label`}>Status</span>
                  <span className={`product-detail-value ${product.status}`}> {product.status}</span>
                  {product.status === "REJECTED" && (
                    <span style={{ color: "#ef4444", fontSize: "0.85rem", marginLeft: 8 }}>Reason: {product.rejectionReason}</span>
                  )}
                </div>
                <div className="product-actions">
                  <button
                    onClick={() => handleEdit(product)}
                    className="product-edit-btn"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="product-delete-btn"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="product-modal-overlay">
          <div className="product-modal">
            <div className="product-modal-header">
              <h2 className="product-modal-title">{editingProduct ? "Edit Product" : "Add Product"}</h2>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="product-modal-close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="product-modal-form">
              <div className="product-form-group">
                <label>Name</label>
                <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Name" required />
              </div>
              <div className="product-form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" required />
              </div>
              <div className="product-form-group">
                <label>Price</label>
                <input name="price" value={formData.price} onChange={handleInputChange} placeholder="Price" type="number" min="0" step="0.01" required />
              </div>
              <div className="product-form-group">
                <label>Quantity</label>
                <input name="quantity" value={formData.quantity} onChange={handleInputChange} placeholder="Quantity" type="number" min="0" required />
              </div>
              <div className="product-form-group">
                <label>Category</label>
                <input name="category" value={formData.category} onChange={handleInputChange} placeholder="Category" required />
              </div>
              <div className="product-form-group">
                <label>SKU</label>
                <input name="sku" value={formData.sku} onChange={handleInputChange} placeholder="SKU" required />
              </div>
              <div className="product-form-group">
                <label>Product Image</label>
                <div className="product-image-zone">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="product-image-preview" />
                  ) : (
                    <div className="product-image-zone-placeholder">
                      <span>🖼</span>
                      <span className="product-image-zone-label">Click to upload image</span>
                      <span className="product-image-zone-sub">JPG, PNG, GIF — max 5MB</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                </div>
              </div>
              <div className="product-modal-actions">
                <button type="submit" className="product-modal-submit" disabled={submitting}>
                  {submitting ? (editingProduct ? "Updating..." : "Adding...") : (editingProduct ? "Update" : "Create")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="product-modal-cancel"
                >
                  Cancel
                </button>
              </div>
              {formError && <div style={{ color: "#ef4444", marginTop: 8 }}>{formError}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default SupplierProductsPage;
