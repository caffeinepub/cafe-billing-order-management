import { initialMenu } from "../data/initialMenu";
import type { Category, Order } from "../types";

const KEYS = {
  MENU: "cafe_menu",
  ORDERS: "cafe_orders",
  ORDER_COUNTER: "cafe_order_counter",
  MENU_VERSION: "cafe_menu_version",
} as const;

// Current version — bump this whenever initialMenu category names change
const CURRENT_MENU_VERSION = "6";

// Map of canonical category id → correct display name (with emoji)
const CATEGORY_NAMES: Record<string, string> = {
  "cat-tea": "🍵 TEA",
  "cat-coffee": "☕ COFFEE",
  "cat-sandwich": "🥪 SANDWICH",
  "cat-toast": "🍞 TOAST",
  "cat-lightsnacks": "🍜 LIGHT SNACKS",
  "cat-momos": "🥟 MOMOS",
  "cat-burgers": "🍔 BURGERS",
  "cat-starters": "🍟 STARTERS",
  "cat-refreshers": "🥤 REFRESHERS",
  "cat-beverages": "💧 BEVERAGES",
  "cat-combo": "🎁 COMBO",
};

// ─── Menu ───────────────────────────────────────────────────────────────────

export function getMenu(): Category[] {
  try {
    const raw = localStorage.getItem(KEYS.MENU);
    const storedVersion = localStorage.getItem(KEYS.MENU_VERSION);

    if (!raw) {
      localStorage.setItem(KEYS.MENU, JSON.stringify(initialMenu));
      localStorage.setItem(KEYS.MENU_VERSION, CURRENT_MENU_VERSION);
      return initialMenu;
    }

    const parsed = JSON.parse(raw) as Category[];

    // If version is outdated, patch category names and merge new items from initialMenu
    if (storedVersion !== CURRENT_MENU_VERSION) {
      const patched = parsed.map((cat) => {
        const canonical = initialMenu.find((c) => c.id === cat.id);
        // Merge new items that don't exist yet in the stored category
        const existingItemIds = new Set(cat.items.map((i) => i.id));
        const newItems = canonical
          ? canonical.items.filter((i) => !existingItemIds.has(i.id))
          : [];
        return {
          ...cat,
          name: CATEGORY_NAMES[cat.id] ?? cat.name,
          items: [...cat.items, ...newItems],
        };
      });
      localStorage.setItem(KEYS.MENU, JSON.stringify(patched));
      localStorage.setItem(KEYS.MENU_VERSION, CURRENT_MENU_VERSION);
      return patched;
    }

    return parsed;
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
    const parsed = JSON.parse(raw) as Order[];
    // Backfill paymentType for legacy orders that don't have it
    return parsed.map((o) => ({
      ...o,
      paymentType: o.paymentType ?? "cash",
    }));
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
    return Number.parseInt(raw, 10) || 0;
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
