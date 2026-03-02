/**
 * Singleton backend actor for direct API calls (without React Query).
 * Uses createActorWithConfig from config to create an anonymous actor.
 */
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";

let _actor: backendInterface | null = null;

async function getActor(): Promise<backendInterface> {
  if (!_actor) {
    _actor = await createActorWithConfig();
  }
  return _actor;
}

export const backendApi = {
  login: async (username: string, password: string): Promise<boolean> => {
    const actor = await getActor();
    return actor.login(username, password);
  },
  getOrders: async () => {
    const actor = await getActor();
    return actor.getOrders();
  },
  addOrder: async (order: any) => {
    const actor = await getActor();
    return actor.addOrder(order);
  },
  deleteOrder: async (id: string) => {
    const actor = await getActor();
    return actor.deleteOrder(id);
  },
  deleteOrdersByDate: async (dateKey: string) => {
    const actor = await getActor();
    return actor.deleteOrdersByDate(dateKey);
  },
  getMenu: async () => {
    const actor = await getActor();
    return actor.getMenu();
  },
  saveMenu: async (newMenu: any[]) => {
    const actor = await getActor();
    return actor.saveMenu(newMenu);
  },
  getNextOrderNumber: async () => {
    const actor = await getActor();
    return actor.getNextOrderNumber();
  },
};
