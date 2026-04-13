import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";

import { API_BASE_URL } from "../utils/api";
import { getCurrentUser } from "../utils/auth";

const STATUS_OPTIONS = ["pending", "processing", "delivered", "cancelled"];

const STATUS_STYLES = {
  pending:    "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  delivered:  "bg-green-100 text-green-800",
  cancelled:  "bg-red-100 text-red-800",
};

const REFUND_STYLES = {
  requested: "bg-yellow-100 text-yellow-800",
  approved:  "bg-green-100 text-green-800",
  rejected:  "bg-red-100 text-red-800",
};

const REFUND_LABELS = {
  requested: "Waiting for Refund",
  approved:  "Refunded",
  rejected:  "Refund Rejected",
};

function Orders() {
  const user = getCurrentUser();
  const isStaff = user?.role === "staff";
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [requestingRefundId, setRequestingRefundId] = useState(null);
  const [updatingRefundId, setUpdatingRefundId] = useState(null);

  const loadOrders = async () => {
    setError("");
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders/`);
      setOrders(response.data);
    } catch (err) {
      setError("Could not load orders.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    setError("");
    setMessage("");
    setUpdatingOrderId(orderId);
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/orders/${orderId}/`,
        { status: newStatus }
      );
      setOrders((prev) =>
        prev.map((o) => (o.order_id === orderId ? { ...o, ...response.data } : o))
      );
      setMessage(`Order marked as "${newStatus}".`);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const updateRefundStatus = async (orderId, refundId, newStatus) => {
    setError("");
    setMessage("");
    setUpdatingRefundId(refundId);
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/payments/refund/update/${refundId}/`,
        { status: newStatus }
      );
      setOrders((prev) =>
        prev.map((o) => {
          if (o.order_id !== orderId) return o;
          return {
            ...o,
            payment: {
              ...o.payment,
              refund: response.data,
            },
          };
        })
      );
      setMessage(`Refund marked as "${newStatus}".`);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update refund status.");
    } finally {
      setUpdatingRefundId(null);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setError("");
    setMessage("");
    setCancellingOrderId(orderId);
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/orders/${orderId}/`,
        { status: "cancelled" }
      );
      setOrders((prev) =>
        prev.map((o) => (o.order_id === orderId ? { ...o, ...response.data } : o))
      );
      setMessage("Order cancelled. You can now request a refund if you were charged.");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not cancel order.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  const requestRefund = async (orderId) => {
    setError("");
    setMessage("");
    setRequestingRefundId(orderId);
    try {
      await axios.post(`${API_BASE_URL}/api/payments/refund/${orderId}/`, {});
      setMessage("Refund requested. Staff will review it shortly.");
      await loadOrders();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not request refund.");
    } finally {
      setRequestingRefundId(null);
    }
  };

  return (
    <div>
      <h2 className="mb-2 text-3xl font-bold">Orders</h2>
      <p className="mb-6 text-slate-600">
        {isStaff
          ? "Staff can see and manage all customer orders."
          : "Track your orders below."}
      </p>

      {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {message && <p className="mb-4 rounded bg-green-50 p-3 text-green-700">{message}</p>}

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
              {isStaff && <th className="p-3 text-left">Customer</th>}
              <th className="p-3 text-left">Items</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Refund</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const refund = order.payment?.refund ?? null;
              const hasPayment = !!order.payment;
              const isCancelled = order.status === "cancelled";
              const isCancellable = ["pending", "processing"].includes(order.status);

              return (
                <tr key={order.order_id} className="border-t align-top">
                  <td className="p-3 font-mono text-sm text-slate-500">{order.order_id}</td>
                  {isStaff && <td className="p-3">{order.customer}</td>}
                  <td className="p-3">
                    {order.items.map((item) => (
                      <div key={`${order.order_id}-${item.product_name}`} className="text-sm">
                        {item.product_name} × {item.quantity}
                      </div>
                    ))}
                  </td>
                  <td className="p-3 font-medium">${order.total}</td>

                  <td className="p-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[order.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {order.status}
                    </span>
                  </td>

                  <td className="p-3">
                    {refund ? (
                      isStaff ? (
                        <select
                          value={refund.status}
                          disabled={updatingRefundId === refund.id}
                          onChange={(e) => updateRefundStatus(order.order_id, refund.id, e.target.value)}
                          className="rounded border border-slate-300 p-1.5 text-sm text-slate-700 disabled:opacity-50 cursor-pointer"
                        >
                          <option value="requested">Waiting for Refund</option>
                          <option value="approved">Refunded</option>
                          <option value="rejected">Refund Rejected</option>
                        </select>
                      ) : (
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${REFUND_STYLES[refund.status] ?? "bg-slate-100 text-slate-600"}`}>
                          {REFUND_LABELS[refund.status] ?? refund.status}
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>

                  <td className="p-3">
                    {isStaff ? (
                      <select
                        value={order.status}
                        disabled={updatingOrderId === order.order_id}
                        onChange={(e) => updateStatus(order.order_id, e.target.value)}
                        className="rounded border border-slate-300 p-1.5 text-sm text-slate-700 disabled:opacity-50 cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {isCancellable && (
                          <button
                            type="button"
                            disabled={cancellingOrderId === order.order_id}
                            onClick={() => cancelOrder(order.order_id)}
                            className="rounded bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
                          >
                            {cancellingOrderId === order.order_id ? "Cancelling..." : "Cancel Order"}
                          </button>
                        )}
                        {isCancelled && hasPayment && !refund && (
                          <button
                            type="button"
                            disabled={requestingRefundId === order.order_id}
                            onClick={() => requestRefund(order.order_id)}
                            className="rounded bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 hover:bg-yellow-200 disabled:opacity-50"
                          >
                            {requestingRefundId === order.order_id ? "Requesting..." : "Request Refund"}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Orders;