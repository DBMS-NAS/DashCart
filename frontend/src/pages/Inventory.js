import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";

import { API_BASE_URL } from "../utils/api";

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInventory = async () => {
      setError("");
      setIsLoading(true);

      try {
        const response = await axios.get(`${API_BASE_URL}/api/inventory/`);
        setInventory(response.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Could not load inventory.");
      } finally {
        setIsLoading(false);
      }
    };

    loadInventory();
  }, []);

  return (
    <div>
      <h2 className="mb-6 text-3xl font-bold">Inventory</h2>

      {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}

      {isLoading ? (
        <p className="text-slate-600">Loading inventory...</p>
      ) : inventory.length === 0 ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-slate-600">
            No inventory records yet. Add products from the Products page.
          </p>
        </div>
      ) : (
        <table className="w-full rounded-lg bg-white shadow">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Warehouse</th>
              <th className="p-3 text-left">Stock</th>
            </tr>
          </thead>

          <tbody>
            {inventory.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3">{item.product_name}</td>
                <td className="p-3">${item.product_price}</td>
                <td className="p-3">{item.warehouse_location}</td>
                <td className="p-3">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Inventory;