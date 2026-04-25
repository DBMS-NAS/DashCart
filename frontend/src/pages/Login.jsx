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
      setError("Invalid username or password.");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-80 rounded bg-white p-6 shadow-md">
        <h2 className="mb-4 text-center text-2xl font-bold">
          Login
        </h2>

        <form onSubmit={handleLogin}>
          <input
            className="mb-3 w-full border p-2"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="mb-3 w-full border p-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="mb-2 text-sm text-red-500">
              {error}
            </p>
          )}

          <button
            className="w-full rounded bg-blue-500 p-2 text-white"
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
