import { Link, useLocation } from "react-router-dom";

function OrderSuccess() {
  const { state } = useLocation();

  if (!state?.order_id) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow">
        <h2 className="text-3xl font-bold text-slate-900">Order Confirmation</h2>
        <p className="mt-3 text-slate-600">
          We could not find a recent order confirmation in this session.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="rounded bg-blue-600 px-4 py-2 text-white" to="/orders">
            View Order History
          </Link>
          <Link className="rounded border border-slate-300 px-4 py-2 text-slate-700" to="/products">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-blue-50 p-8 shadow">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
          Order placed
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-900">
          Thanks for your order.
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Your purchase has been recorded successfully. Keep this order ID handy for your demo
          and order history.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Order ID</p>
            <p className="mt-2 font-mono text-lg font-semibold text-slate-900">{state.order_id}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Paid</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">${state.total}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Items</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{state.item_count}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr,320px]">
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-2xl font-bold text-slate-900">Order Summary</h2>
          <div className="mt-5 space-y-4">
            {(state.items || []).map((item) => (
              <div
                key={`${state.order_id}-${item.id || item.product_id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
              >
                <div>
                  <p className="font-semibold text-slate-900">{item.product_name}</p>
                  <p className="text-sm text-slate-500">Quantity: {item.quantity}</p>
                </div>
                <p className="font-semibold text-slate-900">${item.subtotal}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-2xl font-bold text-slate-900">What next?</h2>
          <div className="mt-5 space-y-3">
            <Link className="block rounded bg-blue-600 px-4 py-3 text-center font-semibold text-white" to="/orders">
              View Order History
            </Link>
            <Link className="block rounded border border-slate-300 px-4 py-3 text-center font-semibold text-slate-700" to="/products">
              Continue Shopping
            </Link>
            <Link className="block rounded border border-slate-300 px-4 py-3 text-center font-semibold text-slate-700" to="/wishlist">
              Open Wishlist
            </Link>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Status: <span className="font-semibold capitalize text-slate-900">{state.status}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default OrderSuccess;
