import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  Calculator,
  DollarSign,
  Package,
  Plus,
  Save,
  Target,
  Trash2
} from "lucide-react";
import { useAuth } from "../AuthContext.jsx";
import {
  deletePricingCalculation,
  getPricingCalculations,
  savePricingCalculation
} from "../services/pricingService.js";
import StatCard from "../components/StatCard.jsx";
const starterItems = [
  {
    id: "sample-microgreens",
    productName: "Microgreens",
    category: "Produce",
    batchCost: 18,
    batchUnits: 24,
    packagingCostPerUnit: 0.22,
    laborHours: 1.5,
    laborRate: 18,
    overheadCost: 5,
    retailPrice: 4,
    wholesalePrice: 2.5,
    targetMargin: 70,
    notes: "Example fresh product."
  }
];

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
  "Crafts",
  "Other"
];

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

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function calculateItem(item) {
  const batchCost = Number(item.batchCost) || 0;
  const batchUnits = Number(item.batchUnits) || 0;
  const packagingCostPerUnit = Number(item.packagingCostPerUnit) || 0;
  const laborHours = Number(item.laborHours) || 0;
  const laborRate = Number(item.laborRate) || 0;
  const overheadCost = Number(item.overheadCost) || 0;
  const retailPrice = Number(item.retailPrice) || 0;
  const wholesalePrice = Number(item.wholesalePrice) || 0;
  const targetMargin = Number(item.targetMargin) || 0;

  const laborCost = laborHours * laborRate;
  const totalBatchCost =
    batchCost + laborCost + overheadCost + packagingCostPerUnit * batchUnits;

  const costPerUnit = batchUnits > 0 ? totalBatchCost / batchUnits : 0;

  const retailProfitPerUnit = retailPrice - costPerUnit;
  const wholesaleProfitPerUnit = wholesalePrice - costPerUnit;

  const retailMargin = retailPrice > 0 ? (retailProfitPerUnit / retailPrice) * 100 : 0;
  const wholesaleMargin =
    wholesalePrice > 0 ? (wholesaleProfitPerUnit / wholesalePrice) * 100 : 0;

  const retailBatchRevenue = retailPrice * batchUnits;
  const wholesaleBatchRevenue = wholesalePrice * batchUnits;

  const retailBatchProfit = retailBatchRevenue - totalBatchCost;
  const wholesaleBatchProfit = wholesaleBatchRevenue - totalBatchCost;

  const suggestedPrice =
    targetMargin < 100 && targetMargin > 0
      ? costPerUnit / (1 - targetMargin / 100)
      : costPerUnit;

  return {
    laborCost,
    totalBatchCost,
    costPerUnit,
    retailProfitPerUnit,
    wholesaleProfitPerUnit,
    retailMargin,
    wholesaleMargin,
    retailBatchRevenue,
    wholesaleBatchRevenue,
    retailBatchProfit,
    wholesaleBatchProfit,
    suggestedPrice
  };
}

function createBlankCalculation() {
  return {
    id: "",
    name: "New Pricing Sheet",
    notes: "",
    items: starterItems
  };
}

export default function PricingCalculator() {
  const { user, loginWithGoogle } = useAuth();

  const setupRef = useRef(null);
  const calculatorRef = useRef(null);
  const comparisonRef = useRef(null);
  const savedRef = useRef(null);

  const [calculationId, setCalculationId] = useState("");
  const [sheetName, setSheetName] = useState("Market Pricing Sheet");
  const [sheetNotes, setSheetNotes] = useState("");
  const [items, setItems] = useState(starterItems);
  const [savedCalculations, setSavedCalculations] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const [newItem, setNewItem] = useState({
    productName: "",
    category: "Produce",
    batchCost: "",
    batchUnits: "",
    packagingCostPerUnit: "",
    laborHours: "",
    laborRate: "",
    overheadCost: "",
    retailPrice: "",
    wholesalePrice: "",
    targetMargin: 70,
    notes: ""
  });

  useEffect(() => {
    function handleScroll() {
      setShowBackToTop(window.scrollY > 50);
    }

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
  if (!statusMessage) return;

  const timer = window.setTimeout(() => {
    setStatusMessage("");
  }, 3000);

  return () => window.clearTimeout(timer);
}, [statusMessage]);
  
  function preventNumberScroll(event) {
    event.target.blur();
  }

  function scrollToSection(ref) {
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  const totals = useMemo(() => {
    return items.reduce(
      (sum, item) => {
        const calc = calculateItem(item);

        return {
          itemCount: sum.itemCount + 1,
          totalBatchCost: sum.totalBatchCost + calc.totalBatchCost,
          retailBatchRevenue: sum.retailBatchRevenue + calc.retailBatchRevenue,
          retailBatchProfit: sum.retailBatchProfit + calc.retailBatchProfit,
          wholesaleBatchRevenue:
            sum.wholesaleBatchRevenue + calc.wholesaleBatchRevenue,
          wholesaleBatchProfit:
            sum.wholesaleBatchProfit + calc.wholesaleBatchProfit
        };
      },
      {
        itemCount: 0,
        totalBatchCost: 0,
        retailBatchRevenue: 0,
        retailBatchProfit: 0,
        wholesaleBatchRevenue: 0,
        wholesaleBatchProfit: 0
      }
    );
  }, [items]);

  async function loadSavedCalculations() {
    if (!user) return;

    setLoadingSaved(true);

    try {
      const saved = await getPricingCalculations(user.uid);
      setSavedCalculations(saved);
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not load saved pricing calculations.");
    } finally {
      setLoadingSaved(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadSavedCalculations();
    } else {
      setSavedCalculations([]);
    }
  }, [user]);

  function hydrateCalculation(calculation) {
    setCalculationId(calculation.id || "");
    setSheetName(calculation.name || "Market Pricing Sheet");
    setSheetNotes(calculation.notes || "");
    setItems(Array.isArray(calculation.items) ? calculation.items : []);
    setStatusMessage("Loaded saved pricing sheet.");
    scrollToSection(setupRef);
  }

  function startNewCalculation() {
    const blank = createBlankCalculation();

    setCalculationId(blank.id);
    setSheetName(blank.name);
    setSheetNotes(blank.notes);
    setItems(blank.items);
    setStatusMessage("Started a new pricing sheet.");
    scrollToTop();
  }

  async function saveCalculation() {
    if (!user) {
      setStatusMessage("Sign in from the Farmers Hub sidebar to save pricing sheets.");
      return;
    }

    setSaving(true);

    const calculation = {
      id: calculationId,
      name: sheetName,
      notes: sheetNotes,
      items,
      totals
    };

    try {
      const savedId = await savePricingCalculation(user.uid, calculation);
      setCalculationId(savedId);
      setStatusMessage("Pricing sheet saved.");
      await loadSavedCalculations();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not save pricing sheet.");
    } finally {
      setSaving(false);
    }
  }

  async function removeSavedCalculation(id) {
    if (!user) return;

    try {
      await deletePricingCalculation(user.uid, id);

      if (calculationId === id) {
        startNewCalculation();
      }

      setStatusMessage("Saved pricing sheet deleted.");
      await loadSavedCalculations();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not delete saved pricing sheet.");
    }
  }

  function updateItem(id, field, value) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  function removeItem(id) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function addItem(event) {
    event.preventDefault();

    if (!newItem.productName.trim()) {
      setStatusMessage("Product name is required.");
      return;
    }

    setItems((current) => [
      ...current,
      {
        id: makeId(),
        productName: newItem.productName.trim(),
        category: newItem.category,
        batchCost: Number(newItem.batchCost) || 0,
        batchUnits: Number(newItem.batchUnits) || 0,
        packagingCostPerUnit: Number(newItem.packagingCostPerUnit) || 0,
        laborHours: Number(newItem.laborHours) || 0,
        laborRate: Number(newItem.laborRate) || 0,
        overheadCost: Number(newItem.overheadCost) || 0,
        retailPrice: Number(newItem.retailPrice) || 0,
        wholesalePrice: Number(newItem.wholesalePrice) || 0,
        targetMargin: Number(newItem.targetMargin) || 0,
        notes: newItem.notes.trim()
      }
    ]);

    setNewItem({
      productName: "",
      category: "Produce",
      batchCost: "",
      batchUnits: "",
      packagingCostPerUnit: "",
      laborHours: "",
      laborRate: "",
      overheadCost: "",
      retailPrice: "",
      wholesalePrice: "",
      targetMargin: 70,
      notes: ""
    });

    setStatusMessage("Product added to pricing sheet.");
    scrollToSection(comparisonRef);
  }

  const sectionCards = [
    {
      title: "Sheet Setup",
      description: "Name the pricing sheet and capture general notes.",
      icon: DollarSign,
      ref: setupRef
    },
    {
      title: "Cost Calculator",
      description: "Add batch costs, packaging, labor, overhead, and prices.",
      icon: Calculator,
      ref: calculatorRef
    },
    {
      title: "Margin Review",
      description: "Edit products and review retail and wholesale margins.",
      icon: Target,
      ref: comparisonRef
    },
    {
      title: "Saved Sheets",
      description: "Load, update, and reuse saved pricing calculations.",
      icon: Package,
      ref: savedRef
    }
  ];

  if (!user) {
    return (
      <div className="modulePage pricingPage compactSpicePage">
        <section className="moduleHero compactHero">
          <div>
            <p className="eyebrow">Pricing Calculator</p>
            <h2>Sign in to save pricing sheets.</h2>
            <p>
              Build product pricing calculations locally, then sign in to save them to
              your Farmers Hub account.
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
      <section className="moduleHero compactHero noActionHero">
        <div>
          <p className="eyebrow">Pricing Calculator</p>
          <h2>Calculate retail, wholesale, margin, and batch profitability.</h2>
          <p>
            Build pricing sheets for market products using batch costs, packaging,
            labor, overhead, target margins, and sales prices.
          </p>
        </div>
      </section>

      {statusMessage ? (
  <div className="floatingStatus success">
    <span>ⓘ</span>
    <span>{statusMessage}</span>
    <button type="button" onClick={() => setStatusMessage("")}>
      ×
    </button>
  </div>
) : null}

      <section className="toolGrid compactToolGrid">
        {sectionCards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              className="toolCard compactToolCard clickableToolCard"
              key={card.title}
              type="button"
              onClick={() => scrollToSection(card.ref)}
            >
              <Icon size={22} />
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </button>
          );
        })}
      </section>

      <section className="spiceWorkspace compactWorkspace">
        <div className="workspacePanel compactPanel scrollAnchor" ref={setupRef}>
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Setup</p>
              <h3>Pricing Sheet Details</h3>
            </div>

            <div className="formActions compactActions">
              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={startNewCalculation}
              >
                <Plus size={15} />
                New Sheet
              </button>

              <button
                className="primaryButton compactPrimary"
                type="button"
                onClick={saveCalculation}
                disabled={saving}
              >
                <Save size={15} />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div className="formGrid compactFormGrid">
            <label>
              Sheet Name
              <input
                value={sheetName}
                onChange={(event) => setSheetName(event.target.value)}
                placeholder="e.g., Summer Market Pricing"
              />
            </label>

            <label>
              Notes
              <input
                value={sheetNotes}
                onChange={(event) => setSheetNotes(event.target.value)}
                placeholder="e.g., Updated for packaging price increase"
              />
            </label>
          </div>

          <div className="batchTotals compactBatchTotals">
            <div>
              <p className="eyebrow">Products</p>
              <h4>{totals.itemCount}</h4>
            </div>
            <div>
              <p className="eyebrow">Retail Batch Profit</p>
              <h4>{money(totals.retailBatchProfit)}</h4>
            </div>
            <div>
              <p className="eyebrow">Wholesale Batch Profit</p>
              <h4>{money(totals.wholesaleBatchProfit)}</h4>
            </div>
          </div>
        </div>

        <div className="workspacePanel compactPanel scrollAnchor" ref={savedRef}>
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Saved</p>
              <h3>Saved Pricing Sheets</h3>
            </div>
          </div>

          <div className="savedList compactSavedList">
            {loadingSaved ? (
              <div className="placeholderBox compactPlaceholder">
                Loading saved pricing sheets...
              </div>
            ) : savedCalculations.length ? (
              savedCalculations.map((calculation) => (
                <div className="savedItem compactSavedItem" key={calculation.id}>
                  <div>
                    <h4>{calculation.name || "Pricing Sheet"}</h4>
                    <p>
                      {calculation.items?.length || 0} products
                      {calculation.totals?.retailBatchProfit !== undefined
                        ? ` • ${money(calculation.totals.retailBatchProfit)} retail batch profit`
                        : ""}
                    </p>
                  </div>

                  <div className="itemActions">
                    <button type="button" onClick={() => hydrateCalculation(calculation)}>
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSavedCalculation(calculation.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="placeholderBox compactPlaceholder">
                No saved pricing sheets yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="workspacePanel compactPanel scrollAnchor" ref={calculatorRef}>
        <div className="workspaceHeader compactPanelHeader">
          <div>
            <p className="eyebrow">Add Product</p>
            <h3>Cost Calculator</h3>
          </div>
        </div>

        <form className="formGrid compactFormGrid" onSubmit={addItem}>
          <label>
            Product Name
            <input
              value={newItem.productName}
              onChange={(event) =>
                setNewItem((current) => ({
                  ...current,
                  productName: event.target.value
                }))
              }
              placeholder="e.g., 1oz Microgreens, Sourdough Loaf, Spice Pouch"
            />
          </label>

          <label>
            Category
            <select
              value={newItem.category}
              onChange={(event) =>
                setNewItem((current) => ({
                  ...current,
                  category: event.target.value
                }))
              }
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>

          <label>
            Batch Ingredient Cost
            <input
              type="number"
              step="0.01"
              value={newItem.batchCost}
              onWheel={preventNumberScroll}
              onChange={(event) =>
                setNewItem((current) => ({
                  ...current,
                  batchCost: event.target.value
                }))
              }
              placeholder="e.g., 18"
            />
          </label>

          <label>
            Units Produced
            <input
              type="number"
              step="1"
              value={newItem.batchUnits}
              onWheel={preventNumberScroll}
              onChange={(event) =>
                setNewItem((current) => ({
                  ...current,
                  batchUnits: event.target.value
                }))
              }
              placeholder="e.g., 24"
            />
          </label>

          <label>
            Packaging Cost / Unit
            <input
              type="number"
              step="0.01"
              value={newItem.packagingCostPerUnit}
              onWheel={preventNumberScroll}
              onChange={(event) =>
                setNewItem((current) => ({
                  ...current,
                  packagingCostPerUnit: event.target.value
                }))
              }
              placeholder="e.g., 0.22"
            />
          </label>

          <label>
            Labor Hours
            <input
              type="number"
              step="0.01"
              value={newItem.laborHours}
              onWheel={preventNumberScroll}
              onChange={(event) =>
                setNewItem((current) => ({
                  ...current,
                  laborHours: event.target.value
                }))
              }
              placeholder="e.g., 1.5"
            />
          </label>

          <label>
            Labor Rate / Hour
            <input
              type="number"
              step="0.01"
              value={newItem.laborRate}
              onWheel={preventNumberScroll}
              onChange={(event) =>
                setNewItem((current) => ({
                  ...current,
                  laborRate: event.target.value
                }))
              }
              placeholder="e.g., 18"
            />
          </label>

          <label>
            Overhead / Fees
            <input
              type="number"
              step="0.01"
              value={newItem.overheadCost}
              onWheel={preventNumberScroll}
              onChange={(event) =>
                setNewItem((current) => ({
                  ...current,
                  overheadCost: event.target.value
                }))
              }
              placeholder="e.g., 5"
            />
          </label>

          <label>
            Retail Price
            <input
              type="number"
              step="0.01"
              value={newItem.retailPrice}
              onWheel={preventNumberScroll}
              onChange={(event) =>
                setNewItem((current) => ({
                  ...current,
                  retailPrice: event.target.value
                }))
              }
              placeholder="e.g., 4"
            />
          </label>

          <label>
            Wholesale Price
            <input
              type="number"
              step="0.01"
              value={newItem.wholesalePrice}
              onWheel={preventNumberScroll}
              onChange={(event) =>
                setNewItem((current) => ({
                  ...current,
                  wholesalePrice: event.target.value
                }))
              }
              placeholder="e.g., 2.5"
            />
          </label>

          <label>
            Target Margin %
            <input
              type="number"
              step="0.1"
              value={newItem.targetMargin}
              onWheel={preventNumberScroll}
              onChange={(event) =>
                setNewItem((current) => ({
                  ...current,
                  targetMargin: event.target.value
                }))
              }
              placeholder="e.g., 70"
            />
          </label>

          <label>
            Notes
            <input
              value={newItem.notes}
              onChange={(event) =>
                setNewItem((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="e.g., Includes market packaging"
            />
          </label>

          <div className="formActions fullSpan compactActions">
            <button className="primaryButton compactPrimary" type="submit">
              <Plus size={15} />
              Add Product
            </button>
          </div>
        </form>
      </section>

      <section className="workspacePanel compactPanel scrollAnchor" ref={comparisonRef}>
        <div className="workspaceHeader compactPanelHeader">
          <div>
            <p className="eyebrow">Review</p>
            <h3>Editable Pricing Comparison</h3>
          </div>

          <button
            className="primaryButton compactPrimary"
            type="button"
            onClick={saveCalculation}
            disabled={saving}
          >
            <Save size={15} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="batchTable compactBatchTable pricingEditableTable">
          <div className="batchTableHeader pricingEditableHeader">
            <span>Product</span>
            <span>Category</span>
            <span>Units</span>
            <span>Batch Cost</span>
            <span>Pack $</span>
            <span>Labor Hrs</span>
            <span>Labor $</span>
            <span>Overhead</span>
            <span>Cost / Unit</span>
            <span>Suggested $</span>
            <span>Retail $</span>
            <span>Retail Margin</span>
            <span>Wholesale $</span>
            <span>Wholesale Margin</span>
            <span>Notes</span>
            <span></span>
          </div>

          {items.map((item) => {
            const calc = calculateItem(item);

            return (
              <div className="batchTableRow pricingEditableRow" key={item.id}>
                <span>
                  <input
                    value={item.productName}
                    onChange={(event) =>
                      updateItem(item.id, "productName", event.target.value)
                    }
                  />
                </span>

                <span>
                  <select
                    value={item.category}
                    onChange={(event) =>
                      updateItem(item.id, "category", event.target.value)
                    }
                  >
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </span>

                <span>
                  <input
                    type="number"
                    step="1"
                    value={item.batchUnits}
                    onWheel={preventNumberScroll}
                    onChange={(event) =>
                      updateItem(item.id, "batchUnits", event.target.value)
                    }
                  />
                </span>

                <span>
                  <input
                    type="number"
                    step="0.01"
                    value={item.batchCost}
                    onWheel={preventNumberScroll}
                    onChange={(event) =>
                      updateItem(item.id, "batchCost", event.target.value)
                    }
                  />
                </span>

                <span>
                  <input
                    type="number"
                    step="0.01"
                    value={item.packagingCostPerUnit}
                    onWheel={preventNumberScroll}
                    onChange={(event) =>
                      updateItem(item.id, "packagingCostPerUnit", event.target.value)
                    }
                  />
                </span>

                <span>
                  <input
                    type="number"
                    step="0.01"
                    value={item.laborHours}
                    onWheel={preventNumberScroll}
                    onChange={(event) =>
                      updateItem(item.id, "laborHours", event.target.value)
                    }
                  />
                </span>

                <span>
                  <input
                    type="number"
                    step="0.01"
                    value={item.laborRate}
                    onWheel={preventNumberScroll}
                    onChange={(event) =>
                      updateItem(item.id, "laborRate", event.target.value)
                    }
                  />
                </span>

                <span>
                  <input
                    type="number"
                    step="0.01"
                    value={item.overheadCost}
                    onWheel={preventNumberScroll}
                    onChange={(event) =>
                      updateItem(item.id, "overheadCost", event.target.value)
                    }
                  />
                </span>

                <span className="pricingMetric">{money(calc.costPerUnit)}</span>

                <span className="pricingMetric">
                  {money(calc.suggestedPrice)}
                  <small>{item.targetMargin}% target</small>
                </span>

                <span>
                  <input
                    type="number"
                    step="0.01"
                    value={item.retailPrice}
                    onWheel={preventNumberScroll}
                    onChange={(event) =>
                      updateItem(item.id, "retailPrice", event.target.value)
                    }
                  />
                </span>

                <span className="pricingMetric pricingPositive">
                  {percent(calc.retailMargin)}
                  <small>{money(calc.retailProfitPerUnit)} / unit</small>
                </span>

                <span>
                  <input
                    type="number"
                    step="0.01"
                    value={item.wholesalePrice}
                    onWheel={preventNumberScroll}
                    onChange={(event) =>
                      updateItem(item.id, "wholesalePrice", event.target.value)
                    }
                  />
                </span>

                <span className="pricingMetric pricingPositive">
                  {percent(calc.wholesaleMargin)}
                  <small>{money(calc.wholesaleProfitPerUnit)} / unit</small>
                </span>

                <span>
                  <input
                    value={item.notes}
                    onChange={(event) =>
                      updateItem(item.id, "notes", event.target.value)
                    }
                  />
                </span>

                <span>
                  <button
                    className="iconButton danger"
                    type="button"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {showBackToTop ? (
        <button className="backToTopButton" type="button" onClick={scrollToTop}>
          <ArrowUp size={18} />
          Top
        </button>
      ) : null}
    </div>
  );
}
