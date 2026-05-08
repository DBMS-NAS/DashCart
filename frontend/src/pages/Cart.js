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
    <div className="space-y-8">
      <section className="hero-panel rounded-[2rem] p-8">
        <p className="page-eyebrow">Checkout</p>
        <h2 className="display-heading mt-3 text-4xl text-slate-50 md:text-5xl">Your Cart</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
          Review selected items, adjust quantities, and complete your order.
        </p>
      </section>

      {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {message && <p className="mb-4 rounded bg-green-50 p-3 text-green-700">{message}</p>}

      {cart.items.length === 0 ? (
        <div className="section-panel rounded-[1.75rem] p-6">
          <p className="text-slate-600">Your cart is empty. Add products to begin checkout.</p>
          <Link
            className="premium-button mt-4 inline-flex px-5 py-3 text-sm"
            to="/products"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <>
          <div className="section-panel overflow-hidden rounded-[1.75rem] shadow">
            <table className="w-full">
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
                    <td className="p-3">
                      <div>{item.product_name}</div>
                      {item.store_name && (
                        <div className="mt-1 text-xs text-slate-500">
                          {item.store_name}
                          {item.store_location ? ` • ${item.store_location}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-amber-500">${item.price}</td>
                    <td className="p-3">
                      <input
                        className="premium-input w-20 rounded-xl px-3 py-2"
                        min="1"
                        onChange={(event) => updateQuantity(item.id, event.target.value)}
                        type="number"
                        value={item.quantity}
                      />
                    </td>
                    <td className="p-3 font-semibold text-amber-500">${item.subtotal}</td>
                    <td className="p-3">
                      <button
                        className="rounded-xl bg-red-500 px-3 py-1.5 text-white"
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
          </div>

          <div className="section-panel mt-6 flex items-center justify-between rounded-[1.75rem] p-6 shadow">
            <div>
              <p className="text-sm text-slate-500">Items</p>
              <p className="text-2xl font-bold">{cart.item_count}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-bold text-amber-500">${cart.total}</p>
            </div>
            <button
              className="premium-button px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
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
