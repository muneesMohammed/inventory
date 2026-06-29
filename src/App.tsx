import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Boxes,
  FileSpreadsheet,
  BookOpen,
  Plus,
  Search,
  Sparkles,
  Globe,
  DollarSign,
  Briefcase,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  ShieldCheck,
  Ship,
  ChevronRight,
  Anchor,
  HelpCircle,
  Edit,
  Sliders,
  Eye,
  Trash2,
  History,
  Receipt,
  LogOut,
  User,
  Lock,
  PlusCircle,
  MinusCircle,
  Printer
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Product, Declaration, AnalyticsData, AICallResult, StockLog, Invoice, InvoiceItem, InvoiceSettings } from "./types";
import CustomsDocument from "./components/CustomsDocument";
import AISuggestionBox from "./components/AISuggestionBox";
import InvoiceDocument from "./components/InvoiceDocument";

export default function App() {
  // State
  const [activeTab, setActiveTab] = useState<"dashboard" | "inventory" | "customs" | "hscodes" | "invoices">("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  
  // Invoices State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<"ALL" | "SALES" | "PURCHASE">("ALL");
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [invoiceFormError, setInvoiceFormError] = useState<string | null>(null);

  // Invoice Form State
  const [newInvoiceType, setNewInvoiceType] = useState<"SALES" | "PURCHASE">("SALES");
  const [newInvoiceClientSupplier, setNewInvoiceClientSupplier] = useState("");
  const [newInvoiceRef, setNewInvoiceRef] = useState("");
  const [newInvoiceItems, setNewInvoiceItems] = useState<Array<{ sku: string; quantity: number | ""; priceAED: number | "" }>>([
    { sku: "", quantity: "", priceAED: "" }
  ]);
  const [newInvoiceStatus, setNewInvoiceStatus] = useState<"PAID" | "PENDING">("PAID");

  // Invoice Template Customization State
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>(() => {
    const saved = localStorage.getItem("invoice_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to default
      }
    }
    return {
      companyName: "AL-SHARQ LOGISTICS FZCO",
      companySubtitle: "DUBAI FREE ZONE AUTHORITY • BONDED WAREHOUSE",
      addressLines: [
        "Plot 482, Logistics City, Jebel Ali Free Zone",
        "PO Box 99201, Dubai, United Arab Emirates",
        "TRN: 100428819400003 (Standard 5% VAT Registered)",
        "Email: finance@alsharqfzco.ae | Tel: +971 4 800 WAREHOUSE"
      ],
      officialDeclaration: "These commodities are stored, sold, or replenished under the Jebel Ali Free Zone Bonded Warehouse provisions. Inbound purchases are subject to customs duty suspension. Outbound sales to mainland UAE are subject to 5% VAT and 5% custom tariffs upon clearance at Mainland Gate 4.",
      bottomComplianceNote: "UAE TAX LAW COMPLIANT TAX-INVOICE V2",
      signatureName: "M. Al-Maktoum",
      signatureDesignation: "Finance Director, Al-Sharq FZCO"
    };
  });
  const [isEditingInvoiceSettings, setIsEditingInvoiceSettings] = useState(false);
  const [settingsFormError, setSettingsFormError] = useState<string | null>(null);

  // Form helper fields for updating settings
  const [settingsCompanyName, setSettingsCompanyName] = useState(invoiceSettings.companyName);
  const [settingsCompanySubtitle, setSettingsCompanySubtitle] = useState(invoiceSettings.companySubtitle);
  const [settingsAddressText, setSettingsAddressText] = useState(invoiceSettings.addressLines.join("\n"));
  const [settingsDeclaration, setSettingsDeclaration] = useState(invoiceSettings.officialDeclaration);
  const [settingsComplianceNote, setSettingsComplianceNote] = useState(invoiceSettings.bottomComplianceNote);
  const [settingsSignatureName, setSettingsSignatureName] = useState(invoiceSettings.signatureName);
  const [settingsSignatureDesignation, setSettingsSignatureDesignation] = useState(invoiceSettings.signatureDesignation);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("customs_auth") === "true";
  });
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<string>(() => {
    return localStorage.getItem("customs_user_role") || "Visitor";
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const u = authUsername.trim().toLowerCase();
    const p = authPassword;

    if (u === "admin" && p === "admin123") {
      setIsAuthenticated(true);
      setLoggedInUser("Warehouse Administrator");
      localStorage.setItem("customs_auth", "true");
      localStorage.setItem("customs_user_role", "Warehouse Administrator");
    } else if (u === "officer" && p === "officer2026") {
      setIsAuthenticated(true);
      setLoggedInUser("Customs Inspector");
      localStorage.setItem("customs_auth", "true");
      localStorage.setItem("customs_user_role", "Customs Inspector");
    } else if (u === "operator" && p === "operator2026") {
      setIsAuthenticated(true);
      setLoggedInUser("Logistics Operator");
      localStorage.setItem("customs_auth", "true");
      localStorage.setItem("customs_user_role", "Logistics Operator");
    } else {
      setAuthError("Invalid username or passcode. Security authentication failed.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoggedInUser("Visitor");
    localStorage.removeItem("customs_auth");
    localStorage.removeItem("customs_user_role");
    setAuthUsername("");
    setAuthPassword("");
  };

  // Loading states
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingDeclarations, setIsLoadingDeclarations] = useState(true);
  const [isLoadingStockLogs, setIsLoadingStockLogs] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [isSubmittingDeclaration, setIsSubmittingDeclaration] = useState(false);
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);

  // Search/Filters
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("ALL");
  const [declarationSearch, setDeclarationSearch] = useState("");
  const [declarationTypeFilter, setDeclarationTypeFilter] = useState("ALL");
  const [stockLogSearch, setStockLogSearch] = useState("");
  const [stockLogTypeFilter, setStockLogTypeFilter] = useState("ALL");

  // Selection states
  const [selectedDeclaration, setSelectedDeclaration] = useState<Declaration | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AICallResult | null>(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);

  // Sub-tabs
  const [inventorySubTab, setInventorySubTab] = useState<"ledger" | "movements">("ledger");

  // Stock Adjustment State
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<"ADD" | "SUB" | "DAMAGE" | "RECONCILIATION">("ADD");
  const [adjustQty, setAdjustQty] = useState<number | "">("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [adjustOperator, setAdjustOperator] = useState("");

  // Product Edit State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductName, setEditProductName] = useState("");
  const [editProductDesc, setEditProductDesc] = useState("");
  const [editProductCategory, setEditProductCategory] = useState("Electronics");
  const [editProductHsCode, setEditProductHsCode] = useState("");
  const [editProductDutyRate, setEditProductDutyRate] = useState(0.05);
  const [editProductValue, setEditProductValue] = useState<number | "">("");
  const [editProductLocation, setEditProductLocation] = useState("");
  const [editProductThreshold, setEditProductThreshold] = useState<number | "">("");
  const [editProductOrigin, setEditProductOrigin] = useState("");
  const [editProductRegBody, setEditProductRegBody] = useState("None");
  const [editProductUom, setEditProductUom] = useState("PCS");

  // Alerts/Errors
  const [appError, setAppError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [adjustFormError, setAdjustFormError] = useState<string | null>(null);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forms State - Product
  const [newProductSku, setNewProductSku] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newProductDesc, setNewProductDesc] = useState("");
  const [newProductHsCode, setNewProductHsCode] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("Electronics");
  const [newProductDutyRate, setNewProductDutyRate] = useState(0.05);
  const [newProductValue, setNewProductValue] = useState<number | "">("");
  const [newProductStock, setNewProductStock] = useState<number | "">("");
  const [newProductUom, setNewProductUom] = useState("PCS");
  const [newProductOrigin, setNewProductOrigin] = useState("South Korea");
  const [newProductRegBody, setNewProductRegBody] = useState("None");
  const [newProductLocation, setNewProductLocation] = useState("Zone A - Row 01 - Shelf 1");
  const [newProductThreshold, setNewProductThreshold] = useState<number | "">(100);
  const [aiPrompt, setAiPrompt] = useState(""); // Raw AI prompt for classification

  // Forms State - Customs Declaration
  const [decType, setDecType] = useState<"IMPORT" | "EXPORT" | "MAINLAND_IMPORT">("IMPORT");
  const [decSku, setDecSku] = useState("");
  const [decQty, setDecQty] = useState<number | "">("");
  const [decCustomsOffice, setDecCustomsOffice] = useState("Jebel Ali Customs Port");
  const [decCarrierName, setDecCarrierName] = useState("Maersk Line");
  const [decDestination, setDecDestination] = useState("Singapore");

  // Load Database
  const fetchData = async () => {
    try {
      setAppError(null);
      const [prodRes, decRes, anaRes, logRes, invRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/declarations"),
        fetch("/api/analytics"),
        fetch("/api/stock-logs"),
        fetch("/api/invoices")
      ]);

      if (!prodRes.ok || !decRes.ok || !anaRes.ok || !logRes.ok || !invRes.ok) {
        throw new Error("Failed to synchronize with Dubai Customs registry API.");
      }

      const prodData = await prodRes.json();
      const decData = await decRes.json();
      const anaData = await anaRes.json();
      const logData = await logRes.json();
      const invData = await invRes.json();

      setProducts(prodData);
      setDeclarations(decData);
      setAnalytics(anaData);
      setStockLogs(logData);
      setInvoices(invData);

      // Pre-select first SKU for declaration form
      if (prodData.length > 0 && !decSku) {
        setDecSku(prodData[0].sku);
      }
    } catch (err: any) {
      console.error(err);
      setAppError(err.message || "An unexpected network error occurred.");
    } finally {
      setIsLoadingProducts(false);
      setIsLoadingDeclarations(false);
      setIsLoadingAnalytics(false);
      setIsLoadingStockLogs(false);
      setIsLoadingInvoices(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // AI Assistant - Classification
  const handleAIClassify = async () => {
    if (!aiPrompt.trim()) {
      setFormError("Please enter a short concept description for the AI to analyze.");
      return;
    }

    setIsClassifying(true);
    setFormError(null);
    setAiSuggestion(null);

    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProductName, description: aiPrompt })
      });

      if (!res.ok) {
        throw new Error("Customs AI Agent was unable to resolve classification. Please enter manually.");
      }

      const result: AICallResult = await res.json();
      setAiSuggestion(result);
      setSuccessMessage("AI tariff analysis completed successfully!");
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsClassifying(false);
    }
  };

  const applyAISuggestion = () => {
    if (!aiSuggestion) return;
    setNewProductHsCode(aiSuggestion.hsCode);
    setNewProductDutyRate(aiSuggestion.dutyRate);
    setNewProductRegBody(aiSuggestion.regulatoryRequirement);
    if (aiSuggestion.customsDescription) {
      setNewProductDesc(aiSuggestion.customsDescription);
    }
    
    // Auto category mapping
    if (aiSuggestion.hsCode.startsWith("85") || aiSuggestion.hsCode.startsWith("84")) {
      setNewProductCategory("Electronics");
    } else if (aiSuggestion.hsCode.startsWith("33")) {
      setNewProductCategory("Cosmetics");
    } else if (aiSuggestion.hsCode.startsWith("08")) {
      setNewProductCategory("Foodstuffs");
    } else if (aiSuggestion.hsCode.startsWith("91")) {
      setNewProductCategory("Luxury Goods");
    } else if (aiSuggestion.hsCode.startsWith("87")) {
      setNewProductCategory("Auto Parts");
    } else if (aiSuggestion.hsCode.startsWith("90")) {
      setNewProductCategory("Medical Equipment");
    }
    
    setSuccessMessage("AI parameters loaded into the configuration form.");
  };

  // Submit New Product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!newProductSku || !newProductName || !newProductHsCode || newProductValue === "") {
      setFormError("All fields marked with * are strictly required.");
      return;
    }

    setIsSubmittingProduct(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: newProductSku,
          name: newProductName,
          description: newProductDesc,
          hsCode: newProductHsCode,
          category: newProductCategory,
          dutyRate: newProductDutyRate,
          valueAED: Number(newProductValue),
          stockLevel: Number(newProductStock) || 0,
          uom: newProductUom,
          originCountry: newProductOrigin,
          regulatoryBody: newProductRegBody,
          warehouseLocation: newProductLocation,
          minStockThreshold: Number(newProductThreshold) || 10
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit product registry.");
      }

      setSuccessMessage(`Product ${newProductSku} successfully added to the bonded database.`);
      
      // Reset Form
      setNewProductSku("");
      setNewProductName("");
      setNewProductDesc("");
      setNewProductHsCode("");
      setNewProductValue("");
      setNewProductStock("");
      setNewProductLocation("Zone A - Row 01 - Shelf 1");
      setNewProductThreshold(100);
      setAiPrompt("");
      setAiSuggestion(null);

      // Reload
      fetchData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Submit Manual Stock Adjustment
  const handleManualAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustFormError(null);
    setSuccessMessage(null);

    if (!adjustingProduct || adjustQty === "") {
      setAdjustFormError("Please enter a valid quantity.");
      return;
    }

    setIsSubmittingAdjustment(true);

    try {
      const res = await fetch("/api/products/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: adjustingProduct.sku,
          adjustmentType: adjustType,
          quantity: Number(adjustQty),
          notes: adjustNotes,
          operator: adjustOperator
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit stock adjustment.");
      }

      setSuccessMessage(`Stock level for ${adjustingProduct.sku} updated successfully to ${data.product.stockLevel} ${adjustingProduct.uom}.`);
      
      // Close Modal and Reset
      setAdjustingProduct(null);
      setAdjustQty("");
      setAdjustNotes("");
      setAdjustOperator("");
      setAdjustType("ADD");

      // Reload
      fetchData();
    } catch (err: any) {
      setAdjustFormError(err.message);
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  // Submit Edit Product Details
  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError(null);
    setSuccessMessage(null);

    if (!editingProduct || !editProductName || !editProductHsCode || editProductValue === "") {
      setEditFormError("Product Name, HS Code, and Unit Valuation are strictly required.");
      return;
    }

    try {
      const res = await fetch(`/api/products/${editingProduct.sku}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editProductName,
          description: editProductDesc,
          category: editProductCategory,
          hsCode: editProductHsCode,
          dutyRate: Number(editProductDutyRate),
          valueAED: Number(editProductValue),
          warehouseLocation: editProductLocation,
          minStockThreshold: Number(editProductThreshold) || 10,
          originCountry: editProductOrigin,
          regulatoryBody: editProductRegBody,
          uom: editProductUom
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update product details.");
      }

      setSuccessMessage(`Product ${editingProduct.sku} has been updated successfully.`);
      setEditingProduct(null);

      // Reload
      fetchData();
    } catch (err: any) {
      setEditFormError(err.message);
    }
  };

  // Trigger Delete Product
  const handleDeleteProduct = async (sku: string) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete SKU ${sku} from the warehouse stock register?`)) {
      return;
    }

    setAppError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/products/${sku}`, {
        method: "DELETE"
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete product.");
      }

      setSuccessMessage(`SKU ${sku} successfully deleted from the register.`);
      
      // Reload
      fetchData();
    } catch (err: any) {
      setAppError(err.message);
    }
  };

  // Submit Declaration
  const handleAddDeclaration = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!decSku || decQty === "") {
      setFormError("Please select a product SKU and specify quantity.");
      return;
    }

    setIsSubmittingDeclaration(true);

    try {
      const res = await fetch("/api/declarations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: decType,
          sku: decSku,
          quantity: Number(decQty),
          customsOffice: decCustomsOffice,
          carrierName: decCarrierName,
          destinationOrSource: decType === "MAINLAND_IMPORT" ? "Dubai Mainland" : decDestination
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Customs submission rejected by terminal handler.");
      }

      setSuccessMessage(`Customs Bill of Entry generated: Ref ${data.declaration.referenceNumber}`);
      setDecQty("");
      
      // Auto open the document for viewing
      setSelectedDeclaration(data.declaration);

      // Reload
      fetchData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmittingDeclaration(false);
    }
  };

  // Submit Invoice (Sales or Purchase)
  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvoiceFormError(null);
    setSuccessMessage(null);

    // Validate fields
    if (!newInvoiceClientSupplier.trim()) {
      setInvoiceFormError("Please enter Client or Supplier name.");
      return;
    }

    const filteredItems = newInvoiceItems.filter(item => item.sku !== "");
    if (filteredItems.length === 0) {
      setInvoiceFormError("Please add at least one product item to the invoice.");
      return;
    }

    for (const item of filteredItems) {
      if (item.quantity === "" || Number(item.quantity) <= 0) {
        setInvoiceFormError("Please specify a valid quantity greater than 0 for all selected items.");
        return;
      }
      if (item.priceAED === "" || Number(item.priceAED) < 0) {
        setInvoiceFormError("Please specify a valid price (AED) for all selected items.");
        return;
      }
    }

    setIsSubmittingInvoice(true);

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newInvoiceType,
          clientOrSupplierName: newInvoiceClientSupplier.trim(),
          referenceNumber: newInvoiceRef.trim(),
          status: newInvoiceStatus,
          items: filteredItems.map(item => ({
            sku: item.sku,
            quantity: Number(item.quantity),
            priceAED: Number(item.priceAED)
          }))
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invoice generation failed.");
      }

      setSuccessMessage(`${newInvoiceType === "SALES" ? "Sales" : "Purchase"} Invoice generated successfully: ${data.invoice.id}`);
      
      // Reset form
      setNewInvoiceClientSupplier("");
      setNewInvoiceRef("");
      setNewInvoiceItems([{ sku: "", quantity: "", priceAED: "" }]);
      setIsCreatingInvoice(false);

      // Auto view the new invoice document
      setSelectedInvoice(data.invoice);

      // Reload databases
      fetchData();
    } catch (err: any) {
      setInvoiceFormError(err.message);
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  const addInvoiceItemLine = () => {
    setNewInvoiceItems([...newInvoiceItems, { sku: "", quantity: "", priceAED: "" }]);
  };

  const removeInvoiceItemLine = (index: number) => {
    const updated = [...newInvoiceItems];
    updated.splice(index, 1);
    setNewInvoiceItems(updated);
  };

  const updateInvoiceItemLine = (index: number, field: string, value: any) => {
    const updated = [...newInvoiceItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto populate default price if sku changed
    if (field === "sku" && value) {
      const selectedProd = products.find(p => p.sku === value);
      if (selectedProd) {
        // Use a slightly higher price for Sales, cost price for Purchase
        updated[index].priceAED = newInvoiceType === "SALES" 
          ? Math.round(selectedProd.valueAED * 1.15) 
          : selectedProd.valueAED;
      }
    }
    setNewInvoiceItems(updated);
  };

  // Save customized Invoice template settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsFormError(null);

    if (!settingsCompanyName.trim()) {
      setSettingsFormError("Company name is required.");
      return;
    }

    const lines = settingsAddressText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");

    if (lines.length === 0) {
      setSettingsFormError("Please provide at least one line of company address or TRN/Contact info.");
      return;
    }

    const updatedSettings: InvoiceSettings = {
      companyName: settingsCompanyName.trim(),
      companySubtitle: settingsCompanySubtitle.trim(),
      addressLines: lines,
      officialDeclaration: settingsDeclaration.trim(),
      bottomComplianceNote: settingsComplianceNote.trim(),
      signatureName: settingsSignatureName.trim(),
      signatureDesignation: settingsSignatureDesignation.trim(),
    };

    setInvoiceSettings(updatedSettings);
    localStorage.setItem("invoice_settings", JSON.stringify(updatedSettings));
    setIsEditingInvoiceSettings(false);
  };

  // Utility Currency and Number formatters
  const formatAED = (num: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0
    }).format(num);
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.hsCode.includes(productSearch);
    const matchesCategory = productCategoryFilter === "ALL" || p.category === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filtered Declarations
  const filteredDeclarations = declarations.filter(d => {
    const matchesSearch = d.id.toLowerCase().includes(declarationSearch.toLowerCase()) ||
                          d.sku.toLowerCase().includes(declarationSearch.toLowerCase()) ||
                          d.productName.toLowerCase().includes(declarationSearch.toLowerCase()) ||
                          d.referenceNumber.toLowerCase().includes(declarationSearch.toLowerCase());
    const matchesType = declarationTypeFilter === "ALL" || d.type === declarationTypeFilter;
    return matchesSearch && matchesType;
  });

  // Filtered Stock Logs
  const filteredStockLogs = stockLogs.filter(log => {
    const query = stockLogSearch.toLowerCase();
    const matchesSearch = log.sku.toLowerCase().includes(query) ||
                          log.productName.toLowerCase().includes(query) ||
                          (log.notes && log.notes.toLowerCase().includes(query)) ||
                          (log.operator && log.operator.toLowerCase().includes(query));
    const matchesType = stockLogTypeFilter === "ALL" || log.type === stockLogTypeFilter;
    return matchesSearch && matchesType;
  });

  // Unique categories for filtering
  const categories = ["ALL", ...Array.from(new Set(products.map(p => p.category)))];

  // Recharts Chart Colors
  const COLORS = ["#c5a880", "#1e293b", "#334155", "#64748b", "#d97706", "#94a3b8"];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
        {/* Abstract design background elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.05),transparent_60%)] pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-800/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-8 relative z-10">
          {/* Gold highlight top line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

          {/* Logo and Headings */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-3.5 rounded-2xl text-slate-950 shadow-lg mb-4">
              <Anchor className="h-7 w-7" />
            </div>
            <h1 className="font-extrabold text-lg tracking-wider text-white uppercase font-sans">
              Dubai Free Zone
            </h1>
            <p className="text-amber-500 font-mono text-[10px] tracking-widest uppercase mt-1">
              Customs & Port Authority
            </p>
            <div className="h-px w-24 bg-slate-800 my-4" />
            <p className="text-slate-400 text-xs">
              Enter security credentials to access the bonded warehouse and customs clearance ledger.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {authError && (
              <div className="p-3 bg-rose-950/50 border border-rose-800/50 text-rose-200 text-xs rounded-xl flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
                Operator Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="e.g. admin"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
                Security Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-bold uppercase tracking-wider text-xs py-3 rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2 mt-6"
            >
              <ShieldCheck className="h-4 w-4" />
              Verify Clearance
            </button>
          </form>

          {/* Quick Demo Credentials Access Panel */}
          <div className="mt-8 border-t border-slate-800/60 pt-6">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 text-center font-mono">
              Quick Authorization Profiles
            </h4>
            <div className="space-y-2">
              {[
                { label: "Warehouse Admin", user: "admin", pass: "admin123", color: "from-amber-500/20 to-amber-600/5 hover:border-amber-500/30 text-amber-300 animate-none" },
                { label: "Customs Inspector", user: "officer", pass: "officer2026", color: "from-blue-500/20 to-blue-600/5 hover:border-blue-500/30 text-blue-300 animate-none" },
                { label: "Logistics Operator", user: "operator", pass: "operator2026", color: "from-emerald-500/20 to-emerald-600/5 hover:border-emerald-500/30 text-emerald-300 animate-none" }
              ].map((prof) => (
                <button
                  key={prof.user}
                  type="button"
                  onClick={() => {
                    setAuthUsername(prof.user);
                    setAuthPassword(prof.pass);
                    setAuthError(null);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border border-slate-800 bg-gradient-to-r ${prof.color} transition-all duration-150 flex items-center justify-between text-[11px] group`}
                >
                  <div>
                    <span className="font-bold block">{prof.label}</span>
                    <span className="text-[9px] text-slate-500 font-mono">user: {prof.user} / pass: {prof.pass}</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-amber-400 transition-all">
                    Autofill
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Outer security status line */}
        <div className="mt-6 text-slate-600 text-[10px] font-mono tracking-wider flex items-center gap-2">
          <span className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
          SECURE ENCRYPTED PORTAL CONNECTION ACTIVE
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Professional Maritime Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2 rounded-lg text-slate-950 shadow-inner">
                <Ship className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-extrabold text-sm sm:text-base tracking-wider text-white">
                    DUBAI FREE ZONE
                  </h1>
                  <span className="bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/20">
                    BONDED SUITE
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono tracking-wider">LOGISTICS & CUSTOMS GATEWAY</p>
              </div>
            </div>

            {/* User Profile & Indicators */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-950/50 rounded-full border border-slate-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-300">JAFZA Terminal 2</span>
              </div>

              {/* Logged in User Profile */}
              <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-white font-bold text-[11px]">{loggedInUser}</span>
                  <span className="text-[9px] text-slate-500">Security Level 4</span>
                </div>
                <div className="bg-slate-800 p-1.5 rounded-lg text-slate-300">
                  <User className="h-4 w-4 text-amber-400" />
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out of Portal"
                  className="bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/30 text-rose-300 hover:text-rose-100 p-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[9px]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Main Tab Controller Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-4 py-3 overflow-x-auto no-scrollbar">
            
            <button
              id="tab-dashboard"
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-150 shrink-0 ${
                activeTab === "dashboard"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Analytics Dashboard
            </button>

            <button
              id="tab-inventory"
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-150 shrink-0 ${
                activeTab === "inventory"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Boxes className="h-4 w-4" />
              Warehouse Stock
            </button>

            <button
              id="tab-customs"
              onClick={() => setActiveTab("customs")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-150 shrink-0 ${
                activeTab === "customs"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Customs Declarations
            </button>

            <button
              id="tab-hscodes"
              onClick={() => setActiveTab("hscodes")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-150 shrink-0 ${
                activeTab === "hscodes"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              HS Directory
            </button>

            <button
              id="tab-invoices"
              onClick={() => setActiveTab("invoices")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-150 shrink-0 ${
                activeTab === "invoices"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Receipt className="h-4 w-4" />
              Invoices Portal
            </button>

          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Notification banner */}
        {appError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs animate-in slide-in-from-top-4">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <div>
              <h5 className="font-bold uppercase tracking-wider">System Synchronization Interrupted</h5>
              <p className="mt-1 font-mono text-[11px] leading-relaxed">{appError}</p>
            </div>
          </div>
        )}

        {/* Global Notifications */}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-xs animate-in slide-in-from-top-4">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
            <button 
              onClick={() => setSuccessMessage(null)}
              className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold uppercase tracking-wider pl-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ==================== TAB 1: ANALYTICS DASHBOARD ==================== */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            
            {/* Quick KPI Stats Summary Row */}
            {isLoadingAnalytics ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white h-24 rounded-xl border border-slate-200" />
                ))}
              </div>
            ) : analytics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Card 1: Total Trade Value */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 blur-xl rounded-full" />
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Total Trade Volume</span>
                      <span className="text-xl font-extrabold font-display text-slate-900 mt-1.5 block">
                        {formatAED(analytics.aggregates.totalTradeVolume)}
                      </span>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-800">
                      <TrendingUp className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                    <span className="text-emerald-600 font-bold">✓ Active License</span>
                    <span>JAFZA Bonds Registry</span>
                  </div>
                </div>

                {/* Card 2: Current Warehouse Stock Value */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-blue-500/5 blur-xl rounded-full" />
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">FZ Stock Valuation</span>
                      <span className="text-xl font-extrabold font-display text-slate-900 mt-1.5 block">
                        {formatAED(analytics.aggregates.stockValuationAED)}
                      </span>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-800">
                      <Boxes className="h-5 w-5 text-slate-700" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                    <span className="text-slate-800 font-bold">{products.reduce((s, p) => s + p.stockLevel, 0).toLocaleString()}</span>
                    <span>total units in bond</span>
                  </div>
                </div>

                {/* Card 3: Free Zone Duty Preserved (SAVED) */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 blur-xl rounded-full" />
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Customs Duty Saved</span>
                      <span className="text-xl font-extrabold font-display text-emerald-600 mt-1.5 block">
                        {formatAED(analytics.aggregates.totalDutySavedAED)}
                      </span>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-lg text-emerald-800">
                      <Coins className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono text-emerald-700">
                    <span className="font-bold">100% Tax Exempt</span>
                    <span>Free Zone liquidity reserve</span>
                  </div>
                </div>

                {/* Card 4: Mainland Tax/Duty Cleared */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-rose-500/5 blur-xl rounded-full" />
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Mainland Taxes Paid</span>
                      <span className="text-xl font-extrabold font-display text-slate-900 mt-1.5 block">
                        {formatAED(analytics.aggregates.totalDutyPaid + analytics.aggregates.totalVatPaid)}
                      </span>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-lg text-amber-800">
                      <ShieldCheck className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                    <span>Duty: </span>
                    <span className="font-bold text-slate-800">{formatAED(analytics.aggregates.totalDutyPaid)}</span>
                    <span className="text-slate-300">|</span>
                    <span>VAT: </span>
                    <span className="font-bold text-slate-800">{formatAED(analytics.aggregates.totalVatPaid)}</span>
                  </div>
                </div>

              </div>
            ) : null}

            {/* Detailed Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Trend Area Chart */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-display font-bold text-slate-900 tracking-wide text-sm sm:text-base">
                        Monthly Bonded Trade Movements (2026)
                      </h3>
                      <p className="text-xs text-slate-500">Inbound imports vs. re-exports and domestic mainland clearances</p>
                    </div>
                    <span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-2.5 py-1 rounded-md border border-slate-200">
                      Value: Millions AED
                    </span>
                  </div>

                  <div className="h-80 w-full text-xs">
                    {isLoadingAnalytics ? (
                      <div className="h-full w-full bg-slate-50 rounded animate-pulse" />
                    ) : analytics ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorImports" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#c5a880" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#c5a880" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorExports" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1e293b" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#1e293b" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorMainland" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#d97706" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="month" tickLine={false} axisLine={false} />
                          <YAxis 
                            tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} 
                            tickLine={false} 
                            axisLine={false} 
                          />
                          <RechartsTooltip 
                            formatter={(value: any) => [formatAED(Number(value)), "Value"]}
                            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                          />
                          <Legend iconType="circle" />
                          <Area 
                            type="monotone" 
                            name="International Imports"
                            dataKey="imports" 
                            stroke="#c5a880" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorImports)" 
                          />
                          <Area 
                            type="monotone" 
                            name="Re-Exports (Outbound)"
                            dataKey="exports" 
                            stroke="#1e293b" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorExports)" 
                          />
                          <Area 
                            type="monotone" 
                            name="Mainland Entry"
                            dataKey="mainland" 
                            stroke="#d97706" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorMainland)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Right Column: Category Distribution Donut Chart */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-bold text-slate-900 tracking-wide text-sm sm:text-base mb-1">
                    Bonded Commodity Mix
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">Valuation weight distribution by sector category</p>
                  
                  <div className="h-60 w-full relative flex items-center justify-center">
                    {isLoadingAnalytics ? (
                      <div className="h-full w-full bg-slate-50 rounded-full animate-pulse" />
                    ) : analytics && analytics.categoryBreakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.categoryBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {analytics.categoryBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value: any) => [formatAED(Number(value)), "Asset Valuation"]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-xs text-slate-400 font-mono">No stock valuation registered</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mt-4 text-[11px] font-mono border-t border-slate-100 pt-4">
                  {analytics?.categoryBreakdown.map((entry, index) => (
                    <div key={entry.name} className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="h-2 w-2 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                        />
                        <span className="text-slate-600 font-medium">{entry.name}</span>
                      </div>
                      <span className="text-slate-900 font-bold">{formatAED(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom Row Dashboard Info: Top Destinations & Recent Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Top Export Destinations Bar Chart */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-bold text-slate-900 tracking-wide text-sm sm:text-base mb-1">
                    Top Trade Destinations
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">Valuation of finished re-exports from Dubai hub</p>
                  
                  <div className="h-64 w-full text-xs">
                    {isLoadingAnalytics ? (
                      <div className="h-full w-full bg-slate-50 rounded animate-pulse" />
                    ) : analytics && analytics.destinationBreakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.destinationBreakdown} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                          <XAxis type="number" tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} tickLine={false} axisLine={false} />
                          <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} />
                          <RechartsTooltip formatter={(value: any) => [formatAED(Number(value)), "Trade Value"]} />
                          <Bar dataKey="value" fill="#c5a880" radius={[0, 4, 4, 0]}>
                            {analytics.destinationBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 font-mono">No export trade logged yet.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Customs Notifications Widget */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col">
                <h3 className="font-display font-bold text-slate-900 tracking-wide text-sm sm:text-base mb-1">
                  Customs Terminal Logs
                </h3>
                <p className="text-xs text-slate-500 mb-4">Live updates from Dubai Trade Integrated Hub</p>

                <div className="flex-1 divide-y divide-slate-100 text-xs">
                  
                  <div className="py-3 flex items-start gap-3">
                    <div className="bg-emerald-50 text-emerald-700 p-1.5 rounded-lg shrink-0 mt-0.5">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Customs Clearance Success</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-auto">10:48 AM</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">Bill of Entry BOE-2026-046182-DXB has been audited and cleared by terminal gate authority.</p>
                    </div>
                  </div>

                  <div className="py-3 flex items-start gap-3">
                    <div className="bg-amber-50 text-amber-700 p-1.5 rounded-lg shrink-0 mt-0.5">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Customs Audit Pending</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-auto">08:12 AM</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">Physical container weight check scheduled at Jebel Ali Terminal 2 for stock category "Electronics".</p>
                    </div>
                  </div>

                  <div className="py-3 flex items-start gap-3">
                    <div className="bg-blue-50 text-blue-700 p-1.5 rounded-lg shrink-0 mt-0.5">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">HS Classifier Auto-Sync</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-auto">Yesterday</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">Customs AI Agent database updated with the latest GCC Harmonized Commodity Classification Code modifications.</p>
                    </div>
                  </div>

                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-4 text-[11px] text-slate-500 font-mono leading-relaxed">
                  💡 <strong>Free Zone Fact:</strong> Businesses operating inside Dubai Free Zones enjoy complete duty deferral on raw inputs. Duties are only triggered when transporting finished goods out of the zone into Dubai mainland domestic areas.
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==================== TAB 2: WAREHOUSE STOCK (INVENTORY) ==================== */}
        {activeTab === "inventory" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Sub-Tab Navigation Header */}
            <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-sm border py-1.5 flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex space-x-1 w-full sm:w-auto">
                <button
                  onClick={() => setInventorySubTab("ledger")}
                  className={`flex items-center gap-2 py-2.5 px-4 rounded-lg font-display font-bold text-xs tracking-wider uppercase transition-all ${
                    inventorySubTab === "ledger"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Boxes className="h-4 w-4" />
                  Warehouse Stock Ledger
                </button>
                <button
                  onClick={() => setInventorySubTab("movements")}
                  className={`flex items-center gap-2 py-2.5 px-4 rounded-lg font-display font-bold text-xs tracking-wider uppercase transition-all ${
                    inventorySubTab === "movements"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <History className="h-4 w-4" />
                  Stock Movements & Auditing
                </button>
              </div>

              <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 self-end sm:self-auto">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Dubai Trade Linked Port Database Active</span>
              </div>
            </div>

            {/* SUB-VIEW 1: WAREHOUSE LEDGER PRODUCT GRID */}
            {inventorySubTab === "ledger" && (
              <div className="space-y-6">
                {/* Control Filters Bar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                  
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search SKU, Product Name, or HS Code..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                    />
                  </div>

                  {/* Dropdown filters */}
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setProductCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${
                          productCategoryFilter === cat
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {cat === "ALL" ? "All Categories" : cat}
                      </button>
                    ))}
                  </div>

                </div>

                {/* Main Split Layout: Products List vs Add Product Form */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  
                  {/* Left Column: Products Directory Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden xl:col-span-2 flex flex-col">
                    <div className="px-6 py-4 bg-slate-950 text-white border-b border-slate-800 flex justify-between items-center">
                      <div>
                        <h3 className="font-display font-bold text-sm tracking-wider">FZ WAREHOUSE STOCK LEVEL REGISTER</h3>
                        <p className="text-[10px] text-slate-400 font-mono">Bonded Ledger of Raw & Processed Commodities</p>
                      </div>
                      <span className="bg-amber-500 text-slate-950 font-bold font-mono text-[10px] px-2.5 py-0.5 rounded">
                        {filteredProducts.length} Active SKUs
                      </span>
                    </div>

                    <div className="overflow-x-auto flex-1">
                      {isLoadingProducts ? (
                        <div className="p-8 space-y-4 animate-pulse">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-10 bg-slate-100 rounded" />
                          ))}
                        </div>
                      ) : filteredProducts.length > 0 ? (
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px] font-mono">
                              <th className="py-3 px-4">SKU / Warehouse Loc</th>
                              <th className="py-3 px-4">Commodity Description</th>
                              <th className="py-3 px-4 text-center">HS Code & Duty</th>
                              <th className="py-3 px-4 text-center">In-Bond Stock</th>
                              <th className="py-3 px-4 text-right">Valuation (AED)</th>
                              <th className="py-3 px-4 text-center">Control Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {filteredProducts.map(prod => {
                              const isLowStock = prod.stockLevel <= (prod.minStockThreshold || 0);
                              return (
                                <tr key={prod.sku} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="py-3.5 px-4">
                                    <span className="font-bold text-slate-900 block">{prod.sku}</span>
                                    <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-1 font-mono">
                                      📍 {prod.warehouseLocation || "Unallocated"}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 font-sans max-w-xs">
                                    <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                      {prod.name}
                                      {prod.regulatoryBody !== "None" && (
                                        <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded text-[8px] font-bold text-amber-800 uppercase font-mono">
                                          {prod.regulatoryBody}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-slate-500 text-[11px] leading-normal mt-0.5 line-clamp-1">{prod.description}</p>
                                  </td>
                                  <td className="py-3.5 px-4 text-center">
                                    <span className="text-slate-800 font-bold block">{prod.hsCode}</span>
                                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Duty: {(prod.dutyRate * 100).toFixed(0)}%</span>
                                  </td>
                                  <td className="py-3.5 px-4 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                      <span className={`inline-block font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded text-[11px] ${
                                        prod.stockLevel === 0 ? "text-rose-600 bg-rose-50 border border-rose-200" : ""
                                      }`}>
                                        {prod.stockLevel.toLocaleString()} <span className="font-normal text-slate-400 text-[9px]">{prod.uom}</span>
                                      </span>
                                      {isLowStock && prod.stockLevel > 0 && (
                                        <span className="text-[8px] bg-amber-500/15 border border-amber-500/35 text-amber-800 px-1.5 py-0.5 rounded font-bold animate-pulse">
                                          ⚠️ LOW STOCK
                                        </span>
                                      )}
                                      {prod.stockLevel === 0 && (
                                        <span className="text-[8px] bg-rose-500/15 border border-rose-500/35 text-rose-800 px-1.5 py-0.5 rounded font-bold">
                                          🚨 OUT OF STOCK
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <span className="text-slate-950 font-bold block">{formatAED(prod.valueAED)}</span>
                                    <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">
                                      Total: {formatAED(prod.stockLevel * prod.valueAED)}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="flex items-center justify-center gap-1">
                                      {/* View details */}
                                      <button
                                        onClick={() => setSelectedProductDetail(prod)}
                                        title="View stock history details"
                                        className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-900 hover:text-white rounded text-slate-600 transition-all"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                      </button>

                                      {/* Stock adjust */}
                                      <button
                                        onClick={() => {
                                          setAdjustingProduct(prod);
                                          setAdjustType("ADD");
                                        }}
                                        title="Manually adjust stock (reconciliation / damage / shift)"
                                        className="p-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white rounded text-blue-600 transition-all"
                                      >
                                        <Sliders className="h-3.5 w-3.5" />
                                      </button>

                                      {/* Edit details */}
                                      <button
                                        onClick={() => {
                                          setEditingProduct(prod);
                                          setEditProductName(prod.name);
                                          setEditProductDesc(prod.description);
                                          setEditProductCategory(prod.category);
                                          setEditProductHsCode(prod.hsCode);
                                          setEditProductDutyRate(prod.dutyRate);
                                          setEditProductValue(prod.valueAED);
                                          setEditProductLocation(prod.warehouseLocation || "");
                                          setEditProductThreshold(prod.minStockThreshold || 10);
                                          setEditProductOrigin(prod.originCountry);
                                          setEditProductRegBody(prod.regulatoryBody);
                                          setEditProductUom(prod.uom);
                                        }}
                                        title="Edit product details"
                                        className="p-1.5 bg-amber-50 border border-amber-200 hover:bg-amber-600 hover:text-slate-950 rounded text-amber-600 transition-all"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </button>

                                      {/* Delete SKU */}
                                      <button
                                        onClick={() => handleDeleteProduct(prod.sku)}
                                        disabled={prod.stockLevel > 0}
                                        title={prod.stockLevel > 0 ? "Cannot delete product with active stock" : "Delete product registration"}
                                        className={`p-1.5 rounded transition-all ${
                                          prod.stockLevel > 0
                                            ? "bg-slate-50 border border-slate-100 text-slate-300 cursor-not-allowed"
                                            : "bg-rose-50 border border-rose-200 hover:bg-rose-600 hover:text-white text-rose-600"
                                        }`}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-12 text-center text-slate-400 font-mono">
                          No products matching current search filters found.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Add New Product Form with AI Integration */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                    
                    {/* Form header */}
                    <div className="px-6 py-4 bg-slate-900 text-white border-b border-slate-800 flex items-center gap-2">
                      <Plus className="h-4.5 w-4.5 text-amber-500" />
                      <h3 className="font-display font-bold text-sm tracking-wider">PROVISION NEW IN-BOND SKU</h3>
                    </div>

                    {/* Form container */}
                    <form onSubmit={handleAddProduct} className="p-6 space-y-4 text-xs flex-1">
                      
                      {formError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 font-mono text-[11px]">
                          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                          <span>{formError}</span>
                        </div>
                      )}

                      {/* AI Assisting Bar */}
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-amber-400" />
                          <span className="font-display font-bold text-white text-[11px] tracking-wide">AI Customs Agent Assist</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Type raw concept notes (e.g. "pure cold-pressed cosmetic argan oil in 50ml bottles"). AI will automatically retrieve the correct 8-digit HS Code, Dubai Duty rates, and ministry codes.
                        </p>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Argan oil cosmetic blend 50ml..."
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-slate-900 text-white border border-slate-800 rounded text-[11px] focus:outline-none focus:border-amber-500 font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleAIClassify}
                            disabled={isClassifying}
                            className="px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[10px] tracking-wider uppercase transition-colors shrink-0 disabled:opacity-50"
                          >
                            {isClassifying ? "Syncing..." : "Analyze"}
                          </button>
                        </div>
                      </div>

                      {/* AI Suggestion Display Result Block */}
                      {aiSuggestion && (
                        <div className="animate-in fade-in duration-250">
                          <AISuggestionBox 
                            suggestion={aiSuggestion} 
                            isLoading={isClassifying} 
                            onApply={applyAISuggestion} 
                          />
                        </div>
                      )}

                      {/* Form fields */}
                      <div className="grid grid-cols-2 gap-3 font-mono">
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">SKU identifier *</label>
                          <input
                            type="text"
                            placeholder="DXB-LU-PT102"
                            value={newProductSku}
                            onChange={(e) => setNewProductSku(e.target.value.toUpperCase())}
                            required
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Standard Category</label>
                          <select
                            value={newProductCategory}
                            onChange={(e) => setNewProductCategory(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                          >
                            <option value="Electronics">Electronics</option>
                            <option value="Cosmetics">Cosmetics</option>
                            <option value="Foodstuffs">Foodstuffs</option>
                            <option value="Luxury Goods">Luxury Goods</option>
                            <option value="Auto Parts">Auto Parts</option>
                            <option value="Medical Equipment">Medical Equipment</option>
                            <option value="General">General</option>
                          </select>
                        </div>
                      </div>

                      <div className="font-mono">
                        <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Commodity Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. AeroPro Dual-Core Processors"
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 font-mono">
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">GCC HS Code *</label>
                          <input
                            type="text"
                            placeholder="XXXX.XX.XX"
                            value={newProductHsCode}
                            onChange={(e) => setNewProductHsCode(e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Duty Rate (%)</label>
                          <select
                            value={newProductDutyRate}
                            onChange={(e) => setNewProductDutyRate(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                          >
                            <option value="0.05">5% (Standard UAE)</option>
                            <option value="0.00">0% (Medical/Food Exempt)</option>
                            <option value="0.10">10% (Special Duty)</option>
                            <option value="0.50">50% (Excise Goods)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 font-mono">
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Unit Valuation (AED) *</label>
                          <input
                            type="number"
                            placeholder="e.g. 450"
                            value={newProductValue}
                            onChange={(e) => setNewProductValue(e.target.value === "" ? "" : Number(e.target.value))}
                            required
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Initial In-Bond Stock</label>
                          <input
                            type="number"
                            placeholder="e.g. 500"
                            value={newProductStock}
                            onChange={(e) => setNewProductStock(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 font-mono">
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Unit of Measure</label>
                          <select
                            value={newProductUom}
                            onChange={(e) => setNewProductUom(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                          >
                            <option value="PCS">PCS</option>
                            <option value="KGS">KGS</option>
                            <option value="CTNS">CTNS</option>
                            <option value="TNS">TONNES</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Origin Country</label>
                          <input
                            type="text"
                            placeholder="e.g. Switzerland"
                            value={newProductOrigin}
                            onChange={(e) => setNewProductOrigin(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">UAE Ministry</label>
                          <select
                            value={newProductRegBody}
                            onChange={(e) => setNewProductRegBody(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                          >
                            <option value="None">None (General)</option>
                            <option value="TDRA">TDRA</option>
                            <option value="Dubai Municipality">Dubai Muni</option>
                            <option value="MOHAP">MOHAP</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 font-mono">
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Warehouse Location (Zone/Row/Bin)</label>
                          <input
                            type="text"
                            placeholder="e.g. Zone A - Row 03 - Bin B1"
                            value={newProductLocation}
                            onChange={(e) => setNewProductLocation(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Min Stock Warning Level Alert</label>
                          <input
                            type="number"
                            placeholder="e.g. 100"
                            value={newProductThreshold}
                            onChange={(e) => setNewProductThreshold(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                          />
                        </div>
                      </div>

                      <div className="font-mono">
                        <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Customs Declaration Product Details Description</label>
                        <textarea
                          placeholder="Specify materials, tech features, ingredients, or retail packaging specs compliant with customs guidelines..."
                          rows={2}
                          value={newProductDesc}
                          onChange={(e) => setNewProductDesc(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingProduct}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-wider uppercase rounded-lg transition-colors shadow-sm mt-4 disabled:opacity-50"
                      >
                        {isSubmittingProduct ? "Registering SKU..." : "Save to Warehouse Index"}
                      </button>

                    </form>

                  </div>

                </div>
              </div>
            )}

            {/* SUB-VIEW 2: STOCK MOVEMENTS LOGS (AUDIT TRAILS) */}
            {inventorySubTab === "movements" && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
                <div className="px-6 py-4 bg-slate-950 text-white border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="font-display font-bold text-sm tracking-wider">STOCK MOVEMENTS LEDGER & AUDIT TRAIL</h3>
                    <p className="text-[10px] text-slate-400 font-mono">Physical & Regulatory Stock Shift Ledger Transactions</p>
                  </div>
                  
                  {/* Ledger summary counters */}
                  <div className="flex gap-2">
                    <span className="bg-emerald-500/10 text-emerald-400 font-bold font-mono text-[10px] px-2.5 py-0.5 rounded border border-emerald-500/20">
                      Inbounds: {stockLogs.filter(l => l.type === "INBOUND" || l.type === "ADJUSTMENT_ADD").length}
                    </span>
                    <span className="bg-amber-500/10 text-amber-400 font-bold font-mono text-[10px] px-2.5 py-0.5 rounded border border-amber-500/20">
                      Outbounds: {stockLogs.filter(l => l.type === "OUTBOUND" || l.type === "ADJUSTMENT_SUB" || l.type === "DAMAGE").length}
                    </span>
                  </div>
                </div>

                {/* Filters for Stock logs */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search movements by SKU, notes, operator, etc..."
                      value={stockLogSearch}
                      onChange={(e) => setStockLogSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { key: "ALL", label: "All Movements" },
                      { key: "INBOUND", label: "Inbound Cargo" },
                      { key: "OUTBOUND", label: "Outbound Release" },
                      { key: "DAMAGE", label: "Damage Writes" },
                      { key: "RECONCILIATION", label: "Audits / Reconcile" }
                    ].map(t => (
                      <button
                        key={t.key}
                        onClick={() => setStockLogTypeFilter(t.key)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${
                          stockLogTypeFilter === t.key
                            ? "bg-slate-900 text-white"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audit table */}
                <div className="overflow-x-auto">
                  {isLoadingStockLogs ? (
                    <div className="p-8 space-y-3 animate-pulse">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-10 bg-slate-100 rounded" />
                      ))}
                    </div>
                  ) : filteredStockLogs.length > 0 ? (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px] font-mono">
                          <th className="py-3 px-4">Transaction ID & Date</th>
                          <th className="py-3 px-4">Commodity / SKU</th>
                          <th className="py-3 px-4 text-center">Movement Type</th>
                          <th className="py-3 px-4 text-center">Quantity Delta</th>
                          <th className="py-3 px-4 text-center">Ledger Shift</th>
                          <th className="py-3 px-4">Notes / Context</th>
                          <th className="py-3 px-4">Operator Agency</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {filteredStockLogs.map(log => {
                          let typeBadgeStyle = "bg-slate-100 text-slate-800";
                          let sign = "";
                          let signColor = "text-slate-900";
                          
                          switch (log.type) {
                            case "INBOUND":
                            case "ADJUSTMENT_ADD":
                              typeBadgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-100 border";
                              sign = "+";
                              signColor = "text-emerald-600 font-bold";
                              break;
                            case "OUTBOUND":
                            case "ADJUSTMENT_SUB":
                              typeBadgeStyle = "bg-amber-50 text-amber-800 border-amber-100 border";
                              sign = "-";
                              signColor = "text-amber-600 font-bold";
                              break;
                            case "DAMAGE":
                              typeBadgeStyle = "bg-rose-50 text-rose-800 border-rose-100 border";
                              sign = "-";
                              signColor = "text-rose-600 font-bold";
                              break;
                            case "RECONCILIATION":
                              typeBadgeStyle = "bg-purple-50 text-purple-800 border-purple-100 border";
                              sign = "±";
                              signColor = "text-purple-600 font-bold";
                              break;
                          }

                          return (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-900 block">{log.id}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">{log.date}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-900 block">{log.sku}</span>
                                <span className="text-[10px] text-slate-500 block truncate max-w-[160px] font-sans">{log.productName}</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${typeBadgeStyle}`}>
                                  {log.type.replace("_", " ")}
                                </span>
                              </td>
                              <td className={`py-3 px-4 text-center font-bold ${signColor}`}>
                                {sign} {log.quantity.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-center font-medium text-slate-500 text-[11px]">
                                {log.prevStock.toLocaleString()} ➔ <span className="text-slate-900 font-bold">{log.newStock.toLocaleString()}</span>
                              </td>
                              <td className="py-3 px-4 text-slate-600 font-sans max-w-xs truncate" title={log.notes}>
                                {log.notes}
                              </td>
                              <td className="py-3 px-4 text-slate-700 text-[11px]">
                                👤 {log.operator || "System"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-12 text-center text-slate-400 font-mono">
                      No transactions registered or matching search filters.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ==================== TAB 3: CUSTOMS DECLARATIONS ==================== */}
        {activeTab === "customs" && (
          <div className="space-y-8">
            
            {/* Split Form & Logs Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Left Form: File New Customs Declaration */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
                <div className="px-6 py-4 bg-slate-900 text-white border-b border-slate-800 flex items-center gap-2">
                  <FileSpreadsheet className="h-4.5 w-4.5 text-amber-500" />
                  <h3 className="font-display font-bold text-sm tracking-wider">FILE DUBAI CUSTOMS DECLARATION</h3>
                </div>

                <form onSubmit={handleAddDeclaration} className="p-6 space-y-4 text-xs font-mono">
                  
                  {formError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-[11px]">
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Tab Selector for Declaration Type */}
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1.5">Declaration Protocol Type</label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
                      
                      <button
                        type="button"
                        onClick={() => setDecType("IMPORT")}
                        className={`py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                          decType === "IMPORT"
                            ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Inbound
                      </button>

                      <button
                        type="button"
                        onClick={() => setDecType("EXPORT")}
                        className={`py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                          decType === "EXPORT"
                            ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Re-Export
                      </button>

                      <button
                        type="button"
                        onClick={() => setDecType("MAINLAND_IMPORT")}
                        className={`py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                          decType === "MAINLAND_IMPORT"
                            ? "bg-white text-slate-900 shadow-sm border border-slate-200 animate-pulse border-amber-300"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Mainland Cleared
                      </button>

                    </div>
                  </div>

                  {/* Interactive explanation based on selection */}
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 leading-normal text-[11px] font-sans text-slate-600">
                    {decType === "IMPORT" && (
                      <p>
                        📥 <strong>Inbound Transfer:</strong> Move commodities from international vessels directly into the JAFZA Bonded Warehouse. No local customs tariffs or VAT applied under Bond Guarantee.
                      </p>
                    )}
                    {decType === "EXPORT" && (
                      <p>
                        📤 <strong>Re-Export Transfer:</strong> Ship bonded commodities out to international markets (non-GCC). Free Zone bond guarantees discharge 100% of duties, enabling 0% duty operations.
                      </p>
                    )}
                    {decType === "MAINLAND_IMPORT" && (
                      <p className="text-amber-800">
                        🚨 <strong>Mainland Clearance Duty Trigger:</strong> Transport goods from Free Zone Bonded Warehouse into Dubai mainland. Triggers standard 5% Customs Duty and 5% VAT payable immediately.
                      </p>
                    )}
                  </div>

                  {/* Form fields */}
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Select Product SKU *</label>
                    <select
                      value={decSku}
                      onChange={(e) => setDecSku(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                    >
                      {products.map(p => (
                        <option key={p.sku} value={p.sku}>
                          {p.sku} - {p.name} (Stock: {p.stockLevel} {p.uom})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Quantity *</label>
                      <input
                        type="number"
                        placeholder="e.g. 100"
                        value={decQty}
                        onChange={(e) => setDecQty(e.target.value === "" ? "" : Number(e.target.value))}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Customs Office</label>
                      <select
                        value={decCustomsOffice}
                        onChange={(e) => setDecCustomsOffice(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                      >
                        <option value="Jebel Ali Customs Port">Jebel Ali Port</option>
                        <option value="DXB Cargo Customs Terminal">DXB Cargo Terminal</option>
                        <option value="DAFZA Airport Customs">DAFZA Customs</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Logistics Carrier</label>
                      <input
                        type="text"
                        placeholder="e.g. Maersk Line"
                        value={decCarrierName}
                        onChange={(e) => setDecCarrierName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                        {decType === "IMPORT" ? "Source Supplier Origin" : "Destination Country"}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Singapore"
                        value={decDestination}
                        onChange={(e) => setDecDestination(e.target.value)}
                        disabled={decType === "MAINLAND_IMPORT"}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Real-time Duty/VAT Estimator panel */}
                  {decSku && decQty !== "" && decQty > 0 && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4 space-y-2 text-xs">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                        Filing Assessment Estimator (AED)
                      </span>
                      
                      {(() => {
                        const product = products.find(p => p.sku === decSku);
                        if (!product) return null;
                        const totalVal = product.valueAED * Number(decQty);
                        const dutyRate = product.dutyRate;
                        
                        let estimatedDuty = 0;
                        let estimatedVat = 0;

                        if (decType === "MAINLAND_IMPORT") {
                          estimatedDuty = totalVal * dutyRate;
                          estimatedVat = (totalVal + estimatedDuty) * 0.05;
                        }

                        return (
                          <div className="space-y-1.5 pt-1.5 border-t border-slate-200">
                            <div className="flex justify-between text-slate-500">
                              <span>Cargo Value:</span>
                              <span className="font-bold text-slate-900">{formatAED(totalVal)}</span>
                            </div>
                            
                            <div className="flex justify-between text-slate-500">
                              <span>Customs Duty ({(dutyRate * 100).toFixed(0)}%):</span>
                              <span className="font-bold text-slate-900">
                                {decType === "MAINLAND_IMPORT" ? formatAED(estimatedDuty) : "AED 0.00 (Bond Deferral)"}
                              </span>
                            </div>

                            <div className="flex justify-between text-slate-500">
                              <span>VAT (5%):</span>
                              <span className="font-bold text-slate-900">
                                {decType === "MAINLAND_IMPORT" ? formatAED(estimatedVat) : "AED 0.00 (Tax Deferral)"}
                              </span>
                            </div>

                            <div className="flex justify-between font-bold text-slate-950 text-sm border-t border-slate-200 pt-2">
                              <span>Estimated Charges:</span>
                              <span>{formatAED(estimatedDuty + estimatedVat)}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingDeclaration}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-wider uppercase rounded-lg transition-colors shadow-sm mt-4 disabled:opacity-50"
                  >
                    {isSubmittingDeclaration ? "Filing Bill of Entry..." : "Submit to Dubai Trade Gate"}
                  </button>

                </form>
              </div>

              {/* Right Columns: Declarations History Logs */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden xl:col-span-2 flex flex-col justify-between">
                <div>
                  <div className="px-6 py-4 bg-slate-950 text-white border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display font-bold text-sm tracking-wider">DUBAI CUSTOMS ELECTRONIC DECLARATION LOG</h3>
                      <p className="text-[10px] text-slate-400 font-mono">Official Bond ledger and Bill of Entry logs</p>
                    </div>

                    <div className="flex gap-2">
                      <select
                        value={declarationTypeFilter}
                        onChange={(e) => setDeclarationTypeFilter(e.target.value)}
                        className="bg-slate-800 text-white border border-slate-700 rounded-md py-1 px-2.5 text-[10px] font-mono outline-none"
                      >
                        <option value="ALL">All Types</option>
                        <option value="IMPORT">IMPORT (Inbound)</option>
                        <option value="EXPORT">EXPORT (Re-export)</option>
                        <option value="MAINLAND_IMPORT">MAINLAND cleared</option>
                      </select>
                    </div>
                  </div>

                  {/* Filter Search */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search Declaration Ref, SKU, Carrier, or Product name..."
                        value={declarationSearch}
                        onChange={(e) => setDeclarationSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    {isLoadingDeclarations ? (
                      <div className="p-8 space-y-4 animate-pulse">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-10 bg-slate-100 rounded" />
                        ))}
                      </div>
                    ) : filteredDeclarations.length > 0 ? (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px] font-mono">
                            <th className="py-2.5 px-4">BOE Reference</th>
                            <th className="py-2.5 px-4">Product / SKU</th>
                            <th className="py-2.5 px-4 text-center">Filing Date</th>
                            <th className="py-2.5 px-4 text-center">Protocol Type</th>
                            <th className="py-2.5 px-4 text-right">Value (AED)</th>
                            <th className="py-2.5 px-4 text-center">Customs Document</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {filteredDeclarations.map(dec => (
                            <tr key={dec.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-900 block">{dec.referenceNumber}</span>
                                <span className="text-[10px] text-slate-500 font-sans mt-0.5 block">{dec.customsOffice}</span>
                              </td>
                              <td className="py-3 px-4 max-w-xs font-sans">
                                <span className="font-bold text-slate-900 block line-clamp-1">{dec.productName}</span>
                                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">SKU: {dec.sku} | Qty: {dec.quantity.toLocaleString()}</span>
                              </td>
                              <td className="py-3 px-4 text-center text-slate-500 font-semibold">
                                {dec.date}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                                  dec.type === "IMPORT" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" :
                                  dec.type === "EXPORT" ? "bg-blue-50 border border-blue-200 text-blue-700" :
                                  "bg-amber-50 border border-amber-200 text-amber-700"
                                }`}>
                                  {dec.type}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right text-slate-950 font-bold">
                                {formatAED(dec.valueAED)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => setSelectedDeclaration(dec)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                                >
                                  View Bill
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-12 text-center text-slate-400 font-mono">
                        No declarations matching search filters found.
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==================== TAB 4: HS CODE DIRECTORY ==================== */}
        {activeTab === "hscodes" && (
          <div className="space-y-8">
            
            {/* Introductory Explanation */}
            <div className="bg-slate-900 p-8 rounded-xl text-white border border-slate-800 relative overflow-hidden shadow-md">
              <div className="absolute top-0 right-0 h-48 w-48 bg-amber-500/10 blur-3xl rounded-full" />
              <h2 className="text-xl font-display font-extrabold tracking-wide text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-amber-500" />
                GCC Common Customs HS-Tariff Directory
              </h2>
              <p className="text-xs text-slate-400 max-w-3xl mt-2 leading-relaxed font-sans">
                The Harmonized Commodity Description and Coding System (HS) is an internationally standardized system of names and numbers to classify traded products. Dubai Customs enforces strict compliance on HS declarations. Below are the key trade groups processed at AL-SHARQ Free Zone logistics terminals.
              </p>
            </div>

            {/* Standard Directory Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              
              {/* Card 1 */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest">Chapter 85</span>
                    <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold font-mono px-2 py-0.5 rounded">
                      TDRA Approved
                    </span>
                  </div>
                  <h4 className="font-display font-extrabold text-slate-900 tracking-wide text-sm sm:text-base">
                    Electrical Machinery & Electronics
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Microprocessors, solid-state storage devices, smart controllers, wireless networking machinery, telecommunication hardware, and micro-modules.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] font-mono text-slate-600">
                    <div>• <strong>Primary HS Headings:</strong> 8542.xx.xx, 8517.xx.xx</div>
                    <div>• <strong>UAE Mainland Tariff:</strong> 5.0% Standard</div>
                    <div>• <strong>Permits Required:</strong> Type Approval from TDRA UAE</div>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest">Chapter 33</span>
                    <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold font-mono px-2 py-0.5 rounded">
                      Montaji Portal
                    </span>
                  </div>
                  <h4 className="font-display font-extrabold text-slate-900 tracking-wide text-sm sm:text-base">
                    Cosmetics, Perfumery & Oils
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Essential oils, blended perfumes, aromatic cosmetics, toilet waters, luxury Oud and Amber concentrated blends.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] font-mono text-slate-600">
                    <div>• <strong>Primary HS Headings:</strong> 3303.00.00, 3304.xx.xx</div>
                    <div>• <strong>UAE Mainland Tariff:</strong> 5.0% Standard</div>
                    <div>• <strong>Permits Required:</strong> Dubai Municipality Approval</div>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest">Chapter 08</span>
                    <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold font-mono px-2 py-0.5 rounded">
                      FIRS Food Portal
                    </span>
                  </div>
                  <h4 className="font-display font-extrabold text-slate-900 tracking-wide text-sm sm:text-base">
                    Edible Fruits & Pistachios
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Shelled pistachios, organic dates, premium almonds, dried legumes, and preserved foodstuff staple commodities.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] font-mono text-slate-600">
                    <div>• <strong>Primary HS Headings:</strong> 0802.52.00, 0804.xx.xx</div>
                    <div>• <strong>UAE Mainland Tariff:</strong> 0.0% Exempt (Staples)</div>
                    <div>• <strong>Permits Required:</strong> Phytosanitary Inspection Certificate</div>
                  </div>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest">Chapter 91</span>
                    <span className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold font-mono px-2 py-0.5 rounded">
                      Customs Audit Valuation
                    </span>
                  </div>
                  <h4 className="font-display font-extrabold text-slate-900 tracking-wide text-sm sm:text-base">
                    Clocks, Watches & Chronos
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Wristwatches of solid gold or clad with precious metals, chronographs, stopwatches, fine automatic mechanical movements.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] font-mono text-slate-600">
                    <div>• <strong>Primary HS Headings:</strong> 9101.xx.xx, 9102.xx.xx</div>
                    <div>• <strong>UAE Mainland Tariff:</strong> 5.0% Standard</div>
                    <div>• <strong>Permits Required:</strong> High-Value Appraisal Audit Certificate</div>
                  </div>
                </div>
              </div>

              {/* Card 5 */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest">Chapter 87</span>
                    <span className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold font-mono px-2 py-0.5 rounded">
                      GCC Standards Compliance
                    </span>
                  </div>
                  <h4 className="font-display font-extrabold text-slate-900 tracking-wide text-sm sm:text-base">
                    Vehicles & Auto Spare Parts
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Braking compound assemblies, automotive friction brake pads, transmission mechanics, filters, and vehicle chassis spares.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] font-mono text-slate-600">
                    <div>• <strong>Primary HS Headings:</strong> 8708.30.00, 8708.xx.xx</div>
                    <div>• <strong>UAE Mainland Tariff:</strong> 5.0% Standard</div>
                    <div>• <strong>Permits Required:</strong> GSO Compliance Certificate</div>
                  </div>
                </div>
              </div>

              {/* Card 6 */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest">Chapter 90</span>
                    <span className="bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold font-mono px-2 py-0.5 rounded">
                      MOHAP Approved
                    </span>
                  </div>
                  <h4 className="font-display font-extrabold text-slate-900 tracking-wide text-sm sm:text-base">
                    Medical & Surgical Instruments
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Continuous glucose/insulin pods, sterile surgical monitors, electronic surgical diagnostic equipment, and medical equipment supplies.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] font-mono text-slate-600">
                    <div>• <strong>Primary HS Headings:</strong> 9018.xx.xx, 9021.xx.xx</div>
                    <div>• <strong>UAE Mainland Tariff:</strong> 0.0% Exempt (Medical Support)</div>
                    <div>• <strong>Permits Required:</strong> MOHAP UAE Medical Device Import Clearance</div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==================== TAB 5: INVOICES PORTAL ==================== */}
        {activeTab === "invoices" && (
          <div className="space-y-8 animate-in fade-in duration-150">
            
            {/* Header Description Banner */}
            <div className="bg-slate-900 p-8 rounded-xl text-white border border-slate-800 relative overflow-hidden shadow-md">
              <div className="absolute top-0 right-0 h-48 w-48 bg-amber-500/10 blur-3xl rounded-full" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                <div>
                  <h2 className="text-xl font-display font-extrabold tracking-wide text-white flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-amber-500" />
                    Financial Invoicing & Stock Ledger
                  </h2>
                  <p className="text-xs text-slate-400 max-w-3xl mt-2 leading-relaxed font-sans">
                    Issue VAT-compliant Sales Invoices to regional buyers or record inbound Purchase Invoices to automatically replenish bonded stock levels. All transactions generate immediate ledger entries.
                  </p>
                </div>
                <div className="flex gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                  <button
                    onClick={() => {
                      setSettingsCompanyName(invoiceSettings.companyName);
                      setSettingsCompanySubtitle(invoiceSettings.companySubtitle);
                      setSettingsAddressText(invoiceSettings.addressLines.join("\n"));
                      setSettingsDeclaration(invoiceSettings.officialDeclaration);
                      setSettingsComplianceNote(invoiceSettings.bottomComplianceNote);
                      setSettingsSignatureName(invoiceSettings.signatureName);
                      setSettingsSignatureDesignation(invoiceSettings.signatureDesignation);
                      setSettingsFormError(null);
                      setIsEditingInvoiceSettings(true);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-md shrink-0"
                  >
                    <Sliders className="h-4 w-4 text-amber-500" />
                    Customize Template
                  </button>
                  <button
                    onClick={() => {
                      setNewInvoiceType("SALES");
                      setNewInvoiceItems([{ sku: "", quantity: "", priceAED: "" }]);
                      setNewInvoiceClientSupplier("");
                      setNewInvoiceRef("");
                      setInvoiceFormError(null);
                      setIsCreatingInvoice(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-md border border-emerald-500/20 shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    New Sales Invoice
                  </button>
                  <button
                    onClick={() => {
                      setNewInvoiceType("PURCHASE");
                      setNewInvoiceItems([{ sku: "", quantity: "", priceAED: "" }]);
                      setNewInvoiceClientSupplier("");
                      setNewInvoiceRef("");
                      setInvoiceFormError(null);
                      setIsCreatingInvoice(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-md border border-blue-500/20 shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    New Purchase Invoice
                  </button>
                </div>
              </div>
            </div>

            {/* Financial Summary Aggregates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Summary Card 1: Sales */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Gross Sales Invoiced</span>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {formatAED(invoices.filter(i => i.type === "SALES").reduce((sum, i) => sum + i.totalAmount, 0))}
                  </h3>
                  <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 font-mono">
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-none" />
                    Outbound Warehouse Releases
                  </span>
                </div>
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg border border-emerald-100">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>

              {/* Summary Card 2: Purchases */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Stock Replenishments</span>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {formatAED(invoices.filter(i => i.type === "PURCHASE").reduce((sum, i) => sum + i.totalAmount, 0))}
                  </h3>
                  <span className="text-[9px] text-blue-600 font-bold flex items-center gap-1 font-mono">
                    <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-none" />
                    Inbound Restocking Costs
                  </span>
                </div>
                <div className="bg-blue-50 text-blue-600 p-3 rounded-lg border border-blue-100">
                  <ArrowDownLeft className="h-5 w-5" />
                </div>
              </div>

              {/* Summary Card 3: Net Trade Balance */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                {(() => {
                  const s = invoices.filter(i => i.type === "SALES").reduce((sum, i) => sum + i.totalAmount, 0);
                  const p = invoices.filter(i => i.type === "PURCHASE").reduce((sum, i) => sum + i.totalAmount, 0);
                  const net = s - p;
                  return (
                    <>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Net Ledger Balance</span>
                        <h3 className={`text-xl font-extrabold ${net >= 0 ? "text-slate-900" : "text-rose-600"}`}>
                          {formatAED(net)}
                        </h3>
                        <span className="text-[9px] text-slate-500 font-mono">
                          Financial Trade Margins
                        </span>
                      </div>
                      <div className={`p-3 rounded-lg border ${net >= 0 ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                        <Coins className="h-5 w-5" />
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Summary Card 4: Total Invoices */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Registered Invoices</span>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {invoices.length}
                  </h3>
                  <span className="text-[9px] text-slate-500 font-mono">
                    Total Inbound & Outbound Records
                  </span>
                </div>
                <div className="bg-slate-50 text-slate-600 p-3 rounded-lg border border-slate-200">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
              </div>

            </div>

            {/* Invoices List Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              
              {/* Table Controls Header */}
              <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between text-xs font-mono">
                
                {/* Search Bar */}
                <div className="relative w-full md:max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    placeholder="Search invoices by ID, Supplier, Client, or SKU..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-all font-sans"
                  />
                </div>

                {/* Filter Selector */}
                <div className="flex gap-2 w-full md:w-auto justify-end">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest self-center mr-2">Filter Type:</span>
                  {(["ALL", "SALES", "PURCHASE"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setInvoiceTypeFilter(type)}
                      className={`px-3.5 py-1.5 rounded-lg border font-bold text-[10px] uppercase tracking-wider transition-all ${
                        invoiceTypeFilter === type
                          ? "bg-slate-900 text-white border-slate-950"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {type === "ALL" ? "All Invoices" : type === "SALES" ? "Sales" : "Purchases"}
                    </button>
                  ))}
                </div>

              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-5 w-24">Date</th>
                      <th className="py-3 px-5 w-28">Invoice ID</th>
                      <th className="py-3 px-5 w-24">Type</th>
                      <th className="py-3 px-5">Buyer / Supplier</th>
                      <th className="py-3 px-5">Commodity Summary</th>
                      <th className="py-3 px-5 text-right w-28">Subtotal</th>
                      <th className="py-3 px-5 text-right w-24">VAT Tax</th>
                      <th className="py-3 px-5 text-right w-32">Total Value</th>
                      <th className="py-3 px-5 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoadingInvoices ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400 font-mono text-xs">
                          <span className="inline-block animate-pulse">Syncing with Port Financial Registry Database...</span>
                        </td>
                      </tr>
                    ) : invoices.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400 font-mono text-xs">
                          No invoices found in registry. Generate a sales/purchase invoice to begin.
                        </td>
                      </tr>
                    ) : (
                      invoices
                        .filter(i => {
                          const query = invoiceSearch.toLowerCase();
                          const matchesSearch = i.id.toLowerCase().includes(query) ||
                                                i.clientOrSupplierName.toLowerCase().includes(query) ||
                                                (i.referenceNumber && i.referenceNumber.toLowerCase().includes(query)) ||
                                                i.items.some(item => item.sku.toLowerCase().includes(query) || item.productName.toLowerCase().includes(query));
                          const matchesType = invoiceTypeFilter === "ALL" || i.type === invoiceTypeFilter;
                          return matchesSearch && matchesType;
                        })
                        .map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/60 font-sans transition-colors">
                            <td className="py-4 px-5 font-mono text-[11px] text-slate-500 whitespace-nowrap">{inv.date}</td>
                            <td className="py-4 px-5 font-mono text-[11px] font-bold text-amber-700 whitespace-nowrap">{inv.id}</td>
                            <td className="py-4 px-5 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                                  inv.type === "SALES"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                }`}
                              >
                                {inv.type === "SALES" ? "Outbound" : "Inbound"}
                              </span>
                            </td>
                            <td className="py-4 px-5 font-bold text-slate-900 whitespace-nowrap max-w-[180px] overflow-hidden text-ellipsis">{inv.clientOrSupplierName}</td>
                            <td className="py-4 px-5 text-slate-500 font-mono text-[11px]">
                              {inv.items.map((it) => `${it.sku} (x${it.quantity})`).join(", ")}
                            </td>
                            <td className="py-4 px-5 text-right font-mono text-[11px] text-slate-500 whitespace-nowrap">{formatAED(inv.subtotal)}</td>
                            <td className="py-4 px-5 text-right font-mono text-[11px] text-slate-500 whitespace-nowrap">
                              {inv.totalTax > 0 ? formatAED(inv.totalTax) : "0.00 (Exempt)"}
                            </td>
                            <td className="py-4 px-5 text-right font-mono text-[11px] font-extrabold text-slate-950 whitespace-nowrap">{formatAED(inv.totalAmount)}</td>
                            <td className="py-4 px-5 whitespace-nowrap text-center">
                              <button
                                onClick={() => setSelectedInvoice(inv)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider shadow-sm"
                              >
                                <Eye className="h-3 w-3" />
                                View Receipt
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Footer copyright */}
      <footer className="bg-slate-950 border-t border-slate-800 py-6 mt-12 text-slate-500 text-xs text-center font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:justify-between items-center gap-3">
          <span>© 2026 AL-SHARQ LOGISTICS GLOBAL FZCO. Bonded warehouse portal.</span>
          <span className="text-slate-400">Integrated with UAE Dubai Trade Gate Systems v4.11</span>
        </div>
      </footer>

      {/* Bill of Entry Modal overlay */}
      {selectedDeclaration && (
        <CustomsDocument 
          declaration={selectedDeclaration} 
          product={products.find(p => p.sku === selectedDeclaration.sku)}
          onClose={() => setSelectedDeclaration(null)} 
        />
      )}

      {/* Product Details & Stock History Audit Modal */}
      {selectedProductDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-950 text-white px-6 py-4 flex justify-between items-center border-b border-slate-800">
              <div>
                <span className="font-mono text-amber-500 font-bold text-xs tracking-wider uppercase">COMMODITY LEDGER RECORD</span>
                <h3 className="font-display font-extrabold text-base tracking-wide mt-0.5">{selectedProductDetail.sku} — {selectedProductDetail.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedProductDetail(null)}
                className="text-slate-400 hover:text-white transition-colors font-sans text-sm font-bold bg-slate-800/50 hover:bg-slate-800 px-3 py-1.5 rounded-lg"
              >
                Close (ESC)
              </button>
            </div>

            {/* Content Container */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs font-mono">
              {/* Dynamic Status / Metrics Display Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">CURRENT IN-BOND STOCK</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-extrabold text-slate-900">{selectedProductDetail.stockLevel.toLocaleString()}</span>
                    <span className="text-slate-500 font-bold text-xs">{selectedProductDetail.uom}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 block">Min Warn Level: {selectedProductDetail.minStockThreshold || 10}</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">BONDED WAREHOUSE LOC</span>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-lg font-extrabold text-slate-900">📍 {selectedProductDetail.warehouseLocation || "Unallocated"}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 block">Zone Bond Status: Active</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">ASSET VALUE AUDIT</span>
                  <div className="flex flex-col mt-2">
                    <span className="text-lg font-extrabold text-emerald-600">{formatAED(selectedProductDetail.stockLevel * selectedProductDetail.valueAED)}</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 block">Unit Price: {formatAED(selectedProductDetail.valueAED)}</span>
                  </div>
                </div>
              </div>

              {/* Product Specifications Table */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                <h4 className="font-display font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">Customs Registration Spec Sheet</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block">GCC HS CODE</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{selectedProductDetail.hsCode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">STANDARD DUTY RATE</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{(selectedProductDetail.dutyRate * 100).toFixed(0)}% (UAE standard)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">ORIGIN COUNTRY</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">🌐 {selectedProductDetail.originCountry}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">REGULATORY MINISTRY</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{selectedProductDetail.regulatoryBody || "None (General)"}</span>
                  </div>
                </div>
                {selectedProductDetail.description && (
                  <div className="pt-2 border-t border-slate-200 text-slate-600 leading-relaxed font-sans">
                    <strong className="font-mono text-[10px] text-slate-400 block">COMMODITY DESCRIPTION SUMMARY:</strong>
                    {selectedProductDetail.description}
                  </div>
                )}
              </div>

              {/* Product Stock Shift History log */}
              <div className="space-y-3">
                <h4 className="font-display font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <History className="h-4 w-4 text-slate-600" />
                  Product Ledger Shift Log Audit Trail
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[250px] overflow-y-auto">
                  {(() => {
                    const productLogs = stockLogs.filter(l => l.sku === selectedProductDetail.sku);
                    return productLogs.length > 0 ? (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[9px] border-b border-slate-200 sticky top-0">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Transaction</th>
                            <th className="py-2.5 px-3 text-right">Qty Delta</th>
                            <th className="py-2.5 px-3 text-right">Balance</th>
                            <th className="py-2.5 px-3">Notes & Inspector</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {productLogs.map(log => {
                            let deltaColor = "text-slate-900";
                            let sign = "";
                            if (log.type === "INBOUND" || log.type === "ADJUSTMENT_ADD") {
                              deltaColor = "text-emerald-600 font-bold";
                              sign = "+";
                            } else if (log.type === "OUTBOUND" || log.type === "ADJUSTMENT_SUB" || log.type === "DAMAGE") {
                              deltaColor = "text-rose-600 font-bold";
                              sign = "-";
                            }
                            return (
                              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-2 px-3 text-slate-400 text-[10px]">{log.date}</td>
                                <td className="py-2 px-3">
                                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">
                                    {log.type.replace("_", " ")}
                                  </span>
                                </td>
                                <td className={`py-2 px-3 text-right ${deltaColor}`}>{sign}{log.quantity.toLocaleString()}</td>
                                <td className="py-2 px-3 text-right text-slate-900 font-bold">{log.newStock.toLocaleString()}</td>
                                <td className="py-2 px-3 text-slate-500 text-[10px] truncate max-w-[180px]" title={`${log.notes} | Operator: ${log.operator}`}>
                                  {log.notes} <span className="text-[9px] text-slate-400">({log.operator})</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-8 text-center text-slate-400 font-mono">
                        No transactions registered for this SKU in the audit trails.
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-950 text-white px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-amber-500" />
                <h3 className="font-display font-bold text-sm tracking-wider">MANUAL BONDED STOCK ADJUSTMENT</h3>
              </div>
              <button 
                onClick={() => setAdjustingProduct(null)}
                className="text-slate-400 hover:text-white text-xs font-sans font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualAdjustment} className="p-6 space-y-4 text-xs font-mono">
              {adjustFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-[11px]">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{adjustFormError}</span>
                </div>
              )}

              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-slate-700 font-sans leading-relaxed text-[11px]">
                ⚠️ <strong>Audit Protocol Warning:</strong> This operation registers physical adjustments directly in the bonded warehouse ledger. All modifications are logged under customs audit protocol laws.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[9px] text-slate-400 block uppercase">Product SKU</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{adjustingProduct.sku}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[9px] text-slate-400 block uppercase">Current Stock</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {adjustingProduct.stockLevel.toLocaleString()} {adjustingProduct.uom}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Adjustment Action Type *</label>
                <select
                  value={adjustType}
                  onChange={(e: any) => setAdjustType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold outline-none focus:bg-white"
                >
                  <option value="ADD">➕ INBOUND ADJUSTMENT (Replenishment / Manual Add)</option>
                  <option value="SUB">➖ OUTBOUND ADJUSTMENT (Manual Release / Correction Sub)</option>
                  <option value="DAMAGE">🚨 DAMAGE WRITE-OFF (Unusable / Expired / Damaged)</option>
                  <option value="RECONCILIATION">⚖️ PHYSICAL COUNT RECONCILIATION (Audit / Balance)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Quantity Shift *</label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value === "" ? "" : Number(e.target.value))}
                    required
                    min={1}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Inspector / Operator ID</label>
                  <input
                    type="text"
                    placeholder="e.g. AL-SHARQ LOGS"
                    value={adjustOperator}
                    onChange={(e) => setAdjustOperator(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Notes / Audit Justification Reason *</label>
                <textarea
                  placeholder="Specify reason for manual inventory movement..."
                  rows={2}
                  required
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium outline-none focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjustment}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmittingAdjustment ? "Updating..." : "Commit Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Information Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-950 text-white px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4 text-amber-500" />
                <h3 className="font-display font-bold text-sm tracking-wider">EDIT SKU CUSTOMS SPECIFICATIONS</h3>
              </div>
              <button 
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-white text-xs font-sans font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditProduct} className="p-6 space-y-4 text-xs font-mono max-h-[80vh] overflow-y-auto">
              {editFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-[11px]">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{editFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block">PRODUCT SKU IDENTIFIER</span>
                  <span className="font-bold text-slate-900 mt-1 block">{editingProduct.sku}</span>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Category</label>
                  <select
                    value={editProductCategory}
                    onChange={(e) => setEditProductCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold outline-none focus:bg-white"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Cosmetics">Cosmetics</option>
                    <option value="Foodstuffs">Foodstuffs</option>
                    <option value="Luxury Goods">Luxury Goods</option>
                    <option value="Auto Parts">Auto Parts</option>
                    <option value="Medical Equipment">Medical Equipment</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Commodity Name *</label>
                <input
                  type="text"
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">GCC HS Code *</label>
                  <input
                    type="text"
                    value={editProductHsCode}
                    onChange={(e) => setEditProductHsCode(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Duty Rate (%)</label>
                  <select
                    value={editProductDutyRate}
                    onChange={(e) => setEditProductDutyRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold outline-none focus:bg-white"
                  >
                    <option value="0.05">5% (Standard UAE)</option>
                    <option value="0.00">0% (Medical/Food Exempt)</option>
                    <option value="0.10">10% (Special Duty)</option>
                    <option value="0.50">50% (Excise Goods)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Unit Valuation (AED) *</label>
                  <input
                    type="number"
                    value={editProductValue}
                    onChange={(e) => setEditProductValue(e.target.value === "" ? "" : Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Unit of Measure</label>
                  <select
                    value={editProductUom}
                    onChange={(e) => setEditProductUom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold outline-none focus:bg-white"
                  >
                    <option value="PCS">PCS</option>
                    <option value="KGS">KGS</option>
                    <option value="CTNS">CTNS</option>
                    <option value="TNS">TONNES</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Warehouse Location</label>
                  <input
                    type="text"
                    value={editProductLocation}
                    onChange={(e) => setEditProductLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Min Stock Threshold Alert</label>
                  <input
                    type="number"
                    value={editProductThreshold}
                    onChange={(e) => setEditProductThreshold(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Origin Country</label>
                  <input
                    type="text"
                    value={editProductOrigin}
                    onChange={(e) => setEditProductOrigin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">UAE Ministry Regulatory Body</label>
                  <select
                    value={editProductRegBody}
                    onChange={(e) => setEditProductRegBody(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold outline-none focus:bg-white"
                  >
                    <option value="None">None (General)</option>
                    <option value="TDRA">TDRA</option>
                    <option value="Dubai Municipality">Dubai Municipality</option>
                    <option value="MOHAP">MOHAP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Product Details Description</label>
                <textarea
                  value={editProductDesc}
                  onChange={(e) => setEditProductDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium outline-none focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Template Customization Modal */}
      {isEditingInvoiceSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-8 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="bg-slate-950 text-white px-6 py-4 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-amber-500" />
                <h3 className="font-display font-bold text-sm tracking-wider uppercase">
                  Customize Invoice Template Header & Footer
                </h3>
              </div>
              <button 
                onClick={() => setIsEditingInvoiceSettings(false)}
                className="text-slate-400 hover:text-white text-xs font-sans font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 space-y-4 text-xs font-mono overflow-y-auto flex-1">
              {settingsFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-[11px]">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{settingsFormError}</span>
                </div>
              )}

              {/* Company Identity Fields */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-200 pb-1.5 flex justify-between items-center">
                  <span>Invoice Header Identity</span>
                  <span className="text-[9px] text-amber-600 lowercase font-normal font-sans">customizes top branding</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GLOBAL CARGO GROUP FZCO"
                      value={settingsCompanyName}
                      onChange={(e) => setSettingsCompanyName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-950 font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Company Subtitle / Authority</label>
                    <input
                      type="text"
                      placeholder="e.g. DUBAI MULTI COMMODITIES CENTRE"
                      value={settingsCompanySubtitle}
                      onChange={(e) => setSettingsCompanySubtitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-950 font-bold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Company Contact & Address Lines (One item per line) *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Line 1: Plot or Suite detail&#10;Line 2: PO Box and City&#10;Line 3: Tax Registration Number (TRN)&#10;Line 4: Contact details"
                    value={settingsAddressText}
                    onChange={(e) => setSettingsAddressText(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-950 font-bold outline-none leading-relaxed"
                  />
                  <p className="text-[9px] text-slate-400 font-sans mt-1">
                    💡 This address area supports standard 5% VAT registered TRNs and official Dubai Free Zone contact coordinates.
                  </p>
                </div>
              </div>

              {/* Bottom Declaration & Footers */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-200 pb-1.5">
                  Invoice Footer & Customs Declaration
                </h4>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Official Declaration Note</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="State customs, tariff, and VAT exemption declarations."
                    value={settingsDeclaration}
                    onChange={(e) => setSettingsDeclaration(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-950 font-bold outline-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Signature Signee Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Jane Doe"
                      value={settingsSignatureName}
                      onChange={(e) => setSettingsSignatureName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-950 font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Signee Title / Role</label>
                    <input
                      type="text"
                      placeholder="e.g. Chief Accountant"
                      value={settingsSignatureDesignation}
                      onChange={(e) => setSettingsSignatureDesignation(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-950 font-bold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Bottom Compliance Notice Text</label>
                  <input
                    type="text"
                    placeholder="e.g. TRADING LICENCE NO: 9283921 • UAE LAW COMPLIANT"
                    value={settingsComplianceNote}
                    onChange={(e) => setSettingsComplianceNote(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-950 font-bold outline-none"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to restore the pristine Dubai Port authority header and footer? All customized values will be cleared.")) {
                      setSettingsCompanyName("AL-SHARQ LOGISTICS FZCO");
                      setSettingsCompanySubtitle("DUBAI FREE ZONE AUTHORITY • BONDED WAREHOUSE");
                      setSettingsAddressText([
                        "Plot 482, Logistics City, Jebel Ali Free Zone",
                        "PO Box 99201, Dubai, United Arab Emirates",
                        "TRN: 100428819400003 (Standard 5% VAT Registered)",
                        "Email: finance@alsharqfzco.ae | Tel: +971 4 800 WAREHOUSE"
                      ].join("\n"));
                      setSettingsDeclaration("These commodities are stored, sold, or replenished under the Jebel Ali Free Zone Bonded Warehouse provisions. Inbound purchases are subject to customs duty suspension. Outbound sales to mainland UAE are subject to 5% VAT and 5% custom tariffs upon clearance at Mainland Gate 4.");
                      setSettingsComplianceNote("UAE TAX LAW COMPLIANT TAX-INVOICE V2");
                      setSettingsSignatureName("M. Al-Maktoum");
                      setSettingsSignatureDesignation("Finance Director, Al-Sharq FZCO");
                    }
                  }}
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold transition-colors w-full sm:w-auto"
                >
                  Reset to Authority Defaults
                </button>

                <div className="flex gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditingInvoiceSettings(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors shadow-md flex items-center gap-1.5"
                  >
                    <ShieldCheck className="h-4 w-4 text-amber-500" />
                    Apply Custom Template
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Generation Modal */}
      {isCreatingInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-8 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="bg-slate-950 text-white px-6 py-4 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-amber-500" />
                <h3 className="font-display font-bold text-sm tracking-wider uppercase">
                  Generate {newInvoiceType} Invoice
                </h3>
              </div>
              <button 
                onClick={() => setIsCreatingInvoice(false)}
                className="text-slate-400 hover:text-white text-xs font-sans font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInvoiceSubmit} className="p-6 space-y-4 text-xs font-mono overflow-y-auto flex-1">
              {invoiceFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-[11px]">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{invoiceFormError}</span>
                </div>
              )}

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    {newInvoiceType === "SALES" ? "Buyer / Client Name *" : "Supplier / Consignor Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={newInvoiceType === "SALES" ? "e.g. Dubai Electronics Co" : "e.g. Seoul Semiconductors"}
                    value={newInvoiceClientSupplier}
                    onChange={(e) => setNewInvoiceClientSupplier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Reference / PO Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PO-2026-9921"
                    value={newInvoiceRef}
                    onChange={(e) => setNewInvoiceRef(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Status Select */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Payment Status</label>
                  <select
                    value={newInvoiceStatus}
                    onChange={(e: any) => setNewInvoiceStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold outline-none focus:bg-white"
                  >
                    <option value="PAID">PAID (Clear Ledger)</option>
                    <option value="UNPAID">UNPAID (Pending Account Receivable/Payable)</option>
                  </select>
                </div>
                <div className="bg-amber-50/40 p-3 rounded-lg border border-amber-200/50 text-[10.5px] font-sans text-slate-700 leading-relaxed">
                  💡 <strong>In Bond Protocol:</strong> {newInvoiceType === "SALES" 
                    ? "Outbound Sales deduct quantities from current warehouse stock levels." 
                    : "Inbound Purchases automatically replenish warehouse stock levels."}
                </div>
              </div>

              {/* Dynamic Items Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Commodity Items List</span>
                  <button
                    type="button"
                    onClick={addInvoiceItemLine}
                    className="text-[10px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    Add Item Line
                  </button>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {newInvoiceItems.map((item, idx) => {
                    const selectedProd = products.find(p => p.sku === item.sku);
                    const stockExceeded = newInvoiceType === "SALES" && selectedProd && Number(item.quantity) > selectedProd.stockLevel;
                    return (
                      <div key={idx} className="flex flex-col sm:flex-row items-stretch gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 relative">
                        {/* SKU Selector */}
                        <div className="flex-1">
                          <label className="text-[9px] text-slate-400 font-bold block mb-1">Product SKU *</label>
                          <select
                            value={item.sku}
                            required
                            onChange={(e) => updateInvoiceItemLine(idx, "sku", e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold outline-none"
                          >
                            <option value="">-- Select Product --</option>
                            {products.map(p => (
                              <option key={p.sku} value={p.sku}>
                                {p.sku} — {p.name} (Stock: {p.stockLevel} {p.uom})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Qty */}
                        <div className="w-full sm:w-24">
                          <label className="text-[9px] text-slate-400 font-bold block mb-1">Quantity *</label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={item.quantity}
                            onChange={(e) => updateInvoiceItemLine(idx, "quantity", e.target.value === "" ? "" : Number(e.target.value))}
                            className={`w-full px-2 py-1.5 bg-white border rounded-lg text-slate-900 font-bold outline-none ${
                              stockExceeded ? "border-rose-500 focus:border-rose-500 text-rose-700" : "border-slate-200"
                            }`}
                          />
                        </div>

                        {/* Price */}
                        <div className="w-full sm:w-28">
                          <label className="text-[9px] text-slate-400 font-bold block mb-1">Unit Price (AED) *</label>
                          <input
                            type="number"
                            min={0}
                            required
                            value={item.priceAED}
                            onChange={(e) => updateInvoiceItemLine(idx, "priceAED", e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold outline-none"
                          />
                        </div>

                        {/* Line Total */}
                        <div className="w-full sm:w-32 self-end text-right font-mono pr-2 py-1.5">
                          <span className="text-[9px] text-slate-400 block mb-0.5">Line Total</span>
                          <span className="font-extrabold text-slate-900 text-[11px]">
                            {item.sku && item.quantity && item.priceAED 
                              ? formatAED(Number(item.quantity) * Number(item.priceAED)) 
                              : "AED 0.00"}
                          </span>
                        </div>

                        {/* Remove button */}
                        {newInvoiceItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeInvoiceItemLine(idx)}
                            className="text-rose-500 hover:text-rose-700 absolute top-2 right-2 sm:relative sm:top-auto sm:right-auto sm:self-end sm:mb-1.5 bg-white sm:bg-transparent p-1 sm:p-0 rounded border border-slate-200 sm:border-none animate-none"
                            title="Remove Line"
                          >
                            <MinusCircle className="h-4 w-4" />
                          </button>
                        )}

                        {/* Stock limit alert */}
                        {stockExceeded && (
                          <div className="absolute -bottom-2.5 left-3 bg-rose-100 border border-rose-300 text-rose-800 text-[8px] px-1.5 py-0.5 rounded font-sans font-bold uppercase tracking-wider">
                            ⚠️ Warning: Requested quantity exceeds current in-bond stock level ({selectedProd?.stockLevel} available)!
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial Summary panel */}
              <div className="border-t border-slate-200 pt-4 font-mono space-y-1 text-right">
                {(() => {
                  const subtotal = newInvoiceItems.reduce((sum, item) => {
                    if (item.sku && item.quantity && item.priceAED) {
                      return sum + (Number(item.quantity) * Number(item.priceAED));
                    }
                    return sum;
                  }, 0);
                  const vatRate = newInvoiceType === "SALES" ? 0.05 : 0.00;
                  const vat = subtotal * vatRate;
                  const grandTotal = subtotal + vat;
                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 inline-block min-w-[280px] text-xs">
                      <div className="flex justify-between text-slate-600 gap-6">
                        <span>Items Subtotal:</span>
                        <span>{formatAED(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 gap-6 mt-1">
                        <span>{newInvoiceType === "SALES" ? "VAT Tax (5%):" : "Inbound Duty/VAT Suspension:"}</span>
                        <span>{formatAED(vat)}</span>
                      </div>
                      <div className="h-px bg-slate-200 my-2" />
                      <div className="flex justify-between font-extrabold text-slate-900 text-sm gap-6">
                        <span>Total Invoice Value:</span>
                        <span className="text-amber-700">{formatAED(grandTotal)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreatingInvoice(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvoice}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingInvoice ? (
                    "Processing..."
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Commit & Issue Invoice
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Invoice Tax Document Viewer overlay */}
      {selectedInvoice && (
        <InvoiceDocument
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          settings={invoiceSettings}
        />
      )}

    </div>
  );
}
