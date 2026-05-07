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
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 shadow-2xl xl:grid-cols-[1.1fr,0.9fr]">
        <div className="hero-panel flex flex-col justify-between p-8 md:p-10">
          <div>
            <p className="page-eyebrow">Retail Studio</p>
            <h1 className="display-heading mt-4 max-w-md text-5xl leading-tight text-slate-50">
              Sign in to your DashCart workspace.
            </h1>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="premium-card rounded-[1.5rem] p-5">
              <p className="page-eyebrow">Customer Flow</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Browse products, save favorites, and place orders with a smooth checkout flow.
              </p>
            </div>
            <div className="premium-card rounded-[1.5rem] p-5">
              <p className="page-eyebrow">Staff Flow</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Oversee stock, suppliers, discounts, and reporting from the same control center.
              </p>
            </div>
          </div>
        </div>

        <div className="section-panel flex flex-col justify-center p-8 md:p-10">
          <p className="page-eyebrow text-center">Access</p>
          <h2 className="display-heading mt-4 text-center text-4xl text-slate-50">
            Welcome back
          </h2>
          <p className="mt-3 text-center text-sm leading-6 text-slate-400">
            Sign in with your DashCart credentials to continue.
          </p>

          <form className="mt-8" onSubmit={handleLogin}>
          <input
            className="premium-input mb-4 w-full rounded-2xl px-4 py-3"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="premium-input mb-4 w-full rounded-2xl px-4 py-3"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            className="premium-button w-full px-4 py-3.5 text-sm"
            type="submit"
          >
            Login
          </button>
        </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Need an account?{" "}
            <Link className="font-semibold text-amber-500 hover:underline" to="/register">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
