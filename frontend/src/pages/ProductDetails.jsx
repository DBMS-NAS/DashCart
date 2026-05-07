import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import axios from "../utils/axiosInstance";
import CustomerProductCard from "../components/CustomerProductCard";
import ProductStars from "../components/ProductStars";
import { API_BASE_URL, mediaUrl } from "../utils/api";
import { getCurrentUser } from "../utils/auth";

function ReviewStars({ rating }) {
  const value = Number(rating);

  return (
    <span className="tracking-wide text-amber-500">
      {"★".repeat(value)}
      <span className="text-slate-300">{"★".repeat(5 - value)}</span>
    </span>
  );
}

function ProductDetails() {
  const { productId } = useParams();
  const user = getCurrentUser();
  const isStaff = user?.role === "staff";
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [relatedQuantities, setRelatedQuantities] = useState({});
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [relatedWarehouses, setRelatedWarehouses] = useState({});
  const [favoriteLoadingIds, setFavoriteLoadingIds] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      setError("");
      setIsLoading(true);

      try {
        const response = await axios.get(`${API_BASE_URL}/api/products/${productId}/`);
        setProduct(response.data);
        setSelectedWarehouseId(response.data.available_stores?.[0]?.warehouse_id || "");
      } catch (err) {
        setError(err.response?.data?.detail || "Could not load product details.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const getRelatedWarehouseId = (targetProduct) =>
    relatedWarehouses[targetProduct.product_id] || targetProduct.available_stores?.[0]?.warehouse_id || "";

  const addToCart = async (targetProductId, warehouseId, targetQuantity = 1) => {
    setError("");
    setMessage("");

    try {
      await axios.post(`${API_BASE_URL}/api/cart/add/`, {
        product_id: targetProductId,
        warehouse_id: warehouseId,
        quantity: targetQuantity,
      });
      setMessage("Product added to cart.");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not add product to cart.");
    }
  };

  const updateRelatedQuantity = (targetProductId, delta, max) => {
    setRelatedQuantities((prev) => {
      const current = prev[targetProductId] || 1;
      const next = Math.min(Math.max(1, current + delta), max);
      return { ...prev, [targetProductId]: next };
    });
  };

  const toggleFavorite = async (targetProduct) => {
    setError("");
    setFavoriteLoadingIds((prev) => ({ ...prev, [targetProduct.product_id]: true }));

    try {
      if (targetProduct.is_favorite) {
        await axios.delete(`${API_BASE_URL}/api/products/favorites/${targetProduct.product_id}/`);
      } else {
        await axios.post(`${API_BASE_URL}/api/products/favorites/`, {
          product_id: targetProduct.product_id,
        });
      }

      setProduct((prev) => {
        if (!prev) return prev;

        if (prev.product_id === targetProduct.product_id) {
          return { ...prev, is_favorite: !prev.is_favorite };
        }

        return {
          ...prev,
          related_products: prev.related_products.map((related) =>
            related.product_id === targetProduct.product_id
              ? { ...related, is_favorite: !related.is_favorite }
              : related
          ),
        };
      });

      setMessage(
        targetProduct.is_favorite ? "Removed from wishlist." : "Added to wishlist."
      );
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update wishlist.");
    } finally {
      setFavoriteLoadingIds((prev) => ({ ...prev, [targetProduct.product_id]: false }));
    }
  };

  if (isLoading) {
    return <p className="text-slate-600">Loading product details...</p>;
  }

  if (!product) {
    return (
      <div className="section-panel rounded-[1.75rem] p-6">
        <p className="text-slate-700">{error || "Product not found."}</p>
        <Link className="premium-button mt-4 inline-flex px-5 py-3 text-sm" to="/products">
          Back to Products
        </Link>
      </div>
    );
  }

  const currentPrice = product.discounted_price || product.price;

  return (
    <div className="space-y-8">
      <div>
        <Link className="page-eyebrow hover:underline" to="/products">
          ← Back to Products
        </Link>
      </div>

      {error && <p className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {message && <p className="rounded bg-green-50 p-3 text-green-700">{message}</p>}

      <section className="section-panel grid gap-8 rounded-[2rem] p-6 lg:grid-cols-[1.1fr,1fr]">
        <div className="overflow-hidden rounded-[1.75rem] bg-slate-100">
          {product.image ? (
            <img
              src={mediaUrl(product.image)}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex min-h-[420px] items-center justify-center text-slate-400">
              No image available
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <p className="page-eyebrow">{product.brand_name}</p>
          <h1 className="display-heading mt-3 text-4xl text-slate-50 md:text-5xl">{product.name}</h1>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            {product.category_names?.join(", ") || "Uncategorized"}
          </p>
          <div className="mt-4">
            <ProductStars
              rating={product.average_rating}
              reviewCount={product.review_count}
              size="lg"
            />
          </div>
          <p className="mt-4 text-sm text-slate-400">Available from {product.store_name}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {product.discounted_price ? (
              <>
                <span className="text-xl text-slate-400 line-through">${product.price}</span>
                <span className="text-4xl font-bold text-amber-500">${product.discounted_price}</span>
                <span className="premium-badge rounded-full px-3 py-1 text-sm">
                  {product.discount_percent}% OFF
                </span>
              </>
            ) : (
              <span className="text-4xl font-bold text-slate-50">${product.price}</span>
            )}
          </div>

          <div className="premium-card mt-6 rounded-[1.75rem] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="page-eyebrow">Availability</p>
                <p className={`mt-1 text-sm ${
                  product.stock <= 0
                    ? "text-red-500"
                    : product.stock <= 5
                      ? "text-orange-500"
                      : "text-green-600"
                }`}>
                  {product.stock <= 0 ? "Out of stock" : `${product.stock} items ready to ship`}
                </p>
              </div>
              {!isStaff && (
                <button
                  type="button"
                  onClick={() => toggleFavorite(product)}
                  disabled={favoriteLoadingIds[product.product_id]}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                    product.is_favorite
                      ? "border-blue-200 bg-blue-50 text-slate-50"
                      : "border-slate-200 bg-slate-900/55 text-slate-200"
                  } disabled:opacity-50`}
                >
                  {product.is_favorite ? "♥ Saved" : "♡ Save to Wishlist"}
                </button>
              )}
            </div>

            {!isStaff && (
              <>
                {product.available_stores?.length > 0 && (
                  <select
                    className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700"
                    value={selectedWarehouseId}
                    onChange={(event) => setSelectedWarehouseId(event.target.value)}
                  >
                    {product.available_stores.map((store) => (
                      <option key={store.warehouse_id} value={store.warehouse_id}>
                        {store.store_name} · {store.store_location} ({store.quantity} available)
                      </option>
                    ))}
                  </select>
                )}

                <div className="mt-4 flex items-center justify-between rounded-lg border bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                    className="px-4 py-2 text-lg font-bold text-slate-600 disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="font-semibold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.min(product.stock, prev + 1))}
                    disabled={quantity >= product.stock}
                    className="px-4 py-2 text-lg font-bold text-slate-600 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => addToCart(product.product_id, selectedWarehouseId, quantity)}
                    disabled={product.stock <= 0 || !selectedWarehouseId}
                    className="rounded bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                  <Link
                    className="premium-button-ghost px-5 py-3 text-sm"
                    to="/wishlist"
                  >
                    View Wishlist
                  </Link>
                </div>
              </>
            )}

            {isStaff && (
              <div className="premium-card mt-4 rounded-[1.5rem] p-4 text-sm text-slate-300">
                Staff can preview customer-facing product details here.
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="premium-card rounded-[1.5rem] p-4">
              <p className="page-eyebrow">Current price</p>
              <p className="mt-3 text-2xl font-bold text-slate-50">${currentPrice}</p>
            </div>
            <div className="premium-card rounded-[1.5rem] p-4">
              <p className="page-eyebrow">Customer reviews</p>
              <p className="mt-3 text-2xl font-bold text-slate-50">{product.review_count}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="section-panel rounded-[2rem] p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="display-heading text-3xl text-slate-50">Customer Reviews</h2>
              <p className="mt-1 text-sm text-slate-500">
                Honest feedback from shoppers who reviewed this product.
              </p>
            </div>
          </div>

          {product.reviews.length === 0 ? (
            <p className="text-slate-600">No reviews yet for this product.</p>
          ) : (
            <div className="space-y-4">
              {product.reviews.map((review) => (
                <div key={review.review_id} className="premium-card rounded-[1.5rem] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <ReviewStars rating={review.rating} />
                    <span className="text-xs text-slate-400">
                      {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(review.created_at))}
                    </span>
                  </div>
                  <p className="mt-3 text-slate-700">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section-panel rounded-[2rem] p-6">
          <h2 className="display-heading text-3xl text-slate-50">Related Products</h2>
          <p className="mt-1 text-sm text-slate-500">
            Similar items from the same categories.
          </p>

          {product.related_products.length === 0 ? (
            <p className="mt-6 text-slate-600">No related products available yet.</p>
          ) : (
            <div className="mt-6 space-y-5">
              {product.related_products.map((relatedProduct) => (
                <CustomerProductCard
                  key={relatedProduct.product_id}
                  product={relatedProduct}
                  quantity={relatedQuantities[relatedProduct.product_id] || 1}
                  onIncrease={(targetProductId, max) => updateRelatedQuantity(targetProductId, 1, max)}
                  onDecrease={(targetProductId, max) => updateRelatedQuantity(targetProductId, -1, max)}
                  onAddToCart={(targetProductId, warehouseId) =>
                    addToCart(targetProductId, warehouseId, relatedQuantities[targetProductId] || 1)
                  }
                  onSelectWarehouse={(targetProductId, warehouseId) =>
                    setRelatedWarehouses((prev) => ({ ...prev, [targetProductId]: warehouseId }))
                  }
                  selectedWarehouseId={getRelatedWarehouseId(relatedProduct)}
                  onToggleFavorite={!isStaff ? toggleFavorite : null}
                  favoritePending={Boolean(favoriteLoadingIds[relatedProduct.product_id])}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default ProductDetails;
