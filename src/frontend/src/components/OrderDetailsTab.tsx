import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Order } from "../types";
import { backendApi as backend } from "../utils/backendApi";

interface OrderDetailsTabProps {
  orders: Order[];
  onOrdersChange: (orders: Order[]) => void;
  onRefresh: () => void;
}

interface DayGroup {
  date: string;
  displayDate: string;
  orders: Order[];
}

function getDateKey(isoString: string): string {
  return isoString.slice(0, 10);
}

function formatDisplayDate(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function OrderDetailsTab({
  orders,
  onOrdersChange,
  onRefresh,
}: OrderDetailsTabProps) {
  const [confirmDeleteDay, setConfirmDeleteDay] = useState<string | null>(null);
  const [confirmDeleteOrder, setConfirmDeleteOrder] = useState<string | null>(
    null,
  );
  const [editPaymentOrder, setEditPaymentOrder] = useState<Order | null>(null);
  const [editPaymentValue, setEditPaymentValue] = useState<"cash" | "online">(
    "cash",
  );
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleRefresh() {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  }

  const dayGroups = useMemo<DayGroup[]>(() => {
    const dayMap = new Map<string, Order[]>();
    for (const order of orders) {
      const key = getDateKey(order.dateTime);
      const arr = dayMap.get(key) ?? [];
      arr.push(order);
      dayMap.set(key, arr);
    }
    return Array.from(dayMap.entries())
      .map(([date, dayOrders]) => ({
        date,
        displayDate: formatDisplayDate(date),
        orders: [...dayOrders].sort(
          (a, b) =>
            new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
        ),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [orders]);

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const deleteOrder = async (orderId: string) => {
    setIsDeleting(true);
    try {
      await backend.deleteOrder(orderId);
      const updated = orders.filter((o) => o.id !== orderId);
      onOrdersChange(updated);
      setConfirmDeleteOrder(null);
      toast.success("Order deleted");
    } catch {
      toast.error("Failed to delete order. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteDay = async (date: string) => {
    setIsDeleting(true);
    try {
      await backend.deleteOrdersByDate(date);
      const updated = orders.filter((o) => getDateKey(o.dateTime) !== date);
      onOrdersChange(updated);
      setConfirmDeleteDay(null);
      toast.success("All orders for this day deleted");
    } catch {
      toast.error("Failed to delete orders. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditPayment = (order: Order) => {
    setEditPaymentOrder(order);
    setEditPaymentValue(order.paymentType as "cash" | "online");
  };

  const saveEditPayment = async () => {
    if (!editPaymentOrder) return;
    setIsUpdating(true);
    try {
      await backend.updateOrderPayment(editPaymentOrder.id, editPaymentValue);
      const updated = orders.map((o) =>
        o.id === editPaymentOrder.id
          ? { ...o, paymentType: editPaymentValue }
          : o,
      );
      onOrdersChange(updated);
      setEditPaymentOrder(null);
      toast.success("Payment type updated");
    } catch {
      toast.error("Failed to update payment type. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Order Details</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {orders.length} total orders
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          data-ocid="details.secondary_button"
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary mt-0.5 disabled:opacity-50"
          aria-label="Refresh orders"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="px-4 py-12 text-center" data-ocid="details.empty_state">
          <p className="text-muted-foreground text-sm">No orders yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Finalized orders will appear here.
          </p>
        </div>
      ) : (
        <div className="px-4 pb-6 space-y-4">
          {dayGroups.map((group) => {
            const isExpanded = expandedDays.has(group.date);
            const dayTotal = group.orders.reduce((s, o) => s + o.total, 0);
            const dayCash = group.orders
              .filter((o) => o.paymentType === "cash")
              .reduce((s, o) => s + o.total, 0);
            const dayOnline = group.orders
              .filter((o) => o.paymentType === "online")
              .reduce((s, o) => s + o.total, 0);

            return (
              <div
                key={group.date}
                className="rounded-xl bg-card border border-border shadow-card overflow-hidden"
              >
                {/* Day header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-secondary border-b border-border">
                  <button
                    type="button"
                    onClick={() => toggleDay(group.date)}
                    className="flex-1 flex items-center gap-2 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {group.displayDate}
                      </p>
                      {/* Bills + total */}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {group.orders.length} bill
                        {group.orders.length !== 1 ? "s" : ""} · ₹
                        {dayTotal.toLocaleString("en-IN")}
                      </p>
                      {/* Cash + Online breakdown */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                          💵 ₹{dayCash.toLocaleString("en-IN")}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                          📱 ₹{dayOnline.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteDay(group.date)}
                    data-ocid="details.delete_button"
                    className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-cafe-red border border-destructive/30 hover:bg-destructive/10 transition-colors shrink-0"
                    aria-label={`Delete all orders for ${group.displayDate}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Day
                  </button>
                </div>

                {/* Orders for this day */}
                {isExpanded && (
                  <div className="divide-y divide-border">
                    {group.orders.map((order) => (
                      <div key={order.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="text-sm font-bold text-cafe-espresso">
                              {order.orderNumber}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {formatTime(order.dateTime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Edit payment type */}
                            <button
                              type="button"
                              onClick={() => openEditPayment(order)}
                              data-ocid="details.order.edit_button"
                              className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-cafe-amber hover:bg-cafe-amber/10 transition-colors"
                              aria-label={`Edit payment for ${order.orderNumber}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {/* Delete order */}
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteOrder(order.id)}
                              data-ocid="details.order.delete_button"
                              className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-cafe-red hover:bg-destructive/10 transition-colors"
                              aria-label={`Delete order ${order.orderNumber}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {/* Items */}
                        <div className="space-y-1 mb-2.5">
                          {order.items.map((item) => (
                            <div
                              key={item.menuItemId}
                              className="flex items-center justify-between text-xs text-foreground"
                            >
                              <span className="flex-1 truncate pr-2">
                                {item.name}
                              </span>
                              <span className="text-muted-foreground shrink-0">
                                {item.quantity} × ₹{item.price}
                              </span>
                              <span className="font-semibold ml-2 text-cafe-espresso shrink-0">
                                ₹{item.price * item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border/60">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground">
                              Total
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                order.paymentType === "online"
                                  ? "bg-cafe-amber/20 text-cafe-amber"
                                  : "bg-cafe-espresso/10 text-cafe-espresso"
                              }`}
                            >
                              {order.paymentType === "online"
                                ? "📱 Online"
                                : "💵 Cash"}
                            </span>
                          </div>
                          <span className="text-base font-bold text-cafe-espresso">
                            ₹{order.total}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isExpanded && (
                  <button
                    type="button"
                    onClick={() => toggleDay(group.date)}
                    className="w-full px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors text-center"
                  >
                    Tap to expand {group.orders.length} order
                    {group.orders.length !== 1 ? "s" : ""}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Edit payment type modal ── */}
      {editPaymentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div
            className="bg-background rounded-2xl shadow-nav max-w-xs w-full p-6 animate-pop-in"
            data-ocid="details.dialog"
          >
            <h3 className="text-base font-bold text-foreground mb-1">
              Edit Payment Type
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Order {editPaymentOrder.orderNumber} · ₹{editPaymentOrder.total}
            </p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => setEditPaymentValue("cash")}
                data-ocid="details.cash.toggle"
                className={`h-14 rounded-xl border-2 flex flex-col items-center justify-center gap-1 text-sm font-bold transition-all ${
                  editPaymentValue === "cash"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-border bg-secondary text-muted-foreground hover:border-green-300"
                }`}
              >
                <span className="text-xl">💵</span>
                Cash
              </button>
              <button
                type="button"
                onClick={() => setEditPaymentValue("online")}
                data-ocid="details.online.toggle"
                className={`h-14 rounded-xl border-2 flex flex-col items-center justify-center gap-1 text-sm font-bold transition-all ${
                  editPaymentValue === "online"
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-border bg-secondary text-muted-foreground hover:border-blue-300"
                }`}
              >
                <span className="text-xl">📱</span>
                Online
              </button>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setEditPaymentOrder(null)}
                disabled={isUpdating}
                data-ocid="details.cancel_button"
                className="flex-1 h-11 rounded-xl border border-border bg-secondary text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditPayment}
                disabled={
                  isUpdating ||
                  editPaymentValue === editPaymentOrder.paymentType
                }
                data-ocid="details.save_button"
                className="flex-1 h-11 rounded-xl bg-cafe-espresso text-white text-sm font-bold hover:opacity-85 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm delete day modal ── */}
      {confirmDeleteDay && (
        <ConfirmModal
          title="Delete Entire Day?"
          description={`This will permanently delete all ${dayGroups.find((g) => g.date === confirmDeleteDay)?.orders.length ?? 0} order(s) for ${formatDisplayDate(confirmDeleteDay)}.`}
          onConfirm={() => deleteDay(confirmDeleteDay)}
          onCancel={() => setConfirmDeleteDay(null)}
          isLoading={isDeleting}
        />
      )}

      {/* ── Confirm delete order modal ── */}
      {confirmDeleteOrder && (
        <ConfirmModal
          title="Delete Order?"
          description={`This will permanently delete order ${orders.find((o) => o.id === confirmDeleteOrder)?.orderNumber ?? ""}.`}
          onConfirm={() => deleteOrder(confirmDeleteOrder)}
          onCancel={() => setConfirmDeleteOrder(null)}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────
interface ConfirmModalProps {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function ConfirmModal({
  title,
  description,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        className="bg-background rounded-2xl shadow-nav max-w-xs w-full p-6 animate-pop-in"
        data-ocid="details.dialog"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-cafe-red" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            data-ocid="details.cancel_button"
            className="flex-1 h-11 rounded-xl border border-border bg-secondary text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            data-ocid="details.confirm_button"
            className="flex-1 h-11 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold hover:opacity-85 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
