import axios from "axios";

const API_URL = "http://localhost:8080/api/orders"; // alamat backend Spring Boot

// Checkout (buat order baru)
export const checkout = async (orderData) => {
  const response = await axios.post(`${API_URL}/checkout`, orderData);
  return response.data;
};

// Ambil semua order user tertentu
export const getUserOrders = async (userId) => {
  const response = await axios.get(`${API_URL}/user/${userId}`);
  return response.data;
};
