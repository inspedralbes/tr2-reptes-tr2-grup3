import client from "./client.js";

export const login = async (email, password) => {
  const { data } = await client.post("/auth/login", { email, password });
  return data;
};

export const getProfile = async (token) => {
  const { data } = await client.get("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.user || data;
};

export const logout = () => {
  // Add API call if needed; client-side clear for now.
  return Promise.resolve();
};
