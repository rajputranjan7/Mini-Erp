import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { challanApi, customerApi, productApi } from "../../api/endpoints";
import { getErrorMessage } from "../../api/client";
import { Customer, Product } from "../../types";
import { ErrorBanner } from "../../components/Banner";

interface Line {
  productId: string;
  quantity: number;
}

export default function NewChallanPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: 1 }]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState<"DRAFT" | "CONFIRMED" | null>(null);

  useEffect(() => {
    customerApi.list({ page: 1, pageSize: 200 } as any).then((r) => setCustomers(r.data)).catch(() => {});
    productApi.list({ page: 1, pageSize: 200 } as any).then((r) => setProducts(r.data)).catch(() => {});
  }, []);

  function productFor(id: string) {
    return products.find((p) => p.id === id);
  }

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { productId: "", quantity: 1 }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  const validLines = lines.filter((l) => l.productId && l.quantity > 0);
  const total = validLines.reduce((sum, l) => {
    const p = productFor(l.productId);
    return sum + (p ? Number(p.unitPrice) * l.quantity : 0);
  }, 0);

  async function handleSubmit(status: "DRAFT" | "CONFIRMED") {
    setError("");
    if (!customerId) {
      setError("Please select a customer");
      return;
    }
    if (validLines.length === 0) {
      setError("Add at least one product line");
      return;
    }
    setSubmitting(status);
    try {
      const challan = await challanApi.create({ customerId, items: validLines, status });
      navigate(`/challans/${challan.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">New sales challan</h1>
        <p className="text-sm text-slate-500">Select a customer, add products, then save as draft or confirm to dispatch.</p>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="card space-y-5 p-5">
        <div>
          <label className="field-label">Customer *</label>
          <select className="field-input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Select a customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.businessName ? `(${c.businessName})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="field-label mb-0">Products</label>
            <button type="button" onClick={addLine} className="text-xs font-medium text-brand-500 hover:underline">
              + Add line
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((line, i) => {
              const product = productFor(line.productId);
              const insufficient = product ? line.quantity > product.currentStock : false;
              return (
                <div key={i} className="flex items-start gap-3 rounded-md border border-slate-200 p-3">
                  <select
                    className="field-input"
                    value={line.productId}
                    onChange={(e) => updateLine(i, { productId: e.target.value })}
                  >
                    <option value="">Select product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.sku} (stock: {p.currentStock})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    className="field-input w-28"
                    value={line.quantity}
                    onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
                  />
                  <div className="w-28 pt-2 text-right text-sm text-slate-500">
                    {product ? `₹${(Number(product.unitPrice) * line.quantity).toLocaleString("en-IN")}` : "—"}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="pt-2 text-xs text-slate-400 hover:text-red-500"
                    disabled={lines.length === 1}
                  >
                    Remove
                  </button>
                  {insufficient && (
                    <p className="w-full text-xs text-red-500">Only {product?.currentStock} in stock — reduce quantity or this will fail on confirm.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">
            Total quantity: <span className="font-medium text-ink">{validLines.reduce((s, l) => s + l.quantity, 0)}</span>
            <span className="mx-2">·</span>
            Est. value: <span className="font-medium text-ink">₹{total.toLocaleString("en-IN")}</span>
          </p>
          <div className="flex gap-3">
            <button className="btn-secondary" disabled={!!submitting} onClick={() => handleSubmit("DRAFT")}>
              {submitting === "DRAFT" ? "Saving..." : "Save as draft"}
            </button>
            <button className="btn-primary" disabled={!!submitting} onClick={() => handleSubmit("CONFIRMED")}>
              {submitting === "CONFIRMED" ? "Confirming..." : "Save & confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
