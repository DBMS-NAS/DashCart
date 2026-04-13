import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";
import { API_BASE_URL } from "../utils/api";
import { getCurrentUser } from "../utils/auth";

function Discounts() {
  const user = getCurrentUser();
  const isStaff = user?.role === "staff";

  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    discount_percent: "",
  });
  const [showForm, setShowForm] = useState(false);

  const [assignForm, setAssignForm] = useState({ product_id: "", discount_id: "" });
  const [showAssign, setShowAssign] = useState(false);

  const loadDiscounts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/discounts/`);
      setDiscounts(res.data);
    } catch {
      setError("Could not load discounts.");
    }
  };

  const loadProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/products/`);
      setProducts(res.data);
    } catch {}
  };

  useEffect(() => {
    loadDiscounts();
    if (isStaff) loadProducts();
  }, [isStaff]);

  const handleCreate = async () => {
    setError(""); setMessage("");
    try {
      await axios.post(`${API_BASE_URL}/api/discounts/`, form);
      setMessage("Discount created.");
      setForm({ name: "", discount_percent: "" });
      setShowForm(false);
      loadDiscounts();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create discount.");
    }
  };

  const handleDelete = async (discountId) => {
    setError(""); setMessage("");
    try {
      await axios.delete(`${API_BASE_URL}/api/discounts/${discountId}/`);
      setMessage("Discount deleted.");
      loadDiscounts();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not delete discount.");
    }
  };

  const handleAssign = async () => {
    setError(""); setMessage("");
    try {
      await axios.post(`${API_BASE_URL}/api/discounts/assign/`, assignForm);
      setMessage("Discount assigned to product.");
      setAssignForm({ product_id: "", discount_id: "" });
      setShowAssign(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not assign discount.");
    }
  };

  const handleRemove = async (productId, discountId) => {
    setError(""); setMessage("");
    try {
      await axios.delete(`${API_BASE_URL}/api/discounts/assign/`, {
        data: { product_id: productId, discount_id: discountId },
      });
      setMessage("Discount removed from product.");
      loadDiscounts();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not remove discount.");
    }
  };

  if (!isStaff) {
    return (
      <div>
        <h2 className="mb-6 text-3xl font-bold">Active Discounts</h2>
        {discounts.length === 0 ? (
          <p className="text-slate-500">No discounts currently active.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {discounts.map((d) => (
              <div key={d.discount_id} className="rounded-xl bg-white p-4 shadow">
                <span className="inline-block mb-2 rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700">
                  {d.discount_percent}% OFF
                </span>
                <h3 className="font-semibold text-slate-800">{d.name}</h3>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-3xl font-bold">Discounts</h2>

      {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {message && <p className="mb-4 rounded bg-green-50 p-3 text-green-700">{message}</p>}

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => { setShowForm(!showForm); setShowAssign(false); }}
          className="rounded bg-blue-500 px-4 py-2 text-white"
          type="button"
        >
          + New Discount
        </button>
        <button
          onClick={() => { setShowAssign(!showAssign); setShowForm(false); }}
          className="rounded bg-purple-500 px-4 py-2 text-white"
          type="button"
        >
          Assign Discount to Product
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded bg-white p-4 shadow space-y-2">
          <h3 className="font-semibold text-slate-700 mb-2">New Discount</h3>
          <input
            type="text"
            placeholder="Discount name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mr-2 border p-2 rounded"
          />
          <input
            type="number"
            placeholder="Percent (e.g. 10)"
            value={form.discount_percent}
            onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
            className="mr-2 w-36 border p-2 rounded"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={handleCreate} className="rounded bg-green-500 px-4 py-2 text-white" type="button">
              Save
            </button>
            <button onClick={() => setShowForm(false)} className="rounded bg-slate-200 px-4 py-2" type="button">
              Cancel
            </button>
          </div>
        </div>
      )}

      {showAssign && (
        <div className="mb-6 rounded bg-white p-4 shadow space-y-2">
          <h3 className="font-semibold text-slate-700 mb-2">Assign Discount to Product</h3>
          <select
            value={assignForm.product_id}
            onChange={(e) => setAssignForm({ ...assignForm, product_id: e.target.value })}
            className="mr-2 border p-2 rounded"
          >
            <option value="">Select product...</option>
            {products.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={assignForm.discount_id}
            onChange={(e) => setAssignForm({ ...assignForm, discount_id: e.target.value })}
            className="mr-2 border p-2 rounded"
          >
            <option value="">Select discount...</option>
            {discounts.map((d) => (
              <option key={d.discount_id} value={d.discount_id}>
                {d.name} ({d.discount_percent}%)
              </option>
            ))}
          </select>
          <div className="flex gap-2 mt-2">
            <button onClick={handleAssign} className="rounded bg-green-500 px-4 py-2 text-white" type="button">
              Assign
            </button>
            <button onClick={() => setShowAssign(false)} className="rounded bg-slate-200 px-4 py-2" type="button">
              Cancel
            </button>
          </div>
        </div>
      )}

      {discounts.length === 0 ? (
        <p className="text-slate-500">No discounts yet.</p>
      ) : (
        <table className="w-full rounded-lg bg-white shadow">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Percent</th>
              <th className="p-3 text-left">Assigned To</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((d) => (
              <tr key={d.discount_id} className="border-t">
                <td className="p-3">{d.name}</td>
                <td className="p-3">
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                    {d.discount_percent}% OFF
                  </span>
                </td>
                <td className="p-3 text-sm text-slate-500">
                  {d.assigned_products && d.assigned_products.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {d.assigned_products.map((p) => (
                        <span
                          key={p.product_id}
                          className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs"
                        >
                          {p.name}
                          <button
                            onClick={() => handleRemove(p.product_id, d.discount_id)}
                            className="ml-1 text-red-400 hover:text-red-600 font-bold"
                            type="button"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400">Not assigned</span>
                  )}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => handleDelete(d.discount_id)}
                    className="rounded bg-red-500 px-3 py-1 text-white text-sm"
                    type="button"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Discounts;