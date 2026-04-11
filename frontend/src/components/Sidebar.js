import { Link, useNavigate } from "react-router-dom";
import { clearCurrentUser, getCurrentUser } from "../utils/auth";

function Sidebar() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isStaff = user?.role === "staff";
  const isCustomer = user?.role === "customer";

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/login");
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-slate-900 p-6 text-white">
      <h2 className="mb-10 text-2xl font-bold">DashCart</h2>

      {user && (
        <div className="mb-8 rounded-lg bg-slate-800 p-3 text-sm">
          <p className="font-semibold">{user.username}</p>
          <p className="capitalize text-slate-300">{user.role}</p>
        </div>
      )}

      <ul className="flex-1 space-y-4">
        
        <li>
          <Link to="/dashboard" className="block rounded p-2 hover:bg-slate-700">
            🏠 Dashboard
          </Link>
        </li>

        <li>
          <Link to="/products" className="block rounded p-2 hover:bg-slate-700">
            📦 Products
          </Link>
        </li>

        {isCustomer && (
          <li>
            <Link to="/cart" className="block rounded p-2 hover:bg-slate-700">
              🛒 Cart
            </Link>
          </li>
        )}

        <li>
          <Link to="/orders" className="block rounded p-2 hover:bg-slate-700">
            🧾 Orders
          </Link>
        </li>

        {isStaff && (
          <li>
            <Link to="/inventory" className="block rounded p-2 hover:bg-slate-700">
              📊 Inventory
            </Link>
          </li>
        )}

      </ul>

      <button
        className="mt-6 rounded bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600"
        onClick={handleLogout}
        type="button"
      >
        Logout
      </button>
    </div>
  );
}

export default Sidebar;
