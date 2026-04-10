import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div className="w-64 h-screen bg-slate-900 text-white p-6">
      <h2 className="text-2xl font-bold mb-10">DashCart</h2>

      <ul className="space-y-4">
        
        <li>
          <Link to="/" className="block hover:bg-slate-700 p-2 rounded">
            🏠 Dashboard
          </Link>
        </li>

        <li>
          <Link to="/products" className="block hover:bg-slate-700 p-2 rounded">
            📦 Products
          </Link>
        </li>

        <li>
  <Link to="/orders" className="block hover:bg-slate-700 p-2 rounded">
    🧾 Orders
  </Link>
</li>

<li>
  <Link to="/inventory" className="block hover:bg-slate-700 p-2 rounded">
    📊 Inventory
  </Link>
</li>

      </ul>
    </div>
  );
}

export default Sidebar;