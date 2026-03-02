import { Printer, RefreshCw } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Order } from "../types";

interface ThermalReceiptProps {
  order: Order;
  onPrint: () => void;
  onNewOrder: () => void;
}

// ─── Receipt line builder ────────────────────────────────────────────────────
// Total line width = 32 chars (fits 80mm at 12px monospace ~2.5mm per char)
const LINE_WIDTH = 32;

function pad(
  str: string,
  width: number,
  align: "left" | "right" = "left",
): string {
  const s = String(str);
  if (s.length >= width) return s.slice(0, width);
  return align === "left" ? s.padEnd(width) : s.padStart(width);
}

function buildReceiptLines(items: Order["items"]): string[] {
  const lines: string[] = [];
  // Header row
  lines.push(
    pad("Item", 16) +
      pad("Qty", 4, "right") +
      pad("₹", 6, "right") +
      pad("Tot", 6, "right"),
  );
  lines.push("-".repeat(LINE_WIDTH));

  for (const item of items) {
    const qty = pad(String(item.quantity), 4, "right");
    const price = pad(String(item.price), 6, "right");
    const total = pad(String(item.price * item.quantity), 6, "right");

    if (item.name.length <= 15) {
      lines.push(pad(item.name, 16) + qty + price + total);
    } else {
      // Long name: name on its own line, then numbers on next
      lines.push(item.name.slice(0, LINE_WIDTH));
      lines.push(pad("", 16) + qty + price + total);
    }
  }

  return lines;
}

function generateBillNo(dateStr: string): string {
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `BILL-${dateStr}-${rand}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
}

function getDateStr(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function ThermalReceipt({
  order,
  onPrint,
  onNewOrder,
}: ThermalReceiptProps) {
  const billNoRef = useRef<string>(generateBillNo(getDateStr(order.dateTime)));
  const billNo = billNoRef.current;

  const itemLines = buildReceiptLines(order.items);
  const separator = "=".repeat(LINE_WIDTH);
  const dashes = "-".repeat(LINE_WIDTH);

  // Center a string within LINE_WIDTH
  const center = (text: string) => {
    const spaces = Math.max(0, Math.floor((LINE_WIDTH - text.length) / 2));
    return " ".repeat(spaces) + text;
  };

  // Format subtotal/total lines (right-aligned label + value)
  const totalLine = (label: string, amount: number): string => {
    const valStr = `₹${amount}`;
    const labelWidth = LINE_WIDTH - valStr.length;
    return label.padEnd(labelWidth) + valStr;
  };

  const paymentLabel =
    order.paymentType === "online" ? "Online Payment" : "Cash Payment";

  const receiptLines: string[] = [
    separator,
    center("SIMPLE SIPS CAFE"),
    center("ESTD 2026 \u2022 Billing Receipt"),
    separator,
    `Date: ${formatDate(order.dateTime)}`,
    `Time: ${formatTime(order.dateTime)}`,
    `Bill No: ${billNo}`,
    separator,
    ...itemLines,
    dashes,
    totalLine("Subtotal:", order.total),
    totalLine("TOTAL:", order.total),
    dashes,
    totalLine("Payment:", 0).replace(
      "₹0",
      order.paymentType === "online" ? "ONLINE" : "CASH",
    ),
    separator,
    center("Thank you for visiting!"),
    center("Simple Sips Cafe \u2615"),
    center("Please come again"),
    separator,
  ];
  void paymentLabel;

  const receiptText = receiptLines.join("\n");

  // Trap focus inside overlay for accessibility
  useEffect(() => {
    const el = document.getElementById("receipt-overlay");
    if (el) el.focus();
  }, []);

  return (
    <dialog
      id="receipt-overlay"
      aria-label="Print Receipt"
      open
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 px-4 py-6 overflow-y-auto no-print-overlay border-0 max-w-none max-h-none w-full h-full m-0 p-0"
      style={{ outline: "none" }}
    >
      {/* Receipt card */}
      <div
        id="thermal-receipt-print-area"
        className="shadow-2xl border-2 border-black"
        style={{
          background: "#FFFDE7",
          color: "#000000",
          fontFamily: "'Courier New', Courier, monospace",
          width: "80mm",
          minWidth: "80mm",
          maxWidth: "80mm",
          margin: 0,
          padding: "4mm 4mm",
          boxSizing: "border-box",
          fontSize: "12px",
          lineHeight: "1.4",
          whiteSpace: "pre",
          overflowX: "hidden",
          wordBreak: "break-all",
        }}
      >
        <pre
          style={{
            fontFamily: "inherit",
            fontSize: "inherit",
            lineHeight: "inherit",
            color: "inherit",
            background: "transparent",
            margin: 0,
            padding: 0,
            whiteSpace: "pre",
            overflowX: "hidden",
          }}
        >
          {receiptText}
        </pre>
      </div>

      {/* Action buttons — hidden when printing */}
      <div className="no-print flex flex-col sm:flex-row gap-3 mt-6 w-full max-w-xs">
        <button
          type="button"
          onClick={onPrint}
          className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-cafe-green text-white font-bold text-sm shadow-lg hover:bg-cafe-green-dark active:scale-[0.98] transition-all"
        >
          <Printer className="w-4 h-4" />
          Print Bill
        </button>
        <button
          type="button"
          onClick={onNewOrder}
          className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-white text-cafe-espresso font-bold text-sm border-2 border-cafe-espresso shadow-md hover:bg-secondary active:scale-[0.98] transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Start New Order
        </button>
      </div>

      <p className="no-print mt-3 text-xs text-white/70 text-center">
        Compatible with USB, Bluetooth & standard printers
      </p>
    </dialog>
  );
}
