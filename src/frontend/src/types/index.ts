export interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export type PaymentType = "cash" | "online";

export interface Order {
  id: string;
  orderNumber: string; // e.g. ORD-001
  dateTime: string; // ISO string
  items: OrderItem[];
  total: number;
  paymentType: PaymentType;
}

export type TabId = "order" | "report" | "order-details" | "menu";
