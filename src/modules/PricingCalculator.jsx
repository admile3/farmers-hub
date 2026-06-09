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
  Trash2,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Image,
  Upload,
  X
} from "lucide-react";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../AuthContext.jsx";
import { useUnsavedChanges } from "../UnsavedChangesContext.jsx";
import {
  deleteProduct,
  getProducts,
  saveProduct
} from "../services/productService.js";
import {
  deleteStorageFile,
  uploadProductImage
} from "../services/storageService.js";
import {
  getSpiceRecipes,
  updateSpiceRecipeProductPackage
} from "../services/spiceKitchenService.js";
import StatCard from "../components/StatCard.jsx";
import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import PricingGuideContent from "../components/PricingGuideContent.jsx";

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

function moneyValue(value) {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : "";
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
    targetRetailMargin: 70,
    targetWholesaleMargin: 50,
    batchIngredientCost: "",
    batchUnits: "",
    packagingCostPerUnit: "",
    laborHours: "",
    laborRate: "",
    overheadCost: "",
    notes: "",
    imageUrl: "",
    imagePath: "",
    selectedVariantId: "",
    selectedVariantName: ""
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
    targetRetailMargin: 70,
    targetWholesaleMargin: 50,
    batchIngredientCost: 32,
    batchUnits: 24,
    packagingCostPerUnit: 0.35,
    laborHours: 1.5,
    laborRate: 18,
    overheadCost: 6,
    notes: "Replace this sample with one of your real products.",
    imageUrl: "",
    imagePath: ""
  };
}

function formatPackageSize(size, unit) {
  const amount = Number(size) || 0;
  if (!amount) return "";
  return `${Number(amount.toFixed(3)).toString()} ${unit || ""}`.trim();
}

function numberOrFallback(...values) {
  for (const value of values) {
    if (value === "" || value === null || value === undefined) continue;
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }

  return "";
}

function getTargetRetailMargin(product) {
  return numberOrFallback(product?.targetRetailMargin, product?.targetMargin, 70);
}

function getTargetWholesaleMargin(product) {
  return numberOrFallback(product?.targetWholesaleMargin, 50);
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
            targetRetailMargin: numberOrFallback(packageItem.targetRetailMargin, 70),
            targetWholesaleMargin: numberOrFallback(packageItem.targetWholesaleMargin, 50),
            batchIngredientCost: moneyValue(ingredientCost),
            batchUnits: numberOrFallback(packageItem.batchUnits, 1),
            packagingCostPerUnit: moneyValue(packageItem.packagingCostPerUnit),
            laborHours: packageItem.laborHours || "",
            laborRate: moneyValue(packageItem.laborRate),
            overheadCost: moneyValue(packageItem.overheadCost),
            notes: "Generated from Spice Kitchen.",
            imageUrl: recipe.imageUrl || "",
            imagePath: recipe.imagePath || "",
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
          targetRetailMargin: numberOrFallback(packageItem.targetRetailMargin, 70),
          targetWholesaleMargin: numberOrFallback(packageItem.targetWholesaleMargin, 50),
          packagingCostPerUnit: moneyValue(packageItem.packagingCostPerUnit),
          batchUnits: numberOrFallback(packageItem.batchUnits, 1),
          laborHours: packageItem.laborHours || "",
          laborRate: moneyValue(packageItem.laborRate),
          overheadCost: moneyValue(packageItem.overheadCost)
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
        targetRetailMargin: firstVariant?.targetRetailMargin || 70,
        targetWholesaleMargin: firstVariant?.targetWholesaleMargin || 50,
        batchIngredientCost: firstVariant?.ingredientCost || moneyValue(costPerOunce),
        batchUnits: firstVariant?.batchUnits || 1,
        packagingCostPerUnit: firstVariant?.packagingCostPerUnit || "",
        laborHours: firstVariant?.laborHours || "",
        laborRate: firstVariant?.laborRate || "",
        overheadCost: firstVariant?.overheadCost || "",
        notes: "Generated from Spice Kitchen. Package sizes are shown as variants.",
        imageUrl: recipe.imageUrl || "",
        imagePath: recipe.imagePath || "",
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
      const laborHours = Number(directory.laborHoursPerBatch) || "";
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
        targetRetailMargin: 70,
        targetWholesaleMargin: 50,
        batchIngredientCost: moneyValue(batchIngredientCost),
        batchUnits: unitsPerBatch,
        packagingCostPerUnit: "",
        laborHours,
        laborRate: "",
        overheadCost: "",
        notes: "Generated from Baking Planner.",
        imageUrl: directory.imageUrl || recipe.imageUrl || "",
        imagePath: directory.imagePath || recipe.imagePath || "",
        generatedVariants: [],
        updatedAt: recipe.updatedAt || ""
      };
    });
}

function productSourceLabel(product) {
  if (product?.sourceLabel) return product.sourceLabel;
  if (product?.sourceType === "manual") return "Manual";
  return "Manual";
}

function applyVariantToProduct(product, variantId) {
  const variants = Array.isArray(product?.generatedVariants)
    ? product.generatedVariants
    : [];

  if (!variants.length) {
    return {
      ...blankProduct(),
      ...product,
      batchIngredientCost: moneyValue(product?.batchIngredientCost),
      packagingCostPerUnit: moneyValue(product?.packagingCostPerUnit),
      laborRate: moneyValue(product?.laborRate),
      overheadCost: moneyValue(product?.overheadCost),
      retailPrice: moneyValue(product?.retailPrice),
      wholesalePrice: moneyValue(product?.wholesalePrice),
      targetRetailMargin: getTargetRetailMargin(product),
      targetWholesaleMargin: getTargetWholesaleMargin(product),
      selectedVariantId: product?.selectedVariantId || "",
      selectedVariantName: product?.selectedVariantName || ""
    };
  }

  const variant =
    variants.find((item) => item.id === variantId) ||
    variants.find((item) => item.id === product?.selectedVariantId) ||
    variants[0];

  return {
    ...blankProduct(),
    ...product,
    sku: variant.sku || product.sku || "",
    unitLabel: variant.name || product.unitLabel || "package",
    retailPrice: moneyValue(variant.retailPrice || product.retailPrice),
    wholesalePrice: moneyValue(variant.wholesalePrice || product.wholesalePrice),
    packagingCostPerUnit: moneyValue(
      variant.packagingCostPerUnit || product.packagingCostPerUnit
    ),
    batchIngredientCost: moneyValue(
      variant.ingredientCost || variant.costPerUnit || product.batchIngredientCost
    ),
    batchUnits: variant.batchUnits || product.batchUnits || 1,
    laborHours: variant.laborHours || product.laborHours || "",
    laborRate: moneyValue(variant.laborRate || product.laborRate),
    overheadCost: moneyValue(variant.overheadCost || product.overheadCost),
    targetRetailMargin: numberOrFallback(
      variant.targetRetailMargin,
      product.targetRetailMargin,
      product.targetMargin,
      70
    ),
    targetWholesaleMargin: numberOrFallback(
      variant.targetWholesaleMargin,
      product.targetWholesaleMargin,
      50
    ),
    selectedVariantId: variant.id,
    selectedVariantName: variant.name
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
  const targetRetailMargin = Number(getTargetRetailMargin(product)) || 0;
  const targetWholesaleMargin = Number(getTargetWholesaleMargin(product)) || 0;

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

  const suggestedRetailPrice =
    targetRetailMargin > 0 && targetRetailMargin < 100
      ? costPerUnit / (1 - targetRetailMargin / 100)
      : costPerUnit;

  const suggestedWholesalePrice =
    targetWholesaleMargin > 0 && targetWholesaleMargin < 100
      ? costPerUnit / (1 - targetWholesaleMargin / 100)
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
    suggestedRetailPrice,
    suggestedWholesalePrice
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
          onBlur={(event) => onChange(moneyValue(event.target.value))}
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
  const imageInputRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [spiceRecipes, setSpiceRecipes] = useState([]);
  const [spiceProducts, setSpiceProducts] = useState([]);
  const [bakingProducts, setBakingProducts] = useState([]);
  const [expandedProductIds, setExpandedProductIds] = useState({});
  const [directoryVariantSelections, setDirectoryVariantSelections] = useState({});
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [form, setForm] = useState(blankProduct());
  const [queryText, setQueryText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [zoomedProductImage, setZoomedProductImage] = useState(null);
  const productDirectoryGridColumns =
  "72px minmax(210px, 1.5fr) minmax(145px, 0.8fr) minmax(110px, 0.65fr) minmax(90px, 0.5fr) minmax(105px, 0.6fr) minmax(90px, 0.5fr) minmax(120px, 0.7fr) 90px";
  const allDirectoryProducts = useMemo(() => {
    const manualProducts = products.map((product) => ({
      ...product,
      sourceType: product.sourceType || "manual",
      sourceLabel: product.sourceLabel || "Manual",
      generatedVariants: product.generatedVariants || [],
      targetRetailMargin: getTargetRetailMargin(product),
      targetWholesaleMargin: getTargetWholesaleMargin(product)
    }));

    return [...manualProducts, ...spiceProducts, ...bakingProducts];
  }, [products, spiceProducts, bakingProducts]);

  const selectedProduct = useMemo(() => {
    return allDirectoryProducts.find((product) => product.id === selectedProductId) || null;
  }, [allDirectoryProducts, selectedProductId]);

  const selectedProductVariants = useMemo(() => {
    return Array.isArray(selectedProduct?.generatedVariants)
      ? selectedProduct.generatedVariants
      : [];
  }, [selectedProduct]);

  const calculation = useMemo(() => calculateProduct(form), [form]);

  const filteredProducts = useMemo(() => {
    const search = normalize(queryText);

    return allDirectoryProducts.filter((product) => {
      const variantNames = Array.isArray(product.generatedVariants)
        ? product.generatedVariants.map((variant) => variant.name).join(" ")
        : "";

      const matchesSearch = search
        ? [
            product.name,
            product.category,
            product.sku,
            product.description,
            product.notes,
            product.unitLabel,
            variantNames
          ]
            .map(normalize)
            .some((value) => value.includes(search))
        : true;

      const matchesCategory =
        categoryFilter === "All categories" || product.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All statuses" || product.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [allDirectoryProducts, queryText, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const activeProducts = allDirectoryProducts.filter((product) => product.status === "Active");
    const productsWithPricing = allDirectoryProducts.filter((product) => {
      const variantId =
        directoryVariantSelections[product.id] ||
        product.selectedVariantId ||
        product.generatedVariants?.[0]?.id ||
        "";
      const productForCalc = applyVariantToProduct(product, variantId);
      const calc = calculateProduct(productForCalc);
      return calc.costPerUnit > 0 && Number(productForCalc.retailPrice) > 0;
    });

    const averageRetailMargin = productsWithPricing.length
      ? productsWithPricing.reduce((sum, product) => {
          const variantId =
            directoryVariantSelections[product.id] ||
            product.selectedVariantId ||
            product.generatedVariants?.[0]?.id ||
            "";
          const productForCalc = applyVariantToProduct(product, variantId);
          return sum + calculateProduct(productForCalc).retailMargin;
        }, 0) / productsWithPricing.length
      : 0;

    return {
      activeCount: activeProducts.length,
      averageRetailMargin,
      productsWithPricing: productsWithPricing.length
    };
  }, [allDirectoryProducts, directoryVariantSelections]);

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
    const guideHidden = localStorage.getItem("hideModuleGuide_pricing") === "true";
    if (!guideHidden) setShowGuide(true);
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
      setSpiceRecipes([]);
      setSpiceProducts([]);
      setBakingProducts([]);
      setSelectedProductId("");
      setSelectedVariantId("");
      setForm(blankProduct());
    }
  }, [user]);

  async function loadProducts() {
    if (!user) return;

    setLoadingProducts(true);

    try {
      const [saved, spiceRecipeRows, bakingSnapshot] = await Promise.all([
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

      setProducts(Array.isArray(saved) ? saved : []);
      setSpiceRecipes(Array.isArray(spiceRecipeRows) ? spiceRecipeRows : []);
      setSpiceProducts(buildSpiceDirectoryProducts(spiceRecipeRows));
      setBakingProducts(buildBakingDirectoryProducts(bakingRecipes));
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
    const variantId =
      options.variantId ||
      directoryVariantSelections[product.id] ||
      product.selectedVariantId ||
      product.generatedVariants?.[0]?.id ||
      "";

    const productForForm = applyVariantToProduct(product, variantId);

    setSelectedProductId(product.id || "");
    setSelectedVariantId(variantId);
    setForm(productForForm);
    markSaved();

    if (!options.silent) {
      setStatusMessage("Product loaded.");
      scrollToSection(detailsRef);
    }
  }

  function changeVariant(variantId) {
    if (!selectedProduct) return;

    const productForForm = applyVariantToProduct(selectedProduct, variantId);

    setSelectedVariantId(variantId);
    setDirectoryVariantSelections((current) => ({
      ...current,
      [selectedProduct.id]: variantId
    }));
    setForm(productForForm);
    markSaved();
    setStatusMessage("Variant loaded.");
  }

  function changeDirectoryVariant(productId, variantId) {
    setDirectoryVariantSelections((current) => ({
      ...current,
      [productId]: variantId
    }));
  }

  function startNewProduct() {
    setSelectedProductId("");
    setSelectedVariantId("");
    setForm(blankProduct());
    markProductsDirty();
    setStatusMessage("Started a new product.");
    scrollToSection(detailsRef);
  }

  function loadSampleProduct() {
    setSelectedProductId("");
    setSelectedVariantId("");
    setForm(sampleProduct());
    markProductsDirty();
    setStatusMessage("Sample product loaded. Edit it, then save when ready.");
    scrollToSection(detailsRef);
  }

  function updateField(field, value) {
    markProductsDirty();
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleProductImageUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !user) return;

    if (!file.type?.startsWith("image/")) {
      setStatusMessage("Please choose an image file.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setStatusMessage("Image must be 5 MB or smaller.");
      return;
    }

    const productId = form.id || selectedProductId || makeId();

    setUploadingImage(true);

    try {
      const uploadResult = await uploadProductImage({
        userId: user.uid,
        productId,
        file,
        previousPath: form.imagePath || ""
      });

      const updatedForm = {
        ...form,
        id: productId,
        imageUrl: uploadResult.url,
        imagePath: uploadResult.path
      };

      setSelectedProductId(productId);
      setForm(updatedForm);

      setProducts((current) =>
        current.map((product) =>
          product.id === productId
            ? {
                ...product,
                imageUrl: uploadResult.url,
                imagePath: uploadResult.path
              }
            : product
        )
      );

      setStatusMessage("Product image uploaded. Click Save Product to keep it attached.");
      markProductsDirty();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not upload product image.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function removeProductImage() {
    if (!form.imageUrl && !form.imagePath) return;

    const confirmed = window.confirm("Remove this product image?");
    if (!confirmed) return;

    try {
      if (form.imagePath) {
        await deleteStorageFile(form.imagePath);
      }

      setForm((current) => ({
        ...current,
        imageUrl: "",
        imagePath: ""
      }));
      markProductsDirty();
      setStatusMessage("Product image removed. Save the product to keep this change.");
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not remove product image.");
    }
  }

  async function saveSpiceKitchenVariant() {
    const recipeId = form.sourceRecipeId;
    const recipe = spiceRecipes.find((item) => item.id === recipeId);

    if (!recipe) {
      setStatusMessage("Could not find the linked Spice Kitchen recipe.");
      return false;
    }

    const packageRows = Array.isArray(recipe.productPackages)
      ? recipe.productPackages
      : [];

    const variant = selectedProductVariants.find((item) => item.id === selectedVariantId);
    const packageIndex =
      typeof variant?.packageIndex === "number"
        ? variant.packageIndex
        : Number(form.sourceVariantIndex);

    if (!Number.isInteger(packageIndex) || !packageRows[packageIndex]) {
      setStatusMessage("Could not find the selected package variant.");
      return false;
    }

    const updatedPackages = packageRows.map((packageItem, index) => {
      if (index !== packageIndex) return packageItem;

      return {
        ...packageItem,
        sku: form.sku || packageItem.sku || "",
        retailPrice: Number(form.retailPrice) || 0,
        wholesalePrice: Number(form.wholesalePrice) || 0,
        targetRetailMargin: Number(form.targetRetailMargin) || 70,
        targetWholesaleMargin: Number(form.targetWholesaleMargin) || 50,
        packagingCostPerUnit: Number(form.packagingCostPerUnit) || 0,
        batchUnits: Number(form.batchUnits) || 1,
        laborHours: Number(form.laborHours) || 0,
        laborRate: Number(form.laborRate) || 0,
        overheadCost: Number(form.overheadCost) || 0
      };
    });

    await updateSpiceRecipeProductPackage(user.uid, recipeId, updatedPackages);
    return true;
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

    try {
      if (form.isGeneratedProduct && form.sourceType === "spice") {
        const savedLinkedVariant = await saveSpiceKitchenVariant();

        if (savedLinkedVariant) {
          markSaved();
          setStatusMessage("Spice Kitchen package pricing saved.");
          await loadProducts();
        }

        return;
      }

      const productToSave = {
        ...form,
        id:
          form.isGeneratedProduct ||
          String(selectedProductId).startsWith("baking-")
            ? makeId()
            : selectedProductId || form.id || makeId(),
        name: form.name.trim(),
        category: form.category || "Other",
        status: form.status || "Active",
        sourceType: form.isGeneratedProduct ? "manual" : form.sourceType || "manual",
        sourceLabel: form.isGeneratedProduct ? "Manual" : form.sourceLabel || "Manual",
        isGeneratedProduct: false,
        selectedVariantId,
        selectedVariantName: form.selectedVariantName || "",
        targetRetailMargin: getTargetRetailMargin(form),
        targetWholesaleMargin: getTargetWholesaleMargin(form),
        pricingSummary: calculation
      };

      const savedId = await saveProduct(user.uid, productToSave);
      setSelectedProductId(savedId);
      setForm((current) => ({
  ...current,
  id: savedId,
  imageUrl: productToSave.imageUrl || current.imageUrl || "",
  imagePath: productToSave.imagePath || current.imagePath || ""
}));
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

    if (!product) {
      setStatusMessage("Generated products are managed in their source module.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${product?.name || "this product"}? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      if (product.imagePath) {
        await deleteStorageFile(product.imagePath);
      }

      await deleteProduct(user.uid, productId);

      if (selectedProductId === productId) {
        setSelectedProductId("");
        setSelectedVariantId("");
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

  function toggleProductExpanded(productId) {
    setExpandedProductIds((current) => ({
      ...current,
      [productId]: !current[productId]
    }));
  }

  const sectionCards = [
    {
      title: "Product Directory",
      description: "Browse, filter, and load saved products.",
      icon: Package,
      ref: directoryRef
    },
    {
      title: "Product Details",
      description: "Edit product names, variants, categories, SKU, status, and notes.",
      icon: Tag,
      ref: detailsRef
    },
    {
      title: "Pricing Analysis",
      description: "Review costs, prices, margins, and suggested pricing.",
      icon: Calculator,
      ref: pricingRef
    }
  ];

  if (!user) {
    return (
      <div className="modulePage pricingPage compactSpicePage">
        <section className="farmModuleHero pricingHero">
          <div className="farmModuleHeroText">
            <p className="eyebrow">Products & Pricing</p>
            <h2>Sign in to save your product list.</h2>
            <p>
              Build a product directory, calculate costs, set prices, and save your
              product records to your Farmers Hub account.
            </p>
          </div>

          <div className="farmModuleHeroActions">
            <button className="primaryButton farmHeroAction" type="button" onClick={loginWithGoogle}>
              Sign in with Google
            </button>
          </div>
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

      <section className="farmModuleHero pricingHero">
        <div className="farmModuleHeroText">
          <p className="eyebrow">Products & Pricing</p>
          <h2>Build your product list and price each item with confidence.</h2>
          <p>
            Keep a central product directory for anything you sell, then select a
            product and package variant to edit its cost breakdown, retail price,
            wholesale price, and margins.
          </p>
        </div>

        <div className="farmModuleHeroActions">
          <button className="primaryButton compactPrimary farmHeroAction" type="button" onClick={startNewProduct}>
            <Plus size={18} />
            Add Product
          </button>
          <button className="secondaryButton compactButton farmHeroAction" type="button" onClick={() => setShowGuide(true)}>
            <CircleHelp size={16} />
            Guide
          </button>
        </div>
      </section>

      <section className="hubStatGrid pricingStatGrid">
        <StatCard icon={Package} label="Products" value={loadingProducts ? "..." : allDirectoryProducts.length} sub="manual + module products" accent="pricing" />
        <StatCard icon={Tag} label="Active" value={loadingProducts ? "..." : stats.activeCount} sub="currently available" accent="market" />
        <StatCard icon={Target} label="Avg Margin" value={loadingProducts ? "..." : percent(stats.averageRetailMargin)} sub="retail margin" accent="spice" />
        <StatCard icon={Calculator} label="Priced" value={loadingProducts ? "..." : stats.productsWithPricing} sub="cost + retail price" accent="sourdough" />
      </section>

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
            <input
              type="search"
              placeholder="Search products, variants, SKU, category, notes, or description"
              value={queryText}
              onChange={(event) => setQueryText(event.target.value)}
            />
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

        <div
          className="productDirectoryInlineTable"
          style={{
            overflowX: "auto",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            background: "#ffffff"
          }}
        >
          <div
            className="productDirectoryInlineHeader"
            style={{
              display: "grid",
              gridTemplateColumns: productDirectoryGridColumns,
              minWidth: "1180px",
              alignItems: "center",
              columnGap: "14px",
              padding: "12px 14px",
              background: "#fbfaf6",
              borderBottom: "1px solid var(--border)",
              color: "var(--muted)",
              fontSize: "0.72rem",
              fontWeight: 900,
              letterSpacing: "0.075em",
              textTransform: "uppercase"
            }}
          >
            <span>Photo</span>
            <span>Product</span>
            <span>Variant</span>
            <span>Category</span>
            <span>Retail</span>
            <span>Wholesale</span>
            <span>Cost</span>
            <span>Margin</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          {filteredProducts.length ? (
            filteredProducts.map((product) => {
              const directoryVariantId =
                directoryVariantSelections[product.id] ||
                product.selectedVariantId ||
                product.generatedVariants?.[0]?.id ||
                "";
              const productForCalc = applyVariantToProduct(product, directoryVariantId);
              const calc = calculateProduct(productForCalc);

              return (
                <div
                  className="productDirectoryInlineRow"
                  key={product.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: productDirectoryGridColumns,
                    minWidth: "1180px",
                    minHeight: "78px",
                    alignItems: "center",
                    columnGap: "14px",
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--border)"
                  }}
                >
                  <span
                    className="pricingImageCell"
                    style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}
                  >
                    {product.imageUrl ? (
                      <button
                        className="productDirectoryImageButton"
                        type="button"
                        onClick={() =>
                          setZoomedProductImage({
                            url: product.imageUrl,
                            name: product.name || "Product image"
                          })
                        }
                        aria-label={`View ${product.name || "product"} image`}
                        style={{
                          width: "58px",
                          height: "58px",
                          padding: 0,
                          borderRadius: "14px",
                          overflow: "hidden",
                          border: "1px solid var(--border)",
                          background: "#fbfaf6",
                          cursor: "zoom-in"
                        }}
                      >
                        <img
                          src={product.imageUrl}
                          alt={`${product.name || "Product"} product`}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      </button>
                    ) : (
                      <span
                        className="pricingImagePlaceholder"
                        style={{
                          width: "58px",
                          height: "58px",
                          borderRadius: "14px",
                          border: "1px solid var(--border)",
                          background: "#fbfaf6",
                          display: "grid",
                          placeItems: "center"
                        }}
                      >
                        <Image size={20} />
                      </span>
                    )}
                  </span>

                  <span className="pricingProductCell" style={{ display: "grid", gap: "3px", minWidth: 0 }}>
                    <button
                      className="savedItemLink"
                      type="button"
                      onClick={() => loadProduct(product, { variantId: directoryVariantId })}
                      style={{
                        maxWidth: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {product.name || "Untitled Product"}
                    </button>
                    <small>
                      {productSourceLabel(product)}
                      {product.sku ? ` • ${product.sku}` : ""}
                    </small>
                  </span>

                  <span className="pricingDirectoryVariantCell" style={{ minWidth: 0 }}>
                    {product.generatedVariants?.length ? (
                      <select
                        className="pricingDirectoryVariantSelect"
                        value={directoryVariantId}
                        onChange={(event) => changeDirectoryVariant(product.id, event.target.value)}
                      >
                        {product.generatedVariants.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="mutedText">Single unit</span>
                    )}
                  </span>

                  <span>{product.category || "Other"}</span>
                  <span className="pricingMetric" style={{ whiteSpace: "nowrap" }}>{money(productForCalc.retailPrice)}</span>
                  <span className="pricingMetric" style={{ whiteSpace: "nowrap" }}>{money(productForCalc.wholesalePrice)}</span>
                  <span className="pricingMetric" style={{ whiteSpace: "nowrap" }}>{money(calc.costPerUnit)}</span>

                  <span className="pricingMetric pricingPositive" style={{ whiteSpace: "nowrap" }}>
                    {percent(calc.retailMargin)}
                    <small style={{ display: "block", marginTop: "2px" }}>{money(calc.retailProfitPerUnit)} / unit</small>
                  </span>

                  <span
                    className="pricingDirectoryActions"
                    style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px" }}
                  >
                    {!product.isGeneratedProduct ? (
                      <button
                        className="iconButton danger"
                        type="button"
                        onClick={() => removeProduct(product.id)}
                        aria-label="Delete product"
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : null}
                    <button
                      className="iconButton"
                      type="button"
                      onClick={() => toggleProductExpanded(product.id)}
                      aria-label="Toggle product details"
                    >
                      {expandedProductIds[product.id] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </span>

                  {expandedProductIds[product.id] ? (
                    <div
                      className="pricingExpandedDetails"
                      style={{ gridColumn: "1 / -1", marginTop: "10px" }}
                    >
                      <div>
                        <strong>Source</strong>
                        <span>{productSourceLabel(product)}</span>
                      </div>
                      <div>
                        <strong>Status</strong>
                        <span>{product.status || "Active"}</span>
                      </div>
                      <div>
                        <strong>Updated</strong>
                        <span>{formatShortDate(product.updatedAt)}</span>
                      </div>
                      <div>
                        <strong>Unit</strong>
                        <span>{productForCalc.unitLabel || "unit"}</span>
                      </div>
                      <div className="pricingExpandedWide">
                        <strong>Notes</strong>
                        <span>{product.notes || product.description || "No notes saved."}</span>
                      </div>
                      {product.isGeneratedProduct ? (
                        <div className="pricingExpandedWide">
                          <strong>Linked Item</strong>
                          <span>
                            This product is managed in {productSourceLabel(product)}. Saving edits here updates the linked package variant.
                          </span>
                        </div>
                      ) : null}
                      {product.generatedVariants?.length ? (
                        <div className="pricingExpandedWide pricingVariantList">
                          <strong>Variant Sizes</strong>
                          {product.generatedVariants.map((variant) => (
                            <button
                              className="pricingVariantRow savedItemLink"
                              type="button"
                              key={variant.id}
                              onClick={() => loadProduct(product, { variantId: variant.id })}
                            >
                              <span>{variant.name}</span>
                              <span>{formatPackageSize(variant.size, variant.unit)}</span>
                              <span>{money(variant.ingredientCost)}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
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
            <div>
              <p className="eyebrow">Product</p>
              <h3>Product Details</h3>
            </div>
            <div className="formActions compactActions">
              <button
                className={`primaryButton compactPrimary ${hasUnsavedChanges ? "dirtySaveButton" : ""}`}
                type="button"
                onClick={saveCurrentProduct}
                disabled={saving}
              >
                <Save size={15} />
                {saving ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "Save Product"}
              </button>
            </div>
          </div>

          {form.isGeneratedProduct ? (
            <div className="placeholderBox compactPlaceholder linkedProductNotice">
              <strong>Linked product:</strong> this product is generated from {productSourceLabel(form)}. Saving edits here will update the linked source package variant.
            </div>
          ) : null}

          <div className="productImagePanel">
            <div className="productImagePreview">
              {form.imageUrl ? (
                <img src={form.imageUrl} alt={`${form.name || "Product"} preview`} />
              ) : (
                <div className="productImageEmptyState">
                  <Image size={28} />
                  <span>No product image yet</span>
                </div>
              )}
            </div>

            <div className="productImageActions">
              <div>
                <p className="eyebrow">Product Image</p>
                <p className="importExportText">
                  Upload a product photo for the directory. Images are stored in Firebase Storage and saved to this product record.
                </p>
              </div>

              <div className="formActions compactActions">
                <input
                  ref={imageInputRef}
                  className="hiddenFileInput"
                  type="file"
                  accept="image/*"
                  onChange={handleProductImageUpload}
                />
                <button
                  className="secondaryButton compactButton"
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  <Upload size={15} />
                  {uploadingImage ? "Uploading..." : form.imageUrl ? "Replace Image" : "Upload Image"}
                </button>
                {form.imageUrl ? (
                  <button
                    className="secondaryButton compactButton dangerTextButton"
                    type="button"
                    onClick={removeProductImage}
                    disabled={uploadingImage}
                  >
                    <X size={15} />
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="formGrid compactFormGrid">
            <label>
              Product Name
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="e.g., Sourdough Loaf, Soy Candle, Lavender Bouquet"
              />
            </label>

            <label>
              SKU
              <input
                value={form.sku}
                onChange={(event) => updateField("sku", event.target.value)}
                placeholder="Optional"
              />
            </label>

            {selectedProductVariants.length ? (
              <label>
                Variant
                <select value={selectedVariantId} onChange={(event) => changeVariant(event.target.value)}>
                  {selectedProductVariants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label>
              Category
              <select value={form.category} onChange={(event) => updateField("category", event.target.value)}>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>

            <label>
              Status
              <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                {productStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>

            <label>
              Unit Label
              <input
                value={form.unitLabel}
                onChange={(event) => updateField("unitLabel", event.target.value)}
                placeholder="each, jar, bunch, lb, dozen, tray"
              />
            </label>

            <NumberInput
              label="Target Retail Margin %"
              value={form.targetRetailMargin}
              onChange={(value) => updateField("targetRetailMargin", value)}
              placeholder="70"
              step="0.1"
            />

            <NumberInput
              label="Target Wholesale Margin %"
              value={form.targetWholesaleMargin}
              onChange={(value) => updateField("targetWholesaleMargin", value)}
              placeholder="50"
              step="0.1"
            />

            <label className="fullSpan">
              Description
              <input
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder="Short internal product description"
              />
            </label>

            <label className="fullSpan">
              Notes
              <input
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Packaging notes, seasonal availability, wholesale details, allergens, or production notes"
              />
            </label>
          </div>
        </div>

        <div className="workspacePanel compactPanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Selected</p>
              <h3>{selectedProduct ? selectedProduct.name : form.name || "Unsaved Product"}</h3>
              {form.selectedVariantName ? <p className="importExportText">{form.selectedVariantName}</p> : null}
            </div>
          </div>

          <div className="hubStatGrid pricingStatGrid">
            <StatCard icon={DollarSign} label="Retail" value={money(form.retailPrice)} sub={`per ${form.unitLabel || "unit"}`} accent="pricing" />
            <StatCard icon={DollarSign} label="Wholesale" value={money(form.wholesalePrice)} sub={`per ${form.unitLabel || "unit"}`} accent="sourdough" />
            <StatCard icon={Target} label="Cost" value={money(calculation.costPerUnit)} sub="estimated per unit" accent="market" />
            <StatCard icon={Package} label="Suggested Retail" value={money(calculation.suggestedRetailPrice)} sub={`${form.targetRetailMargin || 0}% target`} accent="spice" />
            <StatCard icon={Package} label="Suggested Wholesale" value={money(calculation.suggestedWholesalePrice)} sub={`${form.targetWholesaleMargin || 0}% target`} accent="pricing" />
            <StatCard icon={Calculator} label="Retail Margin" value={percent(calculation.retailMargin)} sub={`${money(calculation.retailProfitPerUnit)} profit`} accent="market" />
            <StatCard icon={Calculator} label="Wholesale Margin" value={percent(calculation.wholesaleMargin)} sub={`${money(calculation.wholesaleProfitPerUnit)} profit`} accent="sourdough" />
          </div>

          <div className="placeholderBox compactPlaceholder">
            <strong>Pricing clarity:</strong> select a package variant, then enter material, packaging, labor, and overhead costs below. Farmers Hub will calculate estimated cost per unit, suggested retail price, suggested wholesale price, and profit margins.
          </div>
        </div>
      </section>

      <section className="workspacePanel compactPanel scrollAnchor" ref={pricingRef}>
        <div className="workspaceHeader compactPanelHeader">
          <div>
            <p className="eyebrow">Pricing</p>
            <h3>Pricing Analysis</h3>
          </div>

          <div className="formActions compactActions">
            <label>
              Select Product
              <select
                value={selectedProductId}
                onChange={(event) => {
                  const product = allDirectoryProducts.find((item) => item.id === event.target.value);
                  if (product) loadProduct(product);
                  if (!event.target.value) {
                    setSelectedProductId("");
                    setSelectedVariantId("");
                    setForm(blankProduct());
                  }
                }}
              >
                <option value="">Unsaved or new product</option>
                {allDirectoryProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name || "Untitled Product"} ({productSourceLabel(product)})
                  </option>
                ))}
              </select>
            </label>

            {selectedProductVariants.length ? (
              <label>
                Select Variant
                <select value={selectedVariantId} onChange={(event) => changeVariant(event.target.value)}>
                  {selectedProductVariants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <button
              className={`primaryButton compactPrimary ${hasUnsavedChanges ? "dirtySaveButton" : ""}`}
              type="button"
              onClick={saveCurrentProduct}
              disabled={saving}
            >
              <Save size={15} />
              {saving ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "Save Product"}
            </button>
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
          <div className="workspacePanel compactPanel"><p className="eyebrow">Suggested Retail</p><h3>{money(calculation.suggestedRetailPrice)}</h3><p className="importExportText">Based on {form.targetRetailMargin || 0}% target retail margin.</p></div>
          <div className="workspacePanel compactPanel"><p className="eyebrow">Suggested Wholesale</p><h3>{money(calculation.suggestedWholesalePrice)}</h3><p className="importExportText">Based on {form.targetWholesaleMargin || 0}% target wholesale margin.</p></div>
          <div className="workspacePanel compactPanel"><p className="eyebrow">Retail Margin</p><h3>{percent(calculation.retailMargin)}</h3><p className="importExportText">{money(calculation.retailProfitPerUnit)} retail profit per unit.</p></div>
          <div className="workspacePanel compactPanel"><p className="eyebrow">Wholesale Margin</p><h3>{percent(calculation.wholesaleMargin)}</h3><p className="importExportText">{money(calculation.wholesaleProfitPerUnit)} wholesale profit per unit.</p></div>
        </div>
      </section>

      {showBackToTop ? (
        <button className="backToTopButton" type="button" onClick={scrollToTop}>
          <ArrowUp size={18} />
          Top
        </button>
      ) : null}

      {zoomedProductImage ? (
        <div className="productImageZoomOverlay" onClick={() => setZoomedProductImage(null)}>
          <div className="productImageZoomModal" onClick={(event) => event.stopPropagation()}>
            <button
              className="modalCloseButton"
              type="button"
              onClick={() => setZoomedProductImage(null)}
              aria-label="Close image preview"
            >
              ×
            </button>
            <img src={zoomedProductImage.url} alt={zoomedProductImage.name} />
            <strong>{zoomedProductImage.name}</strong>
          </div>
        </div>
      ) : null}

      <ModuleGuideModal
        isOpen={showGuide}
        moduleKey="pricing"
        title="How to Use Products & Pricing"
        onClose={() => setShowGuide(false)}
      >
        <PricingGuideContent />
      </ModuleGuideModal>
    </div>
  );
}
