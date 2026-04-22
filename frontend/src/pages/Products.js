import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";

import { API_BASE_URL } from "../utils/api";
import { getCurrentUser } from "../utils/auth";

function Products() {
  const user = getCurrentUser();
  const isStaff = user?.role === "staff";
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [form, setForm] = useState({
    name: "",
    brand_name: "",
    category_name: "",
    price: "",
    stock: "",
    image: null,
  });
  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const hasCatalog = products.length > 0;

  const mediaUrl = (path) => (path ? `${API_BASE_URL}${path}` : null);

  const loadProducts = async () => {
    setError("");
    setIsLoading(true);
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/products/`),
        axios.get(`${API_BASE_URL}/api/products/categories/`),
      ]);
      setProducts(productsResponse.data);
      setCategories(categoriesResponse.data);
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
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleImageChange = (event) => {
    setForm({ ...form, image: event.target.files[0] });
  };

  const resetForm = () => {
    setForm({
      name: "",
      brand_name: "",
      category_name: "",
      price: "",
      stock: "",
      image: null,
    });
    setEditingProductId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    setError("");
    setMessage("");
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("brand_name", form.brand_name);
    formData.append("category_name", form.category_name);
    formData.append("price", form.price);
    formData.append("stock", form.stock);
    if (form.image) formData.append("image", form.image);

    try {
      if (editingProductId) {
        await axios.patch(
          `${API_BASE_URL}/api/products/${editingProductId}/`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        setMessage("Product updated.");
      } else {
        await axios.post(`${API_BASE_URL}/api/products/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
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
      category_name: product.category_names?.[0] || "",
      price: product.price,
      stock: product.stock,
      image: null,
    });
    setEditingProductId(product.product_id);
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    setError("");
    setMessage("");
    try {
      await axios.delete(`${API_BASE_URL}/api/products/${productId}/`);
      setMessage("Product deleted.");
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not delete product.");
    }
  };

  const getQuantity = (productId) => quantities[productId] || 1;

  const updateQuantity = (productId, delta, max) => {
    setQuantities((prev) => {
      const current = prev[productId] || 1;
      const next = Math.min(Math.max(1, current + delta), max);
      return { ...prev, [productId]: next };
    });
  };

  const addToCart = async (productId) => {
    setError("");
    setMessage("");
    try {
      await axios.post(
        `${API_BASE_URL}/api/cart/add/`,
        { product_id: productId, quantity: getQuantity(productId) }
      );
      setMessage("Product added to cart.");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not add product to cart.");
    }
  };

  const filteredProducts = products.filter((product) => {
    const q = search.toLowerCase();
    const effectivePrice = parseFloat(product.discounted_price || product.price);
    const productCategories = product.category_names || [];

    const matchesSearch =
      product.name.toLowerCase().includes(q) ||
      product.brand_name?.toLowerCase().includes(q) ||
      productCategories.some((category) => category.toLowerCase().includes(q)) ||
      product.store_name?.toLowerCase().includes(q) ||
      product.discount_name?.toLowerCase().includes(q);

    const matchesCategory =
      categoryFilter === "" || productCategories.includes(categoryFilter);
    const matchesMin = minPrice === "" || effectivePrice >= parseFloat(minPrice);
    const matchesMax = maxPrice === "" || effectivePrice <= parseFloat(maxPrice);

    return matchesSearch && matchesCategory && matchesMin && matchesMax;
  });

  return (
    <div>
      <h2 className="mb-6 text-3xl font-bold">Products</h2>

      {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {message && <p className="mb-4 rounded bg-green-50 p-3 text-green-700">{message}</p>}

      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[80vh] max-w-[80vw] rounded-lg shadow-xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 rounded-full bg-white px-2 py-1 text-sm font-bold shadow"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {isStaff && (
        <button
          onClick={() => {
            setShowForm(true);
            setEditingProductId(null);
            setForm({
              name: "",
              brand_name: "",
              category_name: "",
              price: "",
              stock: "",
              image: null,
            });
          }}
          className="mb-4 rounded bg-blue-500 px-4 py-2 text-white"
          type="button"
        >
          + Add Product
        </button>
      )}

      {isStaff && showForm && (
        <div className="mb-6 rounded bg-white p-4 shadow">
          <input type="text" name="name" placeholder="Product Name" value={form.name} onChange={handleChange} className="mb-2 mr-2 border p-2" />
          <input type="text" name="brand_name" placeholder="Brand" value={form.brand_name} onChange={handleChange} className="mb-2 mr-2 border p-2" />
          <input
            type="text"
            name="category_name"
            placeholder="Category"
            value={form.category_name}
            onChange={handleChange}
            className="mb-2 mr-2 border p-2"
            list="category-options"
          />
          <datalist id="category-options">
            {categories.map((category) => (
              <option key={category.category_id} value={category.name} />
            ))}
          </datalist>
          <input type="number" name="price" placeholder="Price" value={form.price} onChange={handleChange} className="mb-2 mr-2 border p-2" />
          <input type="number" name="stock" placeholder="Stock" value={form.stock} onChange={handleChange} className="mb-2 mr-2 border p-2" />
          <input type="file" accept="image/*" onChange={handleImageChange} className="mb-2 mr-2 border p-2" />
          <button onClick={handleSave} className="mr-2 rounded bg-green-500 px-4 py-2 text-white" type="button">Save</button>
          <button onClick={resetForm} className="rounded bg-slate-200 px-4 py-2" type="button">Cancel</button>
        </div>
      )}

      {/* SEARCH AND PRICE FILTER */}
      <div className="mb-6 flex gap-3 items-center">
        <input
          type="text"
          placeholder="Search by product, brand, category, store or discount..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border p-2"
        />
        <select
          className="rounded-lg border bg-white p-2 text-sm"
          onChange={(event) => setCategoryFilter(event.target.value)}
          value={categoryFilter}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.category_id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
          <button
            onClick={() => setMinPrice((prev) => Math.max(0, (parseFloat(prev) || 0) - 1).toString())}
            className="text-slate-500 hover:text-slate-900 font-bold"
            type="button"
          >−</button>
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-16 text-center outline-none text-sm"
          />
          <button
            onClick={() => setMinPrice((prev) => ((parseFloat(prev) || 0) + 1).toString())}
            className="text-slate-500 hover:text-slate-900 font-bold"
            type="button"
          >+</button>
        </div>
        <span className="text-slate-400 font-medium">—</span>
        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
          <button
            onClick={() => setMaxPrice((prev) => Math.max(0, (parseFloat(prev) || 0) - 1).toString())}
            className="text-slate-500 hover:text-slate-900 font-bold"
            type="button"
          >−</button>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-16 text-center outline-none text-sm"
          />
          <button
            onClick={() => setMaxPrice((prev) => ((parseFloat(prev) || 0) + 1).toString())}
            className="text-slate-500 hover:text-slate-900 font-bold"
            type="button"
          >+</button>
        </div>
        {(minPrice || maxPrice || categoryFilter) && (
          <button
            onClick={() => { setMinPrice(""); setMaxPrice(""); setCategoryFilter(""); }}
            className="rounded-lg bg-slate-200 px-3 py-2 text-sm hover:bg-slate-300"
            type="button"
          >
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-slate-600">Loading products...</p>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-lg bg-white p-6 shadow">
          {hasCatalog ? (
            <p className="text-slate-600">
              No products match the current search or filters.
            </p>
          ) : isStaff ? (
            <>
              <p className="text-slate-700">No products have been added yet.</p>
              <p className="mt-2 text-sm text-slate-500">
                Add one here or run <code>python manage.py seed_demo_catalog</code> to load
                a demo catalog for the MySQL presentation.
              </p>
            </>
          ) : (
            <>
              <p className="text-slate-700">No products are available right now.</p>
              <p className="mt-2 text-sm text-slate-500">
                Ask a staff user to add products or run <code>python manage.py seed_demo_catalog</code>
                so the customer catalog has data to display.
              </p>
            </>
          )}
        </div>
      ) : isStaff ? (
        // STAFF TABLE VIEW
        <table className="w-full rounded-lg bg-white shadow">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left">Image</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Brand</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">Store</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.product_id} className="border-t">
                <td className="p-3">
                  {product.image ? (
                    <img
                      src={mediaUrl(product.image)}
                      alt={product.name}
                      className="h-12 w-12 cursor-pointer object-cover rounded hover:opacity-80 transition"
                      onClick={() => setPreviewImage(mediaUrl(product.image))}
                    />
                  ) : (
                    <span className="text-slate-400 text-sm">No image</span>
                  )}
                </td>
                <td className="p-3">
                  <span>{product.name}</span>
                  {product.discount_name && (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                      {product.discount_name}
                    </span>
                  )}
                </td>
                <td className="p-3">{product.brand_name}</td>
                <td className="p-3">{product.category_names?.join(", ") || "-"}</td>
                <td className="p-3">
                  {product.discounted_price ? (
                    <div>
                      <span className="mr-2 text-sm text-slate-400 line-through">${product.price}</span>
                      <span className="font-semibold text-red-600">${product.discounted_price}</span>
                      <span className="ml-2 text-xs text-green-600">-{product.discount_percent}%</span>
                    </div>
                  ) : (
                    <span>${product.price}</span>
                  )}
                </td>
                <td className="p-3">{product.stock}</td>
                <td className="p-3">{product.store_name}</td>
                <td className="space-x-2 p-3">
                  <button onClick={() => handleEdit(product)} className="rounded bg-yellow-400 px-3 py-1" type="button">Edit</button>
                  <button onClick={() => handleDelete(product.product_id)} className="rounded bg-red-500 px-3 py-1 text-white" type="button">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        // CUSTOMER CARD VIEW
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <div key={product.product_id} className="flex flex-col rounded-xl bg-white shadow hover:shadow-lg transition overflow-hidden">
              {/* IMAGE */}
              <div
                className="relative h-48 w-full cursor-pointer bg-slate-100"
                onClick={() => product.image && setPreviewImage(mediaUrl(product.image))}
              >
                {product.image ? (
                  <img
                    src={mediaUrl(product.image)}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400 text-sm">No image</div>
                )}
                {product.discount_name && (
                  <span className="absolute top-2 left-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                    {product.discount_percent}% OFF
                  </span>
                )}
              </div>

              {/* DETAILS */}
              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs text-slate-400">{product.brand_name}</p>
                <h3 className="mt-1 font-semibold text-slate-900">{product.name}</h3>
                <p className="mt-1 text-xs font-medium text-blue-600">
                  {product.category_names?.join(", ") || "Uncategorized"}
                </p>
                <p className="mt-1 text-xs text-slate-400">{product.store_name}</p>

                {/* PRICE + STOCK ON SAME LINE */}
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    {product.discounted_price ? (
                      <div>
                        <span className="mr-1 text-sm text-slate-400 line-through">${product.price}</span>
                        <span className="text-lg font-bold text-red-600">${product.discounted_price}</span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-slate-900">${product.price}</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${
                    product.stock <= 0 ? "text-red-500" :
                    product.stock <= 5 ? "text-orange-500" :
                    "text-green-600"
                  }`}>
                    {product.stock <= 0 ? "Out of Stock" : `${product.stock} left`}
                  </span>
                </div>

                {/* QUANTITY SELECTOR */}
                <div className="mt-3 flex items-center justify-between rounded-lg border p-1">
                  <button
                    onClick={() => updateQuantity(product.product_id, -1, product.stock)}
                    className="px-3 py-1 text-lg font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30"
                    disabled={getQuantity(product.product_id) <= 1}
                    type="button"
                  >
                    −
                  </button>
                  <span className="font-semibold">{getQuantity(product.product_id)}</span>
                  <button
                    onClick={() => updateQuantity(product.product_id, 1, product.stock)}
                    className="px-3 py-1 text-lg font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30"
                    disabled={getQuantity(product.product_id) >= product.stock}
                    type="button"
                  >
                    +
                  </button>
                </div>

                <button
                  className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  disabled={product.stock <= 0}
                  onClick={() => addToCart(product.product_id)}
                  type="button"
                >
                  {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;
