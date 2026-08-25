const PAYSTACK_BASE_URL = "https://api.paystack.co";

const paystackFetch = async (path, options = {}) => {
  const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || "Paystack request failed");
  }
  return data.data;
};

// Starts a hosted-checkout transaction. Returns { authorization_url, access_code, reference }.
export const initializeTransaction = ({ email, amount, currency, reference, callbackUrl, metadata }) =>
  paystackFetch("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({ email, amount, currency, reference, callback_url: callbackUrl, metadata }),
  });

// Server-to-server confirmation of a transaction — used as a second check
// beyond webhook signature verification before granting "paid" status.
export const verifyTransaction = (reference) =>
  paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`, { method: "GET" });
