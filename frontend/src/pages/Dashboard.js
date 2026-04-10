function Dashboard() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Dashboard</h2>

      <div className="grid grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-gray-500">Total Sales</h3>
          <p className="text-3xl font-bold mt-2">$12,000</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-gray-500">Orders</h3>
          <p className="text-3xl font-bold mt-2">320</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-gray-500">Products</h3>
          <p className="text-3xl font-bold mt-2">85</p>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;