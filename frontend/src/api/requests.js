import client from "./client.js";

export const listRequests = async () => {
  const { data } = await client.get("/requests");
  return data;
};

export const createRequest = async (payload) => {
  const { data } = await client.post("/requests", payload);
  return data;
};
