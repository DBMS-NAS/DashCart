import { Link, useLocation, useNavigate } from "react-router-dom";

import { clearCurrentUser, getCurrentUser } from "../utils/auth";

function Sidebar() {
  const logoSrc = `${process.env.PUBLIC_URL}/dashcart-logo.png`;
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const isCustomer = user?.role === "customer";

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/login");
  };

  const customerLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/products", label: "Products" },
    { to: "/cart", label: "Cart" },
    { to: "/wishlist", label: "Wishlist" },
    { to: "/orders", label: "Order History" },
    { to: "/reviews", label: "Reviews" },
  ];

  const staffLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/products", label: "Products" },
    { to: "/orders", label: "Orders" },
    { to: "/reviews", label: "Reviews" },
    { to: "/inventory", label: "Inventory" },
    { to: "/suppliers", label: "Suppliers" },
    { to: "/discounts", label: "Discounts" },
  ];

  const links = isCustomer ? customerLinks : staffLinks;

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-slate-900/95 p-7 text-white backdrop-blur">
      <div className="mb-10 border-b border-slate-200/60 pb-6">
        <p className="page-eyebrow">Retail Studio</p>
        <div className="mt-4 flex items-center gap-4">
          <img
            src={logoSrc}
            alt="DashCart logo"
            className="h-16 w-16 rounded-2xl border border-slate-200/40 object-contain shadow-lg"
          />
          <div>
            <h2 className="display-heading text-4xl text-slate-50">DashCart</h2>
          </div>
        </div>
      </div>

      <div className="page-eyebrow mb-3">Navigation</div>
      <ul className="flex-1 space-y-2">
        {links.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActive(item.to)
                  ? "border border-blue-200 bg-blue-50 text-slate-50 shadow-sm"
                  : "text-slate-300 hover:bg-slate-700/80 hover:text-slate-50"
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <button
        className="premium-button-secondary mt-auto w-full px-4 py-3 text-sm"
        onClick={handleLogout}
        type="button"
      >
        Logout
      </button>
    </aside>
  );
}

export default Sidebar;
