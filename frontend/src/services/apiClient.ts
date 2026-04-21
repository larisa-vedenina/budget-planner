import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL?.trim() || "";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});
