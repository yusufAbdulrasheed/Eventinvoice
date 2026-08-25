import api from "./api";

export const getPublicInvoice     = (token)       => api.get(`/public/invoices/${token}`);
export const createCheckoutSession = (token)       => api.post(`/public/invoices/${token}/checkout-session`);
export const getPaymentLink       = (invoiceId)   => api.get(`/invoices/${invoiceId}/payment-link`);
