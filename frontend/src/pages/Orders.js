import { useEffect, useState } from "react";
import axios from "axios";

import { API_BASE_URL, authHeaders } from "../utils/api";
import { getCurrentUser } from "../utils/auth";

function Orders() {
  const user = getCurrentUser();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      setError("");
      setIsLoading(true);

      try {
        const response = await axios.get(`${API_BASE_URL}/api/orders/`, {
          headers: authHeaders(),
        });
        setOrders(response.data);
      } catch (err) {
        setError("Could not load orders.");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  return (
    <div>
      <h2 className="mb-2 text-3xl font-bold">Orders</h2>
      <p className="mb-6 text-slate-600">
        {user?.role === "staff"
          ? "Staff can see all customer orders."
          : "Customers can see their own orders."}
      </p>

      {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}

      {isLoading ? (
        <p className="text-slate-600">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-slate-600">No orders yet.</p>
        </div>
      ) : (
        <table className="w-full rounded-lg bg-white shadow">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left">Order ID</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Items</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order.order_id} className="border-t align-top">
                <td className="p-3">{order.order_id}</td>
                <td className="p-3">{order.customer}</td>
                <td className="p-3">
                  {order.items.map((item) => (
                    <div key={`${order.order_id}-${item.product_name}`}>
                      {item.product_name} x {item.quantity}
                    </div>
                  ))}
                </td>
                <td className="p-3">${order.total}</td>
                <td className="p-3">{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Orders;
