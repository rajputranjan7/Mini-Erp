import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { challanApi } from "../../api/endpoints";
import { getErrorMessage } from "../../api/client";
import { Challan } from "../../types";
import StatusChip from "../../components/StatusChip";
import { ErrorBanner } from "../../components/Banner";
import { useAuth } from "../../context/AuthContext";

export default function ChallanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actingOn, setActingOn] = useState<"confirm" | "cancel" | null>(null);

  async function load() {
    if (!id) return;
    try {
      const data = await challanApi.get(id);
      setChallan(data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleConfirm() {
    if (!id) return;
    setActionError("");
    setActingOn("confirm");
    try {
      await challanApi.confirm(id);
      await load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActingOn(null);
    }
  }

  async function handleCancel() {
    if (!id) return;
    if (!window.confirm("Cancel this challan? If it was confirmed, stock will be restored.")) return;
    setActionError("");
    setActingOn("cancel");
    try {
      await challanApi.cancel(id);
      await load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActingOn(null);
    }
  }

  if (error) return <ErrorBanner message={error} />;
  if (!challan) return <p className="text-sm text-slate-400">Loading challan...</p>;

  const canConfirm = challan.status === "DRAFT" && ["ADMIN", "SALES", "WAREHOUSE"].includes(user?.role ?? "");
  const canCancel = challan.status !== "CANCELLED" && ["ADMIN", "SALES"].includes(user?.role ?? "");
  const total = challan.items.reduce((sum, i) => sum + Number(i.lineTotal), 0);

  return (
    <div className="max-w-3xl space-y-6">
      <button onClick={() => navigate("/challans")} className="text-xs font-medium text-slate-400 hover:text-brand-500">
        ← Back to challans
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{challan.challanNumber}</h1>
          <p className="text-sm text-slate-500">
            {challan.customer ? (
              <Link to={`/customers/${challan.customer.id}`} className="hover:text-brand-500">
                {challan.customer.name}
              </Link>
            ) : (
              "Unknown customer"
            )}
          </p>
        </div>
        <StatusChip value={challan.status} />
      </div>

      {actionError && <ErrorBanner message={actionError} />}

      {(canConfirm || canCancel) && (
        <div className="flex gap-3">
          {canConfirm && (
            <button className="btn-primary" disabled={!!actingOn} onClick={handleConfirm}>
              {actingOn === "confirm" ? "Confirming..." : "Confirm challan (deduct stock)"}
            </button>
          )}
          {canCancel && (
            <button className="btn-danger" disabled={!!actingOn} onClick={handleCancel}>
              {actingOn === "cancel" ? "Cancelling..." : "Cancel challan"}
            </button>
          )}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-medium">Product (as sold)</th>
              <th className="px-5 py-3 font-medium">SKU</th>
              <th className="px-5 py-3 font-medium">Qty</th>
              <th className="px-5 py-3 font-medium">Unit price</th>
              <th className="px-5 py-3 font-medium">Line total</th>
            </tr>
          </thead>
          <tbody>
            {challan.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3 font-medium text-ink">{item.productNameSnap}</td>
                <td className="px-5 py-3">
                  <span className="ledger-tag">{item.productSkuSnap}</span>
                </td>
                <td className="px-5 py-3">{item.quantity}</td>
                <td className="px-5 py-3 text-slate-500">₹{Number(item.unitPriceSnap).toLocaleString("en-IN")}</td>
                <td className="px-5 py-3 font-medium">₹{Number(item.lineTotal).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="px-5 py-3 text-right text-sm font-medium text-slate-500">
                Total ({challan.totalQuantity} units)
              </td>
              <td className="px-5 py-3 font-display font-semibold text-ink">₹{total.toLocaleString("en-IN")}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="card p-5 text-sm text-slate-500">
        <p>Created by {challan.createdBy?.name ?? "—"} on {new Date(challan.createdAt).toLocaleString()}</p>
        {challan.confirmedAt && <p>Confirmed on {new Date(challan.confirmedAt).toLocaleString()}</p>}
        {challan.cancelledAt && <p>Cancelled on {new Date(challan.cancelledAt).toLocaleString()}</p>}
        <p className="mt-2 text-xs text-slate-400">
          Product name, SKU and price are snapshotted at the time of sale, so this record stays accurate even if the
          product catalogue changes later.
        </p>
      </div>
    </div>
  );
}
