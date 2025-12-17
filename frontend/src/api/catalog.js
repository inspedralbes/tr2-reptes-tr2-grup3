import client from "./client.js";

export const listWorkshops = async () => {
  const { data } = await client.get("/catalog/workshops");
  return data;
};
