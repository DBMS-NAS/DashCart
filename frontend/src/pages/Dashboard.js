import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../utils/axiosInstance";

import { API_BASE_URL } from "../utils/api";
import { getCurrentUser } from "../utils/auth";

function Dashboard() {
  const user = getCurrentUser();
  const isStaff = user?.role === "staff";
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setError("");
      setIsLoading(true);

      try {
        const response = await axios.get(`${API_BASE_URL}/api/dashboard/`);
        setDashboard(response.data);
      } catch (err) {
        setError("Could not load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div>
      <h2 className="mb-2 text-3xl font-bold">Dashboard</h2>
      <p className="mb-4 text-slate-600">
        Welcome, {dashboard?.username || user?.username}. You are logged in as{" "}
        {dashboard?.role || user?.role}.
      </p>

      {dashboard?.store_name && (
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            STORE
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">Your Store</p>
            <p className="text-lg font-bold text-blue-900">{dashboard.store_name}</p>
            {dashboard.store_location && (
              <p className="text-sm text-blue-600">{dashboard.store_location}</p>
            )}
          </div>
        </div>
      )}

      {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}

      {isLoading ? (
        <p className="text-slate-600">Loading dashboard...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {dashboard?.cards.map((card) => (
            <div
              className="rounded-xl bg-white p-6 shadow transition hover:shadow-lg"
              key={card.label}
            >
              <h3 className="text-gray-500">{card.label}</h3>
              <p className="mt-2 text-3xl font-bold">{card.value}</p>
              <p className="mt-2 text-sm text-slate-500">{card.description}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="rounded bg-blue-600 px-4 py-2 text-white" to="/products">
          View Products
        </Link>
        {isStaff ? (
          <>
            <Link className="rounded bg-slate-800 px-4 py-2 text-white" to="/inventory">
              Manage Inventory
            </Link>
            <Link className="rounded bg-emerald-700 px-4 py-2 text-white" to="/suppliers">
              Manage Suppliers
            </Link>
          </>
        ) : (
          <>
            <Link className="rounded bg-slate-800 px-4 py-2 text-white" to="/cart">
              View Cart
            </Link>
            <Link className="rounded bg-emerald-700 px-4 py-2 text-white" to="/orders">
              View Order History
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
