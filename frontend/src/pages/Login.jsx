import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";
import { saveCurrentUser } from "../utils/auth";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/token/`,
        {
          username,
          password,
        }
      );

      saveCurrentUser({
        access: res.data.access,
        refresh: res.data.refresh,
        username: res.data.username,
        role: res.data.role,
      });

      navigate("/dashboard");

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

        <p className="mt-4 text-center text-sm text-gray-600">
          Need an account?{" "}
          <Link className="font-semibold text-blue-600 hover:underline" to="/register">
            Create one
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;
