import type { Category, Order } from "../types";

// Convert backend Order (bigint fields) to frontend Order (number fields)
export function fromBackendOrder(o: any): Order {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    dateTime: o.dateTime,
    total: Number(o.total),
    paymentType: o.paymentType as "cash" | "online",
    items: o.items.map((item: any) => ({
      menuItemId: item.menuItemId,
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity),
    })),
  };
}

// Convert frontend Order to backend Order (number -> bigint)
export function toBackendOrder(o: Order): any {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    dateTime: o.dateTime,
    total: BigInt(o.total),
    paymentType: o.paymentType,
    items: o.items.map((item) => ({
      menuItemId: item.menuItemId,
      name: item.name,
      price: BigInt(item.price),
      quantity: BigInt(item.quantity),
    })),
  };
}

// Convert backend Category (bigint prices) to frontend Category (number prices)
export function fromBackendCategory(c: any): Category {
  return {
    id: c.id,
    name: c.name,
    items: c.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price),
    })),
  };
}

// Convert frontend Category to backend Category (number -> bigint)
export function toBackendCategory(c: Category): any {
  return {
    id: c.id,
    name: c.name,
    items: c.items.map((item) => ({
      id: item.id,
      name: item.name,
      price: BigInt(item.price),
    })),
  };
}
