import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import bwipjs from "bwip-js/node";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logisticsRegion } from "@/lib/logistics/regions";

export const runtime = "nodejs";

const clean = (value: unknown) =>
  String(value ?? "").replace(/[^\x20-\x7E\xA0-\xFF]/g, "").trim();

function wrap(font: PDFFont, text: string, size: number, width: number): string[] {
  const words = clean(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) line = candidate;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function field(page: PDFPage, font: PDFFont, bold: PDFFont, label: string, value: unknown, x: number, y: number, width: number) {
  page.drawText(label, { x, y, size: 8, font: bold, color: rgb(0.39, 0.45, 0.55) });
  const lines = wrap(font, clean(value) || "-", 10, width);
  lines.slice(0, 3).forEach((line, index) =>
    page.drawText(line, { x, y: y - 13 - index * 12, size: 10, font, color: rgb(0.08, 0.12, 0.2) }),
  );
}

function fittedSize(font: PDFFont, text: string, preferred: number, width: number, minimum = 8) {
  let size = preferred;
  while (size > minimum && font.widthOfTextAtSize(text, size) > width) size -= 0.5;
  return size;
}

async function drawLabel(
  pdf: PDFDocument,
  page: PDFPage,
  order: Record<string, any>,
  font: PDFFont,
  bold: PDFFont,
) {
  const metadata = order.metadata ?? {};
  const storeName = clean(order.resolved_store_name || metadata.storeName || metadata.store_name || "Tienda");
  const district = clean(metadata.municipalDistrictName || metadata.municipal_district_name);
  const reference = clean(order.reference || metadata.reference);
  const address = clean(order.formatted_address || order.street);
  const productAmount = Number(order.collection_amount || 0);
  const shippingAmount = Number(order.shipping_cost || 0);
  const totalToCollect = productAmount + shippingAmount;
  const isPrepaid = Boolean(metadata.alreadyPaid);
  const tracking = clean(order.tracking);
  const destination = [order.sector_name, district, order.municipality_name, order.province_name]
    .map(clean).filter(Boolean).join(", ");
  const light = rgb(0.965, 0.975, 0.985);
  const border = rgb(0.88, 0.91, 0.94);
  const muted = rgb(0.35, 0.43, 0.54);
  const ink = rgb(0.07, 0.11, 0.2);
  const green = rgb(0.02, 0.58, 0.4);

  page.drawText(storeName, {
    x: 14, y: 398, size: fittedSize(bold, storeName, 15, 145), font: bold, color: ink,
  });
  page.drawText("ORDEN", { x: 229, y: 409, size: 6.5, font: bold, color: muted });
  page.drawRectangle({ x: 183, y: 382, width: 90, height: 23, color: light, borderWidth: 1, borderColor: border });
  page.drawText(tracking, {
    x: 188, y: 389, size: fittedSize(bold, tracking, 10.5, 80, 7), font: bold, color: ink,
  });
  page.drawLine({ start: { x: 14, y: 373 }, end: { x: 273, y: 373 }, thickness: 1, color: border });

  page.drawRectangle({ x: 10, y: 265, width: 268, height: 96, color: light, borderWidth: 0.8, borderColor: border });
  page.drawText("DATOS DEL DESTINATARIO", { x: 22, y: 342, size: 8.5, font: bold, color: muted });
  page.drawText(clean(order.customer_name) || "Cliente", {
    x: 22, y: 321, size: fittedSize(font, clean(order.customer_name) || "Cliente", 14, 230), font, color: ink,
  });
  page.drawText("TELEFONO:", { x: 22, y: 303, size: 7, font: bold, color: muted });
  page.drawText(clean(order.customer_phone) || "-", { x: 190, y: 303, size: 9, font: bold, color: green });
  page.drawText("DIRECCION:", { x: 22, y: 288, size: 7, font: bold, color: muted });
  wrap(font, reference ? `${address} (Ref: ${reference})` : address, 7.6, 186).slice(0, 2).forEach((line, index) =>
    page.drawText(line, { x: 82, y: 288 - index * 9, size: 7.6, font, color: ink }),
  );
  page.drawText("DESTINO:", { x: 22, y: 270, size: 7, font: bold, color: muted });
  page.drawText(destination || "-", {
    x: 82, y: 270, size: fittedSize(font, destination || "-", 7.5, 184, 5.5), font, color: ink,
  });

  page.drawRectangle({ x: 10, y: 140, width: 268, height: 113, color: light, borderWidth: 0.8, borderColor: border });
  page.drawText("DETALLES DEL ENVIO", { x: 22, y: 234, size: 8.5, font: bold, color: muted });
  const detailRows: Array<[string, string]> = [
    ["FECHA PEDIDO:", new Date(order.created_at).toLocaleDateString("es-DO")],
    ["TRANSPORTADORA:", "ENKARGORD | LOGISTICA"],
    ["GESTIONADO POR:", "ENKARGORD"],
    ["TIENDA DE VENTA:", storeName],
    ["TIPO PAGO:", isPrepaid ? "PAGADO" : "CONTRA ENTREGA"],
  ];
  detailRows.forEach(([label, value], index) => {
    const y = 216 - index * 14;
    page.drawText(label, { x: 22, y, size: 6.8, font: bold, color: muted });
    page.drawText(value, { x: 142, y, size: fittedSize(font, value, 7.8, 122, 6), font, color: ink });
  });
  page.drawLine({ start: { x: 22, y: 153 }, end: { x: 266, y: 153 }, thickness: 0.8, dashArray: [3, 2], color: rgb(0.72, 0.77, 0.83) });
  page.drawText(isPrepaid ? "PAGADO" : "TOTAL A COBRAR (COD)", { x: 22, y: 142, size: 7.5, font: bold, color: ink });
  const totalText = isPrepaid ? "RD$0.00" : `RD$${totalToCollect.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  page.drawText(totalText, { x: 190, y: 142, size: fittedSize(bold, totalText, 12, 76), font: bold, color: ink });

  page.drawRectangle({ x: 10, y: 76, width: 268, height: 57, color: light, borderWidth: 0.8, borderColor: border });
  page.drawText("CONTENIDO DEL PAQUETE", { x: 22, y: 116, size: 8.5, font: bold, color: muted });
  page.drawText("DESCRIPCION", { x: 22, y: 98, size: 6.8, font: bold, color: muted });
  page.drawText("CANT.", { x: 241, y: 98, size: 6.8, font: bold, color: muted });
  page.drawLine({ start: { x: 22, y: 94 }, end: { x: 266, y: 94 }, thickness: 0.8, dashArray: [3, 2], color: rgb(0.72, 0.77, 0.83) });
  page.drawText(clean(order.package_description || metadata.packageDescription || order.package_type || "Paquete"), {
    x: 22, y: 82, size: 8, font: bold, color: ink,
  });
  page.drawText(String(Number(order.package_quantity || metadata.packageQuantity || 1)), { x: 252, y: 82, size: 8, font: bold, color: ink });

  const barcodeBuffer = await bwipjs.toBuffer({
    bcid: "code128", text: tracking, scale: 2, height: 7, includetext: false,
  });
  const qrBuffer = await bwipjs.toBuffer({
    bcid: "qrcode", text: `https://enkargord.com/seguimiento?tracking=${encodeURIComponent(tracking)}`, scale: 2,
  });
  const barcode = await pdf.embedPng(barcodeBuffer);
  const qr = await pdf.embedPng(qrBuffer);
  page.drawImage(barcode, { x: 38, y: 29, width: 118, height: 26 });
  page.drawText(tracking, { x: 55, y: 18, size: fittedSize(bold, tracking, 6.5, 92, 5), font: bold, color: muted });
  page.drawImage(qr, { x: 218, y: 13, width: 45, height: 45 });
}

function drawOrderDocument(page: PDFPage, order: Record<string, any>, font: PDFFont, bold: PDFFont) {
  const metadata = order.metadata ?? {};
  page.drawText("EnkargoRD - Guia de pedido", { x: 42, y: 745, size: 20, font: bold, color: rgb(0.83, 0.07, 0.1) });
  page.drawText(clean(order.tracking), { x: 42, y: 710, size: 17, font: bold });
  field(page, font, bold, "Cliente", order.customer_name, 42, 665, 240);
  field(page, font, bold, "Telefono", order.customer_phone, 320, 665, 220);
  field(page, font, bold, "Destino", `${order.province_name}, ${order.municipality_name}, ${order.sector_name}`, 42, 600, 500);
  field(page, font, bold, "Direccion completa", order.formatted_address || order.street, 42, 535, 500);
  field(page, font, bold, "Referencia", order.reference, 42, 455, 500);
  field(page, font, bold, "Paquete", `${order.package_type} - ${order.package_description}`, 42, 385, 500);
  field(page, font, bold, "Tienda", metadata.storeName || order.store_id, 42, 315, 240);
  field(page, font, bold, "Repartidor", order.courier_name || "No asignado", 320, 315, 220);
  field(page, font, bold, "Estado", order.status, 42, 245, 240);
  field(page, font, bold, "Region logistica", logisticsRegion(order.province_name), 320, 245, 220);
  page.drawText(`Recaudo: RD$${Number(order.collection_amount || 0).toLocaleString("en-US")}`, { x: 42, y: 155, size: 18, font: bold });
  page.drawText(`Envio: RD$${Number(order.shipping_cost || 0).toLocaleString("en-US")}`, { x: 42, y: 125, size: 12, font });
  page.drawText(`Generado: ${new Date().toLocaleString("es-DO")}`, { x: 42, y: 55, size: 8, font, color: rgb(0.45, 0.5, 0.58) });
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const decoded = await getAdminAuth().verifyIdToken(authorization.slice(7));
    const body = (await request.json()) as { orderIds?: unknown; mode?: unknown };
    const ids = Array.isArray(body.orderIds) ? body.orderIds.filter((id): id is string => typeof id === "string").slice(0, 200) : [];
    const mode = body.mode === "labels" ? "labels" : "orders";
    if (!ids.length) return NextResponse.json({ error: "NO_ORDERS" }, { status: 400 });

    const supabase = getSupabaseAdminClient();
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles").select("role,store_id,courier_id,organization_id").eq("firebase_uid", decoded.uid).single();
    if (profileError) throw profileError;
    let query = supabase
      .from("orders")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .in("id", ids);
    if (profile.role === "Tienda") query = query.eq("store_id", profile.store_id);
    else if (profile.role === "Motorista") query = query.eq("courier_id", profile.courier_id);
    else if (profile.role !== "Admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const { data: orders, error } = await query.order("created_at", { ascending: true });
    if (error) throw error;
    if (!orders || orders.length !== ids.length) return NextResponse.json({ error: "ORDER_ACCESS_DENIED" }, { status: 403 });

    const storeIds = Array.from(new Set(orders.map((order) => order.store_id).filter(Boolean)));
    const storeNames = new Map<string, string>();
    if (storeIds.length) {
      const { data: stores, error: storesError } = await supabase
        .from("stores")
        .select("id,commercial_name")
        .eq("organization_id", profile.organization_id)
        .in("id", storeIds);
      if (storesError) throw storesError;
      for (const store of stores || []) storeNames.set(store.id, store.commercial_name || "Tienda");
    }

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    for (const order of orders) {
      const enrichedOrder = { ...order, resolved_store_name: storeNames.get(order.store_id) };
      const page = pdf.addPage(mode === "labels" ? [288, 432] : [612, 792]);
      if (mode === "labels") await drawLabel(pdf, page, enrichedOrder, font, bold);
      else drawOrderDocument(page, enrichedOrder, font, bold);
    }
    const bytes = await pdf.save();
    const filename = `EnkargoRD-${mode}-${new Date().toISOString().slice(0, 10)}.pdf`;
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json({ error: "PDF_GENERATION_FAILED" }, { status: 500 });
  }
}
