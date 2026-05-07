import { Link } from "react-router-dom";

import { mediaUrl } from "../utils/api";
import ProductStars from "./ProductStars";

function CustomerProductCard({
  product,
  quantity = 1,
  onIncrease,
  onDecrease,
  onAddToCart,
  onSelectWarehouse,
  selectedWarehouseId = "",
  onToggleFavorite,
  favoritePending = false,
  showQuantityControls = true,
  showStore = true,
  actionLabel = "Add to Cart",
}) {
  const detailPath = `/products/${product.product_id}`;

  return (
    <div className="premium-card flex flex-col transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative overflow-hidden">
        <Link className="block h-56 w-full bg-slate-100" to={detailPath}>
          {product.image ? (
            <img
              src={mediaUrl(product.image)}
              alt={product.name}
              className="h-full w-full object-cover transition duration-500 hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No image
            </div>
          )}
        </Link>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900/80 to-transparent" />

        {product.discount_name && (
          <span className="premium-badge absolute left-3 top-3 rounded-full px-3 py-1">
            {product.discount_percent}% OFF
          </span>
        )}

        {onToggleFavorite && (
          <button
            type="button"
            disabled={favoritePending}
            onClick={() => onToggleFavorite(product)}
            className={`absolute right-3 top-3 rounded-full border px-3 py-1.5 text-lg shadow ${
              product.is_favorite
                ? "border-blue-200 bg-blue-50 text-slate-50"
                : "border-slate-200 bg-slate-900/65 text-slate-200"
            } disabled:opacity-50`}
            aria-label={product.is_favorite ? "Remove from wishlist" : "Add to wishlist"}
          >
            {product.is_favorite ? "♥" : "♡"}
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="page-eyebrow">{product.brand_name}</p>
        <Link className="font-display mt-2 text-2xl text-slate-50 hover:text-amber-500" to={detailPath}>
          {product.name}
        </Link>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
          {product.category_names?.join(", ") || "Uncategorized"}
        </p>
        <div className="mt-4">
          <ProductStars rating={product.average_rating} reviewCount={product.review_count} />
        </div>
        {showStore && (
          <div className="mt-2">
            <p className="text-xs text-slate-400">{product.store_name}</p>
            {onSelectWarehouse && product.available_stores?.length > 0 && (
              <select
                className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                value={selectedWarehouseId}
                onChange={(event) => onSelectWarehouse(product.product_id, event.target.value)}
              >
                {product.available_stores.map((store) => (
                  <option key={store.warehouse_id} value={store.warehouse_id}>
                    {store.store_name} · {store.store_location} ({store.quantity} available)
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <div>
            {product.discounted_price ? (
              <div>
                <span className="mr-2 text-sm text-slate-400 line-through">${product.price}</span>
                <span className="text-2xl font-bold text-amber-500">${product.discounted_price}</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-slate-50">${product.price}</span>
            )}
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
              product.stock <= 0
                ? "bg-red-100 text-red-700"
                : product.stock <= 5
                  ? "bg-amber-50 text-amber-700"
                  : "bg-emerald-50 text-emerald-300"
            }`}
          >
            {product.stock <= 0 ? "Out of Stock" : `${product.stock} left`}
          </span>
        </div>

        {showQuantityControls && (
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
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
            className="premium-button-ghost flex-1 px-3 py-2.5 text-center text-sm"
          >
            View Details
          </Link>
          {onAddToCart && (
            <button
              className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={product.stock <= 0 || !selectedWarehouseId}
              onClick={() => onAddToCart(product.product_id, selectedWarehouseId)}
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
