import api from "./api";

export const getItems    = ()         => api.get("/items");
export const getItem     = (id)       => api.get(`/items/${id}`);
export const createItem  = (data)     => api.post("/items", data);
export const updateItem  = (id, data) => api.put(`/items/${id}`, data);
export const deleteItem  = (id)       => api.delete(`/items/${id}`);
