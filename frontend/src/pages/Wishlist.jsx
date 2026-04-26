import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import axios from "../utils/axiosInstance";
import CustomerProductCard from "../components/CustomerProductCard";
import { API_BASE_URL } from "../utils/api";

function Wishlist() {
  const [favorites, setFavorites] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteLoadingIds, setFavoriteLoadingIds] = useState({});

  const loadFavorites = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/products/favorites/`);
      setFavorites(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not load wishlist.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

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

  const removeFavorite = async (product) => {
    setError("");
    setFavoriteLoadingIds((prev) => ({ ...prev, [product.product_id]: true }));

    try {
      await axios.delete(`${API_BASE_URL}/api/products/favorites/${product.product_id}/`);
      setFavorites((prev) =>
        prev.filter((item) => item.product_id !== product.product_id)
      );
      setMessage("Removed from wishlist.");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update wishlist.");
    } finally {
      setFavoriteLoadingIds((prev) => ({ ...prev, [product.product_id]: false }));
    }
  };

  if (isLoading) {
    return <p className="text-slate-600">Loading wishlist...</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold">Wishlist</h2>
        <p className="mt-2 text-slate-600">
          Keep track of products you want to come back to.
        </p>
      </div>

      {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {message && <p className="mb-4 rounded bg-green-50 p-3 text-green-700">{message}</p>}

      {favorites.length === 0 ? (
        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-slate-700">Your wishlist is empty.</p>
          <Link
            className="mt-4 inline-flex rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            to="/products"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((product) => (
            <CustomerProductCard
              key={product.product_id}
              product={product}
              quantity={getQuantity(product.product_id)}
              onIncrease={(productId, max) => changeQuantity(productId, 1, max)}
              onDecrease={(productId, max) => changeQuantity(productId, -1, max)}
              onAddToCart={addToCart}
              onToggleFavorite={removeFavorite}
              favoritePending={Boolean(favoriteLoadingIds[product.product_id])}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
