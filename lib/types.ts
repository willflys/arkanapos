export type Role = "owner" | "barista" | "cashier";

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "completed"
  | "cancelled";

export type PaymentMethod = "cash" | "qris";

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  price: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  inventory?: Inventory | null;
  category?: Category | null;
}

export interface Inventory {
  id: string;
  product_id: string;
  stock_qty: number;
  unit: string;
  low_stock_threshold: number;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  table_number: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: "unpaid" | "paid";
  subtotal: number;
  total: number;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  completed_at: string | null;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  price: number;
  quantity: number;
  notes: string | null;
  subtotal: number;
}

export interface CartLine {
  product: Product;
  quantity: number;
  notes: string;
}
