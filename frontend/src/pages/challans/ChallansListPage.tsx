import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { challanApi } from "../../api/endpoints";
import { getErrorMessage } from "../../api/client";
import { Challan } from "../../types";
import StatusChip from "../../components/StatusChip";
import { EmptyState, ErrorBanner } from "../../components/Banner";
import { useAuth } from "../../context/AuthContext";

export default function ChallansListPage() {
  const { user } = useAuth();
  const canCreate = user?.role === "ADMIN" || user?.role === "SALES";
  const [searchParams] = useSearchParams();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await challanApi.list({ status: status || undefined, page: 1 });
      setChallans(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Sales Challans</h1>
          <p className="text-sm text-slate-500">Draft, confirm and track dispatch of goods to customers.</p>
        </div>
        {canCreate && (
          <Link to="/challans/new" className="btn-primary">
            New challan
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="field-input max-w-[180px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="card overflow-hidden">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">Loading challans...</p>
        ) : challans.length === 0 ? (
          <EmptyState title="No sales challans found" subtitle={canCreate ? "Create one to get started." : undefined} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Challan #</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Total qty</th>
                <th className="px-5 py-3 font-medium">Created by</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {challans.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <Link to={`/challans/${c.id}`} className="ledger-tag hover:border-brand-400 hover:text-brand-600">
                      {c.challanNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 font-medium text-ink">{c.customer?.name ?? "—"}</td>
                  <td className="px-5 py-3">
                    <StatusChip value={c.status} />
                  </td>
                  <td className="px-5 py-3">{c.totalQuantity}</td>
                  <td className="px-5 py-3 text-slate-500">{c.createdBy?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
