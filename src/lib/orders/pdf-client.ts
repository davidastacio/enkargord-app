"use client";

import type { User } from "firebase/auth";

export async function downloadOrdersPdf(
  user: User,
  orderIds: string[],
  mode: "orders" | "labels",
): Promise<void> {
  if (!orderIds.length) throw new Error("NO_ORDERS_SELECTED");
  const token = await user.getIdToken();
  const response = await fetch("/api/orders/pdf", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ orderIds, mode }),
  });
  if (!response.ok) throw new Error("PDF_DOWNLOAD_FAILED");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${mode === "labels" ? "Etiquetas" : "Pedidos"}-${new Date().toISOString().slice(0, 10)}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
