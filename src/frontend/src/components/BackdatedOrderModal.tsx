import {
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  Loader2,
  Minus,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Category, Order, OrderItem, PaymentType } from "../types";
import { backendApi as backend } from "../utils/backendApi";
import { toBackendOrder } from "../utils/backendConverters";
import { ThermalReceipt } from "./ThermalReceipt";

interface BackdatedOrderModalProps {
  categories: Category[];
  onOrderAdded: () => void;
  onClose: () => void;
}

export function BackdatedOrderModal({
  categories,
  onOrderAdded,
  onClose,
}: BackdatedOrderModalProps) {
  // Yesterday's date as the max
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const [selectedDate, setSelectedDate] = useState(yesterday);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedOrder, setSavedOrder] = useState<Order | null>(null);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: Array<{
      item: { id: string; name: string; price: number };
      categoryName: string;
    }> = [];
    for (const cat of categories) {
      for (const item of cat.items) {
        if (item.name.toLowerCase().includes(q)) {
          results.push({ item, categoryName: cat.name });
        }
      }
    }
    return results;
  }, [searchQuery, categories]);

  const isSearching = searchQuery.trim().length > 0;
  const selectedCategory =
    categories.find((c) => c.id === selectedCategoryId) ?? null;

  const addItem = useCallback(
    (item: { id: string; name: string; price: number }) => {
      setOrderItems((prev) => {
        const existing = prev.find((o) => o.menuItemId === item.id);
        if (existing) {
          return prev.map((o) =>
            o.menuItemId === item.id ? { ...o, quantity: o.quantity + 1 } : o,
          );
        }
        return [
          ...prev,
          {
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
          },
        ];
      });
    },
    [],
  );

  const updateQty = useCallback((menuItemId: string, delta: number) => {
    setOrderItems((prev) =>
      prev
        .map((o) =>
          o.menuItemId === menuItemId
            ? { ...o, quantity: o.quantity + delta }
            : o,
        )
        .filter((o) => o.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setOrderItems((prev) => prev.filter((o) => o.menuItemId !== menuItemId));
  }, []);

  const orderTotal = useMemo(
    () => orderItems.reduce((sum, o) => sum + o.price * o.quantity, 0),
    [orderItems],
  );
  const orderCount = useMemo(
    () => orderItems.reduce((sum, o) => sum + o.quantity, 0),
    [orderItems],
  );

  const saveOrder = useCallback(async () => {
    if (orderItems.length === 0) {
      toast.error("Please add items to your order first.");
      return;
    }
    if (!selectedDate) {
      toast.error("Please select a date.");
      return;
    }

    setIsSaving(true);
    try {
      const counterBigInt = await backend.getNextOrderNumber();
      const counter = Number(counterBigInt);
      const orderNumber = `ORD-${String(counter).padStart(3, "0")}`;

      const newOrder: Order = {
        id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        orderNumber,
        dateTime: `${selectedDate}T12:00:00.000Z`,
        items: orderItems,
        total: orderTotal,
        paymentType,
      };

      const backendOrder = toBackendOrder(newOrder);
      const success = await backend.addOrder(backendOrder);

      if (!success) {
        toast.error("Failed to save order. Please try again.");
        setIsSaving(false);
        return;
      }

      toast.success(`Previous order saved for ${selectedDate}!`);
      setSavedOrder(newOrder);
      setShowOrderPanel(false);
      onOrderAdded();
    } catch {
      toast.error("Failed to save order. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  }, [orderItems, orderTotal, paymentType, selectedDate, onOrderAdded]);

  const renderItemCard = (
    item: { id: string; name: string; price: number },
    categoryName?: string,
  ) => {
    const inOrder = orderItems.find((o) => o.menuItemId === item.id);
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => addItem(item)}
        className="relative flex flex-col justify-between rounded-xl bg-card border border-border shadow-card p-3 text-left transition-all duration-150 active:scale-95 hover:shadow-card-hover hover:border-cafe-amber min-h-[88px]"
        aria-label={`Add ${item.name} ₹${item.price}`}
      >
        {inOrder && (
          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cafe-amber text-white text-xs flex items-center justify-center font-semibold">
            {inOrder.quantity}
          </span>
        )}
        <span className="text-sm font-semibold text-foreground leading-snug pr-6">
          {item.name}
        </span>
        {categoryName && (
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mt-0.5">
            {categoryName}
          </span>
        )}
        <span className="mt-2 text-base font-bold text-cafe-espresso">
          ₹{item.price}
        </span>
      </button>
    );
  };

  // Show receipt after saving
  if (savedOrder) {
    return (
      <div className="fixed inset-0 z-[60]">
        <ThermalReceipt
          order={savedOrder}
          onPrint={() => window.print()}
          onNewOrder={onClose}
        />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      data-ocid="backdated.modal"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border shrink-0">
        <div className="w-9 h-9 rounded-full bg-cafe-espresso/10 flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-cafe-espresso" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-bold text-foreground">
            Add Previous Order
          </h2>
          <p className="text-xs text-muted-foreground">
            Select a past date and add items
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
          aria-label="Close"
          data-ocid="backdated.close_button"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Date selector */}
      <div className="px-4 py-3 border-b border-border bg-secondary/50 shrink-0">
        <label
          htmlFor="backdated-date-input"
          className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5"
        >
          Order Date
        </label>
        <input
          type="date"
          value={selectedDate}
          max={yesterday}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="h-11 w-full px-3 rounded-xl border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-cafe-amber/50 focus:border-cafe-amber transition-colors"
          id="backdated-date-input"
          data-ocid="backdated.input"
        />
      </div>

      {/* Payment method */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Payment Method
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPaymentType("cash")}
            data-ocid="backdated.cash.toggle"
            className={`h-10 rounded-xl font-bold text-sm border-2 flex items-center justify-center gap-2 transition-all active:scale-[0.97] ${
              paymentType === "cash"
                ? "bg-cafe-espresso text-white border-cafe-espresso shadow-card"
                : "bg-background text-cafe-espresso border-border hover:border-cafe-espresso/50"
            }`}
          >
            💵 Cash
          </button>
          <button
            type="button"
            onClick={() => setPaymentType("online")}
            data-ocid="backdated.online.toggle"
            className={`h-10 rounded-xl font-bold text-sm border-2 flex items-center justify-center gap-2 transition-all active:scale-[0.97] ${
              paymentType === "online"
                ? "bg-cafe-amber text-white border-cafe-amber shadow-card"
                : "bg-background text-cafe-espresso border-border hover:border-cafe-amber/50"
            }`}
          >
            📱 Online
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-border shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) setSelectedCategoryId(null);
            }}
            placeholder="Search items..."
            className="w-full h-10 pl-9 pr-4 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-cafe-amber/50 focus:border-cafe-amber transition-colors"
            data-ocid="backdated.search_input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Item browser */}
      <div className="flex-1 overflow-y-auto">
        {isSearching && (
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {searchResults.length} result
              {searchResults.length !== 1 ? "s" : ""} for &quot;{searchQuery}
              &quot;
            </p>
            {searchResults.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">No items found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {searchResults.map(({ item, categoryName }) =>
                  renderItemCard(item, categoryName),
                )}
              </div>
            )}
          </div>
        )}

        {!isSearching && !selectedCategory && (
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Categories
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className="flex flex-col justify-between rounded-xl bg-card border border-border shadow-card p-4 text-left transition-all duration-150 active:scale-95 hover:shadow-card-hover hover:border-cafe-amber min-h-[80px]"
                >
                  <span className="text-sm font-bold text-foreground tracking-wide">
                    {cat.name}
                  </span>
                  <span className="mt-2 text-xs font-medium text-muted-foreground">
                    {cat.items.length} item{cat.items.length !== 1 ? "s" : ""}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!isSearching && selectedCategory && (
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setSelectedCategoryId(null)}
                className="flex items-center gap-1.5 text-sm font-semibold text-cafe-espresso hover:text-cafe-amber transition-colors h-9 px-2 rounded-lg hover:bg-secondary"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <span className="text-sm font-bold text-foreground tracking-wide">
                {selectedCategory.name}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {selectedCategory.items.length} items
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {selectedCategory.items.map((item) => renderItemCard(item))}
            </div>
          </div>
        )}
      </div>

      {/* Floating view order button */}
      {orderItems.length > 0 && (
        <div className="sticky bottom-0 px-4 py-3 bg-background/95 backdrop-blur border-t border-border shrink-0">
          <button
            type="button"
            onClick={() => setShowOrderPanel(true)}
            className="w-full h-12 rounded-xl bg-cafe-espresso text-white font-bold text-sm flex items-center justify-between px-5 shadow-card active:scale-[0.98] transition-all"
            data-ocid="backdated.primary_button"
          >
            <span className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Review Order ({orderCount})
            </span>
            <span className="font-bold text-base">₹{orderTotal}</span>
          </button>
        </div>
      )}

      {/* Order Panel Overlay */}
      {showOrderPanel && (
        <div className="fixed inset-0 z-[55] flex flex-col bg-black/50">
          <button
            type="button"
            className="flex-1 cursor-default"
            aria-label="Close order panel"
            onClick={() => setShowOrderPanel(false)}
          />
          <div className="bg-background rounded-t-2xl shadow-nav animate-slide-up max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Previous Order
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedDate} · {orderCount} item
                  {orderCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOrderItems([])}
                  className="flex items-center gap-1.5 text-xs font-semibold text-cafe-red hover:opacity-75 transition-opacity h-9 px-3 rounded-lg border border-destructive/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setShowOrderPanel(false)}
                  className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
                  aria-label="Close panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {orderItems.map((item) => (
                <BackdatedOrderItemRow
                  key={item.menuItemId}
                  item={item}
                  onIncrease={() => updateQty(item.menuItemId, 1)}
                  onDecrease={() => updateQty(item.menuItemId, -1)}
                  onRemove={() => removeItem(item.menuItemId)}
                />
              ))}
            </div>

            <div className="px-5 pt-3 pb-5 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">
                  Total Amount
                </span>
                <span className="text-2xl font-bold text-cafe-espresso">
                  ₹{orderTotal}
                </span>
              </div>

              <button
                type="button"
                onClick={saveOrder}
                disabled={isSaving}
                className="w-full h-12 rounded-xl font-bold text-base bg-cafe-green text-white shadow-card hover:bg-cafe-green-dark active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                data-ocid="backdated.submit_button"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                {isSaving ? "Saving..." : `Save Order for ${selectedDate}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BackdatedOrderItemRow ────────────────────────────────────────────────────
interface BackdatedOrderItemRowProps {
  item: OrderItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

function BackdatedOrderItemRow({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: BackdatedOrderItemRowProps) {
  return (
    <div className="flex items-center gap-3 bg-card rounded-xl border border-border px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {item.name}
        </p>
        <p className="text-xs text-muted-foreground">₹{item.price} each</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDecrease}
          className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
          aria-label="Decrease quantity"
        >
          <Minus className="w-3.5 h-3.5 text-foreground" />
        </button>
        <span className="w-6 text-center text-sm font-bold text-foreground tabular-nums">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          className="w-8 h-8 rounded-full bg-cafe-amber-light border border-cafe-amber/40 flex items-center justify-center hover:bg-cafe-amber hover:border-cafe-amber transition-colors"
          aria-label="Increase quantity"
        >
          <Plus className="w-3.5 h-3.5 text-cafe-espresso" />
        </button>
      </div>
      <div className="text-right min-w-[52px]">
        <p className="text-sm font-bold text-cafe-espresso">
          ₹{item.price * item.quantity}
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-cafe-red hover:bg-destructive/10 transition-colors shrink-0"
        aria-label={`Remove ${item.name}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
