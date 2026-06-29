import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Define Types
interface Product {
  sku: string;
  name: string;
  description: string;
  hsCode: string;
  category: string;
  dutyRate: number; // e.g. 0.05
  valueAED: number;
  stockLevel: number;
  uom: string;
  originCountry: string;
  regulatoryBody: string;
  warehouseLocation?: string;
  minStockThreshold?: number;
}

interface Declaration {
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

interface StockLog {
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

// In-memory Database
let products: Product[] = [
  {
    sku: "DXB-EL-AP101",
    name: "AeroPro Smart Core Processors",
    description: "High-frequency multi-core microprocessors for telemetry and edge computing applications, tray packaging.",
    hsCode: "8542.31.00",
    category: "Electronics",
    dutyRate: 0.05,
    valueAED: 1850,
    stockLevel: 1200,
    uom: "PCS",
    originCountry: "South Korea",
    regulatoryBody: "TDRA",
    warehouseLocation: "Zone A - Row 03 - Bin B1",
    minStockThreshold: 300
  },
  {
    sku: "DXB-LU-OW702",
    name: "Royal Oud Intense Blend Perfume",
    description: "Premium concentrated oriental Oud and Amber perfume oil blend, 100ml luxury glass bottling for retail.",
    hsCode: "3303.00.00",
    category: "Cosmetics",
    dutyRate: 0.05,
    valueAED: 450,
    stockLevel: 3100,
    uom: "PCS",
    originCountry: "UAE",
    regulatoryBody: "Dubai Municipality",
    warehouseLocation: "Zone B - Row 12 - Bin A4",
    minStockThreshold: 500
  },
  {
    sku: "DXB-FD-PST50",
    name: "Premium Roasted Pistachios (Salted)",
    description: "Extra large grade hand-picked roasted salted pistachios in 10kg bulk vacuum foil bags.",
    hsCode: "0802.52.00",
    category: "Foodstuffs",
    dutyRate: 0.00, // Food items often exempt or highly subsidized
    valueAED: 380,
    stockLevel: 15400,
    uom: "KGS",
    originCountry: "Iran",
    regulatoryBody: "Dubai Municipality",
    warehouseLocation: "Zone C (Cold) - Row 02 - Bin C8",
    minStockThreshold: 2000
  },
  {
    sku: "DXB-WT-CH44G",
    name: "Emirates Chrono 44mm Rose Gold",
    description: "Luxury automatic chronometer watch featuring 18k rose gold bezel, alligator leather strap.",
    hsCode: "9101.11.00",
    category: "Luxury Goods",
    dutyRate: 0.05,
    valueAED: 12500,
    stockLevel: 240,
    uom: "PCS",
    originCountry: "Switzerland",
    regulatoryBody: "None",
    warehouseLocation: "Vault 01 - Shelf A2",
    minStockThreshold: 50
  },
  {
    sku: "DXB-AU-BRK99",
    name: "Ceramic Compound Brake Pads Set",
    description: "High-performance sports brake pads set for premium SUV models, asbestos-free friction materials.",
    hsCode: "8708.30.00",
    category: "Auto Parts",
    dutyRate: 0.05,
    valueAED: 290,
    stockLevel: 4500,
    uom: "PCS",
    originCountry: "Germany",
    regulatoryBody: "None",
    warehouseLocation: "Zone D (Heavy) - Row 08 - Bin D12",
    minStockThreshold: 1000
  },
  {
    sku: "DXB-MD-INS88",
    name: "Smart Insulin Delivery Pods",
    description: "Wireless continuous insulin delivery pods, sterile medical equipment for healthcare providers.",
    hsCode: "9018.90.00",
    category: "Medical Equipment",
    dutyRate: 0.00, // Medical devices often exempt
    valueAED: 950,
    stockLevel: 850,
    uom: "PCS",
    originCountry: "USA",
    regulatoryBody: "MOHAP",
    warehouseLocation: "Zone E (Pharma) - Row 01 - Bin E03",
    minStockThreshold: 200
  }
];

let stockLogs: StockLog[] = [
  {
    id: "LOG-001",
    sku: "DXB-EL-AP101",
    productName: "AeroPro Smart Core Processors",
    type: "INBOUND",
    quantity: 2000,
    prevStock: 0,
    newStock: 2000,
    date: "2026-01-15 11:20",
    notes: "Customs Import Clearance (BOE-2026-003841-DXB)",
    operator: "Dubai Trade Gate"
  },
  {
    id: "LOG-002",
    sku: "DXB-EL-AP101",
    productName: "AeroPro Smart Core Processors",
    type: "OUTBOUND",
    quantity: 500,
    prevStock: 2000,
    newStock: 1500,
    date: "2026-01-20 14:45",
    notes: "Mainland Import Release (BOE-2026-004102-DXB)",
    operator: "Dubai Trade Gate"
  },
  {
    id: "LOG-003",
    sku: "DXB-FD-PST50",
    productName: "Premium Roasted Pistachios (Salted)",
    type: "INBOUND",
    quantity: 25000,
    prevStock: 0,
    newStock: 25000,
    date: "2026-02-05 09:30",
    notes: "Customs Import Clearance (BOE-2026-008920-DXB)",
    operator: "Dubai Trade Gate"
  },
  {
    id: "LOG-004",
    sku: "DXB-FD-PST50",
    productName: "Premium Roasted Pistachios (Salted)",
    type: "OUTBOUND",
    quantity: 12000,
    prevStock: 25000,
    newStock: 13000,
    date: "2026-02-18 16:10",
    notes: "Re-Export Outbound Release (BOE-2026-009412-DXB)",
    operator: "Dubai Trade Gate"
  },
  {
    id: "LOG-005",
    sku: "DXB-LU-OW702",
    productName: "Royal Oud Intense Blend Perfume",
    type: "RECONCILIATION",
    quantity: 100,
    prevStock: 3000,
    newStock: 3100,
    date: "2026-06-01 10:00",
    notes: "Annual warehouse physical inventory reconciliation",
    operator: "M. Al-Maktoum (Warehouse Lead)"
  },
  {
    id: "LOG-006",
    sku: "DXB-AU-BRK99",
    productName: "Ceramic Compound Brake Pads Set",
    type: "DAMAGE",
    quantity: 20,
    prevStock: 4520,
    newStock: 4500,
    date: "2026-06-15 08:30",
    notes: "Damaged during forklift offloading at Gate 4. Written off.",
    operator: "A. Rahman (HSE Inspector)"
  }
];

let declarations: Declaration[] = [
  // January 2026
  {
    id: "DEC-2026-00101",
    type: "IMPORT",
    date: "2026-01-15",
    sku: "DXB-EL-AP101",
    productName: "AeroPro Smart Core Processors",
    hsCode: "8542.31.00",
    quantity: 2000,
    valueAED: 3700000,
    dutyPaidAED: 0,
    vatPaidAED: 0,
    status: "APPROVED",
    referenceNumber: "BOE-2026-003841-DXB",
    customsOffice: "Jebel Ali Customs Port",
    carrierName: "Maersk Line",
    destinationOrSource: "South Korea"
  },
  {
    id: "DEC-2026-00102",
    type: "MAINLAND_IMPORT",
    date: "2026-01-20",
    sku: "DXB-EL-AP101",
    productName: "AeroPro Smart Core Processors",
    hsCode: "8542.31.00",
    quantity: 500,
    valueAED: 925000,
    dutyPaidAED: 46250,
    vatPaidAED: 48562.5,
    status: "APPROVED",
    referenceNumber: "BOE-2026-004102-DXB",
    customsOffice: "Jebel Ali Customs Port",
    carrierName: "Al Futtaim Logistics",
    destinationOrSource: "Dubai Mainland"
  },
  // February 2026
  {
    id: "DEC-2026-00201",
    type: "IMPORT",
    date: "2026-02-05",
    sku: "DXB-FD-PST50",
    productName: "Premium Roasted Pistachios (Salted)",
    hsCode: "0802.52.00",
    quantity: 25000,
    valueAED: 9500000,
    dutyPaidAED: 0,
    vatPaidAED: 0,
    status: "APPROVED",
    referenceNumber: "BOE-2026-008920-DXB",
    customsOffice: "DXB Cargo Customs Terminal",
    carrierName: "Emirates SkyCargo",
    destinationOrSource: "Iran"
  },
  {
    id: "DEC-2026-00202",
    type: "EXPORT",
    date: "2026-02-18",
    sku: "DXB-FD-PST50",
    productName: "Premium Roasted Pistachios (Salted)",
    hsCode: "0802.52.00",
    quantity: 12000,
    valueAED: 4560000,
    dutyPaidAED: 0,
    vatPaidAED: 0,
    status: "APPROVED",
    referenceNumber: "BOE-2026-009412-DXB",
    customsOffice: "Jebel Ali Customs Port",
    carrierName: "Hapag-Lloyd",
    destinationOrSource: "Saudi Arabia"
  },
  // March 2026
  {
    id: "DEC-2026-00301",
    type: "IMPORT",
    date: "2026-03-10",
    sku: "DXB-LU-OW702",
    productName: "Royal Oud Intense Blend Perfume",
    hsCode: "3303.00.00",
    quantity: 5000,
    valueAED: 2250000,
    dutyPaidAED: 0,
    vatPaidAED: 0,
    status: "APPROVED",
    referenceNumber: "BOE-2026-014389-DXB",
    customsOffice: "Jebel Ali Customs Port",
    carrierName: "CMA CGM",
    destinationOrSource: "UAE (Free Zone Production)"
  },
  {
    id: "DEC-2026-00302",
    type: "MAINLAND_IMPORT",
    date: "2026-03-25",
    sku: "DXB-LU-OW702",
    productName: "Royal Oud Intense Blend Perfume",
    hsCode: "3303.00.00",
    quantity: 1500,
    valueAED: 675000,
    dutyPaidAED: 33750,
    vatPaidAED: 35437.5,
    status: "APPROVED",
    referenceNumber: "BOE-2026-018221-DXB",
    customsOffice: "Jebel Ali Customs Port",
    carrierName: "DHL Express",
    destinationOrSource: "Dubai Mainland"
  },
  // April 2026
  {
    id: "DEC-2026-00401",
    type: "IMPORT",
    date: "2026-04-02",
    sku: "DXB-WT-CH44G",
    productName: "Emirates Chrono 44mm Rose Gold",
    hsCode: "9101.11.00",
    quantity: 300,
    valueAED: 3750000,
    dutyPaidAED: 0,
    vatPaidAED: 0,
    status: "APPROVED",
    referenceNumber: "BOE-2026-022091-DXB",
    customsOffice: "DXB Cargo Customs Terminal",
    carrierName: "Emirates SkyCargo",
    destinationOrSource: "Switzerland"
  },
  {
    id: "DEC-2026-00402",
    type: "EXPORT",
    date: "2026-04-15",
    sku: "DXB-WT-CH44G",
    productName: "Emirates Chrono 44mm Rose Gold",
    hsCode: "9101.11.00",
    quantity: 80,
    valueAED: 1000000,
    dutyPaidAED: 0,
    vatPaidAED: 0,
    status: "APPROVED",
    referenceNumber: "BOE-2026-024850-DXB",
    customsOffice: "DXB Cargo Customs Terminal",
    carrierName: "FedEx Express",
    destinationOrSource: "United States"
  },
  {
    id: "DEC-2026-00403",
    type: "EXPORT",
    date: "2026-04-28",
    sku: "DXB-EL-AP101",
    productName: "AeroPro Smart Core Processors",
    hsCode: "8542.31.00",
    quantity: 400,
    valueAED: 740000,
    dutyPaidAED: 0,
    vatPaidAED: 0,
    status: "APPROVED",
    referenceNumber: "BOE-2026-028401-DXB",
    customsOffice: "DXB Cargo Customs Terminal",
    carrierName: "DHL Express",
    destinationOrSource: "Singapore"
  },
  // May 2026
  {
    id: "DEC-2026-00501",
    type: "IMPORT",
    date: "2026-05-12",
    sku: "DXB-AU-BRK99",
    productName: "Ceramic Compound Brake Pads Set",
    hsCode: "8708.30.00",
    quantity: 5000,
    valueAED: 1450000,
    dutyPaidAED: 0,
    vatPaidAED: 0,
    status: "APPROVED",
    referenceNumber: "BOE-2026-033104-DXB",
    customsOffice: "Jebel Ali Customs Port",
    carrierName: "MSC Shipping",
    destinationOrSource: "Germany"
  },
  {
    id: "DEC-2026-00502",
    type: "MAINLAND_IMPORT",
    date: "2026-05-22",
    sku: "DXB-AU-BRK99",
    productName: "Ceramic Compound Brake Pads Set",
    hsCode: "8708.30.00",
    quantity: 800,
    valueAED: 232000,
    dutyPaidAED: 11600,
    vatPaidAED: 12180,
    status: "APPROVED",
    referenceNumber: "BOE-2026-036109-DXB",
    customsOffice: "Jebel Ali Customs Port",
    carrierName: "Aramex Logistics",
    destinationOrSource: "Dubai Mainland"
  },
  {
    id: "DEC-2026-00503",
    type: "IMPORT",
    date: "2026-05-29",
    sku: "DXB-MD-INS88",
    productName: "Smart Insulin Delivery Pods",
    hsCode: "9018.90.00",
    quantity: 1000,
    valueAED: 950000,
    dutyPaidAED: 0,
    vatPaidAED: 0,
    status: "APPROVED",
    referenceNumber: "BOE-2026-039120-DXB",
    customsOffice: "DXB Cargo Customs Terminal",
    carrierName: "Emirates SkyCargo",
    destinationOrSource: "USA"
  },
  // June 2026 (Active/Recent)
  {
    id: "DEC-2026-00601",
    type: "EXPORT",
    date: "2026-06-10",
    sku: "DXB-LU-OW702",
    productName: "Royal Oud Intense Blend Perfume",
    hsCode: "3303.00.00",
    quantity: 1000,
    valueAED: 450000,
    dutyPaidAED: 0,
    vatPaidAED: 0,
    status: "APPROVED",
    referenceNumber: "BOE-2026-044820-DXB",
    customsOffice: "Jebel Ali Customs Port",
    carrierName: "Ocean Network Express",
    destinationOrSource: "United Kingdom"
  },
  {
    id: "DEC-2026-00602",
    type: "MAINLAND_IMPORT",
    date: "2026-06-18",
    sku: "DXB-MD-INS88",
    productName: "Smart Insulin Delivery Pods",
    hsCode: "9018.90.00",
    quantity: 200,
    valueAED: 190000,
    dutyPaidAED: 0, // Medical devices are exempt (0% duty)
    vatPaidAED: 9500, // Still subject to 5% VAT
    status: "APPROVED",
    referenceNumber: "BOE-2026-046182-DXB",
    customsOffice: "DXB Cargo Customs Terminal",
    carrierName: "Al Futtaim Logistics",
    destinationOrSource: "Dubai Mainland"
  },
  {
    id: "DEC-2026-00603",
    type: "EXPORT",
    date: "2026-06-25",
    sku: "DXB-EL-AP101",
    productName: "AeroPro Smart Core Processors",
    hsCode: "8542.31.00",
    quantity: 300,
    valueAED: 555000,
    dutyPaidAED: 0,
    vatPaidAED: 0,
    status: "PENDING",
    referenceNumber: "BOE-2026-049210-DXB",
    customsOffice: "DXB Cargo Customs Terminal",
    carrierName: "DHL Express",
    destinationOrSource: "Germany"
  },
  {
    id: "DEC-2026-00604",
    type: "IMPORT",
    date: "2026-06-28",
    sku: "DXB-WT-CH44G",
    productName: "Emirates Chrono 44mm Rose Gold",
    hsCode: "9101.11.00",
    quantity: 50,
    valueAED: 625000,
    dutyPaidAED: 0,
    vatPaidAED: 0,
    status: "INSPECTING",
    referenceNumber: "BOE-2026-049880-DXB",
    customsOffice: "DXB Cargo Customs Terminal",
    carrierName: "Emirates SkyCargo",
    destinationOrSource: "Switzerland"
  }
];

interface InvoiceItem {
  sku: string;
  productName: string;
  quantity: number;
  priceAED: number;
  vatAED: number;
  dutyAED: number;
  totalAED: number;
}

interface Invoice {
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

let invoices: Invoice[] = [
  {
    id: "INV-2026-0001",
    type: "SALES",
    date: "2026-06-20",
    clientOrSupplierName: "Al-Futtaim Retail Group",
    items: [
      {
        sku: "DXB-EL-AP101",
        productName: "AeroPro Smart Core Processors",
        quantity: 50,
        priceAED: 2100,
        vatAED: 5250,
        dutyAED: 0,
        totalAED: 110250
      }
    ],
    subtotal: 105000,
    totalTax: 5250,
    totalAmount: 110250,
    referenceNumber: "SO-9921",
    status: "PAID"
  },
  {
    id: "INV-2026-0002",
    type: "PURCHASE",
    date: "2026-06-18",
    clientOrSupplierName: "South Korea Microelectronics Co.",
    items: [
      {
        sku: "DXB-EL-AP101",
        productName: "AeroPro Smart Core Processors",
        quantity: 200,
        priceAED: 1850,
        vatAED: 0,
        dutyAED: 0,
        totalAED: 370000
      }
    ],
    subtotal: 370000,
    totalTax: 0,
    totalAmount: 370000,
    referenceNumber: "PO-4482",
    status: "PAID"
  }
];

// Lazy Initialize Gemini API Client
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. AI features will run in simulated mode.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key || "dummy_key",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Start Server Setup
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: Get products
  app.get("/api/products", (req, res) => {
    res.json(products);
  });

  // API: Get stock logs
  app.get("/api/stock-logs", (req, res) => {
    res.json(stockLogs);
  });

  // API: Add product
  app.post("/api/products", (req, res) => {
    const newProduct: Product = req.body;
    
    // Check if SKU already exists
    const exists = products.find(p => p.sku.toUpperCase() === newProduct.sku.toUpperCase());
    if (exists) {
      return res.status(400).json({ error: `A product with SKU ${newProduct.sku} already exists.` });
    }

    const skuUpper = newProduct.sku.toUpperCase();
    const initialStock = Number(newProduct.stockLevel) || 0;

    const savedProduct: Product = {
      sku: skuUpper,
      name: newProduct.name,
      description: newProduct.description,
      hsCode: newProduct.hsCode,
      category: newProduct.category || "General",
      dutyRate: Number(newProduct.dutyRate) || 0.05,
      valueAED: Number(newProduct.valueAED) || 0,
      stockLevel: initialStock,
      uom: newProduct.uom || "PCS",
      originCountry: newProduct.originCountry || "Unknown",
      regulatoryBody: newProduct.regulatoryBody || "None",
      warehouseLocation: newProduct.warehouseLocation || "Zone A - General",
      minStockThreshold: Number(newProduct.minStockThreshold) || 10
    };

    products.push(savedProduct);

    // Write initial stock log if we start with some stock
    if (initialStock > 0) {
      stockLogs.unshift({
        id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        sku: skuUpper,
        productName: newProduct.name,
        type: "INBOUND",
        quantity: initialStock,
        prevStock: 0,
        newStock: initialStock,
        date: new Date().toISOString().replace("T", " ").substring(0, 16),
        notes: "Initial inventory registration on SKU setup.",
        operator: "Warehouse System Admin"
      });
    }

    res.status(201).json({ success: true, product: savedProduct });
  });

  // API: Update product
  app.put("/api/products/:sku", (req, res) => {
    const { sku } = req.params;
    const updateData = req.body;

    const productIndex = products.findIndex(p => p.sku.toUpperCase() === sku.toUpperCase());
    if (productIndex === -1) {
      return res.status(404).json({ error: "Product not found" });
    }

    const currentProduct = products[productIndex];
    const updatedProduct = {
      ...currentProduct,
      name: updateData.name !== undefined ? updateData.name : currentProduct.name,
      description: updateData.description !== undefined ? updateData.description : currentProduct.description,
      hsCode: updateData.hsCode !== undefined ? updateData.hsCode : currentProduct.hsCode,
      category: updateData.category !== undefined ? updateData.category : currentProduct.category,
      dutyRate: updateData.dutyRate !== undefined ? Number(updateData.dutyRate) : currentProduct.dutyRate,
      valueAED: updateData.valueAED !== undefined ? Number(updateData.valueAED) : currentProduct.valueAED,
      uom: updateData.uom !== undefined ? updateData.uom : currentProduct.uom,
      originCountry: updateData.originCountry !== undefined ? updateData.originCountry : currentProduct.originCountry,
      regulatoryBody: updateData.regulatoryBody !== undefined ? updateData.regulatoryBody : currentProduct.regulatoryBody,
      warehouseLocation: updateData.warehouseLocation !== undefined ? updateData.warehouseLocation : currentProduct.warehouseLocation,
      minStockThreshold: updateData.minStockThreshold !== undefined ? Number(updateData.minStockThreshold) : currentProduct.minStockThreshold,
    };

    products[productIndex] = updatedProduct;
    res.json({ success: true, product: updatedProduct });
  });

  // API: Delete product
  app.delete("/api/products/:sku", (req, res) => {
    const { sku } = req.params;
    const product = products.find(p => p.sku.toUpperCase() === sku.toUpperCase());
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.stockLevel > 0) {
      return res.status(400).json({ error: "Cannot delete a product with an active in-bond stock level greater than 0. Reconcile stock first." });
    }

    products = products.filter(p => p.sku.toUpperCase() !== sku.toUpperCase());
    res.json({ success: true });
  });

  // API: Adjust stock level manually
  app.post("/api/products/adjust", (req, res) => {
    const { sku, adjustmentType, quantity, notes, operator } = req.body;

    const product = products.find(p => p.sku.toUpperCase() === sku.toUpperCase());
    if (!product) {
      return res.status(404).json({ error: "SKU not found." });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: "Quantity must be a positive number." });
    }

    const prevStock = product.stockLevel;
    let newStock = prevStock;
    let logType: "ADJUSTMENT_ADD" | "ADJUSTMENT_SUB" | "DAMAGE" | "RECONCILIATION";

    if (adjustmentType === "ADD") {
      newStock = prevStock + qty;
      logType = "ADJUSTMENT_ADD";
    } else if (adjustmentType === "SUB") {
      if (prevStock < qty) {
        return res.status(400).json({ error: `Cannot deduct stock. Available level is only ${prevStock}.` });
      }
      newStock = prevStock - qty;
      logType = "ADJUSTMENT_SUB";
    } else if (adjustmentType === "DAMAGE") {
      if (prevStock < qty) {
        return res.status(400).json({ error: `Cannot report damage greater than available stock (${prevStock}).` });
      }
      newStock = prevStock - qty;
      logType = "DAMAGE";
    } else if (adjustmentType === "RECONCILIATION") {
      // For reconciliation, quantity indicates the final actual physical stock count
      newStock = qty;
      logType = "RECONCILIATION";
    } else {
      return res.status(400).json({ error: "Invalid adjustment type specified." });
    }

    product.stockLevel = newStock;

    // Create Stock Log
    const diff = logType === "RECONCILIATION" ? (newStock - prevStock) : qty;
    const logQuantity = logType === "RECONCILIATION" ? Math.abs(diff) : qty;
    
    // Determine type for ledger display
    const finalLogType = logType;

    const newLog: StockLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      sku: product.sku,
      productName: product.name,
      type: finalLogType,
      quantity: logQuantity,
      prevStock,
      newStock,
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      notes: notes || `Manual stock level adjustment (${adjustmentType})`,
      operator: operator || "Warehouse Supervisor"
    };

    stockLogs.unshift(newLog);
    res.json({ success: true, product, log: newLog });
  });

  // API: Get customs declarations
  app.get("/api/declarations", (req, res) => {
    res.json(declarations);
  });

  // API: Submit customs declaration
  app.post("/api/declarations", (req, res) => {
    const { type, sku, quantity, customsOffice, carrierName, destinationOrSource } = req.body;

    const product = products.find(p => p.sku === sku);
    if (!product) {
      return res.status(404).json({ error: "Product not found with specified SKU" });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: "Quantity must be a positive number" });
    }

    // Validation: Stock limits for export or mainland imports
    if ((type === "EXPORT" || type === "MAINLAND_IMPORT") && product.stockLevel < qty) {
      return res.status(400).json({ 
        error: `Insufficient stock in Free Zone warehouse. Available: ${product.stockLevel} ${product.uom}, Requested: ${qty} ${product.uom}.` 
      });
    }

    // Calculations
    const valueAED = product.valueAED * qty;
    let dutyPaidAED = 0;
    let vatPaidAED = 0;

    if (type === "MAINLAND_IMPORT") {
      dutyPaidAED = valueAED * product.dutyRate;
      vatPaidAED = (valueAED + dutyPaidAED) * 0.05; // 5% VAT applied on (Value + Duty)
    }

    // Generate random declaration and BOE reference numbers
    const id = `DEC-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const referenceNumber = `BOE-2026-${Math.floor(100000 + Math.random() * 900000)}-DXB`;

    const newDeclaration: Declaration = {
      id,
      type,
      date: new Date().toISOString().split("T")[0],
      sku,
      productName: product.name,
      hsCode: product.hsCode,
      quantity: qty,
      valueAED,
      dutyPaidAED,
      vatPaidAED,
      status: "APPROVED", // Auto-approved in this prototype/system for ease of use
      referenceNumber,
      customsOffice: customsOffice || "Jebel Ali Customs Port",
      carrierName: carrierName || "Local Logistics",
      destinationOrSource: destinationOrSource || (type === "MAINLAND_IMPORT" ? "Dubai Mainland" : "International")
    };

    // Update Stock and log to Ledger
    const prevStock = product.stockLevel;
    let typeLog: "INBOUND" | "OUTBOUND" = "INBOUND";

    if (type === "IMPORT") {
      product.stockLevel += qty;
      typeLog = "INBOUND";
    } else {
      product.stockLevel -= qty;
      typeLog = "OUTBOUND";
    }
    const newStock = product.stockLevel;

    // Create a Stock Log entry
    const newLog: StockLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      sku: product.sku,
      productName: product.name,
      type: typeLog,
      quantity: qty,
      prevStock,
      newStock,
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      notes: type === "IMPORT" 
        ? `Customs Inbound Import Cargo (BOE ref: ${referenceNumber})` 
        : type === "EXPORT" 
          ? `Customs Outbound Re-Export Cargo (BOE ref: ${referenceNumber})` 
          : `Customs Mainland Clearance (BOE ref: ${referenceNumber})`,
      operator: carrierName || "Customs Gate Agent"
    };

    stockLogs.unshift(newLog);
    declarations.unshift(newDeclaration); // Add to beginning of log
    res.status(201).json({ success: true, declaration: newDeclaration });
  });

  // API: Get invoices
  app.get("/api/invoices", (req, res) => {
    res.json(invoices);
  });

  // API: Submit invoice (Sales or Purchase)
  app.post("/api/invoices", (req, res) => {
    const { type, clientOrSupplierName, items, referenceNumber, status } = req.body;

    if (!clientOrSupplierName || !items || !items.length) {
      return res.status(400).json({ error: "Client/Supplier name and invoice items are required" });
    }

    // Process each item and adjust stock
    for (const item of items) {
      const product = products.find(p => p.sku === item.sku);
      if (!product) {
        return res.status(404).json({ error: `Product with SKU ${item.sku} not found.` });
      }

      if (type === "SALES" && product.stockLevel < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for product ${product.name} (SKU: ${product.sku}). Available: ${product.stockLevel}, Requested: ${item.quantity}` 
        });
      }
    }

    const calculatedItems = [];
    let subtotal = 0;
    let totalTax = 0;

    // Apply calculations and update stocks
    for (const item of items) {
      const product = products.find(p => p.sku === item.sku)!;
      const quantity = Number(item.quantity);
      const priceAED = Number(item.priceAED);
      
      const itemSubtotal = quantity * priceAED;
      
      // Standard UAE VAT is 5% for sales. Inside free zone can be 0% for purchases
      const vatRate = type === "SALES" ? 0.05 : 0;
      const vatAED = itemSubtotal * vatRate;
      const dutyAED = 0;
      const totalAED = itemSubtotal + vatAED + dutyAED;

      calculatedItems.push({
        sku: item.sku,
        productName: product.name,
        quantity,
        priceAED,
        vatAED,
        dutyAED,
        totalAED
      });

      subtotal += itemSubtotal;
      totalTax += (vatAED + dutyAED);

      // Update Stock Level
      const prevStock = product.stockLevel;
      if (type === "SALES") {
        product.stockLevel -= quantity;
      } else {
        product.stockLevel += quantity;
      }
      const newStock = product.stockLevel;

      // Add Stock Log Entry
      const newLog: StockLog = {
        id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        sku: product.sku,
        productName: product.name,
        type: type === "SALES" ? "OUTBOUND" : "INBOUND",
        quantity,
        prevStock,
        newStock,
        date: new Date().toISOString().replace("T", " ").substring(0, 16),
        notes: type === "SALES" 
          ? `Sales Invoice delivery under reference ${referenceNumber || "N/A"} to ${clientOrSupplierName}` 
          : `Purchase Inbound stock replenishment from ${clientOrSupplierName}`,
        operator: type === "SALES" ? "Sales Agent" : "Receiving Agent"
      };
      stockLogs.unshift(newLog);
    }

    const totalAmount = subtotal + totalTax;
    const newInvoiceId = `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const newInvoice: Invoice = {
      id: newInvoiceId,
      type,
      date: new Date().toISOString().split("T")[0],
      clientOrSupplierName,
      items: calculatedItems,
      subtotal,
      totalTax,
      totalAmount,
      referenceNumber: referenceNumber || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      status: status || "PAID"
    };

    invoices.unshift(newInvoice);
    res.status(201).json({ success: true, invoice: newInvoice });
  });

  // API: AI Product HS Code & Customs Classification
  app.post("/api/classify", async (req, res) => {
    const { name, description } = req.body;
    if (!name && !description) {
      return res.status(400).json({ error: "Product name or description is required for classification." });
    }

    const promptText = `
      You are an expert Customs Classification Consultant specialized in Dubai Customs, UAE Federal Customs Authority (FCA), and GCC Common Customs Union regulations.
      Analyze this product and provide an accurate 8-digit HS Code, official description, standard customs duty rate, UAE regulatory agency requirements, and free-zone storage/handling rules.

      Product Name: ${name || "N/A"}
      Product Raw Description: ${description || "N/A"}

      Response must be returned in strict JSON format, matching this schema:
      {
        "hsCode": "8-digit string code in format XXXX.XX.XX",
        "hsDescription": "Official Harmonized System category/subheading text",
        "customsDescription": "A highly precise, compliant customs declaration text (verbose, technical, and formatted for a Bill of Entry)",
        "dutyRate": 0.05, // Numeric float representing duty rate (e.g. 0.05 for 5%, 0.00 for exempt/0%, 1.00 for 100% tobacco/alcohol etc)
        "regulatoryRequirement": "Select ONE of: 'TDRA' (for telecom/wireless), 'Dubai Municipality' (for food, cosmetics, chemicals), 'MOHAP' (for drugs, medical equipment), 'None' (for general goods)",
        "regulatoryNotes": "Detailed explanation of Dubai Customs requirements, approval portals (e.g., Montaji, Food Import and Re-export System - FIRS), or certificates required (e.g. Halal, Health, Certificate of Origin)",
        "freeZoneHandlingNotes": "Guidelines for storage and logisitics in JAFZA/DAFZA free zones (e.g. ambient warehouse, cold chain, hazardous materials storage, customs bond logs)"
      }
    `;

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        // Fallback simulation if key is not configured
        console.log("No valid Gemini API key found. Simulating classification response.");
        return res.json(getSimulatedClassification(name, description));
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hsCode: { type: Type.STRING, description: "HS Code in XXXX.XX.XX format" },
              hsDescription: { type: Type.STRING, description: "Official HS description" },
              customsDescription: { type: Type.STRING, description: "Compliant customs declaration text" },
              dutyRate: { type: Type.NUMBER, description: "Numeric duty rate e.g., 0.05" },
              regulatoryRequirement: { type: Type.STRING, description: "TDRA, Dubai Municipality, MOHAP, or None" },
              regulatoryNotes: { type: Type.STRING, description: "Explanation of special permits needed" },
              freeZoneHandlingNotes: { type: Type.STRING, description: "Free zone storage/logistics rules" },
            },
            required: [
              "hsCode",
              "hsDescription",
              "customsDescription",
              "dutyRate",
              "regulatoryRequirement",
              "regulatoryNotes",
              "freeZoneHandlingNotes"
            ]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from Gemini");
      }

      const result = JSON.parse(responseText.trim());
      res.json(result);

    } catch (error: any) {
      console.error("Gemini API error:", error);
      // Fail gracefully: supply high quality simulated fallback to keep app fully functional
      res.status(200).json(getSimulatedClassification(name, description));
    }
  });

  // API: Get advanced trade analytics
  app.get("/api/analytics", (req, res) => {
    // 1. Core aggregates
    const stockValuationAED = products.reduce((sum, p) => sum + (p.stockLevel * p.valueAED), 0);
    const totalDeclarations = declarations.length;
    
    let totalImportValue = 0;
    let totalExportValue = 0;
    let totalMainlandImportValue = 0;
    let totalDutyPaid = 0;
    let totalVatPaid = 0;

    declarations.forEach(d => {
      if (d.status === "APPROVED") {
        if (d.type === "IMPORT") {
          totalImportValue += d.valueAED;
        } else if (d.type === "EXPORT") {
          totalExportValue += d.valueAED;
        } else if (d.type === "MAINLAND_IMPORT") {
          totalMainlandImportValue += d.valueAED;
          totalDutyPaid += d.dutyPaidAED;
          totalVatPaid += d.vatPaidAED;
        }
      }
    });

    const totalTradeVolume = totalImportValue + totalExportValue + totalMainlandImportValue;

    // Duty savings calculation:
    // If exports had been imported into mainland instead of free-zone and then re-exported,
    // they would have paid duty.
    // Duty saved = Export Value * average duty rate (approx 5%) + hold stock * duty rate
    const dutySavingsExports = declarations
      .filter(d => d.type === "EXPORT" && d.status === "APPROVED")
      .reduce((sum, d) => {
        const product = products.find(p => p.sku === d.sku);
        const rate = product ? product.dutyRate : 0.05;
        return sum + (d.valueAED * rate);
      }, 0);

    const dutySavingsWarehouse = products.reduce((sum, p) => sum + (p.stockLevel * p.valueAED * p.dutyRate), 0);
    const totalDutySavedAED = dutySavingsExports + dutySavingsWarehouse;

    // 2. Monthly trends (last 6 months)
    const monthlyData: { [key: string]: { month: string; imports: number; exports: number; mainland: number } } = {
      "01": { month: "Jan 2026", imports: 0, exports: 0, mainland: 0 },
      "02": { month: "Feb 2026", imports: 0, exports: 0, mainland: 0 },
      "03": { month: "Mar 2026", imports: 0, exports: 0, mainland: 0 },
      "04": { month: "Apr 2026", imports: 0, exports: 0, mainland: 0 },
      "05": { month: "May 2026", imports: 0, exports: 0, mainland: 0 },
      "06": { month: "Jun 2026", imports: 0, exports: 0, mainland: 0 },
    };

    declarations.forEach(d => {
      if (d.status === "APPROVED") {
        const monthPart = d.date.split("-")[1]; // "01", "02", etc.
        if (monthlyData[monthPart]) {
          if (d.type === "IMPORT") {
            monthlyData[monthPart].imports += d.valueAED;
          } else if (d.type === "EXPORT") {
            monthlyData[monthPart].exports += d.valueAED;
          } else if (d.type === "MAINLAND_IMPORT") {
            monthlyData[monthPart].mainland += d.valueAED;
          }
        }
      }
    });

    const trends = Object.values(monthlyData);

    // 3. Destination country breakdown (exports)
    const destCounts: { [key: string]: number } = {};
    declarations
      .filter(d => d.type === "EXPORT" && d.status === "APPROVED")
      .forEach(d => {
        destCounts[d.destinationOrSource] = (destCounts[d.destinationOrSource] || 0) + d.valueAED;
      });

    const destinationBreakdown = Object.entries(destCounts).map(([name, value]) => ({ name, value }));

    // 4. Product category distribution
    const catCounts: { [key: string]: number } = {};
    products.forEach(p => {
      const stockVal = p.stockLevel * p.valueAED;
      catCounts[p.category] = (catCounts[p.category] || 0) + stockVal;
    });
    const categoryBreakdown = Object.entries(catCounts).map(([name, value]) => ({ name, value }));

    res.json({
      aggregates: {
        totalTradeVolume,
        stockValuationAED,
        totalImportValue,
        totalExportValue,
        totalMainlandImportValue,
        totalDutyPaid,
        totalVatPaid,
        totalDutySavedAED,
        totalDeclarations
      },
      trends,
      destinationBreakdown,
      categoryBreakdown
    });
  });

  // Helpers for simulated classifications
  function getSimulatedClassification(name: string, description: string): any {
    const n = (name || "").toLowerCase();
    const d = (description || "").toLowerCase();

    if (n.includes("phone") || n.includes("mobile") || d.includes("cellular") || d.includes("wireless")) {
      return {
        hsCode: "8517.13.00",
        hsDescription: "Smartphones for cellular networks or for other wireless networks",
        customsDescription: "CELLULAR HANDSETS AND SMARTPHONES WITH WIFI, BLUETOOTH, GPS MODULES, COMPLETE WITH BUILT-IN RECHARGEABLE LI-ION BATTERIES, INTENDED FOR MOBILE TELECOMMUNICATION NETWORKS.",
        dutyRate: 0.05,
        regulatoryRequirement: "TDRA",
        regulatoryNotes: "Requires TDRA (Telecommunications and Digital Government Regulatory Authority) Type Approval Certificate prior to Customs Clearance. Importers must log filing into the TDRA portal.",
        freeZoneHandlingNotes: "Store in clean, secure anti-static room. Temperature-controlled dry storage (18°C to 24°C). Track high-value items via serial numbers in customs warehouse logs."
      };
    } else if (n.includes("perfume") || n.includes("fragrance") || n.includes("oud") || d.includes("cosmetic")) {
      return {
        hsCode: "3303.00.00",
        hsDescription: "Perfumes and toilet waters",
        customsDescription: "PREMIUM ESSENTIAL OIL BLENDED PERFUME AND CONCENTRATED FRAGRANCE WATER IN RETAIL PACKAGING AND SPRAY FLASKS, CONTAINING ETHANOL SOLVENT, FREE OF FORBIDDEN ADDITIVES.",
        dutyRate: 0.05,
        regulatoryRequirement: "Dubai Municipality",
        regulatoryNotes: "Subject to Montaji product registration with Dubai Municipality. Must obtain a Health Certificate, Certificate of Analysis (COA), and undergo label assessment to verify compliance.",
        freeZoneHandlingNotes: "Store in temperature-controlled zone (under 22°C) away from direct sunlight. High-security storage due to high retail theft risk. Subject to chemical safety segregation guidelines."
      };
    } else if (n.includes("pistachio") || n.includes("date") || n.includes("food") || n.includes("nut") || d.includes("eat") || d.includes("organic")) {
      return {
        hsCode: "0802.52.00",
        hsDescription: "Pistachios, shelled",
        customsDescription: "SHELLED OR UNSHELLED ROASTED AND SALTED PISTACHIO NUTS, BULK PACKED IN VACUUM HERMETICALLY SEALED BARRIER FOIL BAGS FOR DIRECT HUMAN CONSUMPTION.",
        dutyRate: 0.00,
        regulatoryRequirement: "Dubai Municipality",
        regulatoryNotes: "Requires food inspection and approval from Dubai Municipality Food Safety Department via the FIRS (Food Import and Re-export System). Phytosanitary certificate and Health Certificate from country of origin must be submitted.",
        freeZoneHandlingNotes: "Mandatory temperature and humidity-controlled food-grade cold warehouse storage (4°C to 8°C, RH < 60%) to prevent aflatoxin contamination. Keep off-ground on clean pallets."
      };
    } else if (n.includes("car") || n.includes("brake") || n.includes("engine") || d.includes("part") || d.includes("automotive")) {
      return {
        hsCode: "8708.30.00",
        hsDescription: "Brakes and servo-brakes; parts thereof",
        customsDescription: "SPARE AUTOMOTIVE REPLACEMENT BRAKING SYSTEM COMPONENTS, SPECIFICALLY ASBESTOS-FREE SEMI-METALLIC OR CERAMIC COMPOUND FRICTION BRAKE PADS PACKED FOR COMMERCIAL DISTRIBUTION.",
        dutyRate: 0.05,
        regulatoryRequirement: "None",
        regulatoryNotes: "No special Ministry permit required for standard mechanical components. Must show proof of compliance with GCC standardization standards (GSO/SASO) if imported to mainland.",
        freeZoneHandlingNotes: "Heavy load warehouse storage on reinforced racking. No climate control required, but must protect from moisture and salinity to prevent corrosion on metal surfaces."
      };
    } else if (n.includes("watch") || n.includes("gold") || n.includes("jewelry") || d.includes("luxury")) {
      return {
        hsCode: "9101.11.00",
        hsDescription: "Wrist-watches, electrically operated, whether or not incorporating a stop-watch facility, with case of precious metal or of metal clad with precious metal",
        customsDescription: "LUXURY WRISTWATCHES WITH MECHANICAL SELF-WINDING AUTOMATIC MOVEMENTS, ENCASED IN 18K SOLID GOLD COMPOSITIONS, COMPLYING WITH SWISS HALLMARK CERTIFICATION.",
        dutyRate: 0.05,
        regulatoryRequirement: "None",
        regulatoryNotes: "No special health/telecom permits required. However, subject to strict valuation audits by Dubai Customs. Importer must provide certified commercial invoices and proof of payment.",
        freeZoneHandlingNotes: "Store exclusively inside high-security vault or cage under 24/7 CCTV surveillance with dual-custodian access controls. Fully insured transit required."
      };
    } else {
      // General default fallback
      return {
        hsCode: "9901.00.00",
        hsDescription: "General manufactured commodities and miscellaneous merchandise",
        customsDescription: "GENERAL INDUSTRIAL COMMERCIAL COMMODITIES, PACKAGED FOR SHIPPING AND LOGISTICS OPERATIONS, INDIVIDUALLY LABELED WITH SKUS AND COUNTRY OF ORIGIN PRINTS.",
        dutyRate: 0.05,
        regulatoryRequirement: "None",
        regulatoryNotes: "Standard customs procedures apply. Submit commercial invoice, packing list, certificate of origin, and delivery order via Dubai Trade portal.",
        freeZoneHandlingNotes: "Ambient industrial warehouse storage. Follow standard safety procedures. Record weight and dimensions in the warehouse management system."
      };
    }
  }

  // Vite Integration for Developer Server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dubai Free Zone Server running on port ${PORT}`);
  });
}

startServer();
