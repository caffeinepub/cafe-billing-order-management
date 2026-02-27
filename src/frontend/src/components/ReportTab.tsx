import { useMemo } from "react";
import { TrendingUp, Receipt, Star, Calendar } from "lucide-react";
import type { Order } from "../types";

interface ReportTabProps {
  orders: Order[];
}

interface DaySummary {
  date: string;
  bills: number;
  revenue: number;
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getDateKey(isoString: string): string {
  return isoString.slice(0, 10); // YYYY-MM-DD
}

export function ReportTab({ orders }: ReportTabProps) {
  const { totalRevenue, totalBills, bestDay, daySummaries } = useMemo(() => {
    const dayMap = new Map<string, DaySummary>();

    for (const order of orders) {
      const dateKey = getDateKey(order.dateTime);
      const existing = dayMap.get(dateKey);
      if (existing) {
        existing.bills += 1;
        existing.revenue += order.total;
      } else {
        dayMap.set(dateKey, { date: dateKey, bills: 1, revenue: order.total });
      }
    }

    const summaries = Array.from(dayMap.values()).sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    const totalRevenue = summaries.reduce((sum, d) => sum + d.revenue, 0);
    const totalBills = summaries.reduce((sum, d) => sum + d.bills, 0);
    const bestDay = summaries.reduce<DaySummary | null>(
      (best, d) => (!best || d.revenue > best.revenue ? d : best),
      null
    );

    return { totalRevenue, totalBills, bestDay, daySummaries: summaries };
  }, [orders]);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-foreground">Sales Report</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Revenue & billing overview</p>
      </div>

      {/* ── Summary cards ── */}
      <div className="px-4 pb-4 space-y-3">
        {/* Total Revenue */}
        <div className="rounded-xl bg-cafe-espresso text-white px-5 py-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">Total Revenue</p>
              <p className="text-2xl font-bold mt-0.5">₹{totalRevenue.toLocaleString("en-IN")}</p>
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
                <p className="text-base font-bold text-foreground">₹{bestDay.revenue.toLocaleString("en-IN")}</p>
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
      </div>

      {/* ── Day-wise table ── */}
      <div className="px-4 pb-6">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Daily Breakdown</h2>
        </div>

        {daySummaries.length === 0 ? (
          <div className="rounded-xl bg-card border border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">No orders yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Finalized orders will appear here.</p>
          </div>
        ) : (
          <div className="rounded-xl bg-card border border-border overflow-hidden shadow-card">
            {/* Table header */}
            <div className="grid grid-cols-3 bg-secondary px-4 py-2.5 border-b border-border">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Date</span>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide text-center">Bills</span>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide text-right">Revenue</span>
            </div>
            {/* Table rows */}
            {daySummaries.map((day, idx) => (
              <div
                key={day.date}
                className={`grid grid-cols-3 px-4 py-3.5 ${
                  idx < daySummaries.length - 1 ? "border-b border-border" : ""
                } ${day === bestDay ? "bg-cafe-amber-light/40" : ""}`}
              >
                <span className="text-sm font-semibold text-foreground">
                  {formatDate(day.date)}
                  {day === bestDay && (
                    <span className="ml-1.5 text-[9px] font-bold text-cafe-amber uppercase tracking-wide align-middle">
                      ★ Best
                    </span>
                  )}
                </span>
                <span className="text-sm font-medium text-foreground text-center tabular-nums">
                  {day.bills}
                </span>
                <span className="text-sm font-bold text-cafe-espresso text-right tabular-nums">
                  ₹{day.revenue.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
