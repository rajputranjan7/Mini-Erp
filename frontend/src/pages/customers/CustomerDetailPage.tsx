import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { customerApi } from "../../api/endpoints";
import { getErrorMessage } from "../../api/client";
import { Customer } from "../../types";
import StatusChip from "../../components/StatusChip";
import { ErrorBanner } from "../../components/Banner";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  async function load() {
    if (!id) return;
    try {
      const data = await customerApi.get(id);
      setCustomer(data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!id || !note.trim()) return;
    setSubmittingNote(true);
    try {
      await customerApi.addFollowUp(id, note, followUpDate || undefined);
      setNote("");
      setFollowUpDate("");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmittingNote(false);
    }
  }

  if (error) return <ErrorBanner message={error} />;
  if (!customer) return <p className="text-sm text-slate-400">Loading customer...</p>;

  return (
    <div className="space-y-6">
      <Link to="/customers" className="text-xs font-medium text-slate-400 hover:text-brand-500">
        ← Back to customers
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{customer.name}</h1>
          <p className="text-sm text-slate-500">{customer.businessName ?? "No business name on file"}</p>
        </div>
        <StatusChip value={customer.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-1">
          <h2 className="mb-3 font-display text-sm font-semibold text-ink">Details</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Mobile" value={customer.mobile} mono />
            <Row label="Email" value={customer.email || "—"} />
            <Row label="Type" value={customer.customerType} />
            <Row label="GST number" value={customer.gstNumber || "—"} mono />
            <Row label="Address" value={customer.address || "—"} />
            <Row label="Next follow-up" value={customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : "—"} />
            <Row label="Added by" value={customer.createdBy?.name ?? "—"} />
          </dl>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-3 font-display text-sm font-semibold text-ink">Follow-up notes</h2>
          <form onSubmit={handleAddNote} className="mb-4 space-y-2">
            <textarea
              className="field-input"
              rows={2}
              placeholder="Add a follow-up note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <input
                type="date"
                className="field-input max-w-[180px]"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
              <button type="submit" disabled={submittingNote || !note.trim()} className="btn-primary">
                {submittingNote ? "Adding..." : "Add note"}
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {customer.followUps?.length ? (
              customer.followUps.map((f) => (
                <div key={f.id} className="border-b border-slate-100 pb-3 last:border-0">
                  <p className="text-sm text-ink">{f.note}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {f.createdBy?.name} · {new Date(f.createdAt).toLocaleString()}
                    {f.followUpDate && ` · next: ${new Date(f.followUpDate).toLocaleDateString()}`}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No follow-up notes yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 font-display text-sm font-semibold text-ink">Challan history</h2>
        {customer.challans?.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 font-medium">Challan #</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Qty</th>
                <th className="py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {customer.challans.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-2">
                    <Link to={`/challans/${c.id}`} className="ledger-tag hover:border-brand-400 hover:text-brand-600">
                      {c.challanNumber}
                    </Link>
                  </td>
                  <td className="py-2"><StatusChip value={c.status} /></td>
                  <td className="py-2">{c.totalQuantity}</td>
                  <td className="py-2 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-400">No sales challans for this customer yet.</p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd className={`text-right text-ink ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
