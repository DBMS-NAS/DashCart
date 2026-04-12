import { useEffect, useState } from "react";
import axios from "axios";

import { API_BASE_URL, authHeaders } from "../utils/api";

const supplierInitialState = {
  name: "",
  contact_person: "",
  email: "",
  phone: "",
  address: "",
};

const requestInitialState = {
  supplier: "",
  product_name: "",
  quantity: "",
  notes: "",
};

function Suppliers() {
  const [activeTab, setActiveTab] = useState("suppliers");
  const [suppliers, setSuppliers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [supplierForm, setSupplierForm] = useState(supplierInitialState);
  const [requestForm, setRequestForm] = useState(requestInitialState);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);
  const [isSavingRequest, setIsSavingRequest] = useState(false);

  const loadData = async () => {
    setError("");
    setIsLoading(true);

    try {
      const [suppliersResponse, requestsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/suppliers/`, {
          headers: authHeaders(),
        }),
        axios.get(`${API_BASE_URL}/api/suppliers/requests/`, {
          headers: authHeaders(),
        }),
      ]);

      setSuppliers(suppliersResponse.data);
      setRequests(requestsResponse.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not load supplier data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSupplierChange = (event) => {
    setSupplierForm({
      ...supplierForm,
      [event.target.name]: event.target.value,
    });
  };

  const handleRequestChange = (event) => {
    setRequestForm({
      ...requestForm,
      [event.target.name]: event.target.value,
    });
  };

  const handleSupplierSave = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSavingSupplier(true);

    try {
      await axios.post(`${API_BASE_URL}/api/suppliers/`, supplierForm, {
        headers: authHeaders(),
      });
      setSupplierForm(supplierInitialState);
      setMessage("Supplier added.");
      await loadData();
    } catch (err) {
      const responseErrors = err.response?.data;
      setError(
        responseErrors?.detail ||
          responseErrors?.name?.[0] ||
          responseErrors?.contact_person?.[0] ||
          "Could not save supplier."
      );
    } finally {
      setIsSavingSupplier(false);
    }
  };

  const handleRequestSave = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSavingRequest(true);

    try {
      await axios.post(
        `${API_BASE_URL}/api/suppliers/requests/`,
        {
          ...requestForm,
          quantity: Number(requestForm.quantity),
        },
        {
          headers: authHeaders(),
        }
      );
      setRequestForm(requestInitialState);
      setMessage("Supplier request created.");
      setActiveTab("requests");
      await loadData();
    } catch (err) {
      const responseErrors = err.response?.data;
      setError(
        responseErrors?.detail ||
          responseErrors?.supplier?.[0] ||
          responseErrors?.product_name?.[0] ||
          responseErrors?.quantity?.[0] ||
          "Could not create supplier request."
      );
    } finally {
      setIsSavingRequest(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold">Suppliers</h2>
        <p className="mt-2 text-slate-600">
          Manage supplier details and request products from them.
        </p>
      </div>

      {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {message && <p className="mb-4 rounded bg-green-50 p-3 text-green-700">{message}</p>}

      <div className="mb-6 flex gap-3">
        <button
          className={`rounded px-4 py-2 font-medium ${
            activeTab === "suppliers"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-700 shadow"
          }`}
          onClick={() => setActiveTab("suppliers")}
          type="button"
        >
          Supplier Details
        </button>
        <button
          className={`rounded px-4 py-2 font-medium ${
            activeTab === "requests"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-700 shadow"
          }`}
          onClick={() => setActiveTab("requests")}
          type="button"
        >
          Product Requests
        </button>
      </div>

      {isLoading ? (
        <p className="text-slate-600">Loading supplier records...</p>
      ) : activeTab === "suppliers" ? (
        <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
          <form className="rounded-xl bg-white p-5 shadow" onSubmit={handleSupplierSave}>
            <h3 className="mb-4 text-xl font-semibold">Add Supplier</h3>

            <input
              className="mb-3 w-full rounded border p-2"
              name="name"
              onChange={handleSupplierChange}
              placeholder="Supplier Name"
              value={supplierForm.name}
            />
            <input
              className="mb-3 w-full rounded border p-2"
              name="contact_person"
              onChange={handleSupplierChange}
              placeholder="Contact Person"
              value={supplierForm.contact_person}
            />
            <input
              className="mb-3 w-full rounded border p-2"
              name="email"
              onChange={handleSupplierChange}
              placeholder="Email"
              type="email"
              value={supplierForm.email}
            />
            <input
              className="mb-3 w-full rounded border p-2"
              name="phone"
              onChange={handleSupplierChange}
              placeholder="Phone"
              value={supplierForm.phone}
            />
            <textarea
              className="mb-4 w-full rounded border p-2"
              name="address"
              onChange={handleSupplierChange}
              placeholder="Address"
              rows="4"
              value={supplierForm.address}
            />

            <button
              className="rounded bg-blue-600 px-4 py-2 text-white disabled:bg-slate-400"
              disabled={isSavingSupplier}
              type="submit"
            >
              {isSavingSupplier ? "Saving..." : "Add Supplier"}
            </button>
          </form>

          <div className="rounded-xl bg-white p-5 shadow">
            <h3 className="mb-4 text-xl font-semibold">Supplier List</h3>

            {suppliers.length === 0 ? (
              <p className="text-slate-600">No suppliers added yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-slate-50">
                    <tr>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Contact</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier) => (
                      <tr className="border-b" key={supplier.supplier_id}>
                        <td className="p-3">
                          <p className="font-medium">{supplier.name}</p>
                          <p className="text-sm text-slate-500">{supplier.address || "No address"}</p>
                        </td>
                        <td className="p-3">{supplier.contact_person}</td>
                        <td className="p-3">{supplier.email || "-"}</td>
                        <td className="p-3">{supplier.phone || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
          <form className="rounded-xl bg-white p-5 shadow" onSubmit={handleRequestSave}>
            <h3 className="mb-4 text-xl font-semibold">Request Product</h3>

            <select
              className="mb-3 w-full rounded border p-2"
              name="supplier"
              onChange={handleRequestChange}
              value={requestForm.supplier}
            >
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.supplier_id} value={supplier.supplier_id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <input
              className="mb-3 w-full rounded border p-2"
              name="product_name"
              onChange={handleRequestChange}
              placeholder="Product Name"
              value={requestForm.product_name}
            />
            <input
              className="mb-3 w-full rounded border p-2"
              min="1"
              name="quantity"
              onChange={handleRequestChange}
              placeholder="Quantity"
              type="number"
              value={requestForm.quantity}
            />
            <textarea
              className="mb-4 w-full rounded border p-2"
              name="notes"
              onChange={handleRequestChange}
              placeholder="Notes"
              rows="4"
              value={requestForm.notes}
            />

            <button
              className="rounded bg-emerald-600 px-4 py-2 text-white disabled:bg-slate-400"
              disabled={isSavingRequest || suppliers.length === 0}
              type="submit"
            >
              {isSavingRequest ? "Saving..." : "Create Request"}
            </button>

            {suppliers.length === 0 && (
              <p className="mt-3 text-sm text-amber-700">
                Add a supplier first before creating requests.
              </p>
            )}
          </form>

          <div className="rounded-xl bg-white p-5 shadow">
            <h3 className="mb-4 text-xl font-semibold">Request History</h3>

            {requests.length === 0 ? (
              <p className="text-slate-600">No supplier requests created yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-slate-50">
                    <tr>
                      <th className="p-3 text-left">Supplier</th>
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-left">Qty</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Requested By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr className="border-b" key={request.request_id}>
                        <td className="p-3">{request.supplier_name}</td>
                        <td className="p-3">
                          <p className="font-medium">{request.product_name}</p>
                          <p className="text-sm text-slate-500">{request.notes || "No notes"}</p>
                        </td>
                        <td className="p-3">{request.quantity}</td>
                        <td className="p-3">{request.status}</td>
                        <td className="p-3">{request.requested_by_username}</td>
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

export default Suppliers;
