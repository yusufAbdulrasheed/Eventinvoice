import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getInvoice, sendInvoiceEmail } from "../utils/invoiceApi";
import { formatCurrency, formatDate, STATUS_LABELS, STATUS_CLASS } from "../utils/format";
import Icon from "../components/Icon";

export default function InvoicePreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null); // { ok: bool, message: string }
  const paperRef = useRef(null);

  useEffect(() => {
    getInvoice(id)
      .then(({ data }) => setInvoice(data))
      .catch(() => navigate("/invoices"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    if (!paperRef.current) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
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

  const handleSendEmail = async () => {
    setSending(true);
    setSendResult(null);
    try {
      const { data } = await sendInvoiceEmail(id);
      setSendResult({ ok: true, message: data.message });
      setInvoice((prev) => (prev.status === "draft" ? { ...prev, status: "sent" } : prev));
    } catch (err) {
      setSendResult({ ok: false, message: err.response?.data?.message || "Couldn't send the email." });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background p-margin-desktop"><p className="loading-state">Loading…</p></div>;
  if (!invoice) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-outline-variant/50 px-margin-mobile md:px-margin-desktop py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/invoices" className="text-on-surface-variant hover:text-primary transition-colors p-2 -ml-2 rounded-full hover:bg-surface-container">
            <Icon name="arrow_back" size={20} />
          </Link>
          <div>
            <h2 className="font-title-lg text-title-lg text-primary">Invoice #{invoice.invoiceNumber}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">{invoice.client?.name}</p>
          </div>
          <span className={`badge ${STATUS_CLASS[invoice.status]}`}>{STATUS_LABELS[invoice.status]}</span>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <button className="btn btn-outline" onClick={handleSendEmail} disabled={sending}>
            <Icon name="mail" size={18} />
            {sending ? "Sending…" : "Send to Client"}
          </button>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Icon name="print" size={18} />
            Print
          </button>
          <button className="btn btn-primary" onClick={handleDownloadPdf} disabled={downloading}>
            <Icon name="download" size={18} />
            {downloading ? "Preparing…" : "Download PDF"}
          </button>
        </div>
      </div>

      {sendResult && (
        <div className={`print:hidden mx-margin-mobile md:mx-margin-desktop mt-4 rounded-lg px-4 py-3 font-body-md text-sm flex items-center gap-2 ${sendResult.ok ? "bg-secondary-fixed text-on-secondary-fixed-variant" : "auth-error"}`}>
          <Icon name={sendResult.ok ? "check_circle" : "error"} size={18} filled={sendResult.ok} />
          {sendResult.message}
        </div>
      )}
      {error && (
        <div className="print:hidden mx-margin-mobile md:mx-margin-desktop mt-4 auth-error flex items-center gap-2">
          <Icon name="error" size={18} />
          {error}
        </div>
      )}

      <div className="p-margin-mobile md:p-margin-desktop flex justify-center pb-24">
        <div ref={paperRef} className="w-full max-w-[800px] bg-surface-container-lowest rounded-lg overflow-hidden border border-outline-variant/30 shadow-[0_8px_24px_rgba(74,16,21,0.08)]">
          <div className="bg-primary text-on-primary p-8 md:p-12 flex flex-col sm:flex-row justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-on-primary p-1 flex items-center justify-center overflow-hidden shrink-0">
                  <img src="/logo.jpg" alt="Generous Event" className="w-full h-full object-cover rounded" />
                </div>
                <div>
                  <h2 className="font-display-lg-mobile text-display-lg-mobile tracking-tight">Generous Event</h2>
                  <p className="font-label-caps text-label-caps text-primary-fixed-dim mt-1">RC: 9038826</p>
                </div>
              </div>
              <div className="font-body-md text-primary-fixed-dim space-y-1">
                <p>{user?.name}</p>
                <p>{user?.email}</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <h3 className="font-label-caps text-label-caps text-primary-fixed uppercase mb-2">Invoice</h3>
              <p className="font-headline-md text-headline-md mb-6">#{invoice.invoiceNumber}</p>
              <div className="flex flex-col sm:items-end gap-1 font-body-md">
                <div className="flex gap-4 justify-between sm:justify-end w-full sm:w-auto">
                  <span className="text-primary-fixed-dim">Date Issued:</span>
                  <span>{formatDate(invoice.issueDate)}</span>
                </div>
                <div className="flex gap-4 justify-between sm:justify-end w-full sm:w-auto">
                  <span className="text-primary-fixed-dim">Due Date:</span>
                  <span className="font-bold text-secondary-container">{formatDate(invoice.dueDate)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
              <div>
                <h4 className="font-label-caps text-label-caps text-on-surface-variant border-b border-surface-variant pb-2 mb-4 uppercase">Bill To</h4>
                <p className="font-title-lg text-title-lg text-primary mb-1">{invoice.client?.name}</p>
                <div className="font-body-md text-on-surface-variant space-y-1">
                  {invoice.client?.company && <p>{invoice.client.company}</p>}
                  {invoice.client?.address?.street && <p>{invoice.client.address.street}</p>}
                  {(invoice.client?.address?.city || invoice.client?.address?.state) && (
                    <p>{[invoice.client.address.city, invoice.client.address.state].filter(Boolean).join(", ")}</p>
                  )}
                  <p className="mt-2 text-primary">{invoice.client?.email}</p>
                </div>
              </div>
              <div>
                <h4 className="font-label-caps text-label-caps text-on-surface-variant border-b border-surface-variant pb-2 mb-4 uppercase">Amount Due</h4>
                <p className="font-headline-md text-headline-md text-primary mb-2">{formatCurrency(invoice.total, invoice.currency)}</p>
                <span className={`badge ${STATUS_CLASS[invoice.status]}`}>{STATUS_LABELS[invoice.status]}</span>
              </div>
            </div>

            <div className="mb-12">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-surface-container-low border-y border-outline-variant/50">
                      <th className="py-3 px-4 font-label-caps text-label-caps text-on-surface-variant uppercase w-1/2">Description</th>
                      <th className="py-3 px-4 font-label-caps text-label-caps text-on-surface-variant uppercase text-right">Qty</th>
                      <th className="py-3 px-4 font-label-caps text-label-caps text-on-surface-variant uppercase text-right">Unit Price</th>
                      <th className="py-3 px-4 font-label-caps text-label-caps text-on-surface-variant uppercase text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md">
                    {invoice.lineItems.map((item, i) => (
                      <tr key={i} className="border-b border-surface-variant">
                        <td className="py-4 px-4 font-bold text-primary">{item.description}</td>
                        <td className="py-4 px-4 text-right text-on-surface-variant">{item.quantity}</td>
                        <td className="py-4 px-4 text-right text-on-surface-variant">{formatCurrency(item.rate, invoice.currency)}</td>
                        <td className="py-4 px-4 text-right font-medium text-primary">{formatCurrency(item.amount, invoice.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="w-full sm:w-80 space-y-3">
                <div className="flex justify-between font-body-md text-on-surface-variant">
                  <span>Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                <div className="flex justify-between font-body-md text-on-surface-variant pb-4 border-b border-surface-variant">
                  <span>Tax ({invoice.taxRate}%)</span>
                  <span>{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between items-end pt-2">
                  <span className="font-headline-sm text-headline-sm text-primary">Total</span>
                  <span className="font-headline-md text-headline-md text-primary">{formatCurrency(invoice.total, invoice.currency)}</span>
                </div>
              </div>
            </div>

            <div className="mt-16 pt-8 border-t border-outline-variant/30 text-sm text-on-surface-variant grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <h5 className="font-bold text-primary mb-2">Payment Details</h5>
                {user?.bankDetails?.accountNumber ? (
                  <div className="space-y-0.5">
                    <p>{user.bankDetails.bankName}</p>
                    <p>{user.bankDetails.accountName}</p>
                    <p>{user.bankDetails.accountNumber}</p>
                  </div>
                ) : (
                  <p>Add your bank details in Settings → Billing so they appear here.</p>
                )}
              </div>
              <div>
                <h5 className="font-bold text-primary mb-2">Notes</h5>
                <p>{invoice.notes || "—"}</p>
              </div>
            </div>
            <p className="text-center italic mt-8 text-on-surface-variant/70 font-display-lg-mobile text-lg">Thank you for choosing Generous Event.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
