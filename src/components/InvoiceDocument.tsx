import React from "react";
import { X, Printer, ShieldCheck, Download, Calendar, Landmark, FileText } from "lucide-react";
import { Invoice, InvoiceSettings } from "../types";

interface InvoiceDocumentProps {
  invoice: Invoice;
  onClose: () => void;
  settings: InvoiceSettings;
}

export default function InvoiceDocument({ invoice, onClose, settings }: InvoiceDocumentProps) {
  const formatAED = (num: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(num);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden my-8 animate-in zoom-in-95 duration-150 print:border-none print:shadow-none print:my-0">
        
        {/* Modal Controls Bar - Hidden in Print */}
        <div className="bg-slate-950 text-white px-6 py-4 flex justify-between items-center border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-500" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
              Tax Invoice Document Viewer
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>

        {/* Invoice Printable Area */}
        <div className="p-8 md:p-12 overflow-y-auto flex-1 bg-white text-slate-800 font-sans print:p-0">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-900 pb-8">
            <div>
              {/* Logo / Brand */}
              <div className="flex items-center gap-2.5">
                <div className="bg-slate-900 p-2 rounded-lg text-amber-500">
                  <Landmark className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="font-sans font-extrabold text-base tracking-wide text-slate-900 leading-tight uppercase">
                    {settings.companyName || "AL-SHARQ LOGISTICS FZCO"}
                  </h1>
                  <span className="text-[10px] text-slate-500 font-mono tracking-wider block mt-0.5">
                    {settings.companySubtitle || "DUBAI FREE ZONE AUTHORITY • BONDED WAREHOUSE"}
                  </span>
                </div>
              </div>
              <div className="mt-4 text-xs space-y-0.5 text-slate-500 font-mono">
                {settings.addressLines && settings.addressLines.length > 0 ? (
                  settings.addressLines.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))
                ) : (
                  <>
                    <div>Plot 482, Logistics City, Jebel Ali Free Zone</div>
                    <div>PO Box 99201, Dubai, United Arab Emirates</div>
                    <div>TRN: 100428819400003 (Standard 5% VAT Registered)</div>
                    <div>Email: finance@alsharqfzco.ae | Tel: +971 4 800 WAREHOUSE</div>
                  </>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right sm:self-stretch flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-extrabold tracking-widest text-slate-900 uppercase">
                  {invoice.type === "SALES" ? "TAX INVOICE" : "PURCHASE INVOICE"}
                </h2>
                <div className="text-xs font-mono font-bold text-amber-600 mt-1">{invoice.id}</div>
              </div>
              <div className="mt-4 sm:mt-0 text-xs space-y-1 font-mono text-slate-600">
                <div>
                  <strong>Issue Date:</strong> {invoice.date}
                </div>
                <div>
                  <strong>Reference:</strong> {invoice.referenceNumber}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      invoice.status === "PAID"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Billing / Consignee Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                {invoice.type === "SALES" ? "Bill To / Customer" : "Bill From / Supplier"}
              </span>
              <div className="mt-2">
                <h3 className="font-extrabold text-slate-900 text-sm">{invoice.clientOrSupplierName}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed font-mono">
                  {invoice.type === "SALES" ? (
                    <>
                      Authorized Regional Mainland Distributor<br />
                      Dubai Business Bay, Level 14, Tower A<br />
                      Dubai, UAE | TRN: 100293849100003
                    </>
                  ) : (
                    <>
                      International Semiconductor Supply Corp<br />
                      Seongdong-gu, Logistics Gate 3A<br />
                      Seoul, South Korea | Global Export Lic: KR-992-B
                    </>
                  )}
                </p>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Bonded Logistics Details
              </span>
              <div className="mt-2 text-xs font-mono text-slate-600 space-y-1">
                <div><strong>Customs Status:</strong> Bonded Free-Zone Release</div>
                <div><strong>Storage Terminal:</strong> JAFZA Cargo Terminal 2</div>
                <div><strong>Payment Terms:</strong> Net 30 Days (Direct Bank Transfer)</div>
                <div><strong>Currency:</strong> United Arab Emirates Dirham (AED)</div>
              </div>
            </div>
          </div>

          {/* Table of Items */}
          <div className="py-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  <th className="py-2.5 w-12 text-center">#</th>
                  <th className="py-2.5">Item Description & SKU</th>
                  <th className="py-2.5 text-right w-24">Unit Price</th>
                  <th className="py-2.5 text-center w-20">Qty</th>
                  <th className="py-2.5 text-right w-24">Subtotal</th>
                  <th className="py-2.5 text-right w-20">VAT (5%)</th>
                  <th className="py-2.5 text-right w-28">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="font-mono">
                    <td className="py-3.5 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-3.5">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.sku}</div>
                    </td>
                    <td className="py-3.5 text-right">{formatAED(item.priceAED)}</td>
                    <td className="py-3.5 text-center">{item.quantity}</td>
                    <td className="py-3.5 text-right">{formatAED(item.priceAED * item.quantity)}</td>
                    <td className="py-3.5 text-right text-slate-500">
                      {item.vatAED > 0 ? formatAED(item.vatAED) : "0.00 (Exempt)"}
                    </td>
                    <td className="py-3.5 text-right font-bold text-slate-900">
                      {formatAED(item.totalAED)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-200">
            <div className="text-xs text-slate-500 font-mono leading-relaxed bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
              <span className="font-bold text-[10px] text-slate-400 block uppercase tracking-widest mb-1.5">
                Official Declaration
              </span>
              {settings.officialDeclaration || "These commodities are stored, sold, or replenished under the Jebel Ali Free Zone Bonded Warehouse provisions. Inbound purchases are subject to customs duty suspension. Outbound sales to mainland UAE are subject to 5% VAT and 5% custom tariffs upon clearance at Mainland Gate 4."}
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Value:</span>
                <span>{formatAED(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Value-Added Tax (5% VAT):</span>
                <span>{formatAED(invoice.totalTax)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Customs Duties (Bond Suspended):</span>
                <span>{formatAED(0)}</span>
              </div>
              <div className="h-px bg-slate-200 my-2" />
              <div className="flex justify-between text-base font-extrabold text-slate-950">
                <span>Total Invoice Value:</span>
                <span>{formatAED(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Signatures & Stamps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-12 mt-12 border-t border-slate-100">
            <div className="flex flex-col justify-end text-center h-28 border border-dashed border-slate-200 rounded-xl p-4 relative bg-slate-50/50">
              <div className="absolute top-2 left-2 font-mono text-[8px] text-slate-400 uppercase tracking-widest">
                Port Auditor Digital Stamp
              </div>
              <div className="flex justify-center mb-1">
                <ShieldCheck className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Dubai Trade Verified
              </div>
              <div className="text-[8px] text-slate-400 font-mono">REF ID: {invoice.id}</div>
            </div>

            <div className="flex flex-col justify-end text-center h-28 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="text-[10px] font-bold text-slate-800">
                {settings.signatureName || "M. Al-Maktoum"}
              </div>
              <div className="text-[8px] text-slate-400 font-mono mt-0.5">
                {settings.signatureDesignation || "Finance Director, Al-Sharq FZCO"}
              </div>
              <div className="border-t border-slate-300 mt-3 pt-1.5 text-[9px] text-slate-400 font-mono">
                Authorized Electronic Signature
              </div>
            </div>
          </div>
        </div>

        {/* Footer info bar - Hidden in Print */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-[10px] font-mono text-slate-500 text-center flex justify-between items-center print:hidden shrink-0">
          <span>Printed on: {new Date().toISOString().substring(0, 10)}</span>
          <span>{settings.bottomComplianceNote || "UAE TAX LAW COMPLIANT TAX-INVOICE V2"}</span>
        </div>

      </div>
    </div>
  );
}
