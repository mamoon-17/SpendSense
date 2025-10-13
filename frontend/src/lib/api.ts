import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

// Configure base API instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// No request interceptor needed for cookies auth

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
  login: (credentials: { username: string; password: string }) =>
    api.post("/auth/login", credentials),

  register: (userData: { name: string; username: string; password: string }) =>
    api.post("/auth/signup", userData),

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

export const connectionsAPI = {
  getConnections: () => api.get("/connections"),
  createConnection: (data: { requester_id: string; receiver_id: string }) =>
    api.post("/connections", data),
  acceptRequest: (connection_id: string) =>
    api.patch("/connections", { connection_id }),
  deleteConnection: (id: string) => api.delete(`/connections/${id}`),
  // Search users by username
  searchUsersByUsername: (username: string) =>
    api.get("/users/search", { params: { username } }),
  // Add a connection (send request)
  addConnection: (receiver_id: string) =>
    api.post("/connections", { receiver_id }),
};

export const invitationsAPI = {
  sendInvitation: (data: {
    username: string;
    sent_by: string;
    type: string;
    target_id: string;
  }) => api.post("/invitations", data),
  getInvitations: () => api.get("/invitations"),
  acceptInvitation: (id: string) => api.post(`/invitations/${id}/accept`),
  declineInvitation: (id: string) => api.post(`/invitations/${id}/decline`),
};

export const conversationsAPI = {
  getConversations: () => api.get("/conversations"),
  createConversation: (data: any) => api.post("/conversations", data),
  getConversation: (id: string) => api.get(`/conversations/${id}`),
};
