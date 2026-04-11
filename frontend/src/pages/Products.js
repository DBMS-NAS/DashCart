import { useEffect, useState } from "react";
import axios from "axios";

import { API_BASE_URL, authHeaders } from "../utils/api";
import { getCurrentUser } from "../utils/auth";

function Products() {
  const user = getCurrentUser();
  const isStaff = user?.role === "staff";
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    brand_name: "",
    price: "",
    stock: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadProducts = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/products/`, {
        headers: authHeaders(),
      });
      setProducts(response.data);
    } catch (err) {
      setError("Could not load products.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const resetForm = () => {
    setForm({ name: "", brand_name: "", price: "", stock: "" });
    setEditingProductId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    setError("");
    setMessage("");

    try {
      if (editingProductId) {
        await axios.patch(
          `${API_BASE_URL}/api/products/${editingProductId}/`,
          form,
          { headers: authHeaders() }
        );
        setMessage("Product updated.");
      } else {
        await axios.post(`${API_BASE_URL}/api/products/`, form, {
          headers: authHeaders(),
        });
        setMessage("Product added.");
      }

      resetForm();
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save product.");
    }
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      brand_name: product.brand_name,
      price: product.price,
      stock: product.stock,
    });
    setEditingProductId(product.product_id);
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    setError("");
    setMessage("");

    try {
      await axios.delete(`${API_BASE_URL}/api/products/${productId}/`, {
        headers: authHeaders(),
      });
      setMessage("Product deleted.");
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not delete product.");
    }
  };

  const addToCart = async (productId) => {
    setError("");
    setMessage("");

    try {
      await axios.post(
        `${API_BASE_URL}/api/cart/add/`,
        { product_id: productId, quantity: 1 },
        { headers: authHeaders() }
      );
      setMessage("Product added to cart.");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not add product to cart.");
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2 className="mb-6 text-3xl font-bold">Products</h2>

      {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {message && <p className="mb-4 rounded bg-green-50 p-3 text-green-700">{message}</p>}

      {isStaff ? (
        <button
          onClick={() => {
            setShowForm(true);
            setEditingProductId(null);
            setForm({ name: "", brand_name: "", price: "", stock: "" });
          }}
          className="mb-4 rounded bg-blue-500 px-4 py-2 text-white"
          type="button"
        >
          + Add Product
        </button>
      ) : (
        <p className="mb-4 text-slate-600">
          Browse products and add items to your cart.
        </p>
      )}

      {isStaff && showForm && (
        <div className="mb-6 rounded bg-white p-4 shadow">
          <input
            type="text"
            name="name"
            placeholder="Product Name"
            value={form.name}
            onChange={handleChange}
            className="mb-2 mr-2 border p-2"
          />
          <input
            type="text"
            name="brand_name"
            placeholder="Brand"
            value={form.brand_name}
            onChange={handleChange}
            className="mb-2 mr-2 border p-2"
          />
          <input
            type="number"
            name="price"
            placeholder="Price"
            value={form.price}
            onChange={handleChange}
            className="mb-2 mr-2 border p-2"
          />
          <input
            type="number"
            name="stock"
            placeholder="Stock"
            value={form.stock}
            onChange={handleChange}
            className="mb-2 mr-2 border p-2"
          />
          <button
            onClick={handleSave}
            className="mr-2 rounded bg-green-500 px-4 py-2 text-white"
            type="button"
          >
            Save
          </button>
          <button
            onClick={resetForm}
            className="rounded bg-slate-200 px-4 py-2"
            type="button"
          >
            Cancel
          </button>
        </div>
      )}

      <input
        type="text"
        placeholder="Search product..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mb-4 w-full border p-2"
      />

      {isLoading ? (
        <p className="text-slate-600">Loading products...</p>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-slate-600">
            No products found. Staff can add products from this page.
          </p>
        </div>
      ) : (
        <table className="w-full rounded-lg bg-white shadow">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Brand</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.product_id} className="border-t">
                <td className="p-3">{product.name}</td>
                <td className="p-3">{product.brand_name}</td>
                <td className="p-3">${product.price}</td>
                <td className="p-3">{product.stock}</td>
                <td className="space-x-2 p-3">
                  {isStaff ? (
                    <>
                      <button
                        onClick={() => handleEdit(product)}
                        className="rounded bg-yellow-400 px-3 py-1"
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.product_id)}
                        className="rounded bg-red-500 px-3 py-1 text-white"
                        type="button"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <button
                      className="rounded bg-blue-600 px-3 py-1 text-white disabled:bg-slate-400"
                      disabled={product.stock <= 0}
                      onClick={() => addToCart(product.product_id)}
                      type="button"
                    >
                      {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Products;
