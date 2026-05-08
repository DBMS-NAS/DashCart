import CustomerProductCard from "./CustomerProductCard";

function DealProductStrip({
  products,
  eyebrow = "Special Pricing",
  title = "Deals & Offers",
  description,
  getQuantity,
  onIncrease,
  onDecrease,
  onAddToCart,
  onToggleFavorite,
  favoriteLoadingIds = {},
  showQuantityControls = false,
}) {
  if (!products.length) {
    return null;
  }

  return (
    <section className="rounded-2xl bg-gradient-to-r from-red-50 via-amber-50 to-rose-50 p-6 shadow-sm">
      <div className="mb-4">
        <p className="page-eyebrow">{eyebrow}</p>
        <h3 className="display-heading mt-3 text-3xl font-black text-slate-900">{title}</h3>
        {description && (
          <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
        )}
      </div>

      <div className="flex gap-5 overflow-x-auto pb-2">
        {products.map((product) => (
          <div
            key={product.listing_id || product.product_id}
            className="min-w-[248px] max-w-[248px] sm:min-w-[260px] sm:max-w-[260px]"
          >
            <CustomerProductCard
              product={product}
              quantity={getQuantity ? getQuantity(product.listing_id || product.product_id) : 1}
              onIncrease={onIncrease}
              onDecrease={onDecrease}
              onAddToCart={onAddToCart}
              selectedWarehouseId={product.warehouse_id}
              onToggleFavorite={onToggleFavorite}
              favoritePending={Boolean(favoriteLoadingIds[product.product_id])}
              showQuantityControls={showQuantityControls}
              compact
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default DealProductStrip;
