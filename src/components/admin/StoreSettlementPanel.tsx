"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, CreditCard, Loader2, RefreshCw } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

type Balance = {
  storeId: string;
  storeName: string;
  orderCount: number;
  productBalance: number;
  shippingTotal: number;
  bank: {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    accountType: string;
  };
};

export default function StoreSettlementPanel() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadBalances = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/store-settlements", {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("BALANCES_READ_FAILED");
      const data = (await response.json()) as { balances: Balance[] };
      setBalances(data.balances);
    } catch (error) {
      console.error(error);
      setMessage("No se pudieron cargar los saldos de las tiendas.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadBalances();
  }, [loadBalances]);

  const payStore = async (balance: Balance) => {
    if (!user || payingId) return;
    if (!balance.bank.accountNumber) {
      setMessage("Esta tienda todavía no ha registrado una cuenta bancaria.");
      return;
    }
    const reference = window.prompt(
      `Referencia del depósito de RD$${balance.productBalance.toLocaleString()} para ${balance.storeName}:`,
    )?.trim();
    if (!reference) return;
    if (!window.confirm(`¿Confirmas que ya depositaste RD$${balance.productBalance.toLocaleString()} a ${balance.storeName}?`)) return;

    setPayingId(balance.storeId);
    try {
      const response = await fetch("/api/admin/store-settlements", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ storeId: balance.storeId, paymentReference: reference }),
      });
      if (!response.ok) throw new Error("STORE_PAYMENT_FAILED");
      setMessage(`Pago registrado para ${balance.storeName}. Su saldo pendiente ahora es RD$0.`);
      await loadBalances();
    } catch (error) {
      console.error(error);
      setMessage("No se pudo registrar el pago. No se modificó el saldo.");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-[#E7E7EC] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7E7EC] p-6">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">Saldos acumulados por tienda</h3>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Se paga únicamente el valor de los productos entregados; el envío queda separado.
          </p>
        </div>
        <button onClick={() => void loadBalances()} disabled={loading} className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Actualizar
        </button>
      </div>
      {message && <div className="mx-6 mt-4 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white">{message}</div>}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-xs font-bold text-slate-400">
          <Loader2 size={18} className="animate-spin text-[#d3121a]" /> Calculando saldos...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 p-6 xl:grid-cols-2">
          {balances.map((balance) => (
            <div key={balance.storeId} className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="rounded-xl bg-red-50 p-2.5 text-[#d3121a]"><Building2 size={18} /></div>
                  <div>
                    <h4 className="font-extrabold text-slate-900">{balance.storeName}</h4>
                    <p className="text-[11px] font-medium text-slate-400">{balance.orderCount} pedidos pendientes de pago</p>
                  </div>
                </div>
                <span className="text-xl font-extrabold text-emerald-600">RD${balance.productBalance.toLocaleString()}</span>
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <div className="mb-1 flex items-center gap-2 font-bold text-slate-800"><CreditCard size={14} /> Datos para depósito</div>
                {balance.bank.accountNumber ? (
                  <>
                    <p>{balance.bank.bankName} · {balance.bank.accountType}</p>
                    <p className="font-mono font-bold">{balance.bank.accountNumber}</p>
                    <p>{balance.bank.accountHolder}</p>
                  </>
                ) : <p className="text-amber-700">Cuenta bancaria pendiente de registrar.</p>}
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>Envíos separados: RD${balance.shippingTotal.toLocaleString()}</span>
                <button
                  onClick={() => void payStore(balance)}
                  disabled={payingId !== null || balance.productBalance <= 0}
                  className="rounded-xl bg-[#d3121a] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-40"
                >
                  {payingId === balance.storeId ? "Registrando..." : "Marcar como pagado"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
