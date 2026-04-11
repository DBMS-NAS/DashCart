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
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Create Account</h1>
          <p className="mt-2 text-slate-600">
            Choose the account role first, then enter login details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            What type of user are you?
          </h2>

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            {roles.map((item) => (
              <button
                className={`rounded-xl border p-4 text-left transition ${
                  role === item.value
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                    : "border-slate-200 hover:border-blue-300"
                }`}
                key={item.value}
                onClick={() => setRole(item.value)}
                type="button"
              >
                <span className="block text-lg font-semibold text-slate-900">
                  {item.label}
                </span>
                <span className="mt-2 block text-sm text-slate-600">
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
                className="w-full rounded-lg border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
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
                className="w-full rounded-lg border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
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
            className="mt-6 w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>

          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link className="font-semibold text-blue-600 hover:underline" to="/login">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
