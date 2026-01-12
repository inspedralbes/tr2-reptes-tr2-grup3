import api from "./api";

export const centerService = {
  async getAll() {
    const { data } = await api.get("/centers");
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/centers/${id}`);
    return data;
  },

  async create(center) {
    const { data } = await api.post("/centers", center);
    return data;
  },

  async update(id, center) {
    const { data } = await api.put(`/centers/${id}`, center);
    return data;
  },

  async delete(id) {
    const { data } = await api.delete(`/centers/${id}`);
    return data;
  },

  async importCSV(file) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/centers/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  async exportCSV() {
    const response = await api.get("/centers/export", {
      responseType: "blob",
    });

    // Crear enlace de descarga
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;

    const timestamp = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `centros_${timestamp}.csv`);

    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
