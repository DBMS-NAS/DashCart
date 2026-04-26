import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import axios from "../utils/axiosInstance";
import CustomerProductCard from "../components/CustomerProductCard";
import ProductStars from "../components/ProductStars";
import { API_BASE_URL } from "../utils/api";
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
      } catch (err) {
        setError(err.response?.data?.detail || "Could not load product details.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const addToCart = async (targetProductId, targetQuantity = 1) => {
    setError("");
    setMessage("");

    try {
      await axios.post(`${API_BASE_URL}/api/cart/add/`, {
        product_id: targetProductId,
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
      <div className="rounded-xl bg-white p-6 shadow">
        <p className="text-slate-700">{error || "Product not found."}</p>
        <Link className="mt-4 inline-flex rounded bg-blue-600 px-4 py-2 text-white" to="/products">
          Back to Products
        </Link>
      </div>
    );
  }

  const currentPrice = product.discounted_price || product.price;

  return (
    <div className="space-y-8">
      <div>
        <Link className="text-sm font-semibold text-blue-600 hover:underline" to="/products">
          ← Back to Products
        </Link>
      </div>

      {error && <p className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {message && <p className="rounded bg-green-50 p-3 text-green-700">{message}</p>}

      <section className="grid gap-8 rounded-2xl bg-white p-6 shadow lg:grid-cols-[1.1fr,1fr]">
        <div className="overflow-hidden rounded-2xl bg-slate-100">
          {product.image ? (
            <img
              src={`${API_BASE_URL}${product.image}`}
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
          <p className="text-sm uppercase tracking-wide text-slate-400">{product.brand_name}</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">{product.name}</h1>
          <p className="mt-3 text-sm font-medium text-blue-600">
            {product.category_names?.join(", ") || "Uncategorized"}
          </p>
          <div className="mt-4">
            <ProductStars
              rating={product.average_rating}
              reviewCount={product.review_count}
              size="lg"
            />
          </div>
          <p className="mt-3 text-sm text-slate-500">Available from {product.store_name}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {product.discounted_price ? (
              <>
                <span className="text-xl text-slate-400 line-through">${product.price}</span>
                <span className="text-4xl font-bold text-red-600">${product.discounted_price}</span>
                <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-600">
                  {product.discount_percent}% OFF
                </span>
              </>
            ) : (
              <span className="text-4xl font-bold text-slate-900">${product.price}</span>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Availability</p>
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
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    product.is_favorite
                      ? "bg-rose-100 text-rose-600"
                      : "bg-white text-slate-700"
                  } disabled:opacity-50`}
                >
                  {product.is_favorite ? "♥ Saved" : "♡ Save to Wishlist"}
                </button>
              )}
            </div>

            {!isStaff && (
              <>
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
                    onClick={() => addToCart(product.product_id, quantity)}
                    disabled={product.stock <= 0}
                    className="rounded bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                  <Link
                    className="rounded border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                    to="/wishlist"
                  >
                    View Wishlist
                  </Link>
                </div>
              </>
            )}

            {isStaff && (
              <div className="mt-4 rounded-lg bg-white p-4 text-sm text-slate-600">
                Staff can preview customer-facing product details here.
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current price</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">${currentPrice}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Customer reviews</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{product.review_count}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Customer Reviews</h2>
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
                <div key={review.review_id} className="rounded-xl border border-slate-200 p-4">
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

        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-2xl font-bold text-slate-900">Related Products</h2>
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
                  onAddToCart={(targetProductId) =>
                    addToCart(targetProductId, relatedQuantities[targetProductId] || 1)
                  }
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
