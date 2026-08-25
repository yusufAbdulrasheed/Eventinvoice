import api from "./api";

export const getInvoices    = ()              => api.get("/invoices");
export const getInvoice     = (id)            => api.get(`/invoices/${id}`);
export const createInvoice  = (data)          => api.post("/invoices", data);
export const updateInvoice  = (id, data)      => api.put(`/invoices/${id}`, data);
export const deleteInvoice  = (id)            => api.delete(`/invoices/${id}`);
export const updateStatus   = (id, status)    => api.patch(`/invoices/${id}/status`, { status });
export const sendInvoiceEmail = (id)          => api.post(`/invoices/${id}/send`);
