function ProductStars({ rating, reviewCount = 0, size = "sm" }) {
  const numericRating = Number(rating);
  const roundedRating = Number.isFinite(numericRating) ? Math.round(numericRating) : 0;
  const hasReviews = reviewCount > 0 && Number.isFinite(numericRating);
  const starClassName = size === "lg" ? "text-2xl" : "text-sm";
  const metaClassName = size === "lg" ? "text-sm" : "text-xs";

  return (
    <div className="flex items-center gap-2">
      <span className={`tracking-wide text-amber-500 ${starClassName}`}>
        {"★".repeat(roundedRating)}
        <span className="text-slate-300">{"★".repeat(5 - roundedRating)}</span>
      </span>
      <span className={`${metaClassName} text-slate-500`}>
        {hasReviews ? `${numericRating.toFixed(1)} (${reviewCount})` : "No reviews yet"}
      </span>
    </div>
  );
}

export default ProductStars;
