import { useMemo, useState } from "react";
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

export default function MarketPrepPlanner() {
  const [marketName, setMarketName] = useState("Lexington Farmers Market");
  const [marketDate, setMarketDate] = useState(todayISO());
  const [location, setLocation] = useState("Southland Drive");
  const [weatherNotes, setWeatherNotes] = useState("");
  const [products, setProducts] = useState(starterProducts);
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

    if (!newProduct.name.trim()) return;

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
  }

  function printPlan() {
    window.print();
  }

  return (
    <div className="modulePage marketPrepPage compactSpicePage">
      <section className="moduleHero compactHero noActionHero">
        <div>
          <p className="eyebrow">Market Prep Planner</p>
          <h2>Plan harvest, packing, and product quantities before market day.</h2>
          <p>
            Build a market plan by location and date, estimate 1oz and 2oz container
            counts, add harvest buffer, and generate a simple prep list.
          </p>
        </div>
      </section>

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
          <h3>Prep Summary</h3>
          <p>Review totals and print a working market prep sheet.</p>
        </div>
      </section>

      <section className="spiceWorkspace compactWorkspace">
        <div className="workspacePanel compactPanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Setup</p>
              <h3>Market Details</h3>
            </div>

            <button className="secondaryButton compactButton" type="button" onClick={printPlan}>
              <Printer size={15} />
              Print Plan
            </button>
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

              <button className="secondaryButton compactButton" type="button">
                <Save size={15} />
                Save Coming Soon
              </button>
            </div>
          </form>
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
