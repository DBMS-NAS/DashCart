import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";

import { API_BASE_URL } from "../utils/api";

const storeInitialState = {
  name: "",
  location: "",
};

const warehouseInitialState = {
  store: "",
  location: "",
};

const movementInitialState = {
  product: "",
  warehouse: "",
  type: "in",
  quantity: "",
};

const transferInitialState = {
  product: "",
  source_warehouse: "",
  destination_warehouse: "",
  quantity: "",
};

function Inventory() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [movements, setMovements] = useState([]);
  const [storeForm, setStoreForm] = useState(storeInitialState);
  const [warehouseForm, setWarehouseForm] = useState(warehouseInitialState);
  const [movementForm, setMovementForm] = useState(movementInitialState);
  const [transferForm, setTransferForm] = useState(transferInitialState);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [isSavingWarehouse, setIsSavingWarehouse] = useState(false);
  const [isSavingMovement, setIsSavingMovement] = useState(false);
  const [isSavingTransfer, setIsSavingTransfer] = useState(false);

  const loadData = async () => {
    setError("");
    setIsLoading(true);

    try {
      const [
        inventoryResponse,
        productsResponse,
        storesResponse,
        warehousesResponse,
        movementsResponse,
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/inventory/`),
        axios.get(`${API_BASE_URL}/api/inventory/products/`),
        axios.get(`${API_BASE_URL}/api/stores/`),
        axios.get(`${API_BASE_URL}/api/stores/warehouses/`),
        axios.get(`${API_BASE_URL}/api/inventory/stock-movements/`),
      ]);

      setInventory(inventoryResponse.data);
      setProducts(productsResponse.data);
      setStores(storesResponse.data);
      setWarehouses(warehousesResponse.data);
      setMovements(movementsResponse.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not load inventory data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStoreChange = (event) => {
    setStoreForm({ ...storeForm, [event.target.name]: event.target.value });
  };

  const handleWarehouseChange = (event) => {
    setWarehouseForm({ ...warehouseForm, [event.target.name]: event.target.value });
  };

  const handleMovementChange = (event) => {
    setMovementForm({ ...movementForm, [event.target.name]: event.target.value });
  };

  const handleTransferChange = (event) => {
    setTransferForm({ ...transferForm, [event.target.name]: event.target.value });
  };

  const handleStoreSave = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSavingStore(true);

    try {
      await axios.post(`${API_BASE_URL}/api/stores/`, storeForm);
      setStoreForm(storeInitialState);
      setMessage("Store added.");
      await loadData();
    } catch (err) {
      const responseErrors = err.response?.data;
      setError(
        responseErrors?.detail ||
          responseErrors?.name?.[0] ||
          responseErrors?.location?.[0] ||
          "Could not add store."
      );
    } finally {
      setIsSavingStore(false);
    }
  };

  const handleWarehouseSave = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSavingWarehouse(true);

    try {
      await axios.post(`${API_BASE_URL}/api/stores/warehouses/`, warehouseForm);
      setWarehouseForm(warehouseInitialState);
      setMessage("Warehouse added.");
      await loadData();
    } catch (err) {
      const responseErrors = err.response?.data;
      setError(
        responseErrors?.detail ||
          responseErrors?.store?.[0] ||
          responseErrors?.location?.[0] ||
          "Could not add warehouse."
      );
    } finally {
      setIsSavingWarehouse(false);
    }
  };

  const handleMovementSave = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSavingMovement(true);

    try {
      await axios.post(`${API_BASE_URL}/api/inventory/stock-movements/`, {
        ...movementForm,
        quantity: Number(movementForm.quantity),
      });
      setMovementForm(movementInitialState);
      setMessage("Stock movement recorded.");
      setActiveTab("movements");
      await loadData();
    } catch (err) {
      const responseErrors = err.response?.data;
      setError(
        responseErrors?.detail ||
          responseErrors?.product?.[0] ||
          responseErrors?.warehouse?.[0] ||
          responseErrors?.quantity?.[0] ||
          responseErrors?.type?.[0] ||
          "Could not record stock movement."
      );
    } finally {
      setIsSavingMovement(false);
    }
  };

  const handleTransferSave = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSavingTransfer(true);

    try {
      await axios.post(`${API_BASE_URL}/api/inventory/transfers/`, {
        ...transferForm,
        quantity: Number(transferForm.quantity),
      });
      setTransferForm(transferInitialState);
      setMessage("Stock transferred.");
      setActiveTab("movements");
      await loadData();
    } catch (err) {
      const responseErrors = err.response?.data;
      setError(
        responseErrors?.detail ||
          responseErrors?.non_field_errors?.[0] ||
          responseErrors?.product?.[0] ||
          responseErrors?.source_warehouse?.[0] ||
          responseErrors?.destination_warehouse?.[0] ||
          responseErrors?.quantity?.[0] ||
          "Could not transfer stock."
      );
    } finally {
      setIsSavingTransfer(false);
    }
  };

  const tabClass = (tabName) =>
    `rounded px-4 py-2 font-medium ${
      activeTab === tabName
        ? "bg-slate-900 text-white"
        : "bg-white text-slate-700 shadow"
    }`;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold">Inventory</h2>
        <p className="mt-2 text-slate-600">
          Track product stock by warehouse and record stock in/out movements.
        </p>
      </div>

      {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {message && <p className="mb-4 rounded bg-green-50 p-3 text-green-700">{message}</p>}

      <div className="mb-6 flex flex-wrap gap-3">
        <button className={tabClass("inventory")} onClick={() => setActiveTab("inventory")} type="button">
          Inventory
        </button>
        <button className={tabClass("movements")} onClick={() => setActiveTab("movements")} type="button">
          Stock Movements
        </button>
        <button className={tabClass("warehouses")} onClick={() => setActiveTab("warehouses")} type="button">
          Warehouses
        </button>
      </div>

      {isLoading ? (
        <p className="text-slate-600">Loading inventory...</p>
      ) : activeTab === "inventory" ? (
        inventory.length === 0 ? (
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
                <th className="p-3 text-left">Store</th>
                <th className="p-3 text-left">Warehouse</th>
                <th className="p-3 text-left">Stock</th>
              </tr>
            </thead>

            <tbody>
              {inventory.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">{item.product_name}</td>
                  <td className="p-3">${item.product_price}</td>
                  <td className="p-3">{item.store_name}</td>
                  <td className="p-3">{item.warehouse_location}</td>
                  <td className="p-3">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : activeTab === "movements" ? (
        <div className="grid gap-6 xl:grid-cols-[360px,360px,1fr]">
          <form className="rounded-xl bg-white p-5 shadow" onSubmit={handleMovementSave}>
            <h3 className="mb-4 text-xl font-semibold">Record Stock Movement</h3>
            <select
              className="mb-3 w-full rounded border p-2"
              name="product"
              onChange={handleMovementChange}
              value={movementForm.product}
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.product_id} value={product.product_id}>
                  {product.name}
                </option>
              ))}
            </select>
            <select
              className="mb-3 w-full rounded border p-2"
              name="warehouse"
              onChange={handleMovementChange}
              value={movementForm.warehouse}
            >
              <option value="">Select warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                  {warehouse.store_name} - {warehouse.store_location || warehouse.location}
                </option>
              ))}
            </select>
            <select
              className="mb-3 w-full rounded border p-2"
              name="type"
              onChange={handleMovementChange}
              value={movementForm.type}
            >
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
            </select>
            <input
              className="mb-4 w-full rounded border p-2"
              min="1"
              name="quantity"
              onChange={handleMovementChange}
              placeholder="Quantity"
              type="number"
              value={movementForm.quantity}
            />
            <button
              className="rounded bg-emerald-600 px-4 py-2 text-white disabled:bg-slate-400"
              disabled={isSavingMovement || products.length === 0 || warehouses.length === 0}
              type="submit"
            >
              {isSavingMovement ? "Saving..." : "Record Movement"}
            </button>
            {(products.length === 0 || warehouses.length === 0) && (
              <p className="mt-3 text-sm text-amber-700">
                Add products and warehouses before recording stock movement.
              </p>
            )}
          </form>

          <form className="rounded-xl bg-white p-5 shadow" onSubmit={handleTransferSave}>
            <h3 className="mb-4 text-xl font-semibold">Transfer Between Warehouses</h3>
            <select
              className="mb-3 w-full rounded border p-2"
              name="product"
              onChange={handleTransferChange}
              value={transferForm.product}
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.product_id} value={product.product_id}>
                  {product.name}
                </option>
              ))}
            </select>
            <select
              className="mb-3 w-full rounded border p-2"
              name="source_warehouse"
              onChange={handleTransferChange}
              value={transferForm.source_warehouse}
            >
              <option value="">Source warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                  {warehouse.store_name} - {warehouse.store_location || warehouse.location}
                </option>
              ))}
            </select>
            <select
              className="mb-3 w-full rounded border p-2"
              name="destination_warehouse"
              onChange={handleTransferChange}
              value={transferForm.destination_warehouse}
            >
              <option value="">Destination warehouse</option>
              {warehouses
                .filter((warehouse) => warehouse.warehouse_id !== transferForm.source_warehouse)
                .map((warehouse) => (
                  <option key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                    {warehouse.store_name} - {warehouse.store_location || warehouse.location}
                  </option>
                ))}
            </select>
            <input
              className="mb-4 w-full rounded border p-2"
              min="1"
              name="quantity"
              onChange={handleTransferChange}
              placeholder="Quantity"
              type="number"
              value={transferForm.quantity}
            />
            <button
              className="rounded bg-blue-600 px-4 py-2 text-white disabled:bg-slate-400"
              disabled={isSavingTransfer || products.length === 0 || warehouses.length < 2}
              type="submit"
            >
              {isSavingTransfer ? "Transferring..." : "Transfer Stock"}
            </button>
            {(products.length === 0 || warehouses.length < 2) && (
              <p className="mt-3 text-sm text-amber-700">
                Add products and at least two warehouses before transferring stock.
              </p>
            )}
          </form>

          <div className="rounded-xl bg-white p-5 shadow">
            <h3 className="mb-4 text-xl font-semibold">Movement History</h3>
            {movements.length === 0 ? (
              <p className="text-slate-600">No stock movements recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-slate-50">
                    <tr>
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-left">Store</th>
                      <th className="p-3 text-left">Warehouse</th>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-left">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((movement) => (
                      <tr className="border-b" key={movement.movement_id}>
                        <td className="p-3">{movement.product_name}</td>
                        <td className="p-3">{movement.store_name}</td>
                        <td className="p-3">{movement.warehouse_location}</td>
                        <td className="p-3 capitalize">{movement.type}</td>
                        <td className="p-3">{movement.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <form className="rounded-xl bg-white p-5 shadow" onSubmit={handleStoreSave}>
              <h3 className="mb-4 text-xl font-semibold">Add Store</h3>
              <input
                className="mb-3 w-full rounded border p-2"
                name="name"
                onChange={handleStoreChange}
                placeholder="Store Name"
                value={storeForm.name}
              />
              <input
                className="mb-4 w-full rounded border p-2"
                name="location"
                onChange={handleStoreChange}
                placeholder="Store Location"
                value={storeForm.location}
              />
              <button
                className="rounded bg-blue-600 px-4 py-2 text-white disabled:bg-slate-400"
                disabled={isSavingStore}
                type="submit"
              >
                {isSavingStore ? "Saving..." : "Add Store"}
              </button>
            </form>

            <form className="rounded-xl bg-white p-5 shadow" onSubmit={handleWarehouseSave}>
              <h3 className="mb-4 text-xl font-semibold">Add Warehouse</h3>
              <select
                className="mb-3 w-full rounded border p-2"
                name="store"
                onChange={handleWarehouseChange}
                value={warehouseForm.store}
              >
                <option value="">Select store</option>
                {stores.map((store) => (
                  <option key={store.store_id} value={store.store_id}>
                    {store.name}
                  </option>
                ))}
              </select>
              <input
                className="mb-4 w-full rounded border p-2"
                name="location"
                onChange={handleWarehouseChange}
                placeholder="Warehouse Location"
                value={warehouseForm.location}
              />
              <button
                className="rounded bg-emerald-600 px-4 py-2 text-white disabled:bg-slate-400"
                disabled={isSavingWarehouse || stores.length === 0}
                type="submit"
              >
                {isSavingWarehouse ? "Saving..." : "Add Warehouse"}
              </button>
              {stores.length === 0 && (
                <p className="mt-3 text-sm text-amber-700">
                  Add a store before adding a warehouse.
                </p>
              )}
            </form>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <h3 className="mb-4 text-xl font-semibold">Warehouse List</h3>
            {warehouses.length === 0 ? (
              <p className="text-slate-600">No warehouses added yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-slate-50">
                    <tr>
                      <th className="p-3 text-left">Warehouse ID</th>
                      <th className="p-3 text-left">Store</th>
                      <th className="p-3 text-left">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouses.map((warehouse) => (
                      <tr className="border-b" key={warehouse.warehouse_id}>
                        <td className="p-3">{warehouse.warehouse_id}</td>
                        <td className="p-3">{warehouse.store_name}</td>
                        <td className="p-3">{warehouse.store_location || warehouse.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
