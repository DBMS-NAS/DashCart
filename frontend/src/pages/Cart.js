import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";
import { API_BASE_URL } from "../utils/api";

function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], item_count: 0, total: "0.00" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const loadCart = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/cart/`);
      setCart(response.data);
    } catch (err) {
      setError("Could not load cart.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQuantity = async (itemId, quantity) => {
    setError("");
    setMessage("");

    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/cart/items/${itemId}/`,
        { quantity }
      );
      setCart(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update cart item.");
    }
  };

  const removeItem = async (itemId) => {
    setError("");
    setMessage("");

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/cart/items/${itemId}/`);
      setCart(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not remove cart item.");
    }
  };

  const checkout = async () => {
    setError("");
    setMessage("");
    setIsCheckingOut(true);

    try {
      const cartSnapshot = cart;
      const response = await axios.post(`${API_BASE_URL}/api/cart/checkout/`, {});
      setCart(response.data.cart);
      navigate("/orders/success", {
        state: {
          ...response.data,
          items: cartSnapshot.items,
          total: response.data.total || cartSnapshot.total,
          item_count: response.data.item_count || cartSnapshot.item_count,
        },
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Could not place order.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return <p className="text-slate-600">Loading cart...</p>;
  }

  return (
    <div>
      <h2 className="mb-6 text-3xl font-bold">Cart</h2>

      {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {message && <p className="mb-4 rounded bg-green-50 p-3 text-green-700">{message}</p>}

      {cart.items.length === 0 ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-slate-600">Your cart is empty. Add products to begin checkout.</p>
          <Link
            className="mt-4 inline-flex rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            to="/products"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <>
          <table className="w-full rounded-lg bg-white shadow">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">Quantity</th>
                <th className="p-3 text-left">Subtotal</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item) => (
                <tr className="border-t" key={item.id}>
                  <td className="p-3">{item.product_name}</td>
                  <td className="p-3">${item.price}</td>
                  <td className="p-3">
                    <input
                      className="w-20 rounded border p-2"
                      min="1"
                      onChange={(event) => updateQuantity(item.id, event.target.value)}
                      type="number"
                      value={item.quantity}
                    />
                  </td>
                  <td className="p-3">${item.subtotal}</td>
                  <td className="p-3">
                    <button
                      className="rounded bg-red-500 px-3 py-1 text-white"
                      onClick={() => removeItem(item.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex items-center justify-between rounded-lg bg-white p-6 shadow">
            <div>
              <p className="text-sm text-slate-500">Items</p>
              <p className="text-2xl font-bold">{cart.item_count}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-bold">${cart.total}</p>
            </div>
            <button
              className="rounded bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              onClick={checkout}
              disabled={isCheckingOut}
              type="button"
            >
              {isCheckingOut ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;
