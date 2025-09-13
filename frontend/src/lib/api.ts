import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

// Configure base API instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post("/auth/login", credentials),

  register: (userData: { name: string; email: string; password: string }) =>
    api.post("/auth/register", userData),

  verifyEmail: (token: string) => api.post("/auth/verify-email", { token }),

  refreshToken: () => api.post("/auth/refresh"),

  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    api.post("/auth/reset-password", { token, password }),
};

export const userAPI = {
  getProfile: () => api.get("/user/profile"),
  updateProfile: (data: any) => api.put("/user/profile", data),
  deleteAccount: () => api.delete("/user/account"),
};

export const budgetAPI = {
  getBudgets: () => api.get("/budgets"),
  getBudget: (id: string) => api.get(`/budgets/${id}`),
  createBudget: (data: any) => api.post("/budgets", data),
  updateBudget: (id: string, data: any) => api.put(`/budgets/${id}`, data),
  deleteBudget: (id: string) => api.delete(`/budgets/${id}`),
  inviteUser: (budgetId: string, email: string) =>
    api.post(`/budgets/${budgetId}/invite`, { email }),
};

export const expenseAPI = {
  getExpenses: (budgetId?: string) =>
    api.get("/expenses", { params: { budgetId } }),

  getExpense: (id: string) => api.get(`/expenses/${id}`),
  createExpense: (data: any) => api.post("/expenses", data),
  updateExpense: (id: string, data: any) => api.put(`/expenses/${id}`, data),
  deleteExpense: (id: string) => api.delete(`/expenses/${id}`),
  categorizeExpense: (id: string) => api.post(`/expenses/${id}/categorize`),
};

export const savingsAPI = {
  getGoals: () => api.get("/savings/goals"),
  createGoal: (data: any) => api.post("/savings/goals", data),
  updateGoal: (id: string, data: any) => api.put(`/savings/goals/${id}`, data),
  deleteGoal: (id: string) => api.delete(`/savings/goals/${id}`),
};

export const reportsAPI = {
  getSpendingReport: (period: string) =>
    api.get("/reports/spending", { params: { period } }),

  getInsights: () => api.get("/reports/insights"),
  exportReport: (type: string, format: string) =>
    api.get(`/reports/export/${type}`, {
      params: { format },
      responseType: "blob",
    }),
};
