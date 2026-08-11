export type Role = "ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export type CustomerType = "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";
export type CustomerStatus = "LEAD" | "ACTIVE" | "INACTIVE";

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  businessName?: string | null;
  gstNumber?: string | null;
  customerType: CustomerType;
  status: CustomerStatus;
  address?: string | null;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  createdBy?: { id: string; name: string };
  followUps?: FollowUp[];
  challans?: { id: string; challanNumber: string; status: string; totalQuantity: number; createdAt: string }[];
}

export interface FollowUp {
  id: string;
  note: string;
  followUpDate?: string | null;
  createdAt: string;
  createdBy?: { id: string; name: string };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category?: string | null;
  unitPrice: string;
  currentStock: number;
  minStockQty: number;
  location?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  movementType: "IN" | "OUT";
  reason: string;
  createdAt: string;
  createdBy?: { id: string; name: string };
}

export type ChallanStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export interface ChallanItem {
  id: string;
  productId?: string | null;
  productNameSnap: string;
  productSkuSnap: string;
  unitPriceSnap: string;
  quantity: number;
  lineTotal: string;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  customer?: Customer;
  status: ChallanStatus;
  totalQuantity: number;
  items: ChallanItem[];
  createdBy?: { id: string; name: string };
  createdAt: string;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
