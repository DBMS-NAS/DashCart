import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Sidebar from "./components/Sidebar";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";

function App() {
  return (
    <BrowserRouter>
      <div className="flex bg-slate-100 min-h-screen">
        
        <Sidebar />

        <div className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/inventory" element={<Inventory />} />
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  );
}

export default App;