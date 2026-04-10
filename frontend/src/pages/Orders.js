function Orders() {
  const orders = [
    { id: 1, customer: "John Doe", status: "Delivered" },
    { id: 2, customer: "Alice", status: "Pending" },
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Orders</h2>

      <table className="w-full bg-white rounded-lg shadow">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-3 text-left">Order ID</th>
            <th className="p-3 text-left">Customer</th>
            <th className="p-3 text-left">Status</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t">
              <td className="p-3">{o.id}</td>
              <td className="p-3">{o.customer}</td>
              <td className="p-3">{o.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Orders;