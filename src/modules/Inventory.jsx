import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  DollarSign,
  Edit3,
  Filter,
  PackageCheck,
  Plus,
  Save,
  Search,
  Trash2,
  TrendingDown,
  X
} from "lucide-react";

import { useAuth } from "../AuthContext.jsx";
import { useUnsavedChanges } from "../UnsavedChangesContext.jsx";
import StatCard from "../components/StatCard.jsx";
import {
  deleteInventoryItem,
  getInventoryItems,
  saveInventoryItem
} from "../services/inventoryService.js";

const inventoryCategories = [
  "Microgreens",
  "Spices",
  "Packaging",
  "Seeds",
  "Ingredients",
  "Finished Goods",
  "Market Supplies",
  "Cleaning Supplies",
  "Equipment",
  "Other"
];

const inventoryStatuses = [
  "In Stock",
  "Low Stock",
  "Out of Stock",
  "Expiring Soon",
  "Archived"
];

const sourceModules = [
  "Manual",
  "Products & Pricing",
  "Spice Kitchen",
  "Market Prep Planner",
  "Planting Scheduler",
  "Orders",
  "Other"
];

const storageLocations = [
  "Grow Room",
  "Refrigerator",
  "Freezer",
  "Dry Storage",
  "Market Bins",
  "Packaging Area",
  "Kitchen",
  "Other"
];

const blankInventoryItem = {
  id: "",
  name: "",
  category: "Finished Goods",
  sourceModule: "Manual",
  productId: "",
  productName: "",
  recipeId: "",
  recipeName: "",
  variantId: "",
  variantName: "",
  quantityOnHand: "",
  unit: "each",
  parLevel: "",
  reorderPoint: "",
  storageLocation: "",
  costPerUnit: "",
  wholesalePrice: "",
  retailPrice: "",
  bestByDate: "",
  status: "In Stock",
  notes: ""
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function parseLocalDate(dateString) {
  if (!dateString) return null;

  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysUntil(dateString) {
  const date = parseLocalDate(dateString);
  if (!date) return null;

  const today = parseLocalDate(todayISO());
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateString) {
  const date = parseLocalDate(dateString);
  if (!date) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatNumber(value) {
  const number = Number(value) || 0;

  return number.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: number % 1 === 0 ? 0 : 2
  });
}

function formatCurrency(value) {
  const number = Number(value) || 0;

  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function cleanCurrencyInput(value) {
  if (value === "" || value === null || value === undefined) return "";

  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : "";
}

function cleanNumber(value) {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  return Number.isFinite(number) ? number : "";
}

function getItemComputedStatus(item) {
  const quantity = Number(item.quantityOnHand) || 0;
  const reorderPoint = Number(item.reorderPoint) || 0;
  const bestByDays = daysUntil(item.bestByDate);

  if (item.status === "Archived") return "Archived";
  if (quantity <= 0) return "Out of Stock";
  if (bestByDays !== null && bestByDays >= 0 && bestByDays <= 14) return "Expiring Soon";
  if (reorderPoint > 0 && quantity <= reorderPoint) return "Low Stock";

  return item.status || "In Stock";
}

function getStatusClass(status) {
  return String(status || "")
    .toLowerCase()
    .replaceAll(" ", "-");
}

function getStatusLabel(item) {
  return getItemComputedStatus(item);
}

function getInventoryValue(item) {
  return (Number(item.quantityOnHand) || 0) * (Number(item.costPerUnit) || 0);
}

function getWholesaleValue(item) {
  return (Number(item.quantityOnHand) || 0) * (Number(item.wholesalePrice) || 0);
}

function getRetailValue(item) {
  return (Number(item.quantityOnHand) || 0) * (Number(item.retailPrice) || 0);
}

function InventoryDetail({ label, value }) {
  if (value === undefined || value === null || value === "") return null;

  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function Inventory() {
  const { user, loginWithGoogle } = useAuth();
  const { isDirty: hasUnsavedChanges, markUnsaved, markSaved } = useUnsavedChanges();

  const [inventoryItems, setInventoryItems] = useState([]);
  const [itemForm, setItemForm] = useState(blankInventoryItem);
  const [editingItemId, setEditingItemId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  function showStatus(message, type = "info") {
    setStatusMessage(message);
    setStatusType(type);
  }

  function markInventoryDirty() {
    markUnsaved({
      source: "Inventory",
      onSave: saveItem
    });
  }

  useEffect(() => {
    if (!statusMessage) return undefined;

    const timer = window.setTimeout(() => {
      setStatusMessage("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  async function loadInventoryItems() {
    if (!user) return;

    setLoading(true);

    try {
      const items = await getInventoryItems(user.uid);
      setInventoryItems(items);
    } catch (error) {
      console.error(error);
      showStatus("Could not load inventory items.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadInventoryItems();
    } else {
      setInventoryItems([]);
    }
  }, [user]);

  const inventorySummary = useMemo(() => {
    const activeItems = inventoryItems.filter(
      (item) => getItemComputedStatus(item) !== "Archived"
    );

    const lowStockItems = activeItems.filter(
      (item) => getItemComputedStatus(item) === "Low Stock"
    );

    const outOfStockItems = activeItems.filter(
      (item) => getItemComputedStatus(item) === "Out of Stock"
    );

    const expiringSoonItems = activeItems.filter(
      (item) => getItemComputedStatus(item) === "Expiring Soon"
    );

    const totalValue = activeItems.reduce(
      (sum, item) => sum + getInventoryValue(item),
      0
    );

    const totalWholesaleValue = activeItems.reduce(
      (sum, item) => sum + getWholesaleValue(item),
      0
    );

    const totalRetailValue = activeItems.reduce(
      (sum, item) => sum + getRetailValue(item),
      0
    );

    return {
      activeItems: activeItems.length,
      lowStockItems: lowStockItems.length,
      outOfStockItems: outOfStockItems.length,
      expiringSoonItems: expiringSoonItems.length,
      totalValue,
      totalWholesaleValue,
      totalRetailValue
    };
  }, [inventoryItems]);

  const filteredItems = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return inventoryItems
      .filter((item) => {
        const computedStatus = getItemComputedStatus(item);

        if (categoryFilter !== "All" && item.category !== categoryFilter) return false;
        if (statusFilter !== "All" && computedStatus !== statusFilter) return false;
        if (locationFilter !== "All" && item.storageLocation !== locationFilter) return false;

        if (!search) return true;

        return (
          item.name?.toLowerCase().includes(search) ||
          item.category?.toLowerCase().includes(search) ||
          item.sourceModule?.toLowerCase().includes(search) ||
          item.storageLocation?.toLowerCase().includes(search) ||
          item.variantName?.toLowerCase().includes(search) ||
          item.productName?.toLowerCase().includes(search) ||
          item.recipeName?.toLowerCase().includes(search) ||
          item.notes?.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => {
        const statusOrder = {
          "Out of Stock": 0,
          "Low Stock": 1,
          "Expiring Soon": 2,
          "In Stock": 3,
          Archived: 4
        };

        const statusA = statusOrder[getItemComputedStatus(a)] ?? 99;
        const statusB = statusOrder[getItemComputedStatus(b)] ?? 99;

        if (statusA !== statusB) return statusA - statusB;

        return String(a.name || "").localeCompare(String(b.name || ""));
      });
  }, [inventoryItems, searchTerm, categoryFilter, statusFilter, locationFilter]);

  const lowStockItems = useMemo(() => {
    return inventoryItems
      .filter((item) =>
        ["Low Stock", "Out of Stock"].includes(getItemComputedStatus(item))
      )
      .slice(0, 6);
  }, [inventoryItems]);

  const expiringSoonItems = useMemo(() => {
    return inventoryItems
      .map((item) => ({
        ...item,
        days: daysUntil(item.bestByDate)
      }))
      .filter(
  (item) =>
    Number(item.quantityOnHand) > 0 &&
    item.days !== null &&
    item.days >= 0 &&
    item.days <= 30
)
      .sort((a, b) => a.days - b.days)
      .slice(0, 6);
  }, [inventoryItems]);

  const uniqueLocations = useMemo(() => {
    return Array.from(
      new Set(
        inventoryItems
          .map((item) => item.storageLocation)
          .filter(Boolean)
      )
    ).sort();
  }, [inventoryItems]);

  function openNewItem() {
    setItemForm(blankInventoryItem);
    setEditingItemId(null);
    setSelectedItem(null);
    setIsFormOpen(true);
  }

  function openEditItem(item) {
    setItemForm({
      id: item.id || "",
      name: item.name || "",
      category: item.category || "Finished Goods",
      sourceModule: item.sourceModule || "Manual",
      productId: item.productId || "",
      productName: item.productName || "",
      recipeId: item.recipeId || "",
      recipeName: item.recipeName || "",
      variantId: item.variantId || "",
      variantName: item.variantName || "",
      quantityOnHand: item.quantityOnHand ?? "",
      unit: item.unit || "each",
      parLevel: item.parLevel ?? "",
      reorderPoint: item.reorderPoint ?? "",
      storageLocation: item.storageLocation || "",
      costPerUnit: cleanCurrencyInput(item.costPerUnit),
      wholesalePrice: cleanCurrencyInput(item.wholesalePrice),
      retailPrice: cleanCurrencyInput(item.retailPrice),
      bestByDate: item.bestByDate || "",
      status: item.status || "In Stock",
      notes: item.notes || ""
    });

    setEditingItemId(item.id || null);
    setSelectedItem(item);
    setIsFormOpen(true);
  }

  function updateItemField(field, value) {
    markInventoryDirty();
    setItemForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function saveItem(event) {
    event?.preventDefault?.();

    if (!user) {
      showStatus("Sign in to save inventory items.", "error");
      return;
    }

    const cleanItem = {
      id: itemForm.id || editingItemId || "",
      name: itemForm.name.trim(),
      category: itemForm.category,
      sourceModule: itemForm.sourceModule,
      productId: itemForm.productId || "",
      productName: itemForm.productName || "",
      recipeId: itemForm.recipeId || "",
      recipeName: itemForm.recipeName || "",
      variantId: itemForm.variantId || "",
      variantName: itemForm.variantName || "",
      quantityOnHand: cleanNumber(itemForm.quantityOnHand),
      unit: itemForm.unit.trim() || "each",
      parLevel: cleanNumber(itemForm.parLevel),
      reorderPoint: cleanNumber(itemForm.reorderPoint),
      storageLocation: itemForm.storageLocation.trim(),
      costPerUnit: cleanNumber(itemForm.costPerUnit),
      wholesalePrice: cleanNumber(itemForm.wholesalePrice),
      retailPrice: cleanNumber(itemForm.retailPrice),
      bestByDate: Number(itemForm.quantityOnHand) <= 0 ? "" : itemForm.bestByDate,
status: Number(itemForm.quantityOnHand) <= 0 ? "Out of Stock" : itemForm.status,
      notes: itemForm.notes.trim()
    };

    if (!cleanItem.name) {
      showStatus("Inventory item name is required.", "error");
      return;
    }

    setSaving(true);

    try {
      const savedId = await saveInventoryItem(user.uid, cleanItem);

      setItemForm(blankInventoryItem);
      setEditingItemId(null);
      setSelectedItem(null);
      setIsFormOpen(false);
      markSaved();
      showStatus(editingItemId ? "Inventory item updated." : "Inventory item saved.", "success");

      await loadInventoryItems();

      if (savedId) {
        setSelectedItem(null);
      }
    } catch (error) {
      console.error(error);
      showStatus("Could not save inventory item.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(itemId) {
    if (!user || !itemId) return;

    try {
      await deleteInventoryItem(user.uid, itemId);

      if (editingItemId === itemId) {
        setItemForm(blankInventoryItem);
        setEditingItemId(null);
        setIsFormOpen(false);
      }

      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
      }

      markSaved();
      showStatus("Inventory item deleted.", "success");
      await loadInventoryItems();
    } catch (error) {
      console.error(error);
      showStatus("Could not delete inventory item.", "error");
    }
  }

  function adjustQuantity(item, change) {
    const currentQuantity = Number(item.quantityOnHand) || 0;
    const nextQuantity = Math.max(0, currentQuantity + change);

    openEditItem({
      ...item,
      quantityOnHand: nextQuantity
    });
  }

  if (!user) {
    return (
      <div className="modulePage inventoryModule">
        <section className="farmModuleHero inventoryHero">
          <div className="farmModuleHeroText">
            <p className="eyebrow">Inventory</p>
            <h2>Sign in to manage inventory.</h2>
            <p>
              Track product quantities, packaging, ingredients, storage locations,
              reorder points, and expiring inventory from one shared module.
            </p>
          </div>

          <div className="farmModuleHeroActions">
            <button
              className="primaryButton compactPrimary farmHeroAction"
              type="button"
              onClick={loginWithGoogle}
            >
              Sign in with Google
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="modulePage inventoryModule">
      {statusMessage ? (
        <div className={`floatingStatus ${statusType}`}>
          <AlertCircle size={18} />
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            <X size={16} />
          </button>
        </div>
      ) : null}

      {loading ? <div className="floatingStatus info">Loading inventory...</div> : null}

      <section className="farmModuleHero inventoryHero">
        <div className="farmModuleHeroText">
          <p className="eyebrow">Inventory</p>
          <h2>Track stock, storage, reorder points, and expiring goods.</h2>
          <p>
            Manage finished products, ingredients, packaging, seeds, market supplies,
            and production inventory with clean counts and reorder visibility.
          </p>
        </div>

        <div className="farmModuleHeroActions">
          <button
            className="primaryButton compactPrimary farmHeroAction"
            type="button"
            onClick={openNewItem}
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>
      </section>

      <section
        className="hubStatGrid inventoryStatGrid inventoryStatGridForced"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
          gap: "0.65rem",
          alignItems: "stretch"
        }}
      >
        <StatCard
          icon={PackageCheck}
          label="Active Items"
          value={inventorySummary.activeItems}
          sub="tracked inventory"
          accent="inventory"
        />

        <StatCard
          icon={TrendingDown}
          label="Low Stock"
          value={inventorySummary.lowStockItems}
          sub="at reorder point"
          accent="spice"
        />

        <StatCard
          icon={CalendarClock}
          label="Expiring Soon"
          value={inventorySummary.expiringSoonItems}
          sub="within 14 days"
          accent="sourdough"
        />

        <StatCard
          icon={DollarSign}
          label="Inventory Value"
          value={formatCurrency(inventorySummary.totalValue)}
          sub="estimated cost"
          accent="pricing"
        />

        <StatCard
          icon={DollarSign}
          label="Wholesale Value"
          value={formatCurrency(inventorySummary.totalWholesaleValue)}
          sub="potential wholesale"
          accent="sourdough"
        />

        <StatCard
          icon={DollarSign}
          label="Retail Value"
          value={formatCurrency(inventorySummary.totalRetailValue)}
          sub="potential retail"
          accent="market"
        />
      </section>

      <section className="inventoryInsightGrid">
        <div className="workspacePanel compactPanel inventoryInsightPanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Needs Attention</p>
              <h3>Low or Out of Stock</h3>
            </div>
          </div>

          <div className="inventoryMiniList">
            {lowStockItems.length ? (
              lowStockItems.map((item) => (
                <button
                  type="button"
                  className="inventoryMiniItem"
                  key={`low-${item.id}`}
                  onClick={() => openEditItem(item)}
                >
                  <span className={`inventoryStatusDot ${getStatusClass(getStatusLabel(item))}`} />
                  <div>
                    <strong>{item.name}</strong>
                    <p>
                      {formatNumber(item.quantityOnHand)} {item.unit}
                      {item.reorderPoint !== "" ? ` • Reorder at ${item.reorderPoint}` : ""}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="placeholderBox compactPlaceholder">
                Nothing is currently below its reorder point.
              </div>
            )}
          </div>
        </div>

        <div className="workspacePanel compactPanel inventoryInsightPanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Rotation</p>
              <h3>Expiring Soon</h3>
            </div>
          </div>

          <div className="inventoryMiniList">
            {expiringSoonItems.length ? (
              expiringSoonItems.map((item) => (
                <button
                  type="button"
                  className="inventoryMiniItem"
                  key={`expiring-${item.id}`}
                  onClick={() => openEditItem(item)}
                >
                  <span className={`inventoryStatusDot ${getStatusClass(getStatusLabel(item))}`} />
                  <div>
                    <strong>{item.name}</strong>
                    <p>
                      {formatDate(item.bestByDate)}
                      {item.days === 0
                        ? " • Today"
                        : item.days === 1
                          ? " • Tomorrow"
                          : ` • ${item.days} days`}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="placeholderBox compactPlaceholder">
                No inventory is expiring within the next 30 days.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="workspacePanel compactPanel inventoryDirectoryPanel">
        <div
          className="workspaceHeader compactPanelHeader inventoryDirectoryHeader"
          style={{ marginBottom: "0.55rem" }}
        >
          <div>
            <p className="eyebrow">Directory</p>
            <h3>Inventory Items</h3>
          </div>

          <div className="inventoryFilterSummary">
            <Filter size={15} />
            <span>{filteredItems.length} visible</span>
          </div>
        </div>

        <div
          className="inventoryFilterGrid"
          style={{ marginTop: "-0.65rem", marginBottom: "0.75rem" }}
        >
          <div className="searchBox compactSearch inventorySearchBox">
            <Search size={17} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search inventory..."
            />
          </div>

          <label>
            Category
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="All">All categories</option>
              {inventoryCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>

          <label>
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All statuses</option>
              {inventoryStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>

          <label>
            Location
            <select
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
            >
              <option value="All">All locations</option>
              {uniqueLocations.map((location) => (
                <option key={location}>{location}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="inventoryTableWrap">
          <div className="inventoryTable">
            <div className="inventoryTableHeader">
              <span>Item</span>
              <span>Category</span>
              <span>Qty / Adjust</span>
              <span>Reorder</span>
              <span>Location</span>
              <span>Best By</span>
              <span>Cost</span>
              <span>Wholesale</span>
              <span>Retail</span>
              <span>Status</span>
              <span></span>
            </div>

            {filteredItems.length ? (
              filteredItems.map((item) => {
                const status = getStatusLabel(item);

                return (
                  <div className="inventoryTableRow" key={item.id}>
                    <span className="inventoryNameCell">
                      <button
                        type="button"
                        className="savedItemLink"
                        onClick={() => openEditItem(item)}
                      >
                        {item.name}
                      </button>
                      <small>{item.sourceModule || "Manual"}</small>
                    </span>

                    <span>{item.category || "Other"}</span>

                    <span className="inventoryQuantityCell">
                      <strong>
                        {formatNumber(item.quantityOnHand)} {item.unit || "each"}
                      </strong>
                      <div className="inventoryAdjustButtons">
                        <button type="button" title="Subtract 1" onClick={() => adjustQuantity(item, -1)}>
                          -1
                        </button>
                        <button type="button" title="Add 1" onClick={() => adjustQuantity(item, 1)}>
                          +1
                        </button>
                      </div>
                    </span>

                    <span>
                      {item.reorderPoint !== "" && item.reorderPoint !== null
                        ? `${formatNumber(item.reorderPoint)} ${item.unit || ""}`
                        : "Not set"}
                    </span>

                    <span>{item.storageLocation || "Not listed"}</span>

                    <span>
                      {item.bestByDate ? formatDate(item.bestByDate) : "Not listed"}
                    </span>

                    <span>{formatCurrency(getInventoryValue(item))}</span>
                    <span>{formatCurrency(getWholesaleValue(item))}</span>
                    <span>{formatCurrency(getRetailValue(item))}</span>

                    <span>
                      <span className={`inventoryStatusPill ${getStatusClass(status)}`}>
                        {status}
                      </span>
                    </span>

                    <span className="inventoryActions">
                      <button type="button" onClick={() => openEditItem(item)}>
                        <Edit3 size={14} />
                      </button>

                      <button type="button" onClick={() => removeItem(item.id)}>
                        <Trash2 size={14} />
                      </button>
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="placeholderBox compactPlaceholder">
                No inventory items match the current filters.
              </div>
            )}
          </div>
        </div>
      </section>

      {isFormOpen ? (
        <div className="inventoryModalOverlay" role="dialog" aria-modal="true">
          <div className="inventoryModal">
            <div className="inventoryModalHeader">
              <div>
                <p className="eyebrow">{editingItemId ? "Edit Item" : "New Item"}</p>
                <h3>{editingItemId ? "Update Inventory Item" : "Add Inventory Item"}</h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setItemForm(blankInventoryItem);
                  setEditingItemId(null);
                  setSelectedItem(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form className="inventoryModalForm" onSubmit={saveItem}>
              <label className="fullSpan">
                Item Name *
                <input
                  value={itemForm.name}
                  onChange={(event) => updateItemField("name", event.target.value)}
                  placeholder="e.g., Broccoli microgreens, 1 oz spice pouch, 8 oz deli cups"
                />
              </label>

              <label>
                Category
                <select
                  value={itemForm.category}
                  onChange={(event) => updateItemField("category", event.target.value)}
                >
                  {inventoryCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label>
                Source
                <select
                  value={itemForm.sourceModule}
                  onChange={(event) => updateItemField("sourceModule", event.target.value)}
                >
                  {sourceModules.map((source) => (
                    <option key={source}>{source}</option>
                  ))}
                </select>
              </label>

              <label>
                Quantity On Hand
                <input
                  type="number"
                  step="0.0001"
                  value={itemForm.quantityOnHand}
                  onChange={(event) =>
                    updateItemField("quantityOnHand", event.target.value)
                  }
                  placeholder="e.g., 24"
                />
              </label>

              <label>
                Unit
                <input
                  value={itemForm.unit}
                  onChange={(event) => updateItemField("unit", event.target.value)}
                  placeholder="e.g., each, oz, lb, tray, bag"
                />
              </label>

              <label>
                Par Level
                <input
                  type="number"
                  step="0.0001"
                  value={itemForm.parLevel}
                  onChange={(event) => updateItemField("parLevel", event.target.value)}
                  placeholder="Ideal stock level"
                />
              </label>

              <label>
                Reorder Point
                <input
                  type="number"
                  step="0.0001"
                  value={itemForm.reorderPoint}
                  onChange={(event) => updateItemField("reorderPoint", event.target.value)}
                  placeholder="Warn when at or below"
                />
              </label>

              <label>
                Storage Location
                <input
                  list="inventory-storage-locations"
                  value={itemForm.storageLocation}
                  onChange={(event) =>
                    updateItemField("storageLocation", event.target.value)
                  }
                  placeholder="e.g., Refrigerator, Dry Storage"
                />

                <datalist id="inventory-storage-locations">
                  {storageLocations.map((location) => (
                    <option value={location} key={location} />
                  ))}
                </datalist>
              </label>

              <label>
                Cost Per Unit
                <input
                  type="number"
                  step="0.01"
                  value={itemForm.costPerUnit}
                  onChange={(event) => updateItemField("costPerUnit", event.target.value)}
                  onBlur={(event) =>
                    updateItemField("costPerUnit", cleanCurrencyInput(event.target.value))
                  }
                  placeholder="e.g., 0.14"
                />
              </label>

              <label>
                Wholesale Price
                <input
                  type="number"
                  step="0.01"
                  value={itemForm.wholesalePrice}
                  onChange={(event) => updateItemField("wholesalePrice", event.target.value)}
                  onBlur={(event) =>
                    updateItemField("wholesalePrice", cleanCurrencyInput(event.target.value))
                  }
                  placeholder="e.g., 7.50"
                />
              </label>

              <label>
                Retail Price
                <input
                  type="number"
                  step="0.01"
                  value={itemForm.retailPrice}
                  onChange={(event) => updateItemField("retailPrice", event.target.value)}
                  onBlur={(event) =>
                    updateItemField("retailPrice", cleanCurrencyInput(event.target.value))
                  }
                  placeholder="e.g., 12.00"
                />
              </label>

              <label>
                Best By / Expiration
                <input
                  type="date"
                  value={itemForm.bestByDate}
                  onChange={(event) => updateItemField("bestByDate", event.target.value)}
                />
              </label>

              <label>
                Status
                <select
                  value={itemForm.status}
                  onChange={(event) => updateItemField("status", event.target.value)}
                >
                  {inventoryStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label className="fullSpan">
                Notes
                <textarea
                  value={itemForm.notes}
                  onChange={(event) => updateItemField("notes", event.target.value)}
                  placeholder="Storage instructions, vendor notes, batch notes, reorder notes..."
                />
              </label>

              {selectedItem ? (
                <div className="inventoryDetailGrid fullSpan">
                  <InventoryDetail
                    label="Computed Status"
                    value={getItemComputedStatus({
                      ...selectedItem,
                      ...itemForm
                    })}
                  />

                  <InventoryDetail
                    label="Inventory Value"
                    value={formatCurrency(
                      (Number(itemForm.quantityOnHand) || 0) *
                        (Number(itemForm.costPerUnit) || 0)
                    )}
                  />

                  <InventoryDetail
                    label="Wholesale Value"
                    value={formatCurrency(
                      (Number(itemForm.quantityOnHand) || 0) *
                        (Number(itemForm.wholesalePrice) || 0)
                    )}
                  />

                  <InventoryDetail
                    label="Retail Value"
                    value={formatCurrency(
                      (Number(itemForm.quantityOnHand) || 0) *
                        (Number(itemForm.retailPrice) || 0)
                    )}
                  />

                  <InventoryDetail
                    label="Days Until Best By"
                    value={
                      daysUntil(itemForm.bestByDate) === null
                        ? ""
                        : daysUntil(itemForm.bestByDate)
                    }
                  />
                </div>
              ) : null}

              <div className="inventoryModalActions fullSpan">
                {editingItemId ? (
                  <button
                    className="dangerButton"
                    type="button"
                    onClick={() => removeItem(editingItemId)}
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                ) : null}

                <button
                  className="secondaryButton compactButton"
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setItemForm(blankInventoryItem);
                    setEditingItemId(null);
                    setSelectedItem(null);
                  }}
                >
                  Cancel
                </button>

                <button
                  className={`primaryButton compactPrimary ${
                    hasUnsavedChanges ? "dirtySaveButton" : ""
                  }`}
                  type="submit"
                  disabled={saving}
                >
                  <Save size={15} />
                  {saving ? "Saving..." : editingItemId ? "Save Changes" : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
