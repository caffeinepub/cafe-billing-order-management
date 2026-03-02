import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MenuItem {
    id: string;
    name: string;
    price: bigint;
}
export interface Order {
    id: string;
    total: bigint;
    paymentType: string;
    items: Array<OrderItem>;
    orderNumber: string;
    dateTime: string;
}
export interface Category {
    id: string;
    name: string;
    items: Array<MenuItem>;
}
export interface OrderItem {
    name: string;
    quantity: bigint;
    price: bigint;
    menuItemId: string;
}
export interface backendInterface {
    addOrder(order: Order): Promise<boolean>;
    deleteOrder(id: string): Promise<boolean>;
    deleteOrdersByDate(dateKey: string): Promise<bigint>;
    getMenu(): Promise<Array<Category>>;
    getNextOrderNumber(): Promise<bigint>;
    getOrders(): Promise<Array<Order>>;
    login(username: string, password: string): Promise<boolean>;
    saveMenu(newMenu: Array<Category>): Promise<boolean>;
}
