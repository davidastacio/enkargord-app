"use client";

import type { CourierOrder, OrderStatus } from "@/data/courier";
import type { EnkargoOrder } from "@/lib/supabase/orders";

function number(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toCourierOrder(
  order: EnkargoOrder,
  courierCommission?: number,
): CourierOrder & { settlementStatus: string } {
  const raw = order as Record<string, any>;
  const collectionAmount = number(raw.collectionAmount);
  const shippingCost = number(raw.shippingCost);
  const fulfillmentCost = number(raw.fulfillmentData?.additionalCost);
  const mappedStatus =
    raw.status === "customer_unreachable" ? "no_answer" : raw.status;
  const fullAddress = raw.formattedAddress || raw.street || "";

  return {
    id: order.id,
    trackingId: order.tracking || order.id,
    status: mappedStatus as OrderStatus,
    courierId: raw.courierId || "",
    courierName: raw.courierName || "",
    storeId: raw.storeId || "",
    storeName: raw.storeName || "Tienda EnkargoRD",
    createdAt: order.createdAt,
    scheduledAt: raw.scheduledAt || undefined,
    customer: {
      name: raw.customerName || "Cliente",
      phone: raw.customerPhone || "",
    },
    deliveryAddress: {
      provinceId: raw.provinceId || "",
      provinceName: raw.provinceName || "",
      municipalityId: raw.municipalityId || "",
      municipalityName: raw.municipalityName || "",
      sectorId: raw.sectorId || "",
      sectorName: raw.sectorName || "",
      street: raw.street || "",
      fullAddress,
      reference: raw.reference || "",
      coordinates: {
        lat: number(raw.latitude || raw.deliveryLatitude) || 18.4795,
        lng: number(raw.longitude || raw.deliveryLongitude) || -69.9326,
      },
    },
    financials: {
      orderCollectionAmount: collectionAmount,
      shippingCost,
      storeProductAmount: collectionAmount,
      courierCommission:
        raw.financials?.courierCommission !== undefined
          ? number(raw.financials.courierCommission)
          : courierCommission ?? shippingCost,
      transportCompanyAmount: Math.max(
        0,
        shippingCost -
          (raw.financials?.courierCommission !== undefined
            ? number(raw.financials.courierCommission)
            : courierCommission ?? shippingCost),
      ),
      beneficiaryBreakdown: raw.financials?.beneficiaryBreakdown || [],
      fulfillmentCost,
    },
    fulfillment: {
      required: Boolean(raw.requiresFulfillment),
      ...(raw.fulfillmentData || {}),
    },
    noAnswerRecord: raw.noAnswerRecord,
    deliveredAt: raw.deliveredAt || undefined,
    paymentMethod: raw.paymentMethod || "cash",
    amountCollected:
      raw.amountCollected !== undefined && raw.amountCollected !== null
        ? number(raw.amountCollected)
        : raw.collectedAmount !== undefined && raw.collectedAmount !== null
          ? number(raw.collectedAmount)
          : raw.status === "delivered"
            ? collectionAmount
            : 0,
    routeOrder: raw.routeOrder ?? undefined,
    settlementStatus: raw.settlementStatus || "pending",
  };
}
