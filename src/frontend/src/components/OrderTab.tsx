import { useState, useMemo, useCallback } from "react";
import { ThermalReceipt } from "./ThermalReceipt";
import {
  ShoppingCart,
  Search,
  ChevronLeft,
  Plus,
  Minus,
  X,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Category, OrderItem, Order } from "../types";
import {
  getOrders,
  saveOrders,
  incrementOrderCounter,
  formatOrderNumber,
} from "../utils/localStorage";

interface OrderTabProps {
  categories: Category[];
}

export function OrderTab({ categories }: OrderTabProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [finalizedOrder, setFinalizedOrder] = useState<Order | null>(null);

  // ─── Search results across all categories ────────────────────────────────
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: Array<{ item: { id: string; name: string; price: number }; categoryName: string }> = [];
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
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? null;

  // ─── Order helpers ────────────────────────────────────────────────────────
  const addItem = useCallback((item: { id: string; name: string; price: number }) => {
    setOrderItems((prev) => {
      const existing = prev.find((o) => o.menuItemId === item.id);
      if (existing) {
        return prev.map((o) =>
          o.menuItemId === item.id ? { ...o, quantity: o.quantity + 1 } : o
        );
      }
      return [
        ...prev,
        { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 },
      ];
    });
  }, []);

  const updateQty = useCallback((menuItemId: string, delta: number) => {
    setOrderItems((prev) => {
      return prev
        .map((o) =>
          o.menuItemId === menuItemId ? { ...o, quantity: o.quantity + delta } : o
        )
        .filter((o) => o.quantity > 0);
    });
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setOrderItems((prev) => prev.filter((o) => o.menuItemId !== menuItemId));
  }, []);

  const clearOrder = useCallback(() => {
    setOrderItems([]);
  }, []);

  const orderTotal = useMemo(
    () => orderItems.reduce((sum, o) => sum + o.price * o.quantity, 0),
    [orderItems]
  );

  const orderCount = useMemo(
    () => orderItems.reduce((sum, o) => sum + o.quantity, 0),
    [orderItems]
  );

  // ─── Finalize ─────────────────────────────────────────────────────────────
  const finalizeOrder = useCallback(() => {
    if (orderItems.length === 0) {
      toast.error("Please add items to your order first.");
      return;
    }

    const counter = incrementOrderCounter();
    const orderNumber = formatOrderNumber(counter);
    const now = new Date();

    const newOrder: Order = {
      id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      orderNumber,
      dateTime: now.toISOString(),
      items: orderItems,
      total: orderTotal,
    };

    const existing = getOrders();
    saveOrders([...existing, newOrder]);

    // Show thermal receipt
    setFinalizedOrder(newOrder);
    setShowReceipt(true);
    setShowOrderPanel(false);
    setOrderItems([]);

    // Auto-open print preview after receipt renders
    setTimeout(() => window.print(), 300);
  }, [orderItems, orderTotal]);

  // ─── Receipt handlers ─────────────────────────────────────────────────────
  const handlePrint = useCallback(() => window.print(), []);

  const handleNewOrder = useCallback(() => {
    setShowReceipt(false);
    setFinalizedOrder(null);
  }, []);

  // ─── Render helpers ────────────────────────────────────────────────────────
  const renderItemCard = (
    item: { id: string; name: string; price: number },
    categoryName?: string
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

  return (
    <div className="flex flex-col h-full relative">
      {/* ── Top bar: Finalize + Search ── */}
      <div className="sticky top-0 z-10 bg-background px-4 pt-4 pb-3 space-y-2 border-b border-border">
        <button
          type="button"
          onClick={finalizeOrder}
          disabled={orderItems.length === 0}
          className="w-full h-12 rounded-xl font-bold text-base tracking-wide transition-all duration-150
            bg-cafe-green text-white shadow-card
            disabled:opacity-40 disabled:cursor-not-allowed
            enabled:hover:bg-cafe-green-dark enabled:active:scale-[0.98]
            flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          Finalize Order
          {orderItems.length > 0 && (
            <span className="ml-1 bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              ₹{orderTotal}
            </span>
          )}
        </button>

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

      {/* ── Main content area ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Search results */}
        {isSearching && (
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;
            </p>
            {searchResults.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">No items found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {searchResults.map(({ item, categoryName }) =>
                  renderItemCard(item, categoryName)
                )}
              </div>
            )}
          </div>
        )}

        {/* Category view */}
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

        {/* Category items */}
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

      {/* ── Floating order button (mobile) ── */}
      {orderItems.length > 0 && (
        <div className="sticky bottom-0 px-4 py-3 bg-background/95 backdrop-blur border-t border-border">
          <button
            type="button"
            onClick={() => setShowOrderPanel(true)}
            className="w-full h-12 rounded-xl bg-cafe-espresso text-white font-bold text-sm flex items-center justify-between px-5 shadow-card active:scale-[0.98] transition-all"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              View Order ({orderCount})
            </span>
            <span className="font-bold text-base">₹{orderTotal}</span>
          </button>
        </div>
      )}

      {/* ── Order Panel Overlay ── */}
      {showOrderPanel && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/50">
          <button
            type="button"
            className="flex-1 cursor-default"
            aria-label="Close order panel"
            onClick={() => setShowOrderPanel(false)}
            onKeyDown={(e) => { if (e.key === "Escape") setShowOrderPanel(false); }}
          />
          <div className="bg-background rounded-t-2xl shadow-nav animate-slide-up max-h-[85vh] flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground">Current Order</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {orderCount} item{orderCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearOrder}
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

            {/* Order items */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {orderItems.map((item) => (
                <OrderItemRow
                  key={item.menuItemId}
                  item={item}
                  onIncrease={() => updateQty(item.menuItemId, 1)}
                  onDecrease={() => updateQty(item.menuItemId, -1)}
                  onRemove={() => removeItem(item.menuItemId)}
                />
              ))}
            </div>

            {/* Total + finalize */}
            <div className="px-5 pt-3 pb-5 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">Total Amount</span>
                <span className="text-2xl font-bold text-cafe-espresso">₹{orderTotal}</span>
              </div>
              <button
                type="button"
                onClick={finalizeOrder}
                className="w-full h-12 rounded-xl font-bold text-base bg-cafe-green text-white shadow-card hover:bg-cafe-green-dark active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Finalize Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Thermal Receipt Modal ── */}
      {showReceipt && finalizedOrder && (
        <ThermalReceipt
          order={finalizedOrder}
          onPrint={handlePrint}
          onNewOrder={handleNewOrder}
        />
      )}
    </div>
  );
}

// ─── OrderItemRow ─────────────────────────────────────────────────────────────
interface OrderItemRowProps {
  item: OrderItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

function OrderItemRow({ item, onIncrease, onDecrease, onRemove }: OrderItemRowProps) {
  return (
    <div className="flex items-center gap-3 bg-card rounded-xl border border-border px-3 py-2.5 animate-pop-in">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
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
        <p className="text-sm font-bold text-cafe-espresso">₹{item.price * item.quantity}</p>
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
