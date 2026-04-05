import {
  Banknote,
  Calendar,
  ChevronDown,
  ChevronRight,
  LogOut,
  Receipt,
  RefreshCw,
  Smartphone,
  Star,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Order } from "../types";

interface ReportTabProps {
  orders: Order[];
  onLogout: () => void;
  onRefresh: () => void;
}

interface DaySummary {
  date: string;
  bills: number;
  revenue: number;
}

interface ItemTotal {
  name: string;
  quantity: number;
}

function formatDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDateKey(isoString: string): string {
  return isoString.slice(0, 10); // YYYY-MM-DD
}

export function ReportTab({ orders, onLogout, onRefresh }: ReportTabProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleRefresh() {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  }

  const {
    totalRevenue,
    totalBills,
    bestDay,
    daySummaries,
    itemsByDay,
    totalCashRevenue,
    totalOnlineRevenue,
    totalCashBills,
    totalOnlineBills,
    avgDailySales,
  } = useMemo(() => {
    const dayMap = new Map<string, DaySummary>();
    const itemsByDay = new Map<string, Map<string, number>>();
    let totalCashRevenue = 0;
    let totalOnlineRevenue = 0;
    let totalCashBills = 0;
    let totalOnlineBills = 0;

    for (const order of orders) {
      const dateKey = getDateKey(order.dateTime);

      // Aggregate day summary
      const existing = dayMap.get(dateKey);
      if (existing) {
        existing.bills += 1;
        existing.revenue += order.total;
      } else {
        dayMap.set(dateKey, {
          date: dateKey,
          bills: 1,
          revenue: order.total,
        });
      }

      // Aggregate cash/online
      if (order.paymentType === "online") {
        totalOnlineRevenue += order.total;
        totalOnlineBills += 1;
      } else {
        totalCashRevenue += order.total;
        totalCashBills += 1;
      }

      // Aggregate items by day
      if (!itemsByDay.has(dateKey)) {
        itemsByDay.set(dateKey, new Map<string, number>());
      }
      const dayItems = itemsByDay.get(dateKey)!;
      for (const item of order.items) {
        const currentQty = dayItems.get(item.name) ?? 0;
        dayItems.set(item.name, currentQty + item.quantity);
      }
    }

    const summaries = Array.from(dayMap.values()).sort((a, b) =>
      b.date.localeCompare(a.date),
    );

    const totalRevenue = summaries.reduce((sum, d) => sum + d.revenue, 0);
    const totalBills = summaries.reduce((sum, d) => sum + d.bills, 0);
    const bestDay = summaries.reduce<DaySummary | null>(
      (best, d) => (!best || d.revenue > best.revenue ? d : best),
      null,
    );
    const avgDailySales =
      summaries.length > 0 ? totalRevenue / summaries.length : 0;

    // Convert itemsByDay maps to sorted arrays
    const itemsByDayArray = new Map<string, ItemTotal[]>();
    for (const [date, itemMap] of itemsByDay.entries()) {
      const sorted = Array.from(itemMap.entries())
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity);
      itemsByDayArray.set(date, sorted);
    }

    return {
      totalRevenue,
      totalBills,
      bestDay,
      daySummaries: summaries,
      itemsByDay: itemsByDayArray,
      totalCashRevenue,
      totalOnlineRevenue,
      totalCashBills,
      totalOnlineBills,
      avgDailySales,
    };
  }, [orders]);

  function toggleDay(date: string) {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-5 pb-3 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Sales Report</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Revenue & billing overview
          </p>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary disabled:opacity-50"
            aria-label="Refresh report"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors px-3 py-1.5 rounded-lg hover:bg-destructive/10"
            aria-label="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="px-4 pb-4 space-y-3">
        {/* Total Revenue */}
        <div className="rounded-xl bg-cafe-espresso text-white px-5 py-4 shadow-card">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold mt-0.5">
                  ₹{totalRevenue.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            {/* Average Daily Sales — right side */}
            <div className="text-right">
              <p className="text-[10px] font-semibold opacity-60 uppercase tracking-wide">
                Avg Daily Sales
              </p>
              <p className="text-lg font-bold mt-0.5">
                ₹
                {avgDailySales.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </p>
              {daySummaries.length > 0 && (
                <p className="text-[10px] opacity-50 mt-0.5">
                  over {daySummaries.length} day
                  {daySummaries.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Total Bills */}
          <div className="rounded-xl bg-card border border-border shadow-card px-4 py-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-cafe-amber-light flex items-center justify-center">
                <Receipt className="w-4 h-4 text-cafe-espresso" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalBills}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Bills</p>
          </div>

          {/* Best Day */}
          <div className="rounded-xl bg-card border border-border shadow-card px-4 py-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-cafe-amber-light flex items-center justify-center">
                <Star className="w-4 h-4 text-cafe-espresso" />
              </div>
            </div>
            {bestDay ? (
              <>
                <p className="text-base font-bold text-foreground">
                  ₹{bestDay.revenue.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Best Day</p>
                <p className="text-[10px] text-cafe-amber font-semibold mt-1">
                  {formatDate(bestDay.date)}
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-bold text-foreground">—</p>
                <p className="text-xs text-muted-foreground mt-0.5">Best Day</p>
              </>
            )}
          </div>
        </div>

        {/* Cash vs Online breakdown */}
        <div className="grid grid-cols-2 gap-3">
          {/* Cash Sale */}
          <div className="rounded-xl bg-card border border-border shadow-card px-4 py-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Banknote className="w-4 h-4 text-green-700" />
              </div>
            </div>
            <p className="text-xl font-bold text-green-700">
              ₹{totalCashRevenue.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total Cash Sale
            </p>
            <p className="text-[10px] font-semibold text-green-600 mt-1">
              {totalCashBills} bill{totalCashBills !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Online Sale */}
          <div className="rounded-xl bg-card border border-border shadow-card px-4 py-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-blue-700" />
              </div>
            </div>
            <p className="text-xl font-bold text-blue-700">
              ₹{totalOnlineRevenue.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total Online Sale
            </p>
            <p className="text-[10px] font-semibold text-blue-600 mt-1">
              {totalOnlineBills} bill{totalOnlineBills !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* ── Day-wise table ── */}
      <div className="px-4 pb-6">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
            Daily Breakdown
          </h2>
        </div>

        {daySummaries.length === 0 ? (
          <div className="rounded-xl bg-card border border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">No orders yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Finalized orders will appear here.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-card border border-border overflow-hidden shadow-card">
            {/* Table header */}
            <div className="grid grid-cols-3 bg-secondary px-4 py-2.5 border-b border-border">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Date
              </span>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide text-center">
                Bills
              </span>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide text-right">
                Revenue
              </span>
            </div>

            {/* Table rows */}
            {daySummaries.map((day, idx) => {
              const isExpanded = expandedDays.has(day.date);
              const dayItems = itemsByDay.get(day.date) ?? [];
              const isBestDay = day === bestDay;
              const isLast = idx === daySummaries.length - 1;

              return (
                <div
                  key={day.date}
                  className={
                    !isLast || isExpanded ? "border-b border-border" : ""
                  }
                >
                  {/* Main row — clickable to expand */}
                  <button
                    type="button"
                    onClick={() => toggleDay(day.date)}
                    className={`w-full grid grid-cols-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary/50 ${
                      isBestDay ? "bg-cafe-amber-light/40" : ""
                    }`}
                    aria-expanded={isExpanded}
                    aria-label={`Toggle item breakdown for ${formatDate(day.date)}`}
                  >
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span>
                        {formatDate(day.date)}
                        {isBestDay && (
                          <span className="ml-1.5 text-[9px] font-bold text-cafe-amber uppercase tracking-wide align-middle">
                            ★ Best
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="text-sm font-medium text-foreground text-center tabular-nums">
                      {day.bills}
                    </span>
                    <span className="text-sm font-bold text-cafe-espresso text-right tabular-nums">
                      ₹{day.revenue.toLocaleString("en-IN")}
                    </span>
                  </button>

                  {/* Item breakdown — visible when expanded */}
                  {isExpanded && dayItems.length > 0 && (
                    <div
                      className={`px-4 pb-3 pt-1 ${isBestDay ? "bg-cafe-amber-light/20" : "bg-secondary/30"}`}
                    >
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 pl-5">
                        Items Sold
                      </p>
                      <div className="pl-5 space-y-1.5">
                        {dayItems.map((item) => (
                          <div
                            key={item.name}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="text-xs font-medium text-foreground">
                              {item.name}
                            </span>
                            <span className="text-xs font-bold text-cafe-espresso bg-cafe-amber-light/60 rounded-full px-2 py-0.5 tabular-nums">
                              × {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground mt-3 text-center opacity-60">
          Tap a date row to see item breakdown
        </p>
      </div>
    </div>
  );
}
