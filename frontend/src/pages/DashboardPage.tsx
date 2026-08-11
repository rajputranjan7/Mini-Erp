import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { challanApi, customerApi, productApi } from "../api/endpoints";
import { Product } from "../types";
import StatusChip from "../components/StatusChip";

export default function DashboardPage() {
  const { user } = useAuth();
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [draftChallans, setDraftChallans] = useState<number | null>(null);
  const [lowStock, setLowStock] = useState<Product[]>([]);

  useEffect(() => {
    if (user?.role !== "WAREHOUSE") {
      customerApi.list({ page: 1 }).then((r) => setCustomerCount(r.meta.total)).catch(() => {});
    }
    challanApi.list({ status: "DRAFT", page: 1 }).then((r) => setDraftChallans(r.meta.total)).catch(() => {});
    productApi.list({ lowStockOnly: true, page: 1 }).then((r) => setLowStock(r.data)).catch(() => {});
  }, [user]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Welcome back, {user?.name.split(" ")[0]}</h1>
        <p className="text-sm text-slate-500">Here's what needs attention across the floor today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {user?.role !== "WAREHOUSE" && (
          <StatCard label="Total customers" value={customerCount} to="/customers" />
        )}
        <StatCard label="Draft challans awaiting confirmation" value={draftChallans} to="/challans?status=DRAFT" />
        <StatCard label="Products below minimum stock" value={lowStock.length} to="/products?lowStockOnly=true" tone={lowStock.length > 0 ? "warn" : "default"} />
      </div>

      <div className="card">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-display text-sm font-semibold text-ink">Low stock alerts</h2>
          <Link to="/products?lowStockOnly=true" className="text-xs font-medium text-brand-500 hover:underline">
            View all
          </Link>
        </div>
        {lowStock.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400">All products are above their minimum stock threshold.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-2 font-medium">Product</th>
                <th className="px-5 py-2 font-medium">SKU</th>
                <th className="px-5 py-2 font-medium">Current</th>
                <th className="px-5 py-2 font-medium">Minimum</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.slice(0, 6).map((p) => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">{p.name}</td>
                  <td className="px-5 py-3">
                    <span className="ledger-tag">{p.sku}</span>
                  </td>
                  <td className="px-5 py-3">
                    <StatusChip value={p.currentStock <= p.minStockQty ? "CANCELLED" : "ACTIVE"} />
                    <span className="ml-2">{p.currentStock}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{p.minStockQty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  to,
  tone = "default",
}: {
  label: string;
  value: number | null;
  to: string;
  tone?: "default" | "warn";
}) {
  return (
    <Link
      to={to}
      className={`card block p-5 transition-shadow hover:shadow-md ${tone === "warn" && value ? "border-amber-200" : ""}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 font-display text-3xl font-semibold ${tone === "warn" && value ? "text-amber-600" : "text-ink"}`}>
        {value === null ? "—" : value}
      </p>
    </Link>
  );
}
