function Inventory() {
  const items = [
    { product: "iPhone 15", stock: 50 },
    { product: "Samsung TV", stock: 20 },
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Inventory</h2>

      <table className="w-full bg-white rounded-lg shadow">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-3 text-left">Product</th>
            <th className="p-3 text-left">Stock</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-t">
              <td className="p-3">{item.product}</td>
              <td className="p-3">{item.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Inventory;