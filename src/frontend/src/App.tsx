import { useState, useCallback } from "react";
import { ShoppingCart, BarChart2, List, BookOpen } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { OrderTab } from "./components/OrderTab";
import { ReportTab } from "./components/ReportTab";
import { OrderDetailsTab } from "./components/OrderDetailsTab";
import { MenuManagementTab } from "./components/MenuManagementTab";
import type { Category, Order, TabId } from "./types";
import { getMenu, getOrders } from "./utils/localStorage";

const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
  { id: "order", label: "Order", Icon: ShoppingCart },
  { id: "report", label: "Report", Icon: BarChart2 },
  { id: "order-details", label: "Details", Icon: List },
  { id: "menu", label: "Menu", Icon: BookOpen },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("order");

  // Shared state — lifted here so tab switches reflect fresh data
  const [categories, setCategories] = useState<Category[]>(() => getMenu());
  const [orders, setOrders] = useState<Order[]>(() => getOrders());

  const handleCategoriesChange = useCallback((updated: Category[]) => {
    setCategories(updated);
  }, []);

  const handleOrdersChange = useCallback((updated: Order[]) => {
    setOrders(updated);
  }, []);

  // Re-sync orders when switching to tabs that read orders
  const handleTabChange = useCallback((tab: TabId) => {
    if (tab === "report" || tab === "order-details") {
      setOrders(getOrders());
    }
    if (tab === "order") {
      setCategories(getMenu());
    }
    setActiveTab(tab);
  }, []);

  return (
    <div className="flex flex-col h-dvh max-w-md mx-auto bg-background overflow-hidden">
      {/* ── App header ── */}
      <header className="shrink-0 bg-cafe-espresso text-white px-5 py-3 flex items-center justify-between shadow-card">
        <div>
          <h1 className="text-base font-bold tracking-wide leading-none">☕ Cafe POS</h1>
          <p className="text-xs opacity-60 mt-0.5 font-medium">Billing & Order Manager</p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-60 font-medium">
            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      </header>

      {/* ── Tab content ── */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto pb-nav">
          {activeTab === "order" && (
            <OrderTab categories={categories} />
          )}
          {activeTab === "report" && (
            <ReportTab orders={orders} />
          )}
          {activeTab === "order-details" && (
            <OrderDetailsTab
              orders={orders}
              onOrdersChange={handleOrdersChange}
            />
          )}
          {activeTab === "menu" && (
            <MenuManagementTab
              categories={categories}
              onCategoriesChange={handleCategoriesChange}
            />
          )}
        </div>
      </main>

      {/* ── Bottom navigation ── */}
      <nav
        className="shrink-0 fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-background border-t border-border shadow-nav z-40"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="grid grid-cols-4">
          {TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleTabChange(id)}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-1 min-h-[60px] transition-colors ${
                  isActive
                    ? "text-cafe-amber"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`}
                  strokeWidth={isActive ? 2.5 : 1.75}
                />
                <span
                  className={`text-[10px] font-semibold tracking-wide leading-none ${
                    isActive ? "text-cafe-amber" : ""
                  }`}
                >
                  {label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-cafe-amber" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Toast notifications ── */}
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: {
            fontFamily: "Plus Jakarta Sans, system-ui, sans-serif",
            fontSize: "14px",
          },
        }}
      />

      {/* ── Footer ── */}
      <footer className="hidden">
        <p>
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : ""
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
