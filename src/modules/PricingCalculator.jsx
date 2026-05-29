import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  Calculator,
  DollarSign,
  Package,
  Plus,
  Save,
  Search,
  Tag,
  Target,
  Trash2
} from "lucide-react";

import { useAuth } from "../AuthContext.jsx";
import { useUnsavedChanges } from "../UnsavedChangesContext.jsx";
import {
  deleteProduct,
  getProducts,
  saveProduct
} from "../services/productService.js";
import StatCard from "../components/StatCard.jsx";

const categories = [
  "Produce",
  "Red Meat",
  "Poultry",
  "Protein",
  "Plant Starts",
  "Bread",
  "Spices",
  "Condiments",
  "Eggs",
  "Dairy",
  "Baked Goods",
  "Prepared Foods",
  "Flowers",
  "Candles",
  "Soap / Body Care",
  "Jewelry",
  "Crafts",
  "Other"
];

const productStatuses = ["Active", "Seasonal", "Draft", "Retired"];

function makeId() {
  return `product-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function round(value, digits = 2) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(value) || 0) * factor) / factor;
}

function money(value) {
  return `$${round(value).toFixed(2)}`;
}

function percent(value) {
  return `${round(value, 1).toFixed(1)}%`;
}

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function toDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatShortDate(value) {
  const date = toDate(value);
  if (!date) return "Not saved yet";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function blankProduct() {
  return {
    id: "",
    name: "",
    category: "Produce",
    status: "Active",
    sku: "",
    unitLabel: "each",
    description: "",
    retailPrice: "",
    wholesalePrice: "",
    targetMargin: 70,
    batchIngredientCost: "",
    batchUnits: "",
    packagingCostPerUnit: "",
    laborHours: "",
    laborRate: "",
    overheadCost: "",
    notes: ""
  };
}

function sampleProduct() {
  return {
    ...blankProduct(),
    name: "Sample Product",
    category: "Prepared Foods",
    status: "Active",
    sku: "SAMPLE-001",
    unitLabel: "each",
    description: "Example product. Edit or delete anytime.",
    retailPrice: 8,
    wholesalePrice: 5,
    targetMargin: 70,
    batchIngredientCost: 32,
    batchUnits: 24,
    packagingCostPerUnit: 0.35,
    laborHours: 1.5,
    laborRate: 18,
    overheadCost: 6,
    notes: "Replace this sample with one of your real products."
  };
}

function calculateProduct(product) {
  const batchIngredientCost = Number(product.batchIngredientCost) || 0;
  const batchUnits = Number(product.batchUnits) || 0;
  const packagingCostPerUnit = Number(product.packagingCostPerUnit) || 0;
  const laborHours = Number(product.laborHours) || 0;
  const laborRate = Number(product.laborRate) || 0;
  const overheadCost = Number(product.overheadCost) || 0;
  const retailPrice = Number(product.retailPrice) || 0;
  const wholesalePrice = Number(product.wholesalePrice) || 0;
  const targetMargin = Number(product.targetMargin) || 0;

  const laborCost = laborHours * laborRate;
  const packagingTotal = packagingCostPerUnit * batchUnits;
  const totalBatchCost =
    batchIngredientCost + packagingTotal + laborCost + overheadCost;
  const costPerUnit = batchUnits > 0 ? totalBatchCost / batchUnits : 0;

  const retailProfitPerUnit = retailPrice - costPerUnit;
  const wholesaleProfitPerUnit = wholesalePrice - costPerUnit;

  const retailMargin =
    retailPrice > 0 ? (retailProfitPerUnit / retailPrice) * 100 : 0;
  const wholesaleMargin =
    wholesalePrice > 0 ? (wholesaleProfitPerUnit / wholesalePrice) * 100 : 0;

  const suggestedPrice =
    targetMargin > 0 && targetMargin < 100
      ? costPerUnit / (1 - targetMargin / 100)
      : costPerUnit;

  return {
    laborCost,
    packagingTotal,
    totalBatchCost,
    costPerUnit,
    retailProfitPerUnit,
    wholesaleProfitPerUnit,
    retailMargin,
    wholesaleMargin,
    suggestedPrice
  };
}

function MoneyInput({ label, value, onChange, placeholder = "0.00" }) {
  return (
    <label>
      {label}
      <div className="moneyInputWrap">
        <span className="moneyPrefix" aria-hidden="true">$</span>
        <input
          type="number"
          step="0.01"
          value={value}
          onWheel={(event) => event.currentTarget.blur()}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      </div>
    </label>
  );
}

function NumberInput({ label, value, onChange, placeholder = "0", step = "1" }) {
  return (
    <label>
      {label}
      <input
        type="number"
        step={step}
        value={value}
        onWheel={(event) => event.currentTarget.blur()}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export default function PricingCalculator() {
  const { user, loginWithGoogle } = useAuth();
  const {
    isDirty: hasUnsavedChanges,
    markUnsaved,
    markSaved
  } = useUnsavedChanges();

  const directoryRef = useRef(null);
  const detailsRef = useRef(null);
  const pricingRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [form, setForm] = useState(blankProduct());
  const [queryText, setQueryText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);

  const selectedProduct = useMemo(() => {
    return products.find((product) => product.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const calculation = useMemo(() => calculateProduct(form), [form]);

  const filteredProducts = useMemo(() => {
    const search = normalize(queryText);

    return products.filter((product) => {
      const matchesSearch = search
        ? [product.name, product.category, product.sku, product.description, product.notes]
            .map(normalize)
            .some((value) => value.includes(search))
        : true;

      const matchesCategory =
        categoryFilter === "All categories" || product.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All statuses" || product.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, queryText, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const activeProducts = products.filter((product) => product.status === "Active");
    const productsWithPricing = products.filter((product) => {
      const calc = calculateProduct(product);
      return calc.costPerUnit > 0 && Number(product.retailPrice) > 0;
    });

    const averageRetailMargin = productsWithPricing.length
      ? productsWithPricing.reduce(
          (sum, product) => sum + calculateProduct(product).retailMargin,
          0
        ) / productsWithPricing.length
      : 0;

    return {
      activeCount: activeProducts.length,
      averageRetailMargin,
      productsWithPricing: productsWithPricing.length
    };
  }, [products]);

  function markProductsDirty() {
    markUnsaved({
      source: "Products & Pricing",
      onSave: saveCurrentProduct
    });
  }

  useEffect(() => {
    function handleScroll() {
      setShowBackToTop(window.scrollY > 50);
    }

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!statusMessage) return undefined;

    const timer = window.setTimeout(() => setStatusMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    if (user) {
      loadProducts();
    } else {
      setProducts([]);
      setSelectedProductId("");
      setForm(blankProduct());
    }
  }, [user]);

  async function loadProducts() {
    if (!user) return;

    setLoadingProducts(true);

    try {
      const saved = await getProducts(user.uid);
      setProducts(Array.isArray(saved) ? saved : []);
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not load products.");
    } finally {
      setLoadingProducts(false);
    }
  }

  function scrollToSection(ref) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function loadProduct(product, options = {}) {
    setSelectedProductId(product.id || "");
    setForm({ ...blankProduct(), ...product });
    markSaved();

    if (!options.silent) {
      setStatusMessage("Product loaded.");
      scrollToSection(detailsRef);
    }
  }

  function startNewProduct() {
    setSelectedProductId("");
    setForm(blankProduct());
    markProductsDirty();
    setStatusMessage("Started a new product.");
    scrollToSection(detailsRef);
  }

  function loadSampleProduct() {
    setSelectedProductId("");
    setForm(sampleProduct());
    markProductsDirty();
    setStatusMessage("Sample product loaded. Edit it, then save when ready.");
    scrollToSection(detailsRef);
  }

  function updateField(field, value) {
    markProductsDirty();
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveCurrentProduct() {
    if (!user) {
      setStatusMessage("Sign in from the Farmers Hub sidebar to save products.");
      return;
    }

    if (!form.name.trim()) {
      setStatusMessage("Product name is required.");
      return;
    }

    setSaving(true);

    const productToSave = {
      ...form,
      id: selectedProductId || form.id || makeId(),
      name: form.name.trim(),
      category: form.category || "Other",
      status: form.status || "Active",
      pricingSummary: calculation
    };

    try {
      const savedId = await saveProduct(user.uid, productToSave);
      setSelectedProductId(savedId);
      setForm((current) => ({ ...current, id: savedId }));
      markSaved();
      setStatusMessage("Product saved.");
      await loadProducts();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not save product.");
    } finally {
      setSaving(false);
    }
  }

  async function removeProduct(productId) {
    if (!user || !productId) return;

    const product = products.find((item) => item.id === productId);
    const confirmed = window.confirm(
      `Delete ${product?.name || "this product"}? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteProduct(user.uid, productId);

      if (selectedProductId === productId) {
        setSelectedProductId("");
        setForm(blankProduct());
        markSaved();
      }

      setStatusMessage("Product deleted.");
      await loadProducts();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not delete product.");
    }
  }

  const sectionCards = [
    { title: "Product Directory", description: "Browse, filter, and load saved products.", icon: Package, ref: directoryRef },
    { title: "Product Details", description: "Edit product names, categories, SKU, status, and notes.", icon: Tag, ref: detailsRef },
    { title: "Pricing Analysis", description: "Review costs, prices, margins, and suggested pricing.", icon: Calculator, ref: pricingRef }
  ];

  if (!user) {
    return (
      <div className="modulePage pricingPage compactSpicePage">
        <section className="moduleHero compactHero">
          <div>
            <p className="eyebrow">Products & Pricing</p>
            <h2>Sign in to save your product list.</h2>
            <p>
              Build a product directory, calculate costs, set prices, and save your
              product records to your Farmers Hub account.
            </p>
          </div>

          <button className="primaryButton" onClick={loginWithGoogle}>
            Sign in with Google
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="modulePage pricingPage compactSpicePage">
      {statusMessage ? (
        <div className="floatingStatus success">
          <span>ⓘ</span>
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>×</button>
        </div>
      ) : null}

      <section className="moduleHero compactHero">
        <div>
          <p className="eyebrow">Products & Pricing</p>
          <h2>Build your product list and price each item with confidence.</h2>
          <p>
            Keep a central product directory for anything you sell, then select a
            product to edit its cost breakdown, retail price, wholesale price, and margins.
          </p>
        </div>

        <button className="primaryButton" type="button" onClick={startNewProduct}>
          <Plus size={18} />
          Add Product
        </button>
      </section>

      <section className="hubStatGrid pricingStatGrid">
        <StatCard icon={Package} label="Products" value={loadingProducts ? "..." : products.length} sub="saved products" accent="pricing" />
        <StatCard icon={Tag} label="Active" value={loadingProducts ? "..." : stats.activeCount} sub="currently available" accent="market" />
        <StatCard icon={Target} label="Avg Margin" value={loadingProducts ? "..." : percent(stats.averageRetailMargin)} sub="retail margin" accent="spice" />
        <StatCard icon={Calculator} label="Priced" value={loadingProducts ? "..." : stats.productsWithPricing} sub="cost + retail price" accent="sourdough" />
      </section>

      <section className="toolGrid compactToolGrid">
        {sectionCards.map((card) => {
          const Icon = card.icon;
          return (
            <button className="toolCard compactToolCard clickableToolCard" key={card.title} type="button" onClick={() => scrollToSection(card.ref)}>
              <Icon size={22} />
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </button>
          );
        })}
      </section>

      <section className="workspacePanel compactPanel scrollAnchor" ref={directoryRef}>
        <div className="workspaceHeader compactPanelHeader">
          <div>
            <p className="eyebrow">Directory</p>
            <h3>Product Directory</h3>
          </div>

          <div className="formActions compactActions">
            <button className="secondaryButton compactButton" type="button" onClick={loadProducts}>Refresh</button>
            <button className="secondaryButton compactButton" type="button" onClick={loadSampleProduct}><Package size={15} />Load Sample</button>
            <button className="primaryButton compactPrimary" type="button" onClick={startNewProduct}><Plus size={15} />New Product</button>
          </div>
        </div>

        <div className="customersFilterPanel">
          <div className="searchBox compactSearch customersSearchBox">
            <Search size={17} />
            <input type="search" placeholder="Search products, SKU, category, notes, or description" value={queryText} onChange={(event) => setQueryText(event.target.value)} />
          </div>

          <label>
            Category
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option>All categories</option>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>

          <label>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>All statuses</option>
              {productStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
        </div>

        <div className="batchTable compactBatchTable pricingComparisonTable">
          <div className="pricingComparisonHeader">
            <span>Product</span><span>Category</span><span>Retail</span><span>Wholesale</span><span>Cost / Unit</span><span>Margin</span><span>Status</span><span>Updated</span><span>Notes</span><span></span>
          </div>

          {filteredProducts.length ? (
            filteredProducts.map((product) => {
              const calc = calculateProduct(product);
              return (
                <div className="pricingComparisonRow" key={product.id}>
                  <span>
                    <button className="savedItemLink" type="button" onClick={() => loadProduct(product)}>{product.name || "Untitled Product"}</button>
                    {product.sku ? <small>{product.sku}</small> : null}
                  </span>
                  <span>{product.category || "Other"}</span>
                  <span className="pricingMetric">{money(product.retailPrice)}</span>
                  <span className="pricingMetric">{money(product.wholesalePrice)}</span>
                  <span className="pricingMetric">{money(calc.costPerUnit)}</span>
                  <span className="pricingMetric pricingPositive">{percent(calc.retailMargin)}<small>{money(calc.retailProfitPerUnit)} / unit</small></span>
                  <span>{product.status || "Active"}</span>
                  <span>{formatShortDate(product.updatedAt)}</span>
                  <span>{product.notes || product.description || ""}</span>
                  <span><button className="iconButton danger" type="button" onClick={() => removeProduct(product.id)} aria-label="Delete product"><Trash2 size={15} /></button></span>
                </div>
              );
            })
          ) : (
            <div className="placeholderBox compactPlaceholder">
              {loadingProducts ? "Loading products..." : "No products found. Add a product or load the sample to get started."}
            </div>
          )}
        </div>
      </section>

      <section className="spiceWorkspace compactWorkspace">
        <div className="workspacePanel compactPanel scrollAnchor" ref={detailsRef}>
          <div className="workspaceHeader compactPanelHeader">
            <div><p className="eyebrow">Product</p><h3>Product Details</h3></div>
            <div className="formActions compactActions">
              <button className={`primaryButton compactPrimary ${hasUnsavedChanges ? "dirtySaveButton" : ""}`} type="button" onClick={saveCurrentProduct} disabled={saving}>
                <Save size={15} />{saving ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "Save Product"}
              </button>
            </div>
          </div>

          <div className="formGrid compactFormGrid">
            <label>Product Name<input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="e.g., Sourdough Loaf, Soy Candle, Lavender Bouquet" /></label>
            <label>SKU<input value={form.sku} onChange={(event) => updateField("sku", event.target.value)} placeholder="Optional" /></label>
            <label>Category<select value={form.category} onChange={(event) => updateField("category", event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>Status<select value={form.status} onChange={(event) => updateField("status", event.target.value)}>{productStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label>Unit Label<input value={form.unitLabel} onChange={(event) => updateField("unitLabel", event.target.value)} placeholder="each, jar, bunch, lb, dozen, tray" /></label>
            <NumberInput label="Target Margin %" value={form.targetMargin} onChange={(value) => updateField("targetMargin", value)} placeholder="70" step="0.1" />
            <label className="fullSpan">Description<input value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Short internal product description" /></label>
            <label className="fullSpan">Notes<input value={form.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder="Packaging notes, seasonal availability, wholesale details, allergens, or production notes" /></label>
          </div>
        </div>

        <div className="workspacePanel compactPanel">
          <div className="workspaceHeader compactPanelHeader"><div><p className="eyebrow">Selected</p><h3>{selectedProduct ? selectedProduct.name : form.name || "Unsaved Product"}</h3></div></div>
          <div className="hubStatGrid pricingStatGrid">
            <StatCard icon={DollarSign} label="Retail" value={money(form.retailPrice)} sub={`per ${form.unitLabel || "unit"}`} accent="pricing" />
            <StatCard icon={Target} label="Cost" value={money(calculation.costPerUnit)} sub="estimated per unit" accent="sourdough" />
            <StatCard icon={Calculator} label="Margin" value={percent(calculation.retailMargin)} sub="retail margin" accent="market" />
            <StatCard icon={Package} label="Suggested" value={money(calculation.suggestedPrice)} sub={`${form.targetMargin || 0}% target`} accent="spice" />
          </div>
          <div className="placeholderBox compactPlaceholder"><strong>Pricing clarity:</strong> enter material, packaging, labor, and overhead costs below. Farmers Hub will calculate estimated cost per unit, suggested price, and profit margins.</div>
        </div>
      </section>

      <section className="workspacePanel compactPanel scrollAnchor" ref={pricingRef}>
        <div className="workspaceHeader compactPanelHeader">
          <div><p className="eyebrow">Pricing</p><h3>Pricing Analysis</h3></div>
          <div className="formActions compactActions">
            <label>Select Product<select value={selectedProductId} onChange={(event) => { const product = products.find((item) => item.id === event.target.value); if (product) loadProduct(product); }}><option value="">Unsaved or new product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name || "Untitled Product"}</option>)}</select></label>
            <button className={`primaryButton compactPrimary ${hasUnsavedChanges ? "dirtySaveButton" : ""}`} type="button" onClick={saveCurrentProduct} disabled={saving}><Save size={15} />{saving ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "Save Product"}</button>
          </div>
        </div>

        <div className="formGrid compactFormGrid">
          <MoneyInput label="Batch Ingredient / Material Cost" value={form.batchIngredientCost} onChange={(value) => updateField("batchIngredientCost", value)} placeholder="32.00" />
          <NumberInput label="Units Produced Per Batch" value={form.batchUnits} onChange={(value) => updateField("batchUnits", value)} placeholder="24" step="1" />
          <MoneyInput label="Packaging Cost / Unit" value={form.packagingCostPerUnit} onChange={(value) => updateField("packagingCostPerUnit", value)} placeholder="0.35" />
          <NumberInput label="Labor Hours Per Batch" value={form.laborHours} onChange={(value) => updateField("laborHours", value)} placeholder="1.5" step="0.01" />
          <MoneyInput label="Labor Rate / Hour" value={form.laborRate} onChange={(value) => updateField("laborRate", value)} placeholder="18.00" />
          <MoneyInput label="Overhead / Fees Per Batch" value={form.overheadCost} onChange={(value) => updateField("overheadCost", value)} placeholder="6.00" />
          <MoneyInput label="Retail Price" value={form.retailPrice} onChange={(value) => updateField("retailPrice", value)} placeholder="8.00" />
          <MoneyInput label="Wholesale Price" value={form.wholesalePrice} onChange={(value) => updateField("wholesalePrice", value)} placeholder="5.00" />
        </div>

        <div className="grid four">
          <div className="workspacePanel compactPanel"><p className="eyebrow">Total Batch Cost</p><h3>{money(calculation.totalBatchCost)}</h3><p className="importExportText">Materials + packaging + labor + overhead.</p></div>
          <div className="workspacePanel compactPanel"><p className="eyebrow">Cost Per Unit</p><h3>{money(calculation.costPerUnit)}</h3><p className="importExportText">Estimated cost for one {form.unitLabel || "unit"}.</p></div>
          <div className="workspacePanel compactPanel"><p className="eyebrow">Suggested Retail</p><h3>{money(calculation.suggestedPrice)}</h3><p className="importExportText">Based on {form.targetMargin || 0}% target margin.</p></div>
          <div className="workspacePanel compactPanel"><p className="eyebrow">Retail Margin</p><h3>{percent(calculation.retailMargin)}</h3><p className="importExportText">{money(calculation.retailProfitPerUnit)} profit per unit.</p></div>
        </div>
      </section>

      {showBackToTop ? <button className="backToTopButton" type="button" onClick={scrollToTop}><ArrowUp size={18} />Top</button> : null}
    </div>
  );
}
