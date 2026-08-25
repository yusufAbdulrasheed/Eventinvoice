import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true while we check for an existing session

  // The token is the session; the user profile is never cached in
  // localStorage — it's always fetched fresh from the DB so it can't go stale.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    api.get("/auth/me")
      .then(({ data }) => setUser(data))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("token", data.token);
    setUser(data);
    return data;
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const updateProfile = async (patch) => {
    const { data } = await api.patch("/auth/me", patch);
    setUser((prev) => ({ ...prev, ...data }));
    return data;
  };

  const updateBankDetails = async (bankDetails) => {
    const { data } = await api.patch("/auth/bank-details", bankDetails);
    setUser((prev) => ({ ...prev, ...data }));
    return data;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const { data } = await api.patch("/auth/password", { currentPassword, newPassword });
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateProfile, updateBankDetails, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
