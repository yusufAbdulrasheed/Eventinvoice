import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getPublicInvoice, createCheckoutSession } from "../utils/publicApi";
import { formatCurrency, formatDate, STATUS_LABELS, STATUS_CLASS } from "../utils/format";
import Icon from "../components/Icon";

// Paystack redirects the browser back here after checkout with a `reference`
// query param. That's just a hint to re-check — the invoice's own `status`
// (set only by the server-verified webhook) is the actual source of truth.
const POLL_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 2000;

export default function PublicInvoice() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const returningFromCheckout = searchParams.has("reference") || searchParams.has("trxref");

  const [invoice, setInvoice]   = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [paying, setPaying]     = useState(false);
  const [error, setError]       = useState("");
  const [confirming, setConfirming] = useState(returningFromCheckout);
  const [downloading, setDownloading] = useState(false);
  const paperRef = useRef(null);

  const fetchInvoice = useCallback(async () => {
    try {
      const { data } = await getPublicInvoice(token);
      setInvoice(data);
      return data;
    } catch {
      setNotFound(true);
      return null;
    }
  }, [token]);

  useEffect(() => {
    fetchInvoice().finally(() => setLoading(false));
  }, [fetchInvoice]);

  useEffect(() => {
    if (!returningFromCheckout) return;

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      const data = await fetchInvoice();
      if (data?.status === "paid" || attempts >= POLL_ATTEMPTS) {
        clearInterval(interval);
        setConfirming(false);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [returningFromCheckout, fetchInvoice]);

  const handleDownloadPdf = async () => {
    if (!paperRef.current) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(paperRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
      pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
    } catch {
      setError("Couldn't generate the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePay = async () => {
    setError("");
    setPaying(true);
    try {
      const { data } = await createCheckoutSession(token);
      window.location.href = data.url;
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't start payment. Please try again.");
      setPaying(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background p-margin-desktop"><p className="loading-state">Loading…</p></div>;
  }

  if (notFound || !invoice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <h1 className="font-headline-sm text-headline-sm text-primary mb-2">Invoice not found</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">This payment link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const showPay = invoice.status !== "paid" && invoice.payable;

  return (
    <div className="min-h-screen bg-background">
      <header className="glass-panel flex items-center justify-between px-margin-mobile md:px-margin-desktop h-16">
        <span className="flex items-center gap-2">
          <img src="/logo.jpg" alt="Generous Event" className="w-9 h-9 rounded object-cover" />
          <span className="brand-mark">Generous <span className="accent">Event</span></span>
        </span>
        <span className="flex items-center gap-1.5 font-body-md text-sm text-on-surface-variant"><Icon name="lock" size={16} />Secure Checkout</span>
      </header>

      <div className="max-w-container-max mx-auto p-margin-mobile md:p-margin-desktop grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
        <div className="card overflow-hidden relative" ref={paperRef}>
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-secondary" />
          <div className="flex flex-wrap justify-between items-start gap-4 mb-6 mt-2">
            <div>
              <h1 className="font-headline-sm text-headline-sm text-primary">Invoice {invoice.invoiceNumber}</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                Issued {formatDate(invoice.issueDate)} · Due {formatDate(invoice.dueDate)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`badge ${STATUS_CLASS[invoice.status]}`}>{STATUS_LABELS[invoice.status]}</span>
              <button className="btn btn-outline py-1.5! px-3! text-sm" onClick={handleDownloadPdf} disabled={downloading} data-html2canvas-ignore="true">
                <Icon name="download" size={16} />
                {downloading ? "Preparing…" : "Download PDF"}
              </button>
            </div>
          </div>

          {invoice.status === "paid" && (
            <div className="flex items-center gap-2 bg-secondary-fixed text-on-secondary-fixed-variant rounded-lg px-4 py-3 mb-6 font-body-md text-sm">
              <Icon name="check_circle" size={18} filled />
              Paid{invoice.paidAt ? ` on ${formatDate(invoice.paidAt)}` : ""}. Thank you!
            </div>
          )}

          {invoice.status !== "paid" && confirming && (
            <div className="flex items-center gap-2 bg-tertiary-fixed text-on-tertiary-fixed rounded-lg px-4 py-3 mb-6 font-body-md text-sm">
              <Icon name="hourglass_top" size={18} />
              Confirming your payment — this can take a few seconds…
            </div>
          )}

          {error && (
            <div className="auth-error mb-6 flex items-center gap-2">
              <Icon name="error" size={18} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 pb-8 border-b border-outline-variant">
            <div>
              <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">From</span>
              <p className="text-primary font-semibold">{invoice.from?.name}</p>
              <p className="text-on-surface-variant text-sm">{invoice.from?.email}</p>
              <p className="text-on-surface-variant text-sm">RC: 9038826</p>
            </div>
            <div>
              <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Bill to</span>
              <p className="text-primary font-semibold">{invoice.client?.name}</p>
              {invoice.client?.company && <p className="text-on-surface-variant text-sm">{invoice.client.company}</p>}
              <p className="text-on-surface-variant text-sm">{invoice.client?.email}</p>
            </div>
            <div>
              <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Issue date</span>
              <p className="text-on-surface mb-2">{formatDate(invoice.issueDate)}</p>
              <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Due date</span>
              <p className="text-on-surface">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          <div className="table-scroll mb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-y border-outline-variant/50">
                  <th className="font-label-caps text-label-caps text-on-surface-variant uppercase py-3 px-4">Description</th>
                  <th className="font-label-caps text-label-caps text-on-surface-variant uppercase py-3 px-4 text-right">Qty</th>
                  <th className="font-label-caps text-label-caps text-on-surface-variant uppercase py-3 px-4 text-right">Rate</th>
                  <th className="font-label-caps text-label-caps text-on-surface-variant uppercase py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md">
                {invoice.lineItems.map((item, i) => (
                  <tr key={i} className="border-b border-outline-variant/40">
                    <td className="py-3 px-4 text-primary font-medium">{item.description}</td>
                    <td className="py-3 px-4 text-right text-on-surface-variant">{item.quantity}</td>
                    <td className="py-3 px-4 text-right text-on-surface-variant">{formatCurrency(item.rate, invoice.currency)}</td>
                    <td className="py-3 px-4 text-right font-medium text-primary">{formatCurrency(item.amount, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-6">
            <div className="w-full sm:w-72 space-y-2">
              <div className="flex justify-between font-body-md text-on-surface-variant"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal, invoice.currency)}</span></div>
              <div className="flex justify-between font-body-md text-on-surface-variant pb-2 border-b border-outline-variant"><span>Tax ({invoice.taxRate}%)</span><span>{formatCurrency(invoice.taxAmount, invoice.currency)}</span></div>
              <div className="flex justify-between font-headline-sm text-headline-sm text-primary pt-1"><span>Total</span><span>{formatCurrency(invoice.total, invoice.currency)}</span></div>
            </div>
          </div>

          {invoice.from?.bankDetails?.accountNumber && (
            <div className="pt-6 border-t border-outline-variant">
              <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Pay by Bank Transfer</span>
              <p className="font-body-md text-body-md text-on-surface-variant">{invoice.from.bankDetails.bankName}</p>
              <p className="font-body-md text-body-md text-on-surface-variant">{invoice.from.bankDetails.accountName}</p>
              <p className="font-body-md text-body-md text-on-surface-variant">{invoice.from.bankDetails.accountNumber}</p>
            </div>
          )}

          {invoice.notes && (
            <div className="pt-6 border-t border-outline-variant">
              <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Notes</span>
              <p className="font-body-md text-body-md text-on-surface-variant">{invoice.notes}</p>
            </div>
          )}
        </div>

        {showPay && (
          <aside className="space-y-6">
            <div className="card">
              <h2 className="font-title-lg text-title-lg text-primary flex items-center gap-2 mb-4">
                <Icon name="shopping_cart" size={18} />
                Order Summary
              </h2>
              <div className="flex justify-between font-body-md text-body-md text-on-surface-variant mb-3">
                <span>Invoice {invoice.invoiceNumber}</span>
                <span>{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
              <div className="flex justify-between font-headline-sm text-headline-sm text-primary pt-3 border-t border-outline-variant">
                <span>Total Due</span>
                <span>{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
              <p className="font-body-md text-sm text-on-surface-variant mt-3">Billed once. Paid via Paystack.</p>
            </div>

            <div className="card">
              <h2 className="font-title-lg text-title-lg text-primary flex items-center gap-2 mb-4">
                <Icon name="credit_card" size={18} />
                Payment Details
              </h2>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePay();
                }}
              >
                <div className="form-group">
                  <label className="form-label">Name on Card</label>
                  <input className="form-input" type="text" placeholder="Jane Doe" autoComplete="off" />
                </div>

                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <div className="relative">
                    <Icon name="credit_card" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input className="form-input pl-11" type="text" placeholder="0000 0000 0000 0000" autoComplete="off" inputMode="numeric" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <input className="form-input" type="text" placeholder="MM/YY" autoComplete="off" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVV</label>
                    <input className="form-input" type="text" placeholder="123" autoComplete="off" inputMode="numeric" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Billing Zip / Postal Code</label>
                  <input className="form-input" type="text" placeholder="90210" autoComplete="off" />
                </div>

                <div className="flex gap-3 bg-surface-container-low rounded-lg p-3">
                  <Icon name="verified_user" size={20} className="text-secondary shrink-0" />
                  <p className="font-body-md text-sm text-on-surface-variant">Your payment is encrypted and securely processed by Paystack, our PCI DSS-compliant payment partner — this form never sends your card details to Generous Event.</p>
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={paying}>
                  <Icon name="lock_open" size={18} />
                  {paying ? "Redirecting…" : `Complete Purchase — ${formatCurrency(invoice.total, invoice.currency)}`}
                </button>

                <div className="flex justify-center gap-6 font-body-md text-sm text-on-surface-variant">
                  <span className="flex items-center gap-1"><Icon name="shield" size={14} />Secure Payment</span>
                  <span className="flex items-center gap-1"><Icon name="verified" size={14} />Powered by Paystack</span>
                </div>
              </form>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
