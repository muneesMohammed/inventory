export interface Product {
  sku: string;
  name: string;
  description: string;
  hsCode: string;
  category: string;
  dutyRate: number; // e.g. 0.05 for 5%
  valueAED: number;
  stockLevel: number;
  uom: string;
  originCountry: string;
  regulatoryBody: string;
  warehouseLocation?: string; // e.g. "Zone A - Row 12 - Shelf 3"
  minStockThreshold?: number;  // Low stock warning threshold
}

export interface StockLog {
  id: string;
  sku: string;
  productName: string;
  type: "INBOUND" | "OUTBOUND" | "ADJUSTMENT_ADD" | "ADJUSTMENT_SUB" | "DAMAGE" | "RECONCILIATION";
  quantity: number;
  prevStock: number;
  newStock: number;
  date: string; // YYYY-MM-DD HH:MM
  notes: string;
  operator?: string;
}

export interface Declaration {
  id: string;
  type: "IMPORT" | "EXPORT" | "MAINLAND_IMPORT";
  date: string; // YYYY-MM-DD
  sku: string;
  productName: string;
  hsCode: string;
  quantity: number;
  valueAED: number;
  dutyPaidAED: number;
  vatPaidAED: number;
  status: "APPROVED" | "PENDING" | "INSPECTING" | "REJECTED";
  referenceNumber: string;
  customsOffice: string;
  carrierName: string;
  destinationOrSource: string;
}

export interface InvoiceItem {
  sku: string;
  productName: string;
  quantity: number;
  priceAED: number;
  vatAED: number;
  dutyAED: number;
  totalAED: number;
}

export interface Invoice {
  id: string;
  type: "SALES" | "PURCHASE";
  date: string;
  clientOrSupplierName: string;
  items: InvoiceItem[];
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  referenceNumber: string;
  status: "PAID" | "PENDING";
}

export interface InvoiceSettings {
  companyName: string;
  companySubtitle: string;
  addressLines: string[];
  officialDeclaration: string;
  bottomComplianceNote: string;
  signatureName: string;
  signatureDesignation: string;
}

export interface AnalyticsData {
  aggregates: {
    totalTradeVolume: number;
    stockValuationAED: number;
    totalImportValue: number;
    totalExportValue: number;
    totalMainlandImportValue: number;
    totalDutyPaid: number;
    totalVatPaid: number;
    totalDutySavedAED: number;
    totalDeclarations: number;
  };
  trends: Array<{
    month: string;
    imports: number;
    exports: number;
    mainland: number;
  }>;
  destinationBreakdown: Array<{
    name: string;
    value: number;
  }>;
  categoryBreakdown: Array<{
    name: string;
    value: number;
  }>;
}

export interface AICallResult {
  hsCode: string;
  hsDescription: string;
  customsDescription: string;
  dutyRate: number;
  regulatoryRequirement: "TDRA" | "Dubai Municipality" | "MOHAP" | "None";
  regulatoryNotes: string;
  freeZoneHandlingNotes: string;
}
