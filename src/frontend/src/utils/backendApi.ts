/**
 * Singleton backend actor with retry logic.
 * Actor is reset on error to force a fresh connection on the next call.
 */
import { createActorWithConfig } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";

// Local interface for the backend methods used in this app.
// The generated backendInterface is empty because bindgen did not capture
// the actual Motoko methods; we declare them manually here.
interface CafeBackend {
  login(username: string, password: string): Promise<boolean>;
  getOrders(): Promise<unknown[]>;
  addOrder(order: unknown): Promise<boolean>;
  deleteOrder(id: string): Promise<void>;
  deleteOrdersByDate(dateKey: string): Promise<void>;
  updateOrderPayment(id: string, paymentType: string): Promise<void>;
  getMenu(): Promise<unknown[]>;
  saveMenu(menu: unknown[]): Promise<boolean>;
  getNextOrderNumber(): Promise<string>;
}

let _actor: CafeBackend | null = null;

async function getActor(): Promise<CafeBackend> {
  if (!_actor) {
    _actor = (await createActorWithConfig(
      createActor,
    )) as unknown as CafeBackend;
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

  addOrder: async (order: unknown): Promise<boolean> =>
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

  saveMenu: async (newMenu: unknown[]) =>
    withRetry(async () => (await getActor()).saveMenu(newMenu)),

  getNextOrderNumber: async () =>
    withRetry(async () => (await getActor()).getNextOrderNumber()),
};
