import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";

const roles = [
  {
    value: "customer",
    label: "Customer",
    description: "Shop, browse products, and place orders.",
  },
  {
    value: "staff",
    label: "Staff",
    description: "Help manage products, inventory, and orders.",
  }
];

function Register() {
  const [role, setRole] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getErrorMessage = (data) => {
    if (!data) {
      return "Could not create account. Please try again.";
    }

    if (typeof data === "string") {
      return data;
    }

    const messages = Object.entries(data).flatMap(([field, value]) => {
      if (Array.isArray(value)) {
        return value.map((item) => `${field}: ${item}`);
      }

      return `${field}: ${value}`;
    });

    return messages.join(" ");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!role) {
      setError("Please choose whether this account is customer or staff.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/users/register/`, {
        role,
        username,
        password,
      });

      setSuccess(`Account created for ${response.data.username}. You can now log in.`);
      setUsername("");
      setPassword("");
      setRole("");
    } catch (err) {
      setError(getErrorMessage(err.response?.data));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="hero-panel mb-8 rounded-[2rem] p-8 text-center shadow-2xl">
          <p className="page-eyebrow">Get Started</p>
          <h1 className="display-heading mt-4 text-4xl text-slate-50 md:text-5xl">
            Create your DashCart account
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Choose the account role first, then enter login details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="section-panel rounded-[2rem] p-6 shadow">
          <h2 className="display-heading mb-2 text-3xl text-slate-50">
            What type of user are you?
          </h2>
          <p className="mb-6 text-sm leading-6 text-slate-400">
            Pick the experience that matches how you will use the platform.
          </p>

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            {roles.map((item) => (
              <button
                className={`rounded-[1.5rem] border p-5 text-left transition ${
                  role === item.value
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                    : "premium-card hover:border-blue-300"
                }`}
                key={item.value}
                onClick={() => setRole(item.value)}
                type="button"
              >
                <span className="block text-xl font-semibold text-slate-50">
                  {item.label}
                </span>
                <span className="mt-2 block text-sm leading-6 text-slate-400">
                  {item.description}
                </span>
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Username
              </span>
              <input
                className="premium-input w-full rounded-2xl px-4 py-3"
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
                required
                value={username}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </span>
              <input
                className="premium-input w-full rounded-2xl px-4 py-3"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                required
                type="password"
                value={password}
              />
            </label>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {success}
            </p>
          )}

          <button
            className="premium-button mt-6 w-full px-4 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>

          <p className="mt-4 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link className="font-semibold text-amber-500 hover:underline" to="/login">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
