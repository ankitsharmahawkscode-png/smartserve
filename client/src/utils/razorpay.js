const SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Could not load the payment window. Check your connection.'));
    document.body.appendChild(s);
  });
}

// Resolves with Razorpay's {razorpay_order_id, razorpay_payment_id, razorpay_signature} after a successful payment.
// The caller must send these to POST /payments/verify: the browser result alone is never trusted.
export async function payWithRazorpay(options) {
  await loadRazorpay();
  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({ ...options, handler: resolve, modal: { ondismiss: () => reject(new Error('Payment cancelled')) } });
    checkout.open();
  });
}