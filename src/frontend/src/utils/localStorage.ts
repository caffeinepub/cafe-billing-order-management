import type { Category, Order } from "../types";
import { initialMenu } from "../data/initialMenu";

const KEYS = {
  MENU: "cafe_menu",
  ORDERS: "cafe_orders",
  ORDER_COUNTER: "cafe_order_counter",
} as const;

// ─── Menu ───────────────────────────────────────────────────────────────────

export function getMenu(): Category[] {
  try {
    const raw = localStorage.getItem(KEYS.MENU);
    if (!raw) {
      localStorage.setItem(KEYS.MENU, JSON.stringify(initialMenu));
      return initialMenu;
    }
    return JSON.parse(raw) as Category[];
  } catch {
    return initialMenu;
  }
}

export function saveMenu(menu: Category[]): void {
  localStorage.setItem(KEYS.MENU, JSON.stringify(menu));
}

// ─── Orders ─────────────────────────────────────────────────────────────────

export function getOrders(): Order[] {
  try {
    const raw = localStorage.getItem(KEYS.ORDERS);
    if (!raw) return [];
    return JSON.parse(raw) as Order[];
  } catch {
    return [];
  }
}

export function saveOrders(orders: Order[]): void {
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
}

// ─── Counter ─────────────────────────────────────────────────────────────────

export function getOrderCounter(): number {
  try {
    const raw = localStorage.getItem(KEYS.ORDER_COUNTER);
    if (!raw) return 0;
    return parseInt(raw, 10) || 0;
  } catch {
    return 0;
  }
}

export function incrementOrderCounter(): number {
  const current = getOrderCounter();
  const next = current + 1;
  localStorage.setItem(KEYS.ORDER_COUNTER, String(next));
  return next;
}

export function formatOrderNumber(counter: number): string {
  return `ORD-${String(counter).padStart(3, "0")}`;
}
