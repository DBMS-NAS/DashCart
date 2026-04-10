import { useState } from "react";

function Products() {
  const [search, setSearch] = useState("");  

  const [products, setProducts] = useState([
    { name: "iPhone 15", price: 999, stock: 50 },
    { name: "Samsung TV", price: 1200, stock: 20 },
  ]);

  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    if (editIndex !== null) {
      // Update existing product
      const updated = [...products];
      updated[editIndex] = form;
      setProducts(updated);
      setEditIndex(null);
    } else {
      // Add new product
      setProducts([...products, form]);
    }

    setForm({ name: "", price: "", stock: "" });
    setShowForm(false);
  };

  const handleEdit = (index) => {
    setForm(products[index]);
    setEditIndex(index);
    setShowForm(true);
  };

  const handleDelete = (index) => {
    const updated = products.filter((_, i) => i !== index);
    setProducts(updated);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Products</h2>

      {/* Add Button */}
      <button
        onClick={() => {
          setShowForm(true);
          setEditIndex(null);
          setForm({ name: "", price: "", stock: "" });
        }}
        className="mb-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        + Add Product
      </button>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <input
            type="text"
            name="name"
            placeholder="Product Name"
            value={form.name}
            onChange={handleChange}
            className="border p-2 mr-2"
          />
          <input
            type="number"
            name="price"
            placeholder="Price"
            value={form.price}
            onChange={handleChange}
            className="border p-2 mr-2"
          />
          <input
            type="number"
            name="stock"
            placeholder="Stock"
            value={form.stock}
            onChange={handleChange}
            className="border p-2 mr-2"
          />
          <button
            onClick={handleSave}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      )}

      <input
  type="text"
  placeholder="Search product..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="border p-2 mb-4 w-full"
/>

      {/* Table */}
      <table className="w-full bg-white rounded-lg shadow">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Price</th>
            <th className="p-3 text-left">Stock</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
         {products
  .filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )
  .map((p, index) => (
            <tr key={index} className="border-t">
              <td className="p-3">{p.name}</td>
              <td className="p-3">${p.price}</td>
              <td className="p-3">{p.stock}</td>
              <td className="p-3 space-x-2">
                <button
                  onClick={() => handleEdit(index)}
                  className="bg-yellow-400 px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(index)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Products;