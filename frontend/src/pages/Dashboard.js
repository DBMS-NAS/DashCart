import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../utils/axiosInstance";

import DealProductStrip from "../components/DealProductStrip";
import { API_BASE_URL } from "../utils/api";
import { getCurrentUser } from "../utils/auth";
import { getStoreScopedProduct } from "../utils/storeListings";

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
            .map((product) => getStoreScopedProduct(product))
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
    <div className="space-y-8">
      <section className="hero-panel rounded-[2rem] p-8 lg:p-10">
        <p className="page-eyebrow">Overview</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="display-heading text-4xl text-slate-50 md:text-5xl">
              Welcome back, {dashboard?.username || user?.username}.
            </h2>
          </div>
          <div className="premium-badge rounded-full px-4 py-2">
            {dashboard?.role || user?.role}
          </div>
        </div>
      </section>

      {dashboard?.store_name && (
        <div className="section-panel flex items-center gap-4 rounded-[1.75rem] px-6 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            HUB
          </div>
          <div>
            <p className="page-eyebrow">Your Store</p>
            <p className="mt-2 text-xl font-semibold text-slate-50">{dashboard.store_name}</p>
            {dashboard.store_location && (
              <p className="text-sm text-slate-300">{dashboard.store_location}</p>
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
              className="premium-card rounded-[1.75rem] p-6 transition hover:-translate-y-1 hover:shadow-lg"
              key={card.label}
            >
              <p className="page-eyebrow">{card.label}</p>
              <p className="mt-4 text-4xl font-extrabold text-slate-50">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      <section className="section-panel rounded-[1.75rem] p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="page-eyebrow">Quick Actions</p>
            <h3 className="display-heading mt-3 text-3xl text-slate-50">Navigate faster through quick actions</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="premium-button px-5 py-3 text-sm" to="/products">
              View Products
            </Link>
            {isStaff ? (
              <>
                <Link className="premium-button-ghost px-5 py-3 text-sm" to="/inventory">
                  Manage Inventory
                </Link>
                <Link className="premium-button-secondary px-5 py-3 text-sm" to="/suppliers">
                  Manage Suppliers
                </Link>
              </>
            ) : (
              <>
                <Link className="premium-button-ghost px-5 py-3 text-sm" to="/cart">
                  View Cart
                </Link>
                <Link className="premium-button-secondary px-5 py-3 text-sm" to="/wishlist">
                  View Wishlist
                </Link>
                <Link className="premium-button px-5 py-3 text-sm" to="/orders">
                  View Order History
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {!isLoading && !isStaff && dealProducts.length > 0 && (
        <div className="mt-10">
          <DealProductStrip
            products={dealProducts}
            eyebrow="Special Pricing"
            description="Browse every discounted product in one horizontal strip."
          />
        </div>
      )}
    </div>
  );
}

export default Dashboard;
