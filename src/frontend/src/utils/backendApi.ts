/**
 * Singleton backend actor with retry logic.
 * Actor is reset on error to force a fresh connection on the next call.
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

function resetActor() {
  _actor = null;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      resetActor();
      if (attempt === retries) throw err;
      await new Promise((res) => setTimeout(res, 600));
    }
  }
  throw new Error("Unexpected end of retry loop");
}

export const backendApi = {
  login: async (username: string, password: string): Promise<boolean> =>
    withRetry(async () => (await getActor()).login(username, password)),

  getOrders: async () => withRetry(async () => (await getActor()).getOrders()),

  addOrder: async (order: any) =>
    withRetry(async () => (await getActor()).addOrder(order)),

  deleteOrder: async (id: string) =>
    withRetry(async () => (await getActor()).deleteOrder(id)),

  deleteOrdersByDate: async (dateKey: string) =>
    withRetry(async () => (await getActor()).deleteOrdersByDate(dateKey)),

  updateOrderPayment: async (id: string, paymentType: string) =>
    withRetry(async () =>
      (await getActor()).updateOrderPayment(id, paymentType),
    ),

  getMenu: async () => withRetry(async () => (await getActor()).getMenu()),

  saveMenu: async (newMenu: any[]) =>
    withRetry(async () => (await getActor()).saveMenu(newMenu)),

  getNextOrderNumber: async () =>
    withRetry(async () => (await getActor()).getNextOrderNumber()),
};
