import { apiClient } from "./client";
import {
  AuthUser,
  Challan,
  Customer,
  FollowUp,
  PaginatedResponse,
  Product,
  StockMovement,
} from "../types";

// ---- Auth ----
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ token: string; user: AuthUser }>("/auth/login", { email, password }).then((r) => r.data),
  me: () => apiClient.get<AuthUser>("/auth/me").then((r) => r.data),
};

// ---- Customers ----
export const customerApi = {
  list: (params: { search?: string; status?: string; customerType?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<Customer>>("/customers", { params }).then((r) => r.data),
  get: (id: string) => apiClient.get<Customer>(`/customers/${id}`).then((r) => r.data),
  create: (payload: Partial<Customer>) => apiClient.post<Customer>("/customers", payload).then((r) => r.data),
  update: (id: string, payload: Partial<Customer>) =>
    apiClient.patch<Customer>(`/customers/${id}`, payload).then((r) => r.data),
  addFollowUp: (id: string, note: string, followUpDate?: string) =>
    apiClient.post<FollowUp>(`/customers/${id}/follow-ups`, { note, followUpDate }).then((r) => r.data),
};

// ---- Products ----
export const productApi = {
  list: (params: { search?: string; category?: string; lowStockOnly?: boolean; page?: number }) =>
    apiClient.get<PaginatedResponse<Product>>("/products", { params }).then((r) => r.data),
  get: (id: string) => apiClient.get<Product>(`/products/${id}`).then((r) => r.data),
  create: (payload: Partial<Product>) => apiClient.post<Product>("/products", payload).then((r) => r.data),
  update: (id: string, payload: Partial<Product>) =>
    apiClient.patch<Product>(`/products/${id}`, payload).then((r) => r.data),
  stockMovements: (id: string) =>
    apiClient.get<PaginatedResponse<StockMovement>>(`/products/${id}/stock-movements`).then((r) => r.data),
  recordMovement: (id: string, payload: { quantity: number; movementType: "IN" | "OUT"; reason: string }) =>
    apiClient.post<StockMovement>(`/products/${id}/stock-movements`, payload).then((r) => r.data),
};

// ---- Sales Challans ----
export const challanApi = {
  list: (params: { status?: string; customerId?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<Challan>>("/challans", { params }).then((r) => r.data),
  get: (id: string) => apiClient.get<Challan>(`/challans/${id}`).then((r) => r.data),
  create: (payload: { customerId: string; items: { productId: string; quantity: number }[]; status?: "DRAFT" | "CONFIRMED" }) =>
    apiClient.post<Challan>("/challans", payload).then((r) => r.data),
  update: (id: string, payload: { customerId?: string; items?: { productId: string; quantity: number }[] }) =>
    apiClient.patch<Challan>(`/challans/${id}`, payload).then((r) => r.data),
  confirm: (id: string) => apiClient.post<Challan>(`/challans/${id}/confirm`).then((r) => r.data),
  cancel: (id: string) => apiClient.post<Challan>(`/challans/${id}/cancel`).then((r) => r.data),
};
