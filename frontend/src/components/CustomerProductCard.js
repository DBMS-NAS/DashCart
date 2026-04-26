import { Link } from "react-router-dom";

import { API_BASE_URL } from "../utils/api";
import ProductStars from "./ProductStars";

function CustomerProductCard({
  product,
  quantity = 1,
  onIncrease,
  onDecrease,
  onAddToCart,
  onToggleFavorite,
  favoritePending = false,
  showQuantityControls = true,
  showStore = true,
  actionLabel = "Add to Cart",
}) {
  const detailPath = `/products/${product.product_id}`;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-white shadow transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative">
        <Link className="block h-48 w-full bg-slate-100" to={detailPath}>
          {product.image ? (
            <img
              src={`${API_BASE_URL}${product.image}`}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No image
            </div>
          )}
        </Link>

        {product.discount_name && (
          <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
            {product.discount_percent}% OFF
          </span>
        )}

        {onToggleFavorite && (
          <button
            type="button"
            disabled={favoritePending}
            onClick={() => onToggleFavorite(product)}
            className={`absolute right-2 top-2 rounded-full px-2 py-1 text-lg shadow ${
              product.is_favorite
                ? "bg-rose-100 text-rose-600"
                : "bg-white text-slate-500"
            } disabled:opacity-50`}
            aria-label={product.is_favorite ? "Remove from wishlist" : "Add to wishlist"}
          >
            {product.is_favorite ? "♥" : "♡"}
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-slate-400">{product.brand_name}</p>
        <Link className="mt-1 text-lg font-semibold text-slate-900 hover:text-blue-600" to={detailPath}>
          {product.name}
        </Link>
        <p className="mt-1 text-xs font-medium text-blue-600">
          {product.category_names?.join(", ") || "Uncategorized"}
        </p>
        <div className="mt-2">
          <ProductStars rating={product.average_rating} reviewCount={product.review_count} />
        </div>
        {showStore && (
          <p className="mt-2 text-xs text-slate-400">{product.store_name}</p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div>
            {product.discounted_price ? (
              <div>
                <span className="mr-2 text-sm text-slate-400 line-through">${product.price}</span>
                <span className="text-lg font-bold text-red-600">${product.discounted_price}</span>
              </div>
            ) : (
              <span className="text-lg font-bold text-slate-900">${product.price}</span>
            )}
          </div>
          <span
            className={`text-xs font-medium ${
              product.stock <= 0
                ? "text-red-500"
                : product.stock <= 5
                  ? "text-orange-500"
                  : "text-green-600"
            }`}
          >
            {product.stock <= 0 ? "Out of Stock" : `${product.stock} left`}
          </span>
        </div>

        {showQuantityControls && (
          <div className="mt-4 flex items-center justify-between rounded-lg border p-1">
            <button
              onClick={() => onDecrease(product.product_id, product.stock)}
              className="px-3 py-1 text-lg font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30"
              disabled={quantity <= 1}
              type="button"
            >
              −
            </button>
            <span className="font-semibold">{quantity}</span>
            <button
              onClick={() => onIncrease(product.product_id, product.stock)}
              className="px-3 py-1 text-lg font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30"
              disabled={quantity >= product.stock}
              type="button"
            >
              +
            </button>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Link
            to={detailPath}
            className="flex-1 rounded-lg border border-slate-300 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View Details
          </Link>
          {onAddToCart && (
            <button
              className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={product.stock <= 0}
              onClick={() => onAddToCart(product.product_id)}
              type="button"
            >
              {product.stock <= 0 ? "Out of Stock" : actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerProductCard;
