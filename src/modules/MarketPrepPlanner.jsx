import { useEffect, useMemo, useState } from "react";
import {
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

const starterProducts = [
  {
    id: "rambo-radish",
    name: "Rambo Radish",
    category: "Microgreens",
    target1oz: 10,
    target2oz: 4,
    harvestBufferPct: 10,
    notes: "High visual impact, good seller."
  },
  {
    id: "sunflower",
    name: "Black Oil Sunflower",
    category: "Microgreens",
    target1oz: 12,
    target2oz: 6,
    harvestBufferPct: 10,
    notes: "Core market staple."
  },
  {
    id: "pea-shoots",
    name: "Pea Shoots",
    category: "Microgreens",
    target1oz: 10,
    target2oz: 5,
    harvestBufferPct: 10,
    notes: "Good for samples and broad customer appeal."
  },
  {
    id: "spicy-mix",
    name: "Spicy Salad Mix",
    category: "Microgreens",
    target1oz: 8,
    target2oz: 4,
    harvestBufferPct: 10,
    notes: "Good upsell for sandwiches, tacos, eggs."
  }
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function round(value, digits = 1) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(value) || 0) * factor) / factor;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createBlankPlan() {
  return {
    id: "",
    marketName: "Lexington Farmers Market",
    marketDate: todayISO(),
    location: "Southland Drive",
    weatherNotes: "",
    products: starterProducts
  };
}

export default function MarketPrepPlanner() {
  const { user, loginWithGoogle } = useAuth();

  const [planId, setPlanId] = useState("");
  const [marketName, setMarketName] = useState("Lexington Farmers Market");
  const [marketDate, setMarketDate] = useState(todayISO());
  const [location, setLocation] = useState("Southland Drive");
  const [weatherNotes, setWeatherNotes] = useState("");
  const [products, setProducts] = useState(starterProducts);
  const [savedPlans, setSavedPlans] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Microgreens",
    target1oz: "",
    target2oz: "",
    harvestBufferPct: 10,
    notes: ""
  });

  const totals = useMemo(() => {
    return products.reduce(
      (sum, product) => {
        const oneOz = Number(product.target1oz) || 0;
        const twoOz = Number(product.target2oz) || 0;
        const packagedOz = oneOz + twoOz * 2;
        const bufferMultiplier = 1 + (Number(product.harvestBufferPct) || 0) / 100;
        const harvestOz = packagedOz * bufferMultiplier;

        return {
          oneOzContainers: sum.oneOzContainers + oneOz,
          twoOzContainers: sum.twoOzContainers + twoOz,
          packagedOz: sum.packagedOz + packagedOz,
          harvestOz: sum.harvestOz + harvestOz
        };
      },
      {
        oneOzContainers: 0,
        twoOzContainers: 0,
        packagedOz: 0,
        harvestOz: 0
      }
    );
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
    setMarketName(plan.marketName || "Lexington Farmers Market");
    setMarketDate(plan.marketDate || todayISO());
    setLocation(plan.location || "");
    setWeatherNotes(plan.weatherNotes || "");
    setProducts(Array.isArray(plan.products) ? plan.products : []);
    setStatusMessage("Loaded saved market plan.");
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

  function removeProduct(id) {
    setProducts((current) => current.filter((product) => product.id !== id));
  }

  function addProduct(event) {
    event.preventDefault();

    if (!newProduct.name.trim()) {
      setStatusMessage("Product name is required.");
      return;
    }

    setProducts((current) => [
      ...current,
      {
        id: makeId(),
        name: newProduct.name.trim(),
        category: newProduct.category,
        target1oz: Number(newProduct.target1oz) || 0,
        target2oz: Number(newProduct.target2oz) || 0,
        harvestBufferPct: Number(newProduct.harvestBufferPct) || 0,
        notes: newProduct.notes.trim()
      }
    ]);

    setNewProduct({
      name: "",
      category: "Microgreens",
      target1oz: "",
      target2oz: "",
      harvestBufferPct: 10,
      notes: ""
    });

    setStatusMessage("Product added to market plan.");
  }

  function printPlan() {
    window.print();
  }

  if (!user) {
    return (
      <div className="modulePage marketPrepPage compactSpicePage">
        <section className="moduleHero compactHero">
          <div>
            <p className="eyebrow">Market Prep Planner</p>
            <h2>Sign in to save market prep plans.</h2>
            <p>
              Build harvest forecasts and pack lists locally, then sign in to save
              market plans to your Farmers Hub account.
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
          <h2>Plan harvest, packing, and product quantities before market day.</h2>
          <p>
            Build a market plan by location and date, estimate 1oz and 2oz container
            counts, add harvest buffer, save plans, and print a working prep sheet.
          </p>
        </div>
      </section>

      {statusMessage ? (
        <div className="statusBanner">
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            ×
          </button>
        </div>
      ) : null}

      <section className="toolGrid compactToolGrid">
        <div className="toolCard compactToolCard">
          <CalendarDays size={22} />
          <h3>Market Setup</h3>
          <p>Set date, location, weather notes, and market context.</p>
        </div>

        <div className="toolCard compactToolCard">
          <Sprout size={22} />
          <h3>Harvest Forecast</h3>
          <p>Estimate how many ounces to harvest with a built-in buffer.</p>
        </div>

        <div className="toolCard compactToolCard">
          <PackageCheck size={22} />
          <h3>Pack List</h3>
          <p>Calculate 1oz and 2oz container counts by product.</p>
        </div>

        <div className="toolCard compactToolCard">
          <ClipboardList size={22} />
          <h3>Saved Plans</h3>
          <p>Load, update, print, and reuse market prep plans.</p>
        </div>
      </section>

      <section className="spiceWorkspace compactWorkspace">
        <div className="workspacePanel compactPanel">
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
                placeholder="e.g., Lexington Farmers Market"
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
                placeholder="e.g., Southland Drive"
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
              <p className="eyebrow">1oz Containers</p>
              <h4>{totals.oneOzContainers}</h4>
            </div>
            <div>
              <p className="eyebrow">2oz Containers</p>
              <h4>{totals.twoOzContainers}</h4>
            </div>
            <div>
              <p className="eyebrow">Harvest Target</p>
              <h4>{round(totals.harvestOz)} oz</h4>
            </div>
          </div>

          <div className="placeholderBox compactPlaceholder">
            <strong>{marketName}</strong> at <strong>{location}</strong> on{" "}
            <strong>{marketDate}</strong>
            {weatherNotes ? ` • ${weatherNotes}` : ""}
          </div>
        </div>

        <div className="workspacePanel compactPanel">
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
        <div className="workspacePanel compactPanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Add Product</p>
              <h3>Product Forecast</h3>
            </div>
          </div>

          <form className="formGrid compactFormGrid" onSubmit={addProduct}>
            <label>
              Product / Variety
              <input
                value={newProduct.name}
                onChange={(event) =>
                  setNewProduct((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="e.g., Broccoli Microgreens"
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
                <option>Microgreens</option>
                <option>Spice Blend</option>
                <option>Edible Flowers</option>
                <option>Baked Goods</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              1oz Containers
              <input
                type="number"
                value={newProduct.target1oz}
                onChange={(event) =>
                  setNewProduct((current) => ({
                    ...current,
                    target1oz: event.target.value
                  }))
                }
                placeholder="e.g., 10"
              />
            </label>

            <label>
              2oz Containers
              <input
                type="number"
                value={newProduct.target2oz}
                onChange={(event) =>
                  setNewProduct((current) => ({
                    ...current,
                    target2oz: event.target.value
                  }))
                }
                placeholder="e.g., 4"
              />
            </label>

            <label>
              Harvest Buffer %
              <input
                type="number"
                value={newProduct.harvestBufferPct}
                onChange={(event) =>
                  setNewProduct((current) => ({
                    ...current,
                    harvestBufferPct: event.target.value
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
                placeholder="e.g., Heavy sample variety"
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

        <div className="workspacePanel compactPanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Summary</p>
              <h3>Prep Summary</h3>
            </div>
          </div>

          <div className="batchTotals compactBatchTotals">
            <div>
              <p className="eyebrow">Packaged</p>
              <h4>{round(totals.packagedOz)} oz</h4>
            </div>
            <div>
              <p className="eyebrow">Harvest</p>
              <h4>{round(totals.harvestOz)} oz</h4>
            </div>
            <div>
              <p className="eyebrow">Products</p>
              <h4>{products.length}</h4>
            </div>
          </div>

          <div className="placeholderBox compactPlaceholder">
            Harvest target includes each product’s buffer percentage.
          </div>
        </div>
      </section>

      <section className="workspacePanel compactPanel">
        <div className="workspaceHeader compactPanelHeader">
          <div>
            <p className="eyebrow">Pack List</p>
            <h3>Market Pack + Harvest Plan</h3>
          </div>
        </div>

        <div className="batchTable compactBatchTable">
          <div className="batchTableHeader marketPrepTableHeader">
            <span>Product</span>
            <span>Category</span>
            <span>1oz</span>
            <span>2oz</span>
            <span>Packaged Oz</span>
            <span>Harvest Oz</span>
            <span>Notes</span>
            <span></span>
          </div>

          {products.map((product) => {
            const oneOz = Number(product.target1oz) || 0;
            const twoOz = Number(product.target2oz) || 0;
            const packagedOz = oneOz + twoOz * 2;
            const harvestOz =
              packagedOz * (1 + (Number(product.harvestBufferPct) || 0) / 100);

            return (
              <div className="batchTableRow marketPrepTableRow" key={product.id}>
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
                    <option>Microgreens</option>
                    <option>Spice Blend</option>
                    <option>Edible Flowers</option>
                    <option>Baked Goods</option>
                    <option>Other</option>
                  </select>
                </span>

                <span>
                  <input
                    type="number"
                    value={product.target1oz}
                    onChange={(event) =>
                      updateProduct(product.id, "target1oz", event.target.value)
                    }
                  />
                </span>

                <span>
                  <input
                    type="number"
                    value={product.target2oz}
                    onChange={(event) =>
                      updateProduct(product.id, "target2oz", event.target.value)
                    }
                  />
                </span>

                <span>{round(packagedOz)} oz</span>
                <span>{round(harvestOz)} oz</span>

                <span>
                  <input
                    value={product.notes}
                    onChange={(event) =>
                      updateProduct(product.id, "notes", event.target.value)
                    }
                  />
                </span>

                <span>
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
    </div>
  );
}
