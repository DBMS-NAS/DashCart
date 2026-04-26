import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";

import { API_BASE_URL } from "../utils/api";
import { getCurrentUser } from "../utils/auth";

const initialReviewForm = {
  product: "",
  rating: "5",
  comment: "",
};

const STAR_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

function StarRating({ rating }) {
  const value = Number(rating);

  return (
    <span className="tracking-wide text-amber-500">
      {"★".repeat(value)}
      <span className="text-slate-300">{"★".repeat(5 - value)}</span>
    </span>
  );
}

function StarPicker({ rating, onChange }) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const activeRating = hoveredRating || Number(rating);

  return (
    <div>
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => setHoveredRating(0)}
      >
        {[1, 2, 3, 4, 5].map((value) => {
          const filled = value <= activeRating;

          return (
            <button
              type="button"
              key={value}
              aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
              aria-pressed={Number(rating) === value}
              className={`text-3xl leading-none transition ${
                filled ? "text-amber-500" : "text-slate-300"
              } hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-300`}
              onClick={() => onChange(String(value))}
              onMouseEnter={() => setHoveredRating(value)}
            >
              ★
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-sm font-medium text-slate-600">
        {activeRating} / 5 · {STAR_LABELS[activeRating]}
      </p>
    </div>
  );
}

function Reviews() {
  const user = getCurrentUser();
  const isStaff = user?.role === "staff";
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState(initialReviewForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setError("");
    setIsLoading(true);

    try {
      const [reviewsResponse, productsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/reviews/`),
        axios.get(`${API_BASE_URL}/api/products/`),
      ]);
      setReviews(reviewsResponse.data);
      setProducts(productsResponse.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not load reviews.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      await axios.post(`${API_BASE_URL}/api/reviews/`, {
        ...form,
        rating: Number(form.rating),
      });
      setForm(initialReviewForm);
      setMessage("Review submitted. Thank you for the feedback.");
      await loadData();
    } catch (err) {
      const responseErrors = err.response?.data;
      setError(
        responseErrors?.detail ||
          responseErrors?.product?.[0] ||
          responseErrors?.rating?.[0] ||
          responseErrors?.comment?.[0] ||
          "Could not submit review."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold">Reviews</h2>
        <p className="mt-2 text-slate-600">
          {isStaff
            ? "Read anonymous customer feedback for each product."
            : "Choose a product, leave a star rating, and add a short comment."}
        </p>
      </div>

      {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {message && <p className="mb-4 rounded bg-green-50 p-3 text-green-700">{message}</p>}

      {isLoading ? (
        <p className="text-slate-600">Loading reviews...</p>
      ) : (
        <div className={isStaff ? "" : "grid gap-6 xl:grid-cols-[360px,1fr]"}>
          {!isStaff && (
            <form className="rounded-xl bg-white p-5 shadow" onSubmit={handleSubmit}>
              <h3 className="mb-4 text-xl font-semibold">Write Review</h3>
              <select
                className="mb-3 w-full rounded border p-2"
                name="product"
                onChange={handleChange}
                value={form.product}
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.product_id} value={product.product_id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Your rating</p>
                <p className="mb-3 text-sm text-slate-500">
                  Tap the stars to choose your rating.
                </p>
                <StarPicker
                  rating={form.rating}
                  onChange={(rating) => setForm({ ...form, rating })}
                />
              </div>
              <textarea
                className="mb-4 w-full rounded border p-2"
                name="comment"
                onChange={handleChange}
                placeholder="Write your comment..."
                rows="5"
                value={form.comment}
              />
              <button
                className="rounded bg-blue-600 px-4 py-2 text-white disabled:bg-slate-400"
                disabled={isSaving || products.length === 0}
                type="submit"
              >
                {isSaving ? "Submitting..." : "Submit Review"}
              </button>
              {products.length === 0 && (
                <p className="mt-3 text-sm text-amber-700">
                  Products must be added before customers can review them.
                </p>
              )}
            </form>
          )}

          <div className="rounded-xl bg-white p-5 shadow">
            <h3 className="mb-4 text-xl font-semibold">
              {isStaff ? "Anonymous Reviews" : "Your Reviews"}
            </h3>

            {reviews.length === 0 ? (
              <p className="text-slate-600">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div className="rounded-lg border p-4" key={review.review_id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {review.product_name}
                        </p>
                        {isStaff && (
                          <p className="text-sm text-slate-500">Anonymous customer</p>
                        )}
                      </div>
                      <div className="text-right">
                        <StarRating rating={review.rating} />
                        <p className="text-xs text-slate-500">{review.rating}/5</p>
                      </div>
                    </div>
                    <p className="mt-3 text-slate-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Reviews;
