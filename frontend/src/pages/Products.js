import { useEffect, useMemo, useState } from "react";
import axios from "../utils/axiosInstance";

import CustomerProductCard from "../components/CustomerProductCard";
import { API_BASE_URL } from "../utils/api";
import { getCurrentUser } from "../utils/auth";

const initialProductForm = {
  name: "",
  brand_name: "",
  category_name: "",
  price: "",
  stock: "",
  image: null,
};

function getEffectivePrice(product) {
  return Number.parseFloat(product.discounted_price || product.price || 0);
}

function Products() {
  const user = getCurrentUser();
  const isStaff = user?.role === "staff";
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [showDealsOnly, setShowDealsOnly] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [favoriteLoadingIds, setFavoriteLoadingIds] = useState({});
  const [form, setForm] = useState(initialProductForm);
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

  const dealProducts = useMemo(
    () =>
      products
        .filter((product) => Boolean(product.discounted_price))
        .sort(
          (left, right) =>
            Number.parseFloat(right.discount_percent || 0) -
            Number.parseFloat(left.discount_percent || 0)
        )
        .slice(0, 4),
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const q = search.toLowerCase();
      const effectivePrice = getEffectivePrice(product);
      const productCategories = product.category_names || [];

      const matchesSearch =
        product.name.toLowerCase().includes(q) ||
        product.brand_name?.toLowerCase().includes(q) ||
        productCategories.some((category) => category.toLowerCase().includes(q)) ||
        product.store_name?.toLowerCase().includes(q) ||
        product.discount_name?.toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === "" || productCategories.includes(categoryFilter);
      const matchesMin = minPrice === "" || effectivePrice >= Number.parseFloat(minPrice);
      const matchesMax = maxPrice === "" || effectivePrice <= Number.parseFloat(maxPrice);
      const matchesDeals = !showDealsOnly || Boolean(product.discounted_price);

      return matchesSearch && matchesCategory && matchesMin && matchesMax && matchesDeals;
    });
  }, [categoryFilter, maxPrice, minPrice, products, search, showDealsOnly]);

  const sortedProducts = useMemo(() => {
    const copy = [...filteredProducts];

    copy.sort((left, right) => {
      switch (sortBy) {
        case "price_low":
          return getEffectivePrice(left) - getEffectivePrice(right);
        case "price_high":
          return getEffectivePrice(right) - getEffectivePrice(left);
        case "rating":
          return (right.average_rating || 0) - (left.average_rating || 0);
        case "newest":
          return new Date(right.created_at || 0) - new Date(left.created_at || 0);
        default: {
          const leftDiscount = Number.parseFloat(left.discount_percent || 0);
          const rightDiscount = Number.parseFloat(right.discount_percent || 0);
          if (rightDiscount !== leftDiscount) {
            return rightDiscount - leftDiscount;
          }
          return left.name.localeCompare(right.name);
        }
      }
    });

    return copy;
  }, [filteredProducts, sortBy]);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleImageChange = (event) => {
    setForm({ ...form, image: event.target.files[0] });
  };

  const resetForm = () => {
    setForm(initialProductForm);
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

  const changeQuantity = (productId, delta, max) => {
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
      await axios.post(`${API_BASE_URL}/api/cart/add/`, {
        product_id: productId,
        quantity: getQuantity(productId),
      });
      setMessage("Product added to cart.");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not add product to cart.");
    }
  };

  const toggleFavorite = async (product) => {
    setError("");
    setFavoriteLoadingIds((prev) => ({ ...prev, [product.product_id]: true }));

    try {
      if (product.is_favorite) {
        await axios.delete(`${API_BASE_URL}/api/products/favorites/${product.product_id}/`);
      } else {
        await axios.post(`${API_BASE_URL}/api/products/favorites/`, {
          product_id: product.product_id,
        });
      }

      setProducts((prev) =>
        prev.map((item) =>
          item.product_id === product.product_id
            ? { ...item, is_favorite: !item.is_favorite }
            : item
        )
      );
      setMessage(
        product.is_favorite
          ? "Removed from wishlist."
          : "Added to wishlist."
      );
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update wishlist.");
    } finally {
      setFavoriteLoadingIds((prev) => ({ ...prev, [product.product_id]: false }));
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Products</h2>
          {!isStaff && (
            <p className="mt-2 text-slate-600">
              Browse the catalog, compare deals, save favorites, and open full product details.
            </p>
          )}
        </div>

        {!isStaff && (
          <div className="flex gap-3">
            <button
              type="button"
              className={`rounded px-4 py-2 text-sm font-semibold ${
                showDealsOnly ? "bg-red-600 text-white" : "bg-white text-slate-700 shadow"
              }`}
              onClick={() => setShowDealsOnly((prev) => !prev)}
            >
              {showDealsOnly ? "Show All Products" : "Show Deals Only"}
            </button>
          </div>
        )}
      </div>

      {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {message && <p className="mb-4 rounded bg-green-50 p-3 text-green-700">{message}</p>}

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative" onClick={(event) => event.stopPropagation()}>
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[80vh] max-w-[80vw] rounded-lg shadow-xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -right-3 -top-3 rounded-full bg-white px-2 py-1 text-sm font-bold shadow"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {!isStaff && dealProducts.length > 0 && !isLoading && (
        <section className="mb-8 rounded-2xl bg-gradient-to-r from-red-50 via-amber-50 to-rose-50 p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Deals & Offers</h3>
              <p className="mt-1 text-sm text-slate-600">
                The strongest discounts in the store right now.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDealsOnly(true)}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              View Discounted Products
            </button>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {dealProducts.map((product) => (
              <CustomerProductCard
                key={product.product_id}
                product={product}
                quantity={getQuantity(product.product_id)}
                onIncrease={(productId, max) => changeQuantity(productId, 1, max)}
                onDecrease={(productId, max) => changeQuantity(productId, -1, max)}
                onAddToCart={addToCart}
                onToggleFavorite={toggleFavorite}
                favoritePending={Boolean(favoriteLoadingIds[product.product_id])}
              />
            ))}
          </div>
        </section>
      )}

      {isStaff && (
        <button
          onClick={() => {
            setShowForm(true);
            setEditingProductId(null);
            setForm(initialProductForm);
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

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by product, brand, category, store or discount..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="min-w-[220px] flex-1 rounded-lg border p-2"
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
        <select
          className="rounded-lg border bg-white p-2 text-sm"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
        >
          <option value="featured">Featured</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
          <option value="newest">Newest</option>
        </select>
        <input
          type="number"
          placeholder="Min"
          value={minPrice}
          onChange={(event) => setMinPrice(event.target.value)}
          className="w-24 rounded-lg border p-2 text-sm"
        />
        <input
          type="number"
          placeholder="Max"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
          className="w-24 rounded-lg border p-2 text-sm"
        />
        {(minPrice || maxPrice || categoryFilter || search || showDealsOnly || sortBy !== "featured") && (
          <button
            onClick={() => {
              setSearch("");
              setMinPrice("");
              setMaxPrice("");
              setCategoryFilter("");
              setSortBy("featured");
              setShowDealsOnly(false);
            }}
            className="rounded-lg bg-slate-200 px-3 py-2 text-sm hover:bg-slate-300"
            type="button"
          >
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-slate-600">Loading products...</p>
      ) : sortedProducts.length === 0 ? (
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
                a demo catalog for the presentation.
              </p>
            </>
          ) : (
            <>
              <p className="text-slate-700">No products are available right now.</p>
              <p className="mt-2 text-sm text-slate-500">
                Ask a staff user to add products or run <code>python manage.py seed_demo_catalog</code>
                so the catalog has data to display.
              </p>
            </>
          )}
        </div>
      ) : isStaff ? (
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
              <th className="p-3 text-left">Rating</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((product) => (
              <tr key={product.product_id} className="border-t">
                <td className="p-3">
                  {product.image ? (
                    <img
                      src={mediaUrl(product.image)}
                      alt={product.name}
                      className="h-12 w-12 cursor-pointer rounded object-cover transition hover:opacity-80"
                      onClick={() => setPreviewImage(mediaUrl(product.image))}
                    />
                  ) : (
                    <span className="text-sm text-slate-400">No image</span>
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
                <td className="p-3">
                  {product.average_rating ? `${product.average_rating}/5` : "No reviews"}
                </td>
                <td className="space-x-2 p-3">
                  <button onClick={() => handleEdit(product)} className="rounded bg-yellow-400 px-3 py-1" type="button">Edit</button>
                  <button onClick={() => handleDelete(product.product_id)} className="rounded bg-red-500 px-3 py-1 text-white" type="button">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedProducts.map((product) => (
            <CustomerProductCard
              key={product.product_id}
              product={product}
              quantity={getQuantity(product.product_id)}
              onIncrease={(productId, max) => changeQuantity(productId, 1, max)}
              onDecrease={(productId, max) => changeQuantity(productId, -1, max)}
              onAddToCart={addToCart}
              onToggleFavorite={toggleFavorite}
              favoritePending={Boolean(favoriteLoadingIds[product.product_id])}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;
