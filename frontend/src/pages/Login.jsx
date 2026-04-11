import React, { useState } from "react";
import axios from "axios";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/token/",
        {
          username,
          password,
        }
      );

      localStorage.setItem("token", res.data.access);

      alert("Login successful ✅");

      window.location.href = "/dashboard";

    } catch (err) {
      setError("Invalid username or password ❌");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-80">

        <h2 className="text-2xl font-bold mb-4 text-center">
          Login
        </h2>

        <form onSubmit={handleLogin}>

          <input
            className="w-full p-2 border mb-3"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="w-full p-2 border mb-3"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="text-red-500 text-sm mb-2">
              {error}
            </p>
          )}

          <button
            className="w-full bg-blue-500 text-white p-2 rounded"
            type="submit"
          >
            Login
          </button>

        </form>

      </div>
    </div>
  );
}

export default Login;