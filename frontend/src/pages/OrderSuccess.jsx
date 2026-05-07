import { Link, useLocation } from "react-router-dom";

function OrderSuccess() {
  const { state } = useLocation();

  if (!state?.order_id) {
    return (
      <div className="section-panel rounded-[2rem] p-8">
        <h2 className="display-heading text-4xl text-slate-50">Order Confirmation</h2>
        <p className="mt-3 text-slate-600">
          We could not find a recent order confirmation in this session.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="premium-button px-5 py-3 text-sm" to="/orders">
            View Order History
          </Link>
          <Link className="premium-button-ghost px-5 py-3 text-sm" to="/products">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="hero-panel rounded-[2rem] p-8">
        <p className="page-eyebrow">
          Order placed
        </p>
        <h1 className="display-heading mt-3 text-4xl text-slate-50 md:text-5xl">
          Thanks for your order.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
          Your purchase has been recorded successfully. Keep this order ID handy for your demo
          and order history.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="premium-card rounded-[1.5rem] p-5 shadow-sm">
            <p className="page-eyebrow">Order ID</p>
            <p className="mt-3 font-mono text-lg font-semibold text-slate-50">{state.order_id}</p>
          </div>
          <div className="premium-card rounded-[1.5rem] p-5 shadow-sm">
            <p className="page-eyebrow">Total Paid</p>
            <p className="mt-3 text-lg font-semibold text-slate-50">${state.total}</p>
          </div>
          <div className="premium-card rounded-[1.5rem] p-5 shadow-sm">
            <p className="page-eyebrow">Items</p>
            <p className="mt-3 text-lg font-semibold text-slate-50">{state.item_count}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr,320px]">
        <div className="section-panel rounded-[2rem] p-6">
          <h2 className="display-heading text-3xl text-slate-50">Order Summary</h2>
          <div className="mt-5 space-y-4">
            {(state.items || []).map((item) => (
              <div
                key={`${state.order_id}-${item.id || item.product_id}`}
                className="premium-card flex items-center justify-between rounded-[1.5rem] p-4"
              >
                <div>
                  <p className="font-semibold text-slate-50">{item.product_name}</p>
                  <p className="text-sm text-slate-500">Quantity: {item.quantity}</p>
                </div>
                <p className="font-semibold text-amber-500">${item.subtotal}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="section-panel rounded-[2rem] p-6">
          <h2 className="display-heading text-3xl text-slate-50">What next?</h2>
          <div className="mt-5 space-y-3">
            <Link className="premium-button block px-4 py-3 text-center text-sm" to="/orders">
              View Order History
            </Link>
            <Link className="premium-button-ghost block px-4 py-3 text-center text-sm" to="/products">
              Continue Shopping
            </Link>
            <Link className="premium-button-secondary block px-4 py-3 text-center text-sm" to="/wishlist">
              Open Wishlist
            </Link>
          </div>

          <div className="premium-card mt-6 rounded-[1.5rem] p-4 text-sm text-slate-300">
            Status: <span className="font-semibold capitalize text-slate-50">{state.status}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default OrderSuccess;
