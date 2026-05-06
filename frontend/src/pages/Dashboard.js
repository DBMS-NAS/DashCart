import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../utils/axiosInstance";

import { API_BASE_URL, mediaUrl } from "../utils/api";
import { getCurrentUser } from "../utils/auth";

function Dashboard() {
  const user = getCurrentUser();
  const isStaff = user?.role === "staff";
  const [dashboard, setDashboard] = useState(null);
  const [dealProducts, setDealProducts] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setError("");
      setIsLoading(true);

      try {
        const [dashboardResponse, productsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/dashboard/`),
          axios.get(`${API_BASE_URL}/api/products/`),
        ]);
        setDashboard(dashboardResponse.data);
        setDealProducts(
          productsResponse.data
            .filter((product) => Boolean(product.discounted_price))
            .sort(
              (left, right) =>
                Number.parseFloat(right.discount_percent || 0) -
                Number.parseFloat(left.discount_percent || 0)
            )
        );
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
            <Link className="rounded bg-rose-600 px-4 py-2 text-white" to="/wishlist">
              View Wishlist
            </Link>
            <Link className="rounded bg-emerald-700 px-4 py-2 text-white" to="/orders">
              View Order History
            </Link>
          </>
        )}
      </div>

      {!isLoading && !isStaff && dealProducts.length > 0 && (
        <section className="mt-10 rounded-2xl bg-gradient-to-r from-red-50 via-amber-50 to-rose-50 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-2xl font-bold text-slate-900">Deals & Offers</h3>
            <p className="mt-1 text-sm text-slate-600">
              Browse every discounted product in one horizontal strip.
            </p>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-2">
            {dealProducts.map((product) => (
              <Link
                key={product.product_id}
                to={`/products/${product.product_id}`}
                className="min-w-[260px] max-w-[260px] overflow-hidden rounded-2xl bg-white shadow transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative h-40 bg-slate-100">
                  {product.image ? (
                    <img
                      src={mediaUrl(product.image)}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      No image
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                    {product.discount_percent}% OFF
                  </span>
                </div>

                <div className="p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {product.brand_name}
                  </p>
                  <h4 className="mt-1 text-lg font-bold text-slate-900">{product.name}</h4>
                  <p className="mt-1 text-sm text-slate-500">{product.store_name}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm text-slate-400 line-through">${product.price}</span>
                    <span className="text-2xl font-bold text-red-600">
                      ${product.discounted_price}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Dashboard;
