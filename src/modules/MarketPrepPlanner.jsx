import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  CalendarDays,
  ClipboardList,
  PackageCheck,
  Plus,
  Printer,
  Save,
  Sprout,
  Trash2
} from "lucide-react";
import { useAuth } from "../AuthContext.jsx";
import {
  deleteMarketPrepPlan,
  getMarketPrepPlans,
  saveMarketPrepPlan
} from "../services/marketPrepService.js";

const marketCategories = [
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

const starterProducts = [
  {
    id: "sample-produce",
    name: "Tomatoes",
    category: "Produce",
    unitLabel: "1 lb bag",
    plannedUnits: 12,
    unitAmount: 1,
    amountUnit: "lb",
    bufferPct: 10,
    notes: "Example produce item."
  },
  {
    id: "sample-bread",
    name: "Sourdough Loaf",
    category: "Bread",
    unitLabel: "loaf",
    plannedUnits: 18,
    unitAmount: 1,
    amountUnit: "loaf",
    bufferPct: 0,
    notes: "Example bread item."
  },
  {
    id: "sample-spice",
    name: "Seasoning Pouch",
    category: "Spices",
    unitLabel: "0.2 oz pouch",
    plannedUnits: 30,
    unitAmount: 0.2,
    amountUnit: "oz",
    bufferPct: 5,
    notes: "Example spice item."
  },
  {
    id: "sample-eggs",
    name: "Chicken Eggs",
    category: "Eggs",
    unitLabel: "dozen",
    plannedUnits: 10,
    unitAmount: 1,
    amountUnit: "dozen",
    bufferPct: 0,
    notes: "Example egg item."
  }
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function round(value, digits = 2) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(value) || 0) * factor) / factor;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createBlankPlan() {
  return {
    id: "",
    marketName: "Farmers Market",
    marketDate: todayISO(),
    location: "",
    weatherNotes: "",
    products: starterProducts
  };
}

function getProductTotals(product) {
  const plannedUnits = Number(product.plannedUnits) || 0;
  const unitAmount = Number(product.unitAmount) || 0;
  const bufferPct = Number(product.bufferPct) || 0;

  const plannedAmount = plannedUnits * unitAmount;
  const finalAmount = plannedAmount * (1 + bufferPct / 100);

  return {
    plannedUnits,
    plannedAmount,
    finalAmount
  };
}

export default function MarketPrepPlanner() {
  const { user, loginWithGoogle } = useAuth();

  const setupRef = useRef(null);
  const forecastRef = useRef(null);
  const packListRef = useRef(null);
  const savedPlansRef = useRef(null);

  const [planId, setPlanId] = useState("");
  const [marketName, setMarketName] = useState("Farmers Market");
  const [marketDate, setMarketDate] = useState(todayISO());
  const [location, setLocation] = useState("");
  const [weatherNotes, setWeatherNotes] = useState("");
  const [products, setProducts] = useState(starterProducts);
  const [savedPlans, setSavedPlans] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Produce",
    unitLabel: "",
    plannedUnits: "",
    unitAmount: "",
    amountUnit: "",
    bufferPct: 0,
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
    return products.reduce(
      (sum, product) => {
        const productTotals = getProductTotals(product);

        return {
          productCount: sum.productCount + 1,
          plannedUnits: sum.plannedUnits + productTotals.plannedUnits,
          lineItemsWithBuffer:
            sum.lineItemsWithBuffer + (Number(product.bufferPct) > 0 ? 1 : 0)
        };
      },
      {
        productCount: 0,
        plannedUnits: 0,
        lineItemsWithBuffer: 0
      }
    );
  }, [products]);

  const categorySummary = useMemo(() => {
    return products.reduce((summary, product) => {
      const category = product.category || "Other";
      const productTotals = getProductTotals(product);

      if (!summary[category]) {
        summary[category] = {
          units: 0,
          items: 0
        };
      }

      summary[category].units += productTotals.plannedUnits;
      summary[category].items += 1;

      return summary;
    }, {});
  }, [products]);

  async function loadSavedPlans() {
    if (!user) return;

    setLoadingPlans(true);

    try {
      const plans = await getMarketPrepPlans(user.uid);
      setSavedPlans(plans);
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not load saved market plans.");
    } finally {
      setLoadingPlans(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadSavedPlans();
    } else {
      setSavedPlans([]);
    }
  }, [user]);

  function hydratePlan(plan) {
    setPlanId(plan.id || "");
    setMarketName(plan.marketName || "Farmers Market");
    setMarketDate(plan.marketDate || todayISO());
    setLocation(plan.location || "");
    setWeatherNotes(plan.weatherNotes || "");
    setProducts(Array.isArray(plan.products) ? plan.products : []);
    setStatusMessage("Loaded saved market plan.");
    scrollToSection(setupRef);
  }

  function startNewPlan() {
    const blank = createBlankPlan();
    setPlanId(blank.id);
    setMarketName(blank.marketName);
    setMarketDate(blank.marketDate);
    setLocation(blank.location);
    setWeatherNotes(blank.weatherNotes);
    setProducts(blank.products);
    setStatusMessage("Started a new market plan.");
    scrollToTop();
  }

  async function savePlan() {
    if (!user) {
      setStatusMessage("Sign in from the Farmers Hub sidebar to save market plans.");
      return;
    }

    setSaving(true);

    const plan = {
      id: planId,
      marketName,
      marketDate,
      location,
      weatherNotes,
      products,
      totals
    };

    try {
      const savedId = await saveMarketPrepPlan(user.uid, plan);
      setPlanId(savedId);
      setStatusMessage("Market prep plan saved.");
      await loadSavedPlans();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not save market prep plan.");
    } finally {
      setSaving(false);
    }
  }

  async function removeSavedPlan(id) {
    if (!user) return;

    try {
      await deleteMarketPrepPlan(user.uid, id);

      if (planId === id) {
        startNewPlan();
      }

      setStatusMessage("Saved plan deleted.");
      await loadSavedPlans();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not delete saved plan.");
    }
  }

  function updateProduct(id, field, value) {
    setProducts((current) =>
      current.map((product) =>
        product.id === id ? { ...product, [field]: value } : product
      )
    );
  }

  function togglePacked(id) {
    setProducts((current) =>
      current.map((product) =>
        product.id === id ? { ...product, packed: !product.packed } : product
      )
    );
  }

  function removeProduct(id) {
    setProducts((current) => current.filter((product) => product.id !== id));
  }

  function addProduct(event) {
    event.preventDefault();

    if (!newProduct.name.trim()) {
      setStatusMessage("Product name is required.");
      return;
    }

    if (!newProduct.unitLabel.trim()) {
      setStatusMessage("Unit label is required.");
      return;
    }

    setProducts((current) => [
      ...current,
      {
        id: makeId(),
        name: newProduct.name.trim(),
        category: newProduct.category,
        unitLabel: newProduct.unitLabel.trim(),
        plannedUnits: Number(newProduct.plannedUnits) || 0,
        unitAmount: Number(newProduct.unitAmount) || 0,
        amountUnit: newProduct.amountUnit.trim(),
        bufferPct: Number(newProduct.bufferPct) || 0,
        notes: newProduct.notes.trim(),
        packed: false
      }
    ]);

    setNewProduct({
      name: "",
      category: "Produce",
      unitLabel: "",
      plannedUnits: "",
      unitAmount: "",
      amountUnit: "",
      bufferPct: 0,
      notes: ""
    });

    setStatusMessage("Product added to market plan.");
    scrollToSection(packListRef);
  }

  function printPlan() {
    window.print();
  }

  const sectionCards = [
    {
      title: "Market Setup",
      description: "Set date, location, weather notes, and market context.",
      icon: CalendarDays,
      ref: setupRef
    },
    {
      title: "Product Forecast",
      description: "Plan any vendor product using custom units and categories.",
      icon: Sprout,
      ref: forecastRef
    },
    {
      title: "Pack List",
      description: "Calculate planned units and prep targets by product.",
      icon: PackageCheck,
      ref: packListRef
    },
    {
      title: "Saved Plans",
      description: "Load, update, print, and reuse market prep plans.",
      icon: ClipboardList,
      ref: savedPlansRef
    }
  ];

  if (!user) {
    return (
      <div className="modulePage marketPrepPage compactSpicePage">
        <section className="moduleHero compactHero">
          <div>
            <p className="eyebrow">Market Prep Planner</p>
            <h2>Sign in to save market prep plans.</h2>
            <p>
              Build generalized product forecasts and pack lists locally, then sign in
              to save market plans to your Farmers Hub account.
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
    <div className="modulePage marketPrepPage compactSpicePage">
      <section className="moduleHero compactHero noActionHero">
        <div>
          <p className="eyebrow">Market Prep Planner</p>
          <h2>Plan packing, prep quantities, and inventory before market day.</h2>
          <p>
            Build a market plan by location and date, define your own unit labels,
            estimate product quantities, add buffers, save plans, and print a working
            prep sheet.
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
              <h3>Market Details</h3>
            </div>

            <div className="formActions compactActions">
              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={startNewPlan}
              >
                <Plus size={15} />
                New Plan
              </button>

              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={printPlan}
              >
                <Printer size={15} />
                Print
              </button>

              <button
                className="primaryButton compactPrimary"
                type="button"
                onClick={savePlan}
                disabled={saving}
              >
                <Save size={15} />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div className="formGrid compactFormGrid">
            <label>
              Market Name
              <input
                value={marketName}
                onChange={(event) => setMarketName(event.target.value)}
                placeholder="e.g., Downtown Farmers Market"
              />
            </label>

            <label>
              Market Date
              <input
                type="date"
                value={marketDate}
                onChange={(event) => setMarketDate(event.target.value)}
              />
            </label>

            <label>
              Location
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="e.g., Pavilion, Main Street, South Lot"
              />
            </label>

            <label>
              Weather / Demand Notes
              <input
                value={weatherNotes}
                onChange={(event) => setWeatherNotes(event.target.value)}
                placeholder="e.g., Hot day, holiday weekend, rain possible"
              />
            </label>
          </div>

          <div className="batchTotals compactBatchTotals">
            <div>
              <p className="eyebrow">Products</p>
              <h4>{totals.productCount}</h4>
            </div>
            <div>
              <p className="eyebrow">Planned Units</p>
              <h4>{totals.plannedUnits}</h4>
            </div>
            <div>
              <p className="eyebrow">Buffered Items</p>
              <h4>{totals.lineItemsWithBuffer}</h4>
            </div>
          </div>

          <div className="placeholderBox compactPlaceholder">
            <strong>{marketName}</strong>
            {location ? (
              <>
                {" "}
                at <strong>{location}</strong>
              </>
            ) : null}{" "}
            on <strong>{marketDate}</strong>
            {weatherNotes ? ` • ${weatherNotes}` : ""}
          </div>
        </div>

        <div className="workspacePanel compactPanel scrollAnchor" ref={savedPlansRef}>
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Saved</p>
              <h3>Saved Market Plans</h3>
            </div>
          </div>

          <div className="savedList compactSavedList">
            {loadingPlans ? (
              <div className="placeholderBox compactPlaceholder">
                Loading saved plans...
              </div>
            ) : savedPlans.length ? (
              savedPlans.map((plan) => (
                <div className="savedItem compactSavedItem" key={plan.id}>
                  <div>
                    <h4>{plan.marketName || "Market Plan"}</h4>
                    <p>
                      {plan.marketDate || "No date"} • {plan.location || "No location"}
                    </p>
                  </div>

                  <div className="itemActions">
                    <button type="button" onClick={() => hydratePlan(plan)}>
                      Load
                    </button>
                    <button type="button" onClick={() => removeSavedPlan(plan.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="placeholderBox compactPlaceholder">
                No saved market plans yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="spiceWorkspace compactWorkspace">
        <div className="workspacePanel compactPanel scrollAnchor" ref={forecastRef}>
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Add Product</p>
              <h3>Product Forecast</h3>
            </div>
          </div>

          <form className="formGrid compactFormGrid" onSubmit={addProduct}>
            <label>
              Product / Item
              <input
                value={newProduct.name}
                onChange={(event) =>
                  setNewProduct((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="e.g., Tomatoes, Eggs, Loaf, Starter Tray"
              />
            </label>

            <label>
              Category
              <select
                value={newProduct.category}
                onChange={(event) =>
                  setNewProduct((current) => ({
                    ...current,
                    category: event.target.value
                  }))
                }
              >
                {marketCategories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>

            <label>
              Unit Label
              <input
                value={newProduct.unitLabel}
                onChange={(event) =>
                  setNewProduct((current) => ({
                    ...current,
                    unitLabel: event.target.value
                  }))
                }
                placeholder="e.g., 1 lb bag, dozen, loaf, 4-pack, 0.2 oz pouch"
              />
            </label>

            <label>
              Planned Units
              <input
                type="number"
                value={newProduct.plannedUnits}
                onChange={(event) =>
                  setNewProduct((current) => ({
                    ...current,
                    plannedUnits: event.target.value
                  }))
                }
                placeholder="e.g., 24"
              />
            </label>

            <label>
              Amount Per Unit
              <input
                type="number"
                step="0.0001"
                value={newProduct.unitAmount}
                onChange={(event) =>
                  setNewProduct((current) => ({
                    ...current,
                    unitAmount: event.target.value
                  }))
                }
                placeholder="e.g., 1, 0.2, 12"
              />
            </label>

            <label>
              Amount Unit
              <input
                value={newProduct.amountUnit}
                onChange={(event) =>
                  setNewProduct((current) => ({
                    ...current,
                    amountUnit: event.target.value
                  }))
                }
                placeholder="e.g., lb, oz, dozen, each, tray"
              />
            </label>

            <label>
              Buffer %
              <input
                type="number"
                value={newProduct.bufferPct}
                onChange={(event) =>
                  setNewProduct((current) => ({
                    ...current,
                    bufferPct: event.target.value
                  }))
                }
                placeholder="e.g., 10"
              />
            </label>

            <label>
              Notes
              <input
                value={newProduct.notes}
                onChange={(event) =>
                  setNewProduct((current) => ({ ...current, notes: event.target.value }))
                }
                placeholder="e.g., Best seller, sample item, keep cold"
              />
            </label>

            <div className="formActions fullSpan compactActions">
              <button className="primaryButton compactPrimary" type="submit">
                <Plus size={15} />
                Add Product
              </button>
            </div>
          </form>
        </div>

        <div className="workspacePanel compactPanel marketPrepPrintSummary">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Summary</p>
              <h3>Category Summary</h3>
            </div>
          </div>

          <div className="savedList compactSavedList">
            {Object.keys(categorySummary).length ? (
              Object.entries(categorySummary).map(([category, summary]) => (
                <div className="savedItem compactSavedItem" key={category}>
                  <div>
                    <h4>{category}</h4>
                    <p>
                      {summary.items} items • {summary.units} planned units
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="placeholderBox compactPlaceholder">
                Add products to see category totals.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="workspacePanel compactPanel scrollAnchor marketPrepPrintPackList" ref={packListRef}>
        <div className="workspaceHeader compactPanelHeader">
          <div>
            <p className="eyebrow">Pack List</p>
            <h3>Market Pack + Prep Plan</h3>
          </div>

          <div className="formActions compactActions marketPrepNoPrint">
            <button
              className="secondaryButton compactButton"
              type="button"
              onClick={printPlan}
            >
              <Printer size={15} />
              Print
            </button>

            <button
              className="primaryButton compactPrimary"
              type="button"
              onClick={savePlan}
              disabled={saving}
            >
              <Save size={15} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="marketPrepPrintHeader">
          <h2>{marketName}</h2>
          <p>
            {marketDate}
            {location ? ` • ${location}` : ""}
            {weatherNotes ? ` • ${weatherNotes}` : ""}
          </p>
        </div>

        <div className="batchTable compactBatchTable marketPrepCompactTable">
          <div className="batchTableHeader marketPrepCompactHeader">
            <span>Done</span>
            <span>Product</span>
            <span>Category</span>
            <span>Unit</span>
            <span>Qty</span>
            <span>Amt / Unit</span>
            <span>Total</span>
            <span>Target</span>
            <span>Notes</span>
            <span className="marketPrepNoPrint"></span>
          </div>

          {products.map((product) => {
            const productTotals = getProductTotals(product);

            return (
              <div className="batchTableRow marketPrepCompactRow" key={product.id}>
                <span className="marketPrepCheckCell">
                  <input
                    type="checkbox"
                    checked={Boolean(product.packed)}
                    onChange={() => togglePacked(product.id)}
                  />
                </span>

                <span>
                  <input
                    value={product.name}
                    onChange={(event) =>
                      updateProduct(product.id, "name", event.target.value)
                    }
                  />
                </span>

                <span>
                  <select
                    value={product.category}
                    onChange={(event) =>
                      updateProduct(product.id, "category", event.target.value)
                    }
                  >
                    {marketCategories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </span>

                <span>
                  <input
                    value={product.unitLabel}
                    onChange={(event) =>
                      updateProduct(product.id, "unitLabel", event.target.value)
                    }
                  />
                </span>

                <span>
                  <input
                    type="number"
                    value={product.plannedUnits}
                    onChange={(event) =>
                      updateProduct(product.id, "plannedUnits", event.target.value)
                    }
                  />
                </span>

                <span>
                  <div className="amountUnitInline">
                    <input
                      type="number"
                      step="0.0001"
                      value={product.unitAmount}
                      onChange={(event) =>
                        updateProduct(product.id, "unitAmount", event.target.value)
                      }
                    />
                    <input
                      value={product.amountUnit}
                      onChange={(event) =>
                        updateProduct(product.id, "amountUnit", event.target.value)
                      }
                    />
                  </div>
                </span>

                <span className="marketPrepCalculated">
                  {round(productTotals.plannedAmount)} {product.amountUnit}
                </span>

                <span className="marketPrepCalculated">
                  {round(productTotals.finalAmount)} {product.amountUnit}
                  {Number(product.bufferPct) > 0 ? (
                    <small>{product.bufferPct}% buffer</small>
                  ) : null}
                </span>

                <span>
                  <input
                    value={product.notes}
                    onChange={(event) =>
                      updateProduct(product.id, "notes", event.target.value)
                    }
                  />
                </span>

                <span className="marketPrepNoPrint">
                  <button
                    className="iconButton danger"
                    type="button"
                    onClick={() => removeProduct(product.id)}
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
