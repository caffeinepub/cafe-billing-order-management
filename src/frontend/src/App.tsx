import { Toaster } from "@/components/ui/sonner";
import { BarChart2, BookOpen, List, ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LoginScreen } from "./components/LoginScreen";
import { MenuManagementTab } from "./components/MenuManagementTab";
import { OrderDetailsTab } from "./components/OrderDetailsTab";
import { OrderTab } from "./components/OrderTab";
import { ReportTab } from "./components/ReportTab";
import { initialMenu } from "./data/initialMenu";
import type { Category, Order, TabId } from "./types";
import { backendApi as backend } from "./utils/backendApi";
import {
  fromBackendCategory,
  fromBackendOrder,
  toBackendCategory,
} from "./utils/backendConverters";

const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
  { id: "order", label: "Order", Icon: ShoppingCart },
  { id: "report", label: "Report", Icon: BarChart2 },
  { id: "order-details", label: "Details", Icon: List },
  { id: "menu", label: "Menu", Icon: BookOpen },
];

const POLL_INTERVAL_MS = 2_000; // 2 seconds

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("order");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    () => localStorage.getItem("cafe_auth") === "true",
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">(
    "syncing",
  );

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Load orders from backend ─────────────────────────────────────────────
  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setSyncStatus("syncing");
    try {
      const raw = await backend.getOrders();
      const converted = raw.map(fromBackendOrder);
      setOrders(converted);
      setSyncStatus("synced");
      return converted;
    } catch {
      setSyncStatus("error");
      if (!silent) toast.error("Failed to load orders");
      return null;
    }
  }, []);

  // ─── Load menu from backend ───────────────────────────────────────────────
  const loadMenu = useCallback(async () => {
    try {
      const raw = await backend.getMenu();
      if (raw.length === 0) {
        // No menu saved yet – seed with initialMenu
        await backend.saveMenu(initialMenu.map(toBackendCategory));
        setCategories(initialMenu);
      } else {
        const converted = raw.map(fromBackendCategory);
        // Check if the stored menu is outdated (fewer items than initialMenu)
        const storedItemCount = converted.reduce(
          (sum, c) => sum + c.items.length,
          0,
        );
        const expectedItemCount = initialMenu.reduce(
          (sum, c) => sum + c.items.length,
          0,
        );
        if (
          converted.length < initialMenu.length ||
          storedItemCount < expectedItemCount
        ) {
          // Backend menu is outdated – replace with latest initialMenu
          await backend.saveMenu(initialMenu.map(toBackendCategory));
          setCategories(initialMenu);
        } else {
          setCategories(converted);
        }
      }
    } catch {
      setCategories(initialMenu);
    }
  }, []);

  // ─── Initial data load ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function init() {
      setIsLoadingData(true);
      setSyncStatus("syncing");
      try {
        await Promise.all([loadOrders(true), loadMenu()]);
        if (!cancelled) setSyncStatus("synced");
      } catch {
        if (!cancelled) setSyncStatus("error");
      } finally {
        if (!cancelled) setIsLoadingData(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [loadOrders, loadMenu]);

  // ─── Polling for real-time sync ───────────────────────────────────────────
  useEffect(() => {
    pollTimerRef.current = setInterval(() => {
      loadOrders(true);
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [loadOrders]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleCategoriesChange = useCallback((updated: Category[]) => {
    setCategories(updated);
  }, []);

  const handleOrdersChange = useCallback((updated: Order[]) => {
    setOrders(updated);
  }, []);

  const handleLogin = useCallback(() => {
    setIsLoggedIn(true);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("cafe_auth");
    setIsLoggedIn(false);
  }, []);

  const handleTabChange = useCallback(
    async (tab: TabId) => {
      setActiveTab(tab);
      // Refresh data when switching to data-heavy tabs
      if (tab === "report" || tab === "order-details") {
        await loadOrders(true);
      }
      if (tab === "menu") {
        await loadMenu();
      }
    },
    [loadOrders, loadMenu],
  );

  const handleOrderAdded = useCallback(async () => {
    await loadOrders(true);
  }, [loadOrders]);

  return (
    <div className="flex flex-col h-dvh max-w-md mx-auto bg-background overflow-hidden">
      {/* ── App header ── */}
      <header className="shrink-0 bg-cafe-espresso text-white px-5 py-3 flex items-center justify-between shadow-card">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">☕</span>
          <div>
            <h1 className="text-base font-bold tracking-wide leading-none">
              Simple Sips Cafe
            </h1>
            <p className="text-xs opacity-60 mt-0.5 font-medium">
              Billing & Order Manager
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-xs opacity-60 font-medium">
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          {/* Sync status indicator */}
          <div className="flex items-center gap-1">
            {syncStatus === "syncing" && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-[9px] font-semibold opacity-70 uppercase tracking-wide">
                  Syncing
                </span>
              </>
            )}
            {syncStatus === "synced" && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-[9px] font-semibold opacity-70 uppercase tracking-wide">
                  Synced
                </span>
              </>
            )}
            {syncStatus === "error" && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span className="text-[9px] font-semibold opacity-70 uppercase tracking-wide">
                  Offline
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Loading overlay ── */}
      {isLoadingData && (
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <div className="w-8 h-8 border-2 border-cafe-amber border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">
            Loading data...
          </p>
        </div>
      )}

      {/* ── Tab content ── */}
      {!isLoadingData && (
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto pb-nav">
            {activeTab === "order" && (
              <OrderTab
                categories={categories}
                onOrderAdded={handleOrderAdded}
              />
            )}
            {activeTab === "report" &&
              (isLoggedIn ? (
                <ReportTab
                  orders={orders}
                  onLogout={handleLogout}
                  onRefresh={() => loadOrders(false)}
                />
              ) : (
                <LoginScreen onLogin={handleLogin} />
              ))}
            {activeTab === "order-details" && (
              <OrderDetailsTab
                orders={orders}
                onOrdersChange={handleOrdersChange}
                onRefresh={() => loadOrders(false)}
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
      )}

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
              typeof window !== "undefined" ? window.location.hostname : "",
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
