import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CircleHelp,
  DollarSign,
  Edit3,
  PackageCheck,
  Plus,
  Save,
  Search,
  Trash2,
  TrendingDown,
  X
} from "lucide-react";

import ActionMenu from "../components/ActionMenu.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import EmptyState from "../components/EmptyState.jsx";
import FilterBar from "../components/FilterBar.jsx";
import FormField from "../components/FormField.jsx";
import InventoryGuideContent from "../components/InventoryGuideContent.jsx";
import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import ModuleHero from "../components/ModuleHero.jsx";
import RecordList from "../components/RecordList.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusPill from "../components/StatusPill.jsx";
import Toast from "../components/Toast.jsx";
import WorkspacePanel from "../components/WorkspacePanel.jsx";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../AuthContext.jsx";
import { useUnsavedChanges } from "../UnsavedChangesContext.jsx";
import {
  deleteInventoryItem,
  getInventoryItems,
  saveInventoryItem
} from "../services/inventoryService.js";
import { getProducts } from "../services/productService.js";
import { getSpiceRecipes } from "../services/spiceKitchenService.js";

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
  "Use/Sell Soon",
  "Expired",
  "Archived"
];

const sourceModules = [
  "Manual",
  "Products & Pricing",
  "Spice Kitchen",
  "Baking Planner",
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

  const [year, month, day] = String(dateString).split("-").map(Number);

  if (!year || !month || !day) return null;

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

function parseInventoryNumber(value) {
  if (value === "" || value === null || value === undefined) return 0;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const directNumber = Number(value);
  if (Number.isFinite(directNumber)) return directNumber;

  const match = String(value).match(/-?\d+(\.\d+)?/);
  if (!match) return 0;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value) {
  const number = parseInventoryNumber(value);

  return number.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: number % 1 === 0 ? 0 : 2
  });
}

function formatCurrency(value) {
  const number = parseInventoryNumber(value);

  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function cleanCurrencyInput(value) {
  if (value === "" || value === null || value === undefined) return "";

  const number = parseInventoryNumber(value);
  return Number.isFinite(number) ? number.toFixed(2) : "";
}

function cleanNumber(value) {
  if (value === "" || value === null || value === undefined) return "";
  const number = parseInventoryNumber(value);
  return Number.isFinite(number) ? number : "";
}

function cleanWholeNumberInput(value) {
  if (value === "" || value === null || value === undefined) return "";

  const number = parseInventoryNumber(value);
  if (!Number.isFinite(number)) return "";

  return String(Math.max(0, Math.round(number)));
}

function moneyValue(value) {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : "";
}

function numberOrFallback(...values) {
  for (const value of values) {
    if (value === "" || value === null || value === undefined) continue;
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }

  return "";
}

function formatPackageSize(size, unit) {
  const amount = Number(size) || 0;
  if (!amount) return "";
  return `${Number(amount.toFixed(3)).toString()} ${unit || ""}`.trim();
}

function buildSpiceDirectoryProducts(spiceRecipes = []) {
  const products = [];

  spiceRecipes
    .filter((recipe) => recipe?.listInProductDirectory)
    .forEach((recipe) => {
      const packageRows = Array.isArray(recipe.productPackages)
        ? recipe.productPackages
        : [];
      const costPerOunce = Number(recipe.formulaCostPerOunce) || 0;
      const listSizesAsUniqueProducts = Boolean(recipe.listSizesAsUniqueProducts);

      if (listSizesAsUniqueProducts) {
        packageRows.forEach((packageItem, index) => {
          const packageName =
            packageItem.name ||
            formatPackageSize(packageItem.size, packageItem.unit) ||
            `Size ${index + 1}`;
          const ingredientCost =
            Number(packageItem.ingredientCost) ||
            (Number(packageItem.packageOunces) || 0) * costPerOunce;

          products.push({
            id: `spice-${recipe.id}-${index}`,
            sourceType: "spice",
            sourceLabel: "Spice Kitchen",
            sourceRecipeId: recipe.id,
            sourceVariantIndex: index,
            isGeneratedProduct: true,
            isVariantProduct: true,
            parentName: recipe.name,
            name: `${recipe.name} - ${packageName}`,
            category: "Spices",
            status: "Active",
            sku: packageItem.sku || "",
            unitLabel: packageName,
            description: recipe.notes || "",
            retailPrice: moneyValue(packageItem.retailPrice),
            wholesalePrice: moneyValue(packageItem.wholesalePrice),
            batchIngredientCost: moneyValue(ingredientCost),
            batchUnits: numberOrFallback(packageItem.batchUnits, 1),
            packagingCostPerUnit: moneyValue(packageItem.packagingCostPerUnit),
            notes: "Generated from Spice Kitchen.",
            generatedVariants: [],
            updatedAt: recipe.updatedAt || recipe.createdAt || ""
          });
        });

        return;
      }

      const variants = packageRows.map((packageItem, index) => {
        const packageName =
          packageItem.name ||
          formatPackageSize(packageItem.size, packageItem.unit) ||
          `Size ${index + 1}`;
        const ingredientCost =
          Number(packageItem.ingredientCost) ||
          (Number(packageItem.packageOunces) || 0) * costPerOunce;

        return {
          id: `spice-${recipe.id}-variant-${index}`,
          packageIndex: index,
          name: packageName,
          size: packageItem.size,
          unit: packageItem.unit,
          packageOunces: packageItem.packageOunces,
          ingredientCost: moneyValue(ingredientCost),
          costPerUnit: moneyValue(ingredientCost),
          sku: packageItem.sku || "",
          retailPrice: moneyValue(packageItem.retailPrice),
          wholesalePrice: moneyValue(packageItem.wholesalePrice),
          packagingCostPerUnit: moneyValue(packageItem.packagingCostPerUnit),
          batchUnits: numberOrFallback(packageItem.batchUnits, 1)
        };
      });

      const firstVariant = variants[0] || null;

      products.push({
        id: `spice-${recipe.id}`,
        sourceType: "spice",
        sourceLabel: "Spice Kitchen",
        sourceRecipeId: recipe.id,
        isGeneratedProduct: true,
        name: recipe.name || "Untitled Spice Blend",
        category: "Spices",
        status: "Active",
        sku: firstVariant?.sku || "",
        unitLabel: firstVariant?.name || "package",
        description: recipe.notes || "",
        retailPrice: firstVariant?.retailPrice || "",
        wholesalePrice: firstVariant?.wholesalePrice || "",
        batchIngredientCost: firstVariant?.ingredientCost || moneyValue(costPerOunce),
        batchUnits: firstVariant?.batchUnits || 1,
        packagingCostPerUnit: firstVariant?.packagingCostPerUnit || "",
        notes: "Generated from Spice Kitchen. Package sizes are shown as variants.",
        formulaCostPerOunce: costPerOunce,
        generatedVariants: variants,
        listSizesAsUniqueProducts,
        selectedVariantId: firstVariant?.id || "",
        selectedVariantName: firstVariant?.name || "",
        updatedAt: recipe.updatedAt || recipe.createdAt || ""
      });
    });

  return products;
}

function buildBakingDirectoryProducts(bakingRecipes = []) {
  return bakingRecipes
    .filter((recipe) => recipe?.listInProductDirectory)
    .map((recipe) => {
      const directory = recipe.productDirectory || {};
      const productName = directory.productName || recipe.name || "Untitled Baking Product";
      const unitsPerBatch = Number(directory.unitsPerBatch) || Number(recipe.ovenCapacityUnits) || 1;
      const batchIngredientCost =
        recipe.pricingSummary?.totalCost ||
        recipe.productDirectory?.batchIngredientCost ||
        "";

      return {
        id: `baking-${recipe.id}`,
        sourceType: "baking",
        sourceLabel: "Baking Planner",
        sourceRecipeId: recipe.id,
        isGeneratedProduct: true,
        name: productName,
        category:
          recipe.category === "Loaf" ||
          recipe.category === "Baguette" ||
          recipe.category === "Pan Loaf"
            ? "Bread"
            : "Baked Goods",
        status: "Active",
        sku: "",
        unitLabel: directory.sellingUnit || recipe.unitsLabel || "unit",
        description: directory.notes || "",
        retailPrice: "",
        wholesalePrice: "",
        batchIngredientCost: moneyValue(batchIngredientCost),
costPerUnit: moneyValue(
  recipe.pricingSummary?.costPerUnit ||
    recipe.productDirectory?.costPerUnit ||
    (Number(batchIngredientCost) && Number(unitsPerBatch)
      ? Number(batchIngredientCost) / Number(unitsPerBatch)
      : "")
),
        batchUnits: unitsPerBatch,
        packagingCostPerUnit: "",
        notes: "Generated from Baking Planner.",
        generatedVariants: [],
        updatedAt: recipe.updatedAt || ""
      };
    });
}

function isArchived(item) {
  return item.status === "Archived";
}

function isOutOfStock(item) {
  return !isArchived(item) && parseInventoryNumber(item.quantityOnHand) <= 0;
}

function isLowStock(item) {
  const quantity = parseInventoryNumber(item.quantityOnHand);
  const reorderPoint = parseInventoryNumber(item.reorderPoint);

  return !isArchived(item) && quantity > 0 && reorderPoint > 0 && quantity <= reorderPoint;
}

function isExpired(item) {
  const quantity = parseInventoryNumber(item.quantityOnHand);
  const bestByDays = daysUntil(item.bestByDate);

  return (
    !isArchived(item) &&
    quantity > 0 &&
    bestByDays !== null &&
    bestByDays < 0
  );
}

function isUseSellSoon(item) {
  const quantity = parseInventoryNumber(item.quantityOnHand);
  const bestByDays = daysUntil(item.bestByDate);

  return (
    !isArchived(item) &&
    quantity > 0 &&
    bestByDays !== null &&
    bestByDays >= 0 &&
    bestByDays <= 14
  );
}

function isInStock(item) {
  return (
    !isArchived(item) &&
    !isOutOfStock(item) &&
    !isLowStock(item) &&
    !isUseSellSoon(item) &&
    !isExpired(item)
  );
}

function getItemComputedStatus(item) {
  if (isArchived(item)) return "Archived";
  if (isExpired(item)) return "Expired";
  if (isOutOfStock(item)) return "Out of Stock";
  if (isLowStock(item)) return "Low Stock";
  if (isUseSellSoon(item)) return "Use/Sell Soon";

  return item.status || "In Stock";
}

function getItemStatusList(item) {
  if (isArchived(item)) return ["Archived"];

  const statuses = [];

  if (isExpired(item)) statuses.push("Expired");
  if (isOutOfStock(item)) statuses.push("Out of Stock");
  if (isLowStock(item)) statuses.push("Low Stock");
  if (isUseSellSoon(item)) statuses.push("Use/Sell Soon");

  return statuses.length ? statuses : ["In Stock"];
}

function getStatusClass(status) {
  return String(status || "")
    .toLowerCase()
    .replaceAll("+", "")
    .replaceAll("/", "-")
    .replaceAll(" ", "-");
}

function getStatusLabel(item) {
  return getItemComputedStatus(item);
}

function getInventoryValue(item) {
  return parseInventoryNumber(item.quantityOnHand) * parseInventoryNumber(item.costPerUnit);
}

function getWholesaleValue(item) {
  return parseInventoryNumber(item.quantityOnHand) * parseInventoryNumber(item.wholesalePrice);
}

function getRetailValue(item) {
  return parseInventoryNumber(item.quantityOnHand) * parseInventoryNumber(item.retailPrice);
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

function getStatusVariant(status) {
  switch (status) {
    case "In Stock":
      return "success";
    case "Low Stock":
    case "Use/Sell Soon":
      return "warning";
    case "Out of Stock":
    case "Expired":
      return "danger";
    case "Archived":
      return "neutral";
    default:
      return "primary";
  }
}

function ItemStatusPills({ item }) {
  return (
    <div className="inventoryStatusPillStack">
      {getItemStatusList(item).map((status) => (
        <StatusPill
          key={status}
          label={status}
          variant={getStatusVariant(status)}
        />
      ))}
    </div>
  );
}

export default function Inventory() {
  const { user, loginWithGoogle } = useAuth();
  const { isDirty: hasUnsavedChanges, markUnsaved, markSaved } = useUnsavedChanges();

  const [inventoryItems, setInventoryItems] = useState([]);
  const [directoryProducts, setDirectoryProducts] = useState([]);
  const [itemForm, setItemForm] = useState(blankInventoryItem);
  const [editingItemId, setEditingItemId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [addMode, setAddMode] = useState("existing");
  const [existingItemSearch, setExistingItemSearch] = useState("");
  const [selectedExistingItemId, setSelectedExistingItemId] = useState("");
  const [selectedDirectoryVariantId, setSelectedDirectoryVariantId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDirectoryProducts, setLoadingDirectoryProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  function showToast(nextToast) {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 3000);
  }

  function showStatus(message, type = "info") {
    showToast({
      title: type === "error" ? "Inventory needs attention" : "Inventory",
      message,
      variant: type === "error" ? "danger" : type
    });
  }

  function markInventoryDirty() {
    markUnsaved({
      source: "Inventory",
      onSave: saveItem
    });
  }

  useEffect(() => {
    const hidden = localStorage.getItem("hideModuleGuide_inventory") === "true";
    if (!hidden) setShowGuide(true);
  }, []);

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

  async function loadDirectoryProducts() {
    if (!user) return;

    setLoadingDirectoryProducts(true);

    try {
      const [savedProducts, spiceRecipeRows, bakingSnapshot] = await Promise.all([
        getProducts(user.uid),
        getSpiceRecipes(user.uid).catch((error) => {
          console.error(error);
          return [];
        }),
        getDoc(doc(db, "users", user.uid, "bakingPlanner", "main")).catch((error) => {
          console.error(error);
          return null;
        })
      ]);

      const bakingRecipes = bakingSnapshot?.exists?.()
        ? bakingSnapshot.data()?.recipes || []
        : [];

      const manualProducts = Array.isArray(savedProducts)
        ? savedProducts.map((product) => ({
            ...product,
            sourceType: product.sourceType || "manual",
            sourceLabel: product.sourceLabel || "Products & Pricing",
            generatedVariants: product.generatedVariants || []
          }))
        : [];

      const spiceProducts = buildSpiceDirectoryProducts(
        Array.isArray(spiceRecipeRows) ? spiceRecipeRows : []
      );
      const bakingProducts = buildBakingDirectoryProducts(
        Array.isArray(bakingRecipes) ? bakingRecipes : []
      );

      setDirectoryProducts([...manualProducts, ...spiceProducts, ...bakingProducts]);
    } catch (error) {
      console.error(error);
      showStatus("Could not load product directory.", "error");
    } finally {
      setLoadingDirectoryProducts(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadInventoryItems();
      loadDirectoryProducts();
    } else {
      setInventoryItems([]);
      setDirectoryProducts([]);
    }
  }, [user]);

  const inventorySummary = useMemo(() => {
    const activeItems = inventoryItems.filter((item) => !isArchived(item));
    const lowStockItems = activeItems.filter((item) => isLowStock(item));
    const outOfStockItems = activeItems.filter((item) => isOutOfStock(item));
    const useSellSoonItems = activeItems.filter((item) => isUseSellSoon(item));
    const expiredItems = activeItems.filter((item) => isExpired(item));

    return {
      activeItems: activeItems.length,
      lowStockItems: lowStockItems.length,
      outOfStockItems: outOfStockItems.length,
      useSellSoonItems: useSellSoonItems.length,
      expiredItems: expiredItems.length,
      totalValue: activeItems.reduce((sum, item) => sum + getInventoryValue(item), 0),
      totalWholesaleValue: activeItems.reduce((sum, item) => sum + getWholesaleValue(item), 0),
      totalRetailValue: activeItems.reduce((sum, item) => sum + getRetailValue(item), 0)
    };
  }, [inventoryItems]);

  const filteredItems = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return inventoryItems
      .filter((item) => {
        if (categoryFilter !== "All" && item.category !== categoryFilter) return false;

        if (statusFilter !== "All") {
          if (statusFilter === "Low Stock" && !isLowStock(item)) return false;
          if (statusFilter === "Out of Stock" && !isOutOfStock(item)) return false;
          if (statusFilter === "Use/Sell Soon" && !isUseSellSoon(item)) return false;
          if (statusFilter === "Expired" && !isExpired(item)) return false;
          if (statusFilter === "Archived" && !isArchived(item)) return false;
          if (statusFilter === "In Stock" && !isInStock(item)) return false;
        }

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
        const statusOrder = (item) => {
          if (isExpired(item)) return 0;
          if (isOutOfStock(item)) return 1;
          if (isLowStock(item)) return 2;
          if (isUseSellSoon(item)) return 3;
          if (isArchived(item)) return 5;
          return 4;
        };

        const statusA = statusOrder(a);
        const statusB = statusOrder(b);
        if (statusA !== statusB) return statusA - statusB;
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
  }, [inventoryItems, searchTerm, categoryFilter, statusFilter, locationFilter]);

  const lowStockItems = useMemo(() => {
    return inventoryItems
      .filter((item) => isOutOfStock(item) || isLowStock(item))
      .sort((a, b) => {
        if (isOutOfStock(a) && !isOutOfStock(b)) return -1;
        if (!isOutOfStock(a) && isOutOfStock(b)) return 1;
        const quantityA = parseInventoryNumber(a.quantityOnHand);
        const quantityB = parseInventoryNumber(b.quantityOnHand);
        const reorderA = parseInventoryNumber(a.reorderPoint);
        const reorderB = parseInventoryNumber(b.reorderPoint);
        const ratioA = reorderA > 0 ? quantityA / reorderA : 0;
        const ratioB = reorderB > 0 ? quantityB / reorderB : 0;
        if (ratioA !== ratioB) return ratioA - ratioB;
        return String(a.name || "").localeCompare(String(b.name || ""));
      })
      .slice(0, 6);
  }, [inventoryItems]);

  const useSellSoonItems = useMemo(() => {
    return inventoryItems
      .map((item) => ({ ...item, days: daysUntil(item.bestByDate) }))
      .filter((item) => isUseSellSoon(item))
      .sort((a, b) => a.days - b.days)
      .slice(0, 6);
  }, [inventoryItems]);

  const expiredItems = useMemo(() => {
    return inventoryItems
      .map((item) => ({ ...item, days: daysUntil(item.bestByDate) }))
      .filter((item) => isExpired(item))
      .sort((a, b) => a.days - b.days)
      .slice(0, 6);
  }, [inventoryItems]);

  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(inventoryItems.map((item) => item.storageLocation).filter(Boolean))).sort();
  }, [inventoryItems]);

  const allStorageLocationOptions = useMemo(() => {
    return Array.from(new Set([...storageLocations, ...uniqueLocations])).sort((a, b) => {
      const aBaseIndex = storageLocations.indexOf(a);
      const bBaseIndex = storageLocations.indexOf(b);
      if (aBaseIndex !== -1 && bBaseIndex !== -1) return aBaseIndex - bBaseIndex;
      if (aBaseIndex !== -1) return -1;
      if (bBaseIndex !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [uniqueLocations]);

  const directoryProductOptions = useMemo(() => {
    const search = existingItemSearch.trim().toLowerCase();

    return directoryProducts
      .filter((product) => {
        if (!product?.id) return false;
        if (!search) return true;
        const variantNames = Array.isArray(product.generatedVariants)
          ? product.generatedVariants.map((variant) => variant.name).join(" ")
          : "";
        return (
          product.name?.toLowerCase().includes(search) ||
          product.category?.toLowerCase().includes(search) ||
          product.sourceLabel?.toLowerCase().includes(search) ||
          product.sku?.toLowerCase().includes(search) ||
          product.unitLabel?.toLowerCase().includes(search) ||
          variantNames.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [directoryProducts, existingItemSearch]);

  const selectedDirectoryProduct = useMemo(() => {
    return directoryProducts.find((product) => product.id === selectedExistingItemId) || null;
  }, [directoryProducts, selectedExistingItemId]);

  const selectedDirectoryVariants = useMemo(() => {
    return Array.isArray(selectedDirectoryProduct?.generatedVariants)
      ? selectedDirectoryProduct.generatedVariants
      : [];
  }, [selectedDirectoryProduct]);

  function resetModalState() {
    setItemForm(blankInventoryItem);
    setEditingItemId(null);
    setSelectedItem(null);
    setIsFormOpen(false);
    setAddMode(directoryProducts.length ? "existing" : "new");
    setExistingItemSearch("");
    setSelectedExistingItemId("");
    setSelectedDirectoryVariantId("");
  }

  function openNewItem() {
    setItemForm(blankInventoryItem);
    setEditingItemId(null);
    setSelectedItem(null);
    setAddMode(directoryProducts.length ? "existing" : "new");
    setExistingItemSearch("");
    setSelectedExistingItemId("");
    setSelectedDirectoryVariantId("");
    setIsFormOpen(true);
    if (user) loadDirectoryProducts();
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
    setSelectedExistingItemId(item.productId || item.id || "");
    setSelectedDirectoryVariantId(item.variantId || "");
    setAddMode("existing");
    setIsFormOpen(true);
  }

  function getDirectoryVariant(product, variantId = "") {
    const variants = Array.isArray(product?.generatedVariants) ? product.generatedVariants : [];
    if (!variants.length) return null;
    return (
      variants.find((variant) => variant.id === variantId) ||
      variants.find((variant) => variant.id === product?.selectedVariantId) ||
      variants[0]
    );
  }

  function getExistingInventoryForDirectoryProduct(product, variant) {
    if (!product?.id) return null;
    return (
      inventoryItems.find((item) => {
        const productMatches = String(item.productId || "") === String(product.id || "");
        const variantMatches = variant?.id
          ? String(item.variantId || "") === String(variant.id || "")
          : true;
        return productMatches && variantMatches;
      }) || null
    );
  }

  function buildInventoryFormFromDirectoryProduct(product, variant = null) {
    const variantName = variant?.name || product.selectedVariantName || "";
    const displayName = variantName && product.generatedVariants?.length
      ? `${product.name} - ${variantName}`
      : product.name || "";

    return {
      ...blankInventoryItem,
      name: displayName,
      category: product.category || "Finished Goods",
      sourceModule: product.sourceLabel || "Products & Pricing",
      productId: product.id || "",
      productName: product.name || "",
      recipeId: product.sourceRecipeId || "",
      recipeName: product.parentName || product.name || "",
      variantId: variant?.id || product.selectedVariantId || "",
      variantName,
      quantityOnHand: "",
      unit: variantName || product.unitLabel || "each",
      costPerUnit: cleanCurrencyInput(
        variant?.costPerUnit ||
          product.costPerUnit ||
          variant?.ingredientCost ||
          product.batchIngredientCost ||
          ""
      ),
      wholesalePrice: cleanCurrencyInput(variant?.wholesalePrice || product.wholesalePrice || ""),
      retailPrice: cleanCurrencyInput(variant?.retailPrice || product.retailPrice || ""),
      notes: product.notes || product.description || ""
    };
  }

  function chooseDirectoryProduct(productId) {
    const product = directoryProducts.find((directoryProduct) => directoryProduct.id === productId);
    setSelectedExistingItemId(productId);

    if (!product) {
      setSelectedDirectoryVariantId("");
      setItemForm(blankInventoryItem);
      return;
    }

    const variant = getDirectoryVariant(product);
    const existingInventoryItem = getExistingInventoryForDirectoryProduct(product, variant);
    setSelectedDirectoryVariantId(variant?.id || "");

    if (existingInventoryItem) {
      openEditItem(existingInventoryItem);
      showStatus("Existing inventory record loaded.", "success");
      return;
    }

    setEditingItemId(null);
    setSelectedItem(null);
    setItemForm(buildInventoryFormFromDirectoryProduct(product, variant));
    markInventoryDirty();
  }

  function chooseDirectoryVariant(variantId) {
    if (!selectedDirectoryProduct) return;

    const variant = getDirectoryVariant(selectedDirectoryProduct, variantId);
    const existingInventoryItem = getExistingInventoryForDirectoryProduct(selectedDirectoryProduct, variant);
    setSelectedDirectoryVariantId(variant?.id || "");

    if (existingInventoryItem) {
      openEditItem(existingInventoryItem);
      showStatus("Existing inventory record loaded.", "success");
      return;
    }

    setEditingItemId(null);
    setSelectedItem(null);
    setItemForm(buildInventoryFormFromDirectoryProduct(selectedDirectoryProduct, variant));
    markInventoryDirty();
  }

  function updateItemField(field, value) {
    markInventoryDirty();
    setItemForm((current) => ({ ...current, [field]: value }));
  }

  async function saveItem(event) {
    event?.preventDefault?.();

    if (!user) {
      showStatus("Sign in to save inventory items.", "error");
      return;
    }

    const quantityOnHand = cleanNumber(itemForm.quantityOnHand);
    const isZeroQuantity = parseInventoryNumber(quantityOnHand) <= 0;

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
      quantityOnHand: Math.round(parseInventoryNumber(quantityOnHand)),
      unit: itemForm.unit.trim() || "each",
      parLevel:
        itemForm.parLevel === "" || itemForm.parLevel === null || itemForm.parLevel === undefined
          ? ""
          : Math.round(parseInventoryNumber(itemForm.parLevel)),
      reorderPoint:
        itemForm.reorderPoint === "" || itemForm.reorderPoint === null || itemForm.reorderPoint === undefined
          ? ""
          : Math.round(parseInventoryNumber(itemForm.reorderPoint)),
      storageLocation: itemForm.storageLocation.trim(),
      costPerUnit: cleanNumber(itemForm.costPerUnit),
      wholesalePrice: cleanNumber(itemForm.wholesalePrice),
      retailPrice: cleanNumber(itemForm.retailPrice),
      bestByDate: isZeroQuantity ? "" : itemForm.bestByDate,
      status: isZeroQuantity ? "Out of Stock" : itemForm.status,
      notes: itemForm.notes.trim()
    };

    if (!cleanItem.name) {
      showStatus("Inventory item name is required.", "error");
      return;
    }

    setSaving(true);

    try {
      await saveInventoryItem(user.uid, cleanItem);
      setItemForm(blankInventoryItem);
      setEditingItemId(null);
      setSelectedItem(null);
      setSelectedExistingItemId("");
      setSelectedDirectoryVariantId("");
      setExistingItemSearch("");
      setAddMode(directoryProducts.length ? "existing" : "new");
      setIsFormOpen(false);
      markSaved();
      showStatus(editingItemId ? "Inventory item updated." : "Inventory item saved.", "success");
      await loadInventoryItems();
    } catch (error) {
      console.error(error);
      showStatus("Could not save inventory item.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function quickSaveQuantityChange(item, change) {
    if (!user || !item?.id) return;

    const currentQuantity = Math.round(parseInventoryNumber(item.quantityOnHand));
    const nextQuantity = Math.max(0, currentQuantity + change);
    const updatedItem = {
      ...item,
      quantityOnHand: nextQuantity,
      bestByDate: nextQuantity <= 0 ? "" : item.bestByDate,
      status: nextQuantity <= 0 ? "Out of Stock" : item.status
    };

    try {
      await saveInventoryItem(user.uid, updatedItem);
      await loadInventoryItems();
      markSaved();
      showStatus("Inventory quantity updated.", "success");
    } catch (error) {
      console.error(error);
      showStatus("Could not adjust inventory quantity.", "error");
    }
  }

  function requestRemoveItem(item) {
    setDeleteTarget(item);
  }

  async function confirmRemoveItem() {
    if (!user || !deleteTarget?.id) return;

    try {
      await deleteInventoryItem(user.uid, deleteTarget.id);
      if (editingItemId === deleteTarget.id) resetModalState();
      if (selectedItem?.id === deleteTarget.id) setSelectedItem(null);
      setDeleteTarget(null);
      markSaved();
      showStatus("Inventory item deleted.", "success");
      await loadInventoryItems();
    } catch (error) {
      console.error(error);
      showStatus("Could not delete inventory item.", "error");
    }
  }

  function getItemActions(item) {
    return [
      {
        label: "Edit",
        icon: Edit3,
        onClick: () => openEditItem(item)
      },
      {
        divider: true
      },
      {
        label: "Delete",
        icon: Trash2,
        destructive: true,
        onClick: () => requestRemoveItem(item)
      }
    ];
  }

  function renderInsightItem(item, context) {
    let detail = "";

    if (context === "stock") {
      detail = `${formatNumber(item.quantityOnHand)} ${item.unit || "each"}`;
      if (item.reorderPoint !== "" && item.reorderPoint !== null) {
        detail += ` • Reorder at ${formatNumber(item.reorderPoint)} ${item.unit || ""}`;
      }
      if (isExpired(item)) detail += " • Also expired";
      if (isUseSellSoon(item)) detail += " • Also use/sell soon";
    }

    if (context === "soon") {
      detail = `${formatDate(item.bestByDate)}${
        item.days === 0
          ? " • Today"
          : item.days === 1
            ? " • Tomorrow"
            : ` • ${item.days} days`
      }`;
      if (isLowStock(item)) detail += " • Also low stock";
    }

    if (context === "expired") {
      detail = `${formatDate(item.bestByDate)}${
        Math.abs(item.days) === 1
          ? " • Expired 1 day ago"
          : ` • Expired ${Math.abs(item.days)} days ago`
      }`;
      if (isLowStock(item)) detail += " • Also low stock";
    }

    return (
      <button
        type="button"
        className="inventoryMiniItem"
        key={`${context}-${item.id}`}
        onClick={() => openEditItem(item)}
      >
        <span className={`inventoryStatusDot ${getStatusClass(getStatusLabel(item))}`} />
        <div>
          <strong>{item.name}</strong>
          <p>{detail}</p>
        </div>
      </button>
    );
  }

  if (!user) {
    return (
      <div className="modulePage inventoryModule">
        <ModuleHero
          eyebrow="Inventory"
          accent="inventory"
          icon={PackageCheck}
          title="Sign in to manage inventory."
          description="Track product quantities, packaging, ingredients, storage locations, reorder points, and expiring inventory from one shared module."
          actions={[
            {
              label: "Sign in with Google",
              onClick: loginWithGoogle
            }
          ]}
        />
      </div>
    );
  }

  return (
    <div className="modulePage inventoryModule">
      {loading ? (
        <Toast
          open
          variant="info"
          title="Inventory"
          message="Loading inventory..."
          onClose={() => {}}
        />
      ) : null}

      <ModuleHero
        eyebrow="Inventory"
        accent="inventory"
        icon={PackageCheck}
        title="Track stock, storage, reorder points, and rotation."
        description="Manage finished products, ingredients, packaging, seeds, market supplies, and production inventory with clean counts and reorder visibility."
        actions={[
          {
            label: "Guide",
            icon: CircleHelp,
            variant: "secondary",
            onClick: () => setShowGuide(true)
          },
          {
            label: "Add Item",
            icon: Plus,
            onClick: openNewItem
          }
        ]}
      />

      <section className="hubStatGrid inventoryStatGrid inventoryStatGridForced inventoryStatGridSeven">
        <StatCard icon={PackageCheck} label="Active Items" value={inventorySummary.activeItems} sub="tracked inventory" accent="inventory" />
        <StatCard icon={TrendingDown} label="Low Stock" value={inventorySummary.lowStockItems} sub="at reorder point" accent="spice" />
        <StatCard icon={CalendarClock} label="Use/Sell Soon" value={inventorySummary.useSellSoonItems} sub="within 14 days" accent="sourdough" />
        <StatCard icon={AlertCircle} label="Expired" value={inventorySummary.expiredItems} sub="past best by date" accent="spice" />
        <StatCard icon={DollarSign} label="Inventory Value" value={formatCurrency(inventorySummary.totalValue)} sub="estimated cost" accent="pricing" />
        <StatCard icon={DollarSign} label="Wholesale Value" value={formatCurrency(inventorySummary.totalWholesaleValue)} sub="potential wholesale" accent="sourdough" />
        <StatCard icon={DollarSign} label="Retail Value" value={formatCurrency(inventorySummary.totalRetailValue)} sub="potential retail" accent="market" />
      </section>

      <section className="inventoryInsightGrid inventoryInsightGridThree">
        <WorkspacePanel eyebrow="Needs Attention" title="Low or Out of Stock" className="inventoryInsightPanel">
          <div className="inventoryMiniList">
            {lowStockItems.length ? (
              lowStockItems.map((item) => renderInsightItem(item, "stock"))
            ) : (
              <EmptyState icon={TrendingDown} title="Stock levels look good" message="Nothing is currently below its reorder point." />
            )}
          </div>
        </WorkspacePanel>

        <WorkspacePanel eyebrow="Rotation" title="Use / Sell Soon" className="inventoryInsightPanel">
          <div className="inventoryMiniList">
            {useSellSoonItems.length ? (
              useSellSoonItems.map((item) => renderInsightItem(item, "soon"))
            ) : (
              <EmptyState icon={CalendarClock} title="No urgent rotation" message="No inventory needs to be used or sold within the next 14 days." />
            )}
          </div>
        </WorkspacePanel>

        <WorkspacePanel eyebrow="Past Best By" title="Expired" className="inventoryInsightPanel">
          <div className="inventoryMiniList">
            {expiredItems.length ? (
              expiredItems.map((item) => renderInsightItem(item, "expired"))
            ) : (
              <EmptyState icon={AlertCircle} title="Nothing expired" message="No inventory is past its best by date." />
            )}
          </div>
        </WorkspacePanel>
      </section>

      <WorkspacePanel
        eyebrow="Directory"
        title="Inventory Items"
        description={`${filteredItems.length} visible`}
        actions={[
          {
            label: "Add Item",
            icon: Plus,
            onClick: openNewItem
          }
        ]}
        toolbar={
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search inventory..."
            filters={[
              {
                label: "Category",
                value: categoryFilter,
                onChange: setCategoryFilter,
                options: ["All", ...inventoryCategories]
              },
              {
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: ["All", ...inventoryStatuses]
              },
              {
                label: "Location",
                value: locationFilter,
                onChange: setLocationFilter,
                options: ["All", ...uniqueLocations]
              }
            ]}
          />
        }
        className="inventoryDirectoryPanel"
      >
        <RecordList
          records={filteredItems}
          selectedRecordId={editingItemId || ""}
          onRecordClick={openEditItem}
          emptyMessage="No inventory items match the current filters."
          getTitle={(item) => item.name || "Unnamed Item"}
          getSubtitle={(item) =>
            [item.category || "Other", item.sourceModule || "Manual", item.storageLocation || "No location"]
              .filter(Boolean)
              .join(" • ")
          }
          getMeta={(item) => [
            { label: "Qty", value: `${formatNumber(item.quantityOnHand)} ${item.unit || "each"}` },
            {
              label: "Reorder",
              value:
                item.reorderPoint !== "" && item.reorderPoint !== null
                  ? `${formatNumber(item.reorderPoint)} ${item.unit || ""}`
                  : "Not set"
            },
            { label: "Best By", value: item.bestByDate ? formatDate(item.bestByDate) : "Not listed" },
            { label: "Cost", value: formatCurrency(getInventoryValue(item)) },
            { label: "Wholesale", value: formatCurrency(getWholesaleValue(item)) },
            { label: "Retail", value: formatCurrency(getRetailValue(item)) }
          ]}
          renderStatus={(item) => <ItemStatusPills item={item} />}
          renderActions={(item) => (
            <div className="inventoryRecordActions">
              <div className="inventoryQuantityAdjustControl">
                <button type="button" title="Subtract 1" onClick={(event) => { event.stopPropagation(); quickSaveQuantityChange(item, -1); }}>
                  -1
                </button>
                <button type="button" title="Add 1" onClick={(event) => { event.stopPropagation(); quickSaveQuantityChange(item, 1); }}>
                  +1
                </button>
              </div>
              <ActionMenu items={getItemActions(item)} />
            </div>
          )}
        />
      </WorkspacePanel>

      {isFormOpen ? (
        <div className="inventoryModalOverlay" role="dialog" aria-modal="true">
          <div className="inventoryModal">
            <div className="inventoryModalHeader">
              <div>
                <p className="eyebrow">{editingItemId ? "Edit Item" : "Add Inventory"}</p>
                <h3>{editingItemId ? "Update Existing Inventory Item" : "Add Inventory Item"}</h3>
              </div>
              <button type="button" onClick={resetModalState}>
                <X size={20} />
              </button>
            </div>

            {!editingItemId ? (
              <div className="inventoryAddModePanel">
                <div className="inventoryAddModeTabs">
                  <button
                    className={addMode === "existing" ? "active" : ""}
                    type="button"
                    onClick={() => {
                      setAddMode("existing");
                      setItemForm(blankInventoryItem);
                      setSelectedExistingItemId("");
                      setSelectedDirectoryVariantId("");
                    }}
                    disabled={!directoryProducts.length && !loadingDirectoryProducts}
                  >
                    Existing Product
                  </button>

                  <button
                    className={addMode === "new" ? "active" : ""}
                    type="button"
                    onClick={() => {
                      setAddMode("new");
                      setItemForm(blankInventoryItem);
                      setSelectedExistingItemId("");
                      setSelectedDirectoryVariantId("");
                    }}
                  >
                    New Product
                  </button>
                </div>

                {addMode === "existing" ? (
                  <div className="inventoryExistingPicker">
                    <FormField label="Select Product Directory Item" fullWidth>
                      <select value={selectedExistingItemId} onChange={(event) => chooseDirectoryProduct(event.target.value)}>
                        <option value="">
                          {loadingDirectoryProducts ? "Loading product directory..." : "Choose a product"}
                        </option>
                        {directoryProductOptions.map((product) => (
                          <option value={product.id} key={product.id}>
                            {product.name} {product.category ? `• ${product.category}` : ""} {product.sourceLabel ? `• ${product.sourceLabel}` : ""}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    {selectedDirectoryVariants.length ? (
                      <FormField label="Variant / Package Size" fullWidth>
                        <select value={selectedDirectoryVariantId} onChange={(event) => chooseDirectoryVariant(event.target.value)}>
                          {selectedDirectoryVariants.map((variant) => (
                            <option key={variant.id} value={variant.id}>{variant.name}</option>
                          ))}
                        </select>
                      </FormField>
                    ) : null}

                    <div className="searchBox compactSearch inventorySearchBox">
                      <Search size={17} />
                      <input
                        value={existingItemSearch}
                        onChange={(event) => setExistingItemSearch(event.target.value)}
                        placeholder="Search product directory..."
                      />
                    </div>

                    {!directoryProducts.length && !loadingDirectoryProducts ? (
                      <EmptyState
                        icon={PackageCheck}
                        title="No Product Directory items found"
                        message="Choose New Product to add an inventory-only item, or add products in Products & Pricing."
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {(editingItemId || addMode === "new" || itemForm.productId) ? (
              <form className="inventoryModalForm formGrid compactFormGrid" onSubmit={saveItem}>
                <FormField label="Item Name *" fullWidth>
                  <input value={itemForm.name} onChange={(event) => updateItemField("name", event.target.value)} placeholder="e.g., Broccoli microgreens, 1 oz spice pouch, 8 oz deli cups" />
                </FormField>

                <FormField label="Category">
                  <select value={itemForm.category} onChange={(event) => updateItemField("category", event.target.value)}>
                    {inventoryCategories.map((category) => <option key={category}>{category}</option>)}
                  </select>
                </FormField>

                <FormField label="Source">
                  <select value={itemForm.sourceModule} onChange={(event) => updateItemField("sourceModule", event.target.value)}>
                    {sourceModules.map((source) => <option key={source}>{source}</option>)}
                  </select>
                </FormField>

                <FormField label="Quantity On Hand">
                  <input type="number" step="1" min="0" value={itemForm.quantityOnHand} onChange={(event) => updateItemField("quantityOnHand", cleanWholeNumberInput(event.target.value))} onBlur={(event) => updateItemField("quantityOnHand", cleanWholeNumberInput(event.target.value))} placeholder="e.g., 24" />
                </FormField>

                <FormField label="Unit">
                  <input value={itemForm.unit} onChange={(event) => updateItemField("unit", event.target.value)} placeholder="e.g., each, oz, lb, tray, bag" />
                </FormField>

                <FormField label="Par Level">
                  <input type="number" step="1" min="0" value={itemForm.parLevel} onChange={(event) => updateItemField("parLevel", cleanWholeNumberInput(event.target.value))} onBlur={(event) => updateItemField("parLevel", cleanWholeNumberInput(event.target.value))} placeholder="Ideal stock level" />
                </FormField>

                <FormField label="Reorder Point">
                  <input type="number" step="1" min="0" value={itemForm.reorderPoint} onChange={(event) => updateItemField("reorderPoint", cleanWholeNumberInput(event.target.value))} onBlur={(event) => updateItemField("reorderPoint", cleanWholeNumberInput(event.target.value))} placeholder="Warn when at or below" />
                </FormField>

                <FormField label="Storage Location">
                  <select value={itemForm.storageLocation || ""} onChange={(event) => updateItemField("storageLocation", event.target.value)}>
                    <option value="">Select location</option>
                    {allStorageLocationOptions.map((location) => <option value={location} key={location}>{location}</option>)}
                  </select>
                </FormField>

                <FormField label="Cost Per Unit">
                  <input type="number" step="0.01" value={itemForm.costPerUnit} onChange={(event) => updateItemField("costPerUnit", event.target.value)} onBlur={(event) => updateItemField("costPerUnit", cleanCurrencyInput(event.target.value))} placeholder="e.g., 0.14" />
                </FormField>

                <FormField label="Wholesale Price">
                  <input type="number" step="0.01" value={itemForm.wholesalePrice} onChange={(event) => updateItemField("wholesalePrice", event.target.value)} onBlur={(event) => updateItemField("wholesalePrice", cleanCurrencyInput(event.target.value))} placeholder="e.g., 7.50" />
                </FormField>

                <FormField label="Retail Price">
                  <input type="number" step="0.01" value={itemForm.retailPrice} onChange={(event) => updateItemField("retailPrice", event.target.value)} onBlur={(event) => updateItemField("retailPrice", cleanCurrencyInput(event.target.value))} placeholder="e.g., 12.00" />
                </FormField>

                <FormField label="Best By / Expiration">
                  <input type="date" value={itemForm.bestByDate} onChange={(event) => updateItemField("bestByDate", event.target.value)} />
                </FormField>

                <FormField label="Status">
                  <select value={itemForm.status} onChange={(event) => updateItemField("status", event.target.value)}>
                    {inventoryStatuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </FormField>

                <FormField label="Notes" fullWidth>
                  <textarea value={itemForm.notes} onChange={(event) => updateItemField("notes", event.target.value)} placeholder="Storage instructions, vendor notes, batch notes, reorder notes..." />
                </FormField>

                {selectedItem ? (
                  <div className="inventoryDetailGrid fullSpan">
                    <InventoryDetail label="Computed Status" value={getItemComputedStatus({ ...selectedItem, ...itemForm })} />
                    <InventoryDetail label="Inventory Value" value={formatCurrency(parseInventoryNumber(itemForm.quantityOnHand) * parseInventoryNumber(itemForm.costPerUnit))} />
                    <InventoryDetail label="Wholesale Value" value={formatCurrency(parseInventoryNumber(itemForm.quantityOnHand) * parseInventoryNumber(itemForm.wholesalePrice))} />
                    <InventoryDetail label="Retail Value" value={formatCurrency(parseInventoryNumber(itemForm.quantityOnHand) * parseInventoryNumber(itemForm.retailPrice))} />
                    <InventoryDetail label="Days Until Best By" value={daysUntil(itemForm.bestByDate) === null ? "" : daysUntil(itemForm.bestByDate)} />
                  </div>
                ) : null}

                <div className="inventoryModalActions fullSpan">
                  {editingItemId ? (
                    <button className="dangerButton" type="button" onClick={() => requestRemoveItem({ ...itemForm, id: editingItemId })}>
                      <Trash2 size={15} />
                      Delete
                    </button>
                  ) : null}

                  <button className="secondaryButton compactButton" type="button" onClick={resetModalState}>Cancel</button>

                  <button className={`primaryButton compactPrimary ${hasUnsavedChanges ? "dirtySaveButton" : ""}`} type="submit" disabled={saving}>
                    <Save size={15} />
                    {saving ? "Saving..." : editingItemId ? "Save Changes" : "Save Item"}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Inventory Item?"
        message={deleteTarget?.name ? `Delete ${deleteTarget.name}? This action cannot be undone.` : "This action cannot be undone."}
        confirmLabel="Delete"
        confirmVariant="danger"
        cancelLabel="Cancel"
        onConfirm={confirmRemoveItem}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast
        open={Boolean(toast)}
        variant={toast?.variant}
        title={toast?.title}
        message={toast?.message}
        onClose={() => setToast(null)}
      />

      <ModuleGuideModal
        isOpen={showGuide}
        moduleKey="inventory"
        title="How to Use Inventory"
        onClose={() => setShowGuide(false)}
      >
        <InventoryGuideContent />
      </ModuleGuideModal>
    </div>
  );
}
