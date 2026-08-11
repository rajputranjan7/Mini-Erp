import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { customerApi } from "../../api/endpoints";
import { getErrorMessage } from "../../api/client";
import { Customer, CustomerType } from "../../types";
import StatusChip from "../../components/StatusChip";
import { EmptyState, ErrorBanner } from "../../components/Banner";

const CUSTOMER_TYPES: CustomerType[] = ["RETAIL", "WHOLESALE", "DISTRIBUTOR"];

export default function CustomersListPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await customerApi.list({ search: search || undefined, status: status || undefined, page: 1 });
      setCustomers(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(load, 250); // debounce search
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Customers</h1>
          <p className="text-sm text-slate-500">Leads, wholesale buyers and distributors in one place.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Close" : "Add customer"}
        </button>
      </div>

      {showForm && <NewCustomerForm onCreated={() => { setShowForm(false); load(); }} />}

      <div className="flex flex-wrap gap-3">
        <input
          className="field-input max-w-xs"
          placeholder="Search name, mobile, business..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="field-input max-w-[160px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="card overflow-hidden">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">Loading customers...</p>
        ) : customers.length === 0 ? (
          <EmptyState title="No customers found" subtitle="Try clearing filters or add a new customer." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Business</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Mobile</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <Link to={`/customers/${c.id}`} className="font-medium text-ink hover:text-brand-500">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{c.businessName ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-500">{c.customerType}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">{c.mobile}</td>
                  <td className="px-5 py-3">
                    <StatusChip value={c.status} />
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function NewCustomerForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    businessName: "",
    gstNumber: "",
    customerType: "RETAIL" as CustomerType,
    address: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await customerApi.create(form);
      onCreated();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-5">
      {error && <ErrorBanner message={error} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Customer name *</label>
          <input required className="field-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Mobile *</label>
          <input required className="field-input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Email</label>
          <input type="email" className="field-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Business name</label>
          <input className="field-input" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
        </div>
        <div>
          <label className="field-label">GST number</label>
          <input className="field-input" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Customer type *</label>
          <select className="field-input" value={form.customerType} onChange={(e) => setForm({ ...form, customerType: e.target.value as CustomerType })}>
            {CUSTOMER_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Address</label>
          <input className="field-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Notes</label>
          <textarea className="field-input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </div>
      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? "Saving..." : "Save customer"}
      </button>
    </form>
  );
}
