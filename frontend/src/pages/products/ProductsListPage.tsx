import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { productApi } from "../../api/endpoints";
import { getErrorMessage } from "../../api/client";
import { Product } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { EmptyState, ErrorBanner } from "../../components/Banner";

export default function ProductsListPage() {
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "WAREHOUSE";
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get("lowStockOnly") === "true");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await productApi.list({ search: search || undefined, lowStockOnly: lowStockOnly || undefined, page: 1 });
      setProducts(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, lowStockOnly]);

  useEffect(() => {
    setSearchParams(lowStockOnly ? { lowStockOnly: "true" } : {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowStockOnly]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Products &amp; Stock</h1>
          <p className="text-sm text-slate-500">Catalogue, pricing and live stock levels.</p>
        </div>
        {canManage && (
          <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Close" : "Add product"}
          </button>
        )}
      </div>

      {showForm && <NewProductForm onCreated={() => { setShowForm(false); load(); }} />}
      {adjustingProduct && (
        <StockAdjustForm
          product={adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          onSaved={() => { setAdjustingProduct(null); load(); }}
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="field-input max-w-xs"
          placeholder="Search name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
          Low stock only
        </label>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="card overflow-hidden">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">Loading products...</p>
        ) : products.length === 0 ? (
          <EmptyState title="No products found" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Unit price</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Location</th>
                {canManage && <th className="px-5 py-3 font-medium"></th>}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const low = p.currentStock <= p.minStockQty;
                return (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-medium text-ink">{p.name}</td>
                    <td className="px-5 py-3">
                      <span className="ledger-tag">{p.sku}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{p.category ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-600">₹{Number(p.unitPrice).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3">
                      <span className={low ? "font-semibold text-amber-600" : "text-ink"}>{p.currentStock}</span>
                      <span className="ml-1 text-xs text-slate-400">/ min {p.minStockQty}</span>
                      {low && <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">Low</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{p.location ?? "—"}</td>
                    {canManage && (
                      <td className="px-5 py-3 text-right">
                        <button className="btn-secondary" onClick={() => setAdjustingProduct(p)}>
                          Adjust stock
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function NewProductForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    unitPrice: "",
    currentStock: "0",
    minStockQty: "0",
    location: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await productApi.create({
        ...form,
        unitPrice: form.unitPrice as any,
        currentStock: Number(form.currentStock) as any,
        minStockQty: Number(form.minStockQty) as any,
      });
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="field-label">Product name *</label>
          <input required className="field-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="field-label">SKU / code *</label>
          <input required className="field-input font-mono" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Category</label>
          <input className="field-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Unit price (₹) *</label>
          <input required type="number" step="0.01" min="0" className="field-input" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Opening stock</label>
          <input type="number" min="0" className="field-input" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Minimum stock alert</label>
          <input type="number" min="0" className="field-input" value={form.minStockQty} onChange={(e) => setForm({ ...form, minStockQty: e.target.value })} />
        </div>
        <div className="sm:col-span-3">
          <label className="field-label">Warehouse / location</label>
          <input className="field-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
      </div>
      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? "Saving..." : "Save product"}
      </button>
    </form>
  );
}

function StockAdjustForm({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const [quantity, setQuantity] = useState("1");
  const [movementType, setMovementType] = useState<"IN" | "OUT">("IN");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await productApi.recordMovement(product.id, { quantity: Number(quantity), movementType, reason });
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-ink">
          Adjust stock — {product.name} <span className="ledger-tag ml-1">{product.sku}</span>
        </h3>
        <button type="button" onClick={onClose} className="text-xs text-slate-400 hover:text-ink">
          Cancel
        </button>
      </div>
      {error && <ErrorBanner message={error} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="field-label">Movement</label>
          <select className="field-input" value={movementType} onChange={(e) => setMovementType(e.target.value as "IN" | "OUT")}>
            <option value="IN">Stock IN (received)</option>
            <option value="OUT">Stock OUT (removed)</option>
          </select>
        </div>
        <div>
          <label className="field-label">Quantity *</label>
          <input required type="number" min="1" className="field-input" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div>
          <label className="field-label">Reason *</label>
          <input required className="field-input" placeholder="e.g. New shipment received" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </div>
      <p className="text-xs text-slate-400">Current stock: {product.currentStock}</p>
      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? "Saving..." : "Record movement"}
      </button>
    </form>
  );
}
