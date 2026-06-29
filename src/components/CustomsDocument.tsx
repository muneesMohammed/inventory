import React from "react";
import { X, CheckCircle, Shield, Printer, Download, Eye, FileText } from "lucide-react";
import { Declaration, Product } from "../types";

interface CustomsDocumentProps {
  declaration: Declaration;
  product?: Product;
  onClose: () => void;
}

export default function CustomsDocument({ declaration, product, onClose }: CustomsDocumentProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" }).format(val);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header toolbar */}
        <div className="bg-slate-950 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-500" />
            <span className="font-display font-semibold tracking-wide">DUBAI CUSTOMS - BILL OF ENTRY</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.print()}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
              title="Print Document"
            >
              <Printer className="h-4.5 w-4.5" />
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* The Official Document Sheet */}
        <div className="p-8 font-sans bg-white text-slate-800" id="dubai-customs-boe">
          
          {/* Dubai Customs Letterhead */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-950 font-display">GOVERNMENT OF DUBAI</h1>
              <h2 className="text-lg font-bold text-slate-800 font-display">DUBAI CUSTOMS</h2>
              <p className="text-xs text-slate-500 mt-1 font-mono">Free Zone Bonded Warehousing Division</p>
              <p className="text-xs text-slate-400 font-mono">Port & Customs Authority - UAE</p>
            </div>
            
            <div className="text-right flex flex-col items-end">
              {/* Barcode representation */}
              <div className="bg-slate-100 p-2 border border-slate-300 rounded mb-1">
                <div className="h-8 w-44 bg-repeating-linear bg-[linear-gradient(90deg,#000,#000_2px,transparent_2px,transparent_5px)]" />
                <div className="text-[10px] font-mono tracking-widest text-center mt-1">{declaration.referenceNumber}</div>
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Filing Date: <span className="font-semibold text-slate-800">{declaration.date}</span>
              </div>
            </div>
          </div>

          {/* Core metadata rows */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6 text-xs font-mono">
            <div>
              <span className="text-slate-400 block uppercase text-[10px]">Declaration ID</span>
              <span className="text-slate-900 font-bold">{declaration.id}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase text-[10px]">Customs Type</span>
              <span className={`font-bold ${
                declaration.type === "IMPORT" ? "text-emerald-600" : 
                declaration.type === "EXPORT" ? "text-blue-600" : "text-amber-600"
              }`}>
                {declaration.type === "IMPORT" ? "Inbound Free Zone" : 
                 declaration.type === "EXPORT" ? "Re-Export Outbound" : "Mainland Entry"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase text-[10px]">Processing Office</span>
              <span className="text-slate-800 font-medium">{declaration.customsOffice}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase text-[10px]">Declaration Status</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                <CheckCircle className="h-3 w-3" /> APPROVED
              </span>
            </div>
          </div>

          {/* Importer / Exporter Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-xs">
            <div className="p-4 border border-slate-100 rounded-lg bg-slate-50/50">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5 mb-2">
                Declarant (Free Zone Licensee)
              </h3>
              <p className="font-semibold text-slate-800">AL-SHARQ LOGISTICS GLOBAL FZCO</p>
              <p className="text-slate-500 mt-1">Warehouse Gate 4, JAFZA North, Dubai, UAE</p>
              <p className="text-slate-400 mt-0.5 font-mono">FZ License No: FZ-89240-DXB</p>
            </div>
            
            <div className="p-4 border border-slate-100 rounded-lg bg-slate-50/50">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5 mb-2">
                Carrier & Shipping Details
              </h3>
              <p className="font-medium text-slate-800">
                <span className="text-slate-400">Carrier:</span> {declaration.carrierName}
              </p>
              <p className="text-slate-800 mt-0.5">
                <span className="text-slate-400">{declaration.type === "IMPORT" ? "Origin Port:" : "Destination:"}</span>{" "}
                <span className="font-semibold">{declaration.destinationOrSource}</span>
              </p>
              <p className="text-slate-400 mt-1 font-mono">Port Ingress Code: DXB-TER-2</p>
            </div>
          </div>

          {/* Itemized Cargo Declaration */}
          <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px] font-mono">
                  <th className="py-2.5 px-4">HS Code / SKU</th>
                  <th className="py-2.5 px-4">Product & Customs Description</th>
                  <th className="py-2.5 px-4 text-center">Qty / UOM</th>
                  <th className="py-2.5 px-4 text-right">Declared Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900 leading-normal">
                    {declaration.hsCode}
                    <span className="block font-normal text-slate-500 text-[10px] mt-0.5">SKU: {declaration.sku}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 max-w-sm font-sans leading-relaxed">
                    <span className="font-bold text-slate-900 block">{declaration.productName}</span>
                    <span className="text-xs text-slate-500 mt-0.5 block italic line-clamp-2">
                      {product?.description || "Bonded free-zone commodity storage transaction record."}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900 font-semibold">
                    {declaration.quantity.toLocaleString()}
                    <span className="block font-normal text-slate-500 text-[10px] mt-0.5">{product?.uom || "PCS"}</span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-950 font-bold">
                    {formatCurrency(declaration.valueAED)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tariffs and Customs Duty Calculation Table */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col md:flex-row justify-between gap-6 text-xs font-mono">
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 mb-2 uppercase text-[10px] tracking-wide">
                Duty Exemption & Bond Registry
              </h4>
              <div className="space-y-1.5 text-slate-600 text-[11px] leading-relaxed">
                {declaration.type === "IMPORT" && (
                  <p className="text-emerald-700 font-sans">
                    ✓ <strong>Bonded Storage Protocol:</strong> Goods are imported into the Dubai Free Zone Bonded Warehousing Network. All UAE Customs Tariffs and VAT are fully deferred under FZ bonded guarantees.
                  </p>
                )}
                {declaration.type === "EXPORT" && (
                  <p className="text-blue-700 font-sans">
                    ✓ <strong>Re-Export Exemption:</strong> Outbound shipment from Bonded Warehouse directly to international port of discharge. Duty is completely waived (0% levy) under customs exit verification.
                  </p>
                )}
                {declaration.type === "MAINLAND_IMPORT" && (
                  <p className="text-amber-800 font-sans">
                    ⚠ <strong>Domestic Cleared Protocol:</strong> Bond withdrawal for UAE Mainland commercial distribution. Subject to GCC Common Customs Tariffs and Federal Tax Authority (FTA) domestic VAT filing.
                  </p>
                )}
                <p className="text-slate-400 text-[10px] mt-1 font-mono">GCC Tariff Regulation Reference: Book V Chapter III</p>
              </div>
            </div>

            <div className="w-full md:w-64 space-y-2 text-right self-end border-t md:border-t-0 pt-4 md:pt-0">
              <div className="flex justify-between text-slate-500">
                <span>Assessable Value:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(declaration.valueAED)}</span>
              </div>
              
              <div className="flex justify-between text-slate-500">
                <span>Customs Duty ({product ? (product.dutyRate * 100) : 5}%):</span>
                <span className="font-semibold text-slate-900">
                  {declaration.type === "MAINLAND_IMPORT" ? formatCurrency(declaration.dutyPaidAED) : "AED 0.00 (Exempt)"}
                </span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Value Added Tax (5%):</span>
                <span className="font-semibold text-slate-900">
                  {declaration.type === "MAINLAND_IMPORT" ? formatCurrency(declaration.vatPaidAED) : "AED 0.00 (Exempt)"}
                </span>
              </div>

              <div className="border-t border-slate-300 my-2 pt-2 flex justify-between text-slate-950 font-bold text-sm">
                <span>Total Fees Paid:</span>
                <span className="text-slate-900">
                  {declaration.type === "MAINLAND_IMPORT" 
                    ? formatCurrency(declaration.dutyPaidAED + declaration.vatPaidAED) 
                    : "AED 0.00"}
                </span>
              </div>
            </div>
          </div>

          {/* Legal / Authority Signatures & Seals */}
          <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-[10px] text-center font-mono">
            <div>
              <div className="h-12 flex items-center justify-center italic text-slate-400">
                Electronically Audited
              </div>
              <div className="border-t border-slate-300 pt-1 text-slate-500 uppercase">
                Dubai Customs Audit
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              {/* Simulated Circular Stamp */}
              <div className="h-14 w-14 rounded-full border-2 border-dashed border-emerald-600 flex flex-col items-center justify-center text-emerald-600 font-bold text-[8px] rotate-12 p-1 leading-tight">
                <span className="tracking-widest">DUBAI</span>
                <span>CUSTOMS</span>
                <span className="bg-emerald-100 px-1 rounded text-[7px] mt-0.5">PASSED</span>
              </div>
            </div>

            <div>
              <div className="h-12 flex items-center justify-center font-mono font-bold text-slate-700">
                AL-SHARQ FZCO
              </div>
              <div className="border-t border-slate-300 pt-1 text-slate-500 uppercase">
                Authorized Licensee
              </div>
            </div>
          </div>

        </div>

        {/* Footer toolbar */}
        <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t border-slate-200">
          <span className="text-[11px] text-slate-400 font-mono">
            Reference Verification Hash: SHA256:{declaration.referenceNumber.replace(/-/g, "")}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-sm"
          >
            Close Document
          </button>
        </div>

      </div>
    </div>
  );
}
