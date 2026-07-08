import { useEffect, useMemo, useState } from "react";
import {
  Beaker,
  BookOpen,
  Calculator,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Edit3,
  FlaskConical,
  HelpCircle,
  Library,
  PackageCheck,
  Plus,
  Save,
  Search,
  Trash2
} from "lucide-react";

import { useAuth } from "../AuthContext.jsx";
import { useUnsavedChanges } from "../UnsavedChangesContext.jsx";
import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import PreservedFoodsGuideContent from "../components/PreservedFoodsGuideContent.jsx";
import ModuleHero from "../components/ModuleHero.jsx";
import StatCard from "../components/StatCard.jsx";
import { addQuantityToMatchedInventoryItem } from "../services/inventoryService.js";
import { getSpiceIngredients } from "../services/spiceKitchenService.js";
import {
  createPreservedBatch,
  createPreservedIngredient,
  createPreservedRecipe,
  deletePreservedBatch,
  deletePreservedIngredient,
  deletePreservedRecipe,
  getPreservedBatches,
  getPreservedIngredients,
  getPreservedRecipes,
  updatePreservedIngredient,
  updatePreservedRecipe
} from "../services/preservedFoodsService.js";

const ingredientCategories = [
  "Produce",
  "Vinegar",
  "Salt",
  "Sugar",
  "Spice",
  "Herb",
  "Water",
  "Culture",
  "Jar",
  "Lid",
  "Label",
  "Packaging",
  "Other"
];

const recipeTypes = [
  "Pickles",
  "Ferment",
  "Relish",
  "Hot Sauce",
  "Sauerkraut / Kimchi",
  "Canned Vegetable",
  "Infused Vinegar",
  "Jam / Jelly",
  "Other"
];

const processMethods = [
  "Refrigerated",
  "Fermented",
  "Water Bath",
  "Pressure Canned",
  "Hot Fill",
  "Frozen",
  "Other"
];

const costUnits = ["each", "oz", "lb", "g", "jar", "case"];

const emptyIngredient = {
  name: "",
  category: "Produce",
  supplier: "",
  cost: "",
  costUnit: "lb",
  notes: ""
};

const emptyRecipe = {
  name: "",
  type: "Pickles",
  description: "",
  brinePercent: 45,
  vinegarPercent: 50,
  saltPercent: 3.5,
  sugarPercent: 0,
  targetPh: 4.2,
  processMethod: "Water Bath",
  ingredients: [],
  packages: []
};

const emptyBatch = {
  recipeId: "",
  packageId: "",
  productionDate: "",
  lotNumber: "",
  jarCount: "",
  ph: "",
  processMethod: "Water Bath",
  bestByDate: "",
  notes: ""
};

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value, places = 2) {
  return Number(value || 0).toFixed(places);
}

function formatCurrency(value) {
  const number = toNumber(value);
  return `$${number.toFixed(2)}`;
}

function cleanCurrency(value) {
  if (value === "" || value === null || value === undefined) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "";
}

function convertToOunces(amount, unit) {
  const value = toNumber(amount);

  if (unit === "oz") return value;
  if (unit === "lb") return value * 16;
  if (unit === "g") return value / 28.3495;

  return value;
}

function convertCostToEachOrOunce(ingredient) {
  const cost = toNumber(ingredient?.cost);

  if (!cost) return 0;
  if (ingredient.costUnit === "oz") return cost;
  if (ingredient.costUnit === "lb") return cost / 16;
  if (ingredient.costUnit === "g") return cost * 28.3495;

  return cost;
}

function createBlankRecipeIngredient() {
  return {
    ingredientId: "",
    ingredientName: "",
    pantrySource: "",
    amount: "",
    unit: "oz",
    role: "Ingredient"
  };
}

function createBlankPackage() {
  return {
    id: makeId("pkg"),
    name: "",
    jarSizeOz: "16",
    retailPrice: "",
    wholesalePrice: "",
    packagingCost: ""
  };
}

function getIngredientLabel(line, availableIngredients) {
  const match = availableIngredients.find(
    (item) => item.optionId === line.ingredientId
  );

  return line.ingredientName || match?.name || "Unknown ingredient";
}

function calculateRecipeCost(recipe, availableIngredients) {
  const ingredientCost = (recipe.ingredients || []).reduce((sum, line) => {
    const ingredient = availableIngredients.find(
      (item) => item.optionId === line.ingredientId
    );

    if (!ingredient) return sum;

    const unitCost = convertCostToEachOrOunce(ingredient);
    const amount = toNumber(line.amount);

    if (["oz", "lb", "g"].includes(line.unit)) {
      return sum + convertToOunces(amount, line.unit) * unitCost;
    }

    return sum + amount * unitCost;
  }, 0);

  return ingredientCost;
}

function calculateBrine(recipe, packageItem, jarCount) {
  const jars = toNumber(jarCount);
  const jarSizeOz = toNumber(packageItem?.jarSizeOz);
  const totalFillOz = jars * jarSizeOz;
  const brineOz = totalFillOz * (toNumber(recipe?.brinePercent) / 100);
  const vinegarOz = brineOz * (toNumber(recipe?.vinegarPercent) / 100);
  const waterOz = Math.max(brineOz - vinegarOz, 0);
  const saltOz = brineOz * (toNumber(recipe?.saltPercent) / 100);
  const sugarOz = brineOz * (toNumber(recipe?.sugarPercent) / 100);

  return {
    jars,
    jarSizeOz,
    totalFillOz,
    brineOz,
    vinegarOz,
    waterOz,
    saltOz,
    sugarOz
  };
}

export default function PreservedFoods() {
  const { user, loginWithGoogle } = useAuth();
  const { isDirty: hasUnsavedChanges, markUnsaved, markSaved } =
    useUnsavedChanges();

  const [ingredients, setIngredients] = useState([]);
  const [spiceIngredients, setSpiceIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [batches, setBatches] = useState([]);
  const [ingredientForm, setIngredientForm] = useState(emptyIngredient);
  const [editingIngredientId, setEditingIngredientId] = useState(null);
  const [recipeForm, setRecipeForm] = useState(emptyRecipe);
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);
  const [batchForm, setBatchForm] = useState(emptyBatch);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("success");
  const [loading, setLoading] = useState(false);
  const [savingInventory, setSavingInventory] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  function showStatus(message, type = "success") {
    setStatusMessage(message);
    setStatusType(type);
  }

  function markPreservedDirty() {
    markUnsaved({
      source: "Preserved Foods",
      onSave: async () => {
        markSaved();
        return true;
      }
    });
  }

  async function loadData() {
    if (!user) return;

    setLoading(true);

    try {
      const [savedIngredients, savedRecipes, savedBatches, savedSpiceIngredients] =
        await Promise.all([
          getPreservedIngredients(user.uid),
          getPreservedRecipes(user.uid),
          getPreservedBatches(user.uid),
          getSpiceIngredients(user.uid)
        ]);

      setIngredients(savedIngredients);
      setRecipes(savedRecipes);
      setBatches(savedBatches);
      setSpiceIngredients(savedSpiceIngredients);
    } catch (error) {
      console.error(error);
      showStatus("Could not load Preserved Foods data.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setIngredients([]);
      setSpiceIngredients([]);
      setRecipes([]);
      setBatches([]);
    }
  }, [user]);

  useEffect(() => {
    if (!statusMessage) return;

    const timer = window.setTimeout(() => {
      setStatusMessage("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    if (!user) return;

    const hideGuide = window.localStorage.getItem(
      "hideModuleGuide_preservedFoods"
    );

    if (!hideGuide) {
      setShowGuide(true);
    }
  }, [user]);

  const availableRecipeIngredients = useMemo(() => {
    const preservedOptions = ingredients.map((ingredient) => ({
      ...ingredient,
      pantrySource: "Preserved Foods",
      optionId: `preserved:${ingredient.id}`
    }));

    const spiceOptions = spiceIngredients.map((ingredient) => ({
      ...ingredient,
      pantrySource: "Spice Kitchen",
      optionId: `spice:${ingredient.id}`
    }));

    return [...preservedOptions, ...spiceOptions].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""))
    );
  }, [ingredients, spiceIngredients]);

  const filteredRecipes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return recipes.filter((recipe) => {
      if (!query) return true;

      return (
        recipe.name?.toLowerCase().includes(query) ||
        recipe.type?.toLowerCase().includes(query) ||
        recipe.description?.toLowerCase().includes(query)
      );
    });
  }, [recipes, searchTerm]);

  const selectedRecipe = useMemo(() => {
    return recipes.find((recipe) => recipe.id === batchForm.recipeId) || null;
  }, [recipes, batchForm.recipeId]);

  const selectedPackage = useMemo(() => {
    if (!selectedRecipe) return null;

    return (
      (selectedRecipe.packages || []).find(
        (item) => item.id === batchForm.packageId
      ) || null
    );
  }, [selectedRecipe, batchForm.packageId]);

  const brineSummary = useMemo(() => {
    if (!selectedRecipe || !selectedPackage) {
      return {
        jars: 0,
        jarSizeOz: 0,
        totalFillOz: 0,
        brineOz: 0,
        vinegarOz: 0,
        waterOz: 0,
        saltOz: 0,
        sugarOz: 0
      };
    }

    return calculateBrine(selectedRecipe, selectedPackage, batchForm.jarCount);
  }, [selectedRecipe, selectedPackage, batchForm.jarCount]);

  const recipeCost = useMemo(() => {
    return calculateRecipeCost(recipeForm, availableRecipeIngredients);
  }, [recipeForm, availableRecipeIngredients]);

  const selectedRecipeCost = useMemo(() => {
    if (!selectedRecipe) return 0;

    return calculateRecipeCost(selectedRecipe, availableRecipeIngredients);
  }, [selectedRecipe, availableRecipeIngredients]);

  const batchCostEstimate = useMemo(() => {
    if (!selectedPackage || !brineSummary.jars) return 0;

    const packagingCost =
      toNumber(selectedPackage.packagingCost) * brineSummary.jars;

    return selectedRecipeCost + packagingCost;
  }, [selectedPackage, brineSummary.jars, selectedRecipeCost]);

  const batchCostPerJar =
    brineSummary.jars > 0 ? batchCostEstimate / brineSummary.jars : 0;

  const dashboardSummary = useMemo(() => {
    const finishedJars = batches.reduce(
      (sum, batch) => sum + toNumber(batch.jarCount),
      0
    );

    const averagePhValues = batches
      .map((batch) => toNumber(batch.ph))
      .filter((value) => value > 0);

    const averagePh =
      averagePhValues.length > 0
        ? averagePhValues.reduce((sum, value) => sum + value, 0) /
          averagePhValues.length
        : 0;

    return {
      ingredients: ingredients.length + spiceIngredients.length,
      preservedIngredients: ingredients.length,
      sharedSpiceIngredients: spiceIngredients.length,
      recipes: recipes.length,
      batches: batches.length,
      finishedJars,
      averagePh
    };
  }, [ingredients, spiceIngredients, recipes, batches]);

  function updateIngredientField(field, value) {
    markPreservedDirty();

    setIngredientForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateRecipeField(field, value) {
    markPreservedDirty();

    setRecipeForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateBatchField(field, value) {
    setBatchForm((current) => {
      const next = {
        ...current,
        [field]: value
      };

      if (field === "recipeId") {
        const recipe = recipes.find((item) => item.id === value);
        next.packageId = recipe?.packages?.[0]?.id || "";
        next.processMethod = recipe?.processMethod || "Water Bath";
      }

      return next;
    });
  }

  async function saveIngredient(event) {
    event?.preventDefault?.();

    if (!user) return;

    const cleanIngredient = {
      name: ingredientForm.name.trim(),
      category: ingredientForm.category,
      supplier: ingredientForm.supplier.trim(),
      cost: cleanCurrency(ingredientForm.cost),
      costUnit: ingredientForm.costUnit,
      notes: ingredientForm.notes.trim()
    };

    if (!cleanIngredient.name) {
      showStatus("Ingredient name is required.", "error");
      return;
    }

    try {
      if (editingIngredientId) {
        await updatePreservedIngredient(
          user.uid,
          editingIngredientId,
          cleanIngredient
        );
        showStatus("Ingredient updated.");
      } else {
        await createPreservedIngredient(user.uid, cleanIngredient);
        showStatus("Ingredient saved.");
      }

      setIngredientForm(emptyIngredient);
      setEditingIngredientId(null);
      markSaved();
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not save ingredient.", "error");
    }
  }

  function editIngredient(ingredient) {
    setEditingIngredientId(ingredient.id);
    setIngredientForm({
      name: ingredient.name || "",
      category: ingredient.category || "Other",
      supplier: ingredient.supplier || "",
      cost: cleanCurrency(ingredient.cost),
      costUnit: ingredient.costUnit || "each",
      notes: ingredient.notes || ""
    });
  }

  async function removeIngredient(ingredientId) {
    if (!user) return;

    try {
      await deletePreservedIngredient(user.uid, ingredientId);
      showStatus("Ingredient deleted.");
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not delete ingredient.", "error");
    }
  }

  function addRecipeIngredient() {
    markPreservedDirty();

    setRecipeForm((current) => ({
      ...current,
      ingredients: [
        ...(current.ingredients || []),
        createBlankRecipeIngredient()
      ]
    }));
  }

  function updateRecipeIngredient(index, field, value) {
    markPreservedDirty();

    setRecipeForm((current) => {
      const nextIngredients = [...(current.ingredients || [])];
      const nextLine = {
        ...nextIngredients[index],
        [field]: value
      };

      if (field === "ingredientId") {
        const ingredient = availableRecipeIngredients.find(
          (item) => item.optionId === value
        );

        nextLine.ingredientName = ingredient?.name || "";
        nextLine.pantrySource = ingredient?.pantrySource || "";
      }

      nextIngredients[index] = nextLine;

      return {
        ...current,
        ingredients: nextIngredients
      };
    });
  }

  function removeRecipeIngredient(index) {
    markPreservedDirty();

    setRecipeForm((current) => ({
      ...current,
      ingredients: (current.ingredients || []).filter(
        (_, lineIndex) => lineIndex !== index
      )
    }));
  }

  function addPackage() {
    markPreservedDirty();

    setRecipeForm((current) => ({
      ...current,
      packages: [...(current.packages || []), createBlankPackage()]
    }));
  }

  function updatePackage(index, field, value) {
    markPreservedDirty();

    setRecipeForm((current) => {
      const nextPackages = [...(current.packages || [])];

      nextPackages[index] = {
        ...nextPackages[index],
        [field]: value
      };

      return {
        ...current,
        packages: nextPackages
      };
    });
  }

  function removePackage(index) {
    markPreservedDirty();

    setRecipeForm((current) => ({
      ...current,
      packages: (current.packages || []).filter(
        (_, packageIndex) => packageIndex !== index
      )
    }));
  }

  async function saveRecipe(event) {
    event?.preventDefault?.();

    if (!user) return;

    const cleanRecipe = {
      name: recipeForm.name.trim(),
      type: recipeForm.type,
      description: recipeForm.description.trim(),
      brinePercent: toNumber(recipeForm.brinePercent),
      vinegarPercent: toNumber(recipeForm.vinegarPercent),
      saltPercent: toNumber(recipeForm.saltPercent),
      sugarPercent: toNumber(recipeForm.sugarPercent),
      targetPh: toNumber(recipeForm.targetPh),
      processMethod: recipeForm.processMethod,
      estimatedRecipeCost: recipeCost,
      ingredients: (recipeForm.ingredients || [])
        .filter((line) => line.ingredientId && toNumber(line.amount) > 0)
        .map((line) => ({
          ingredientId: line.ingredientId,
          ingredientName: line.ingredientName,
          pantrySource: line.pantrySource || "",
          amount: toNumber(line.amount),
          unit: line.unit,
          role: line.role || "Ingredient"
        })),
      packages: (recipeForm.packages || [])
        .filter((item) => item.name.trim() && toNumber(item.jarSizeOz) > 0)
        .map((item) => ({
          id: item.id || makeId("pkg"),
          name: item.name.trim(),
          jarSizeOz: toNumber(item.jarSizeOz),
          retailPrice:
            item.retailPrice === "" ? "" : toNumber(item.retailPrice),
          wholesalePrice:
            item.wholesalePrice === "" ? "" : toNumber(item.wholesalePrice),
          packagingCost:
            item.packagingCost === "" ? "" : toNumber(item.packagingCost)
        }))
    };

    if (!cleanRecipe.name) {
      showStatus("Recipe name is required.", "error");
      return;
    }

    if (!cleanRecipe.ingredients.length) {
      showStatus("Add at least one recipe ingredient.", "error");
      return;
    }

    if (!cleanRecipe.packages.length) {
      showStatus("Add at least one jar or package size.", "error");
      return;
    }

    try {
      if (editingRecipeId) {
        await updatePreservedRecipe(user.uid, editingRecipeId, cleanRecipe);
        showStatus("Recipe updated.");
      } else {
        await createPreservedRecipe(user.uid, cleanRecipe);
        showStatus("Recipe saved.");
      }

      setRecipeForm(emptyRecipe);
      setEditingRecipeId(null);
      setExpandedRecipeId(null);
      markSaved();
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not save recipe.", "error");
    }
  }

  function editRecipe(recipe) {
    setEditingRecipeId(recipe.id);
    setRecipeForm({
      name: recipe.name || "",
      type: recipe.type || "Pickles",
      description: recipe.description || "",
      brinePercent: recipe.brinePercent ?? 45,
      vinegarPercent: recipe.vinegarPercent ?? 50,
      saltPercent: recipe.saltPercent ?? 3.5,
      sugarPercent: recipe.sugarPercent ?? 0,
      targetPh: recipe.targetPh ?? 4.2,
      processMethod: recipe.processMethod || "Water Bath",
      ingredients: recipe.ingredients || [],
      packages: recipe.packages || []
    });
  }

  async function removeRecipe(recipeId) {
    if (!user) return;

    try {
      await deletePreservedRecipe(user.uid, recipeId);
      showStatus("Recipe deleted.");
      if (expandedRecipeId === recipeId) setExpandedRecipeId(null);
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not delete recipe.", "error");
    }
  }

  async function saveBatch(event) {
    event?.preventDefault?.();

    if (!user || !selectedRecipe || !selectedPackage) {
      showStatus("Select a recipe and package before saving a batch.", "error");
      return;
    }

    if (!batchForm.productionDate || !batchForm.jarCount) {
      showStatus("Production date and jar count are required.", "error");
      return;
    }

    const cleanBatch = {
      recipeId: selectedRecipe.id,
      recipeName: selectedRecipe.name,
      packageId: selectedPackage.id,
      packageName: selectedPackage.name,
      productionDate: batchForm.productionDate,
      lotNumber: batchForm.lotNumber.trim(),
      jarCount: toNumber(batchForm.jarCount),
      jarSizeOz: toNumber(selectedPackage.jarSizeOz),
      ph: batchForm.ph === "" ? "" : toNumber(batchForm.ph),
      targetPh: selectedRecipe.targetPh || "",
      processMethod: batchForm.processMethod,
      bestByDate: batchForm.bestByDate,
      notes: batchForm.notes.trim(),
      brineSummary,
      estimatedBatchCost: batchCostEstimate,
      estimatedCostPerJar: batchCostPerJar
    };

    try {
      await createPreservedBatch(user.uid, cleanBatch);
      showStatus("Batch logged.");
      setBatchForm(emptyBatch);
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not save batch.", "error");
    }
  }

  async function removeBatch(batchId) {
    if (!user) return;

    try {
      await deletePreservedBatch(user.uid, batchId);
      showStatus("Batch deleted.");
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not delete batch.", "error");
    }
  }

  async function addBatchToInventory() {
    if (!user || !selectedRecipe || !selectedPackage) {
      showStatus("Select a recipe and package before adding inventory.", "error");
      return;
    }

    const jarCount = toNumber(batchForm.jarCount);

    if (jarCount <= 0) {
      showStatus("Enter a finished jar count before adding inventory.", "error");
      return;
    }

    setSavingInventory(true);

    try {
      await addQuantityToMatchedInventoryItem({
        userId: user.uid,
        match: {
          recipeId: selectedRecipe.id,
          variantId: selectedPackage.id,
          sourceModule: "Preserved Foods"
        },
        itemDefaults: {
          name: `${selectedRecipe.name} - ${selectedPackage.name}`,
          category: "Finished Goods",
          sourceModule: "Preserved Foods",
          productId: `preserved-${selectedRecipe.id}`,
          productName: selectedRecipe.name,
          recipeId: selectedRecipe.id,
          recipeName: selectedRecipe.name,
          variantId: selectedPackage.id,
          variantName: selectedPackage.name,
          quantityOnHand: 0,
          unit: "jars",
          costPerUnit: batchCostPerJar || "",
          retailPrice: selectedPackage.retailPrice || "",
          wholesalePrice: selectedPackage.wholesalePrice || "",
          bestByDate: batchForm.bestByDate || "",
          status: "In Stock",
          notes: `Added from Preserved Foods. Lot: ${
            batchForm.lotNumber || "not recorded"
          }. pH: ${batchForm.ph || "not recorded"}.`
        },
        quantityToAdd: jarCount
      });

      showStatus("Finished jars added to inventory.");
    } catch (error) {
      console.error(error);
      showStatus("Could not add jars to inventory.", "error");
    } finally {
      setSavingInventory(false);
    }
  }

  if (!user) {
    return (
      <div className="preservedFoodsModule preservedFoodsPage modulePage">
        <ModuleHero
          eyebrow="Preserved Foods"
          title="Build recipes, brines, batches, and inventory for preserved products."
          description="Sign in to manage pickles, ferments, relishes, hot sauces, canned goods, jams, jellies, and other value-added preserved foods."
          accent="preserved"
          icon={FlaskConical}
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
    <div className="preservedFoodsModule preservedFoodsPage modulePage">
      {statusMessage ? (
        <div className={`floatingStatus ${statusType}`}>
          <span>ⓘ</span>
          <span>{statusMessage}</span>

          <button type="button" onClick={() => setStatusMessage("")}>
            ×
          </button>
        </div>
      ) : null}

      <ModuleHero
        eyebrow="Preserved Foods"
        title="Plan preserved products from recipe to finished inventory."
        description="Build recipes, calculate brines, log production batches, track pH and processing details, and add finished jars into inventory."
        accent="preserved"
        icon={FlaskConical}
        actions={[
          {
            label: "Guide",
            icon: HelpCircle,
            variant: "secondary",
            onClick: () => setShowGuide(true)
          }
        ]}
      />

      <section className="hubStatGrid preservedFoodsStatGrid">
        <StatCard
          icon={Beaker}
          label="Ingredients"
          value={loading ? "..." : dashboardSummary.ingredients}
          sub={`${dashboardSummary.preservedIngredients} pantry, ${dashboardSummary.sharedSpiceIngredients} shared spices`}
          accent="preserved"
        />

        <StatCard
          icon={BookOpen}
          label="Recipes"
          value={loading ? "..." : dashboardSummary.recipes}
          sub="Saved formulas"
          accent="spice"
        />

        <StatCard
          icon={ClipboardCheck}
          label="Batches"
          value={loading ? "..." : dashboardSummary.batches}
          sub="Production records"
          accent="market"
        />

        <StatCard
          icon={PackageCheck}
          label="Finished Jars"
          value={loading ? "..." : dashboardSummary.finishedJars}
          sub={
            dashboardSummary.averagePh
              ? `Avg pH ${round(dashboardSummary.averagePh, 2)}`
              : "Logged yield"
          }
          accent="pricing"
        />
      </section>

      <section className="toolGrid compactToolGrid">
        <a className="toolCard compactToolCard clickableToolCard" href="#preserved-pantry">
          <Library size={20} />
          <h3>Ingredient Pantry</h3>
          <p>Save preserved-specific ingredients, jars, lids, labels, costs, suppliers, and notes.</p>
        </a>

        <a className="toolCard compactToolCard clickableToolCard" href="#preserved-recipes">
          <FlaskConical size={20} />
          <h3>Recipe Builder</h3>
          <p>Create preserved food formulas using this pantry and shared Spice Kitchen ingredients.</p>
        </a>

        <a className="toolCard compactToolCard clickableToolCard" href="#preserved-brine">
          <Calculator size={20} />
          <h3>Brine Calculator</h3>
          <p>Calculate brine, vinegar, water, salt, sugar, yield, and cost.</p>
        </a>

        <a className="toolCard compactToolCard clickableToolCard" href="#preserved-library">
          <BookOpen size={20} />
          <h3>Recipe Library</h3>
          <p>Review, expand, edit, and manage saved preserved food recipes.</p>
        </a>
      </section>

      <section className="preservedFoodsLayout">
        <div className="preservedFoodsLeftStack">
          <section className="workspacePanel compactPanel scrollAnchor" id="preserved-pantry">
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Pantry</p>
                <h3>Ingredient Pantry</h3>
              </div>
            </div>

            <form className="formGrid compactFormGrid" onSubmit={saveIngredient}>
              <label>
                Ingredient Name *
                <input
                  value={ingredientForm.name}
                  onChange={(event) => updateIngredientField("name", event.target.value)}
                  placeholder="e.g., Cucumbers"
                />
              </label>

              <label>
                Category
                <select
                  value={ingredientForm.category}
                  onChange={(event) => updateIngredientField("category", event.target.value)}
                >
                  {ingredientCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label>
                Supplier / Source
                <input
                  value={ingredientForm.supplier}
                  onChange={(event) => updateIngredientField("supplier", event.target.value)}
                  placeholder="Farm, vendor, store, distributor"
                />
              </label>

              <label>
                Cost
                <input
                  type="number"
                  step="0.01"
                  value={ingredientForm.cost}
                  onChange={(event) => updateIngredientField("cost", event.target.value)}
                  onBlur={(event) =>
                    updateIngredientField("cost", cleanCurrency(event.target.value))
                  }
                  placeholder="0.00"
                />
              </label>

              <label>
                Cost Unit
                <select
                  value={ingredientForm.costUnit}
                  onChange={(event) => updateIngredientField("costUnit", event.target.value)}
                >
                  {costUnits.map((unit) => (
                    <option key={unit}>{unit}</option>
                  ))}
                </select>
              </label>

              <label className="fullSpan">
                Notes
                <textarea
                  value={ingredientForm.notes}
                  onChange={(event) => updateIngredientField("notes", event.target.value)}
                  placeholder="Optional sourcing, quality, or prep notes..."
                />
              </label>

              <div className="formActions fullSpan">
                <button className="primaryButton compactPrimary" type="submit">
                  <Save size={15} />
                  {editingIngredientId ? "Update Ingredient" : "Save Ingredient"}
                </button>

                {editingIngredientId ? (
                  <button
                    className="secondaryButton compactButton"
                    type="button"
                    onClick={() => {
                      setEditingIngredientId(null);
                      setIngredientForm(emptyIngredient);
                    }}
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className="savedList compactSavedList preservedIngredientList">
              {ingredients.length ? (
                ingredients.map((ingredient) => (
                  <div className="savedItem compactSavedItem" key={ingredient.id}>
                    <div>
                      <h4>{ingredient.name}</h4>
                      <p>
                        {ingredient.category} •{" "}
                        {ingredient.cost
                          ? `${formatCurrency(ingredient.cost)} / ${ingredient.costUnit}`
                          : "No cost"}
                      </p>
                    </div>

                    <div className="itemActions">
                      <button type="button" onClick={() => editIngredient(ingredient)}>
                        <Edit3 size={14} />
                      </button>
                      <button type="button" onClick={() => removeIngredient(ingredient.id)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="permitEmptyState">No preserved-specific ingredients yet.</div>
              )}
            </div>
          </section>

          <section className="workspacePanel compactPanel scrollAnchor" id="preserved-brine">
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Calculator</p>
                <h3>Brine Calculator</h3>
              </div>

              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={addBatchToInventory}
                disabled={savingInventory}
              >
                <PackageCheck size={15} />
                {savingInventory ? "Adding..." : "Add to Inventory"}
              </button>
            </div>

            <form className="formGrid compactFormGrid" onSubmit={saveBatch}>
              <label>
                Recipe
                <select
                  value={batchForm.recipeId}
                  onChange={(event) => updateBatchField("recipeId", event.target.value)}
                >
                  <option value="">Choose recipe...</option>
                  {recipes.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Package
                <select
                  value={batchForm.packageId}
                  onChange={(event) => updateBatchField("packageId", event.target.value)}
                  disabled={!selectedRecipe}
                >
                  <option value="">Choose package...</option>
                  {(selectedRecipe?.packages || []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.jarSizeOz} oz)
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Finished Jars *
                <input
                  type="number"
                  step="1"
                  value={batchForm.jarCount}
                  onChange={(event) => updateBatchField("jarCount", event.target.value)}
                  placeholder="24"
                />
              </label>

              <label>
                Production Date *
                <input
                  type="date"
                  value={batchForm.productionDate}
                  onChange={(event) => updateBatchField("productionDate", event.target.value)}
                />
              </label>

              <label>
                Lot Number
                <input
                  value={batchForm.lotNumber}
                  onChange={(event) => updateBatchField("lotNumber", event.target.value)}
                  placeholder="PF-2026-001"
                />
              </label>

              <label>
                Measured pH
                <input
                  type="number"
                  step="0.01"
                  value={batchForm.ph}
                  onChange={(event) => updateBatchField("ph", event.target.value)}
                  placeholder="3.8"
                />
              </label>

              <label>
                Process Method
                <select
                  value={batchForm.processMethod}
                  onChange={(event) => updateBatchField("processMethod", event.target.value)}
                >
                  {processMethods.map((method) => (
                    <option key={method}>{method}</option>
                  ))}
                </select>
              </label>

              <label>
                Best By Date
                <input
                  type="date"
                  value={batchForm.bestByDate}
                  onChange={(event) => updateBatchField("bestByDate", event.target.value)}
                />
              </label>

              <label className="fullSpan">
                Batch Notes
                <textarea
                  value={batchForm.notes}
                  onChange={(event) => updateBatchField("notes", event.target.value)}
                  placeholder="Processing notes, deviations, texture, flavor, pH notes, etc."
                />
              </label>

              <div className="batchTotals fullSpan preservedBrineTotals">
                <div>
                  <span>Total Fill</span>
                  <h4>{round(brineSummary.totalFillOz)} oz</h4>
                </div>

                <div>
                  <span>Brine Needed</span>
                  <h4>{round(brineSummary.brineOz)} oz</h4>
                </div>

                <div>
                  <span>Vinegar</span>
                  <h4>{round(brineSummary.vinegarOz)} oz</h4>
                </div>

                <div>
                  <span>Water</span>
                  <h4>{round(brineSummary.waterOz)} oz</h4>
                </div>

                <div>
                  <span>Salt</span>
                  <h4>{round(brineSummary.saltOz)} oz</h4>
                </div>

                <div>
                  <span>Sugar</span>
                  <h4>{round(brineSummary.sugarOz)} oz</h4>
                </div>
              </div>

              <div className="batchTotals fullSpan preservedBrineTotals">
                <div>
                  <span>Batch Cost</span>
                  <h4>{formatCurrency(batchCostEstimate)}</h4>
                </div>

                <div>
                  <span>Cost / Jar</span>
                  <h4>{formatCurrency(batchCostPerJar)}</h4>
                </div>

                <div>
                  <span>Target pH</span>
                  <h4>{selectedRecipe?.targetPh || "N/A"}</h4>
                </div>
              </div>

              <div className="formActions fullSpan">
                <button className="primaryButton compactPrimary" type="submit">
                  <Save size={15} />
                  Save Batch Log
                </button>
              </div>
            </form>
          </section>
        </div>

        <div className="preservedFoodsRightStack">
          <section className="workspacePanel compactPanel scrollAnchor" id="preserved-recipes">
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Builder</p>
                <h3>Recipe Builder</h3>
              </div>
            </div>

            <form className="formGrid compactFormGrid" onSubmit={saveRecipe}>
              <label>
                Recipe Name *
                <input
                  value={recipeForm.name}
                  onChange={(event) => updateRecipeField("name", event.target.value)}
                  placeholder="e.g., Dill Pickle Spears"
                />
              </label>

              <label>
                Type
                <select
                  value={recipeForm.type}
                  onChange={(event) => updateRecipeField("type", event.target.value)}
                >
                  {recipeTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label>
                Brine % of Jar Fill
                <input
                  type="number"
                  step="0.1"
                  value={recipeForm.brinePercent}
                  onChange={(event) => updateRecipeField("brinePercent", event.target.value)}
                />
              </label>

              <label>
                Vinegar % of Brine
                <input
                  type="number"
                  step="0.1"
                  value={recipeForm.vinegarPercent}
                  onChange={(event) => updateRecipeField("vinegarPercent", event.target.value)}
                />
              </label>

              <label>
                Salt %
                <input
                  type="number"
                  step="0.1"
                  value={recipeForm.saltPercent}
                  onChange={(event) => updateRecipeField("saltPercent", event.target.value)}
                />
              </label>

              <label>
                Sugar %
                <input
                  type="number"
                  step="0.1"
                  value={recipeForm.sugarPercent}
                  onChange={(event) => updateRecipeField("sugarPercent", event.target.value)}
                />
              </label>

              <label>
                Target pH
                <input
                  type="number"
                  step="0.01"
                  value={recipeForm.targetPh}
                  onChange={(event) => updateRecipeField("targetPh", event.target.value)}
                />
              </label>

              <label>
                Process Method
                <select
                  value={recipeForm.processMethod}
                  onChange={(event) => updateRecipeField("processMethod", event.target.value)}
                >
                  {processMethods.map((method) => (
                    <option key={method}>{method}</option>
                  ))}
                </select>
              </label>

              <label className="fullSpan">
                Description
                <textarea
                  value={recipeForm.description}
                  onChange={(event) => updateRecipeField("description", event.target.value)}
                  placeholder="Flavor notes, process notes, safety reminders, or product positioning..."
                />
              </label>

              <div className="preservedSubPanel fullSpan">
                <div className="recipeLineHeader">
                  <div>
                    <p className="eyebrow">Formula</p>
                    <h4>Recipe Ingredients</h4>
                  </div>

                  <button
                    className="secondaryButton compactButton"
                    type="button"
                    onClick={addRecipeIngredient}
                  >
                    <Plus size={15} />
                    Add Ingredient
                  </button>
                </div>

                <div className="preservedRecipeLineHeader">
                  <span>Ingredient</span>
                  <span>Amount</span>
                  <span>Unit</span>
                  <span>Role</span>
                  <span />
                </div>

                {(recipeForm.ingredients || []).map((line, index) => (
                  <div className="preservedRecipeLine" key={`${line.ingredientId}-${index}`}>
                    <select
                      value={line.ingredientId}
                      onChange={(event) =>
                        updateRecipeIngredient(index, "ingredientId", event.target.value)
                      }
                    >
                      <option value="">Choose ingredient...</option>

                      <optgroup label="Preserved Foods Pantry">
                        {availableRecipeIngredients
                          .filter(
                            (ingredient) =>
                              ingredient.pantrySource === "Preserved Foods"
                          )
                          .map((ingredient) => (
                            <option key={ingredient.optionId} value={ingredient.optionId}>
                              {ingredient.name}
                            </option>
                          ))}
                      </optgroup>

                      <optgroup label="Spice Kitchen Ingredients">
                        {availableRecipeIngredients
                          .filter(
                            (ingredient) =>
                              ingredient.pantrySource === "Spice Kitchen"
                          )
                          .map((ingredient) => (
                            <option key={ingredient.optionId} value={ingredient.optionId}>
                              {ingredient.name}
                            </option>
                          ))}
                      </optgroup>
                    </select>

                    <input
                      type="number"
                      step="0.01"
                      value={line.amount}
                      onChange={(event) =>
                        updateRecipeIngredient(index, "amount", event.target.value)
                      }
                      placeholder="0"
                    />

                    <select
                      value={line.unit}
                      onChange={(event) =>
                        updateRecipeIngredient(index, "unit", event.target.value)
                      }
                    >
                      {["oz", "lb", "g", "each", "jar"].map((unit) => (
                        <option key={unit}>{unit}</option>
                      ))}
                    </select>

                    <input
                      value={line.role}
                      onChange={(event) =>
                        updateRecipeIngredient(index, "role", event.target.value)
                      }
                      placeholder="Produce, brine, spice..."
                    />

                    <button
                      className="iconButton"
                      type="button"
                      onClick={() => removeRecipeIngredient(index)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                {recipeForm.ingredients?.length ? null : (
                  <div className="permitEmptyState">
                    No recipe ingredients added yet. You can use preserved pantry items or Spice Kitchen ingredients.
                  </div>
                )}
              </div>

              <div className="preservedSubPanel fullSpan">
                <div className="recipeLineHeader">
                  <div>
                    <p className="eyebrow">Product Setup</p>
                    <h4>Jar / Package Sizes</h4>
                  </div>

                  <button
                    className="secondaryButton compactButton"
                    type="button"
                    onClick={addPackage}
                  >
                    <Plus size={15} />
                    Add Package
                  </button>
                </div>

                <div className="preservedPackageHeader">
                  <span>Name</span>
                  <span>Jar Size</span>
                  <span>Retail</span>
                  <span>Wholesale</span>
                  <span>Pkg Cost</span>
                  <span />
                </div>

                {(recipeForm.packages || []).map((item, index) => (
                  <div className="preservedPackageLine" key={item.id || index}>
                    <input
                      value={item.name}
                      onChange={(event) => updatePackage(index, "name", event.target.value)}
                      placeholder="16 oz jar"
                    />

                    <input
                      type="number"
                      step="0.01"
                      value={item.jarSizeOz}
                      onChange={(event) => updatePackage(index, "jarSizeOz", event.target.value)}
                      placeholder="16"
                    />

                    <input
                      type="number"
                      step="0.01"
                      value={item.retailPrice}
                      onChange={(event) => updatePackage(index, "retailPrice", event.target.value)}
                      placeholder="0.00"
                    />

                    <input
                      type="number"
                      step="0.01"
                      value={item.wholesalePrice}
                      onChange={(event) => updatePackage(index, "wholesalePrice", event.target.value)}
                      placeholder="0.00"
                    />

                    <input
                      type="number"
                      step="0.01"
                      value={item.packagingCost}
                      onChange={(event) => updatePackage(index, "packagingCost", event.target.value)}
                      placeholder="0.00"
                    />

                    <button
                      className="iconButton"
                      type="button"
                      onClick={() => removePackage(index)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                {recipeForm.packages?.length ? null : (
                  <div className="permitEmptyState">No package sizes added yet.</div>
                )}
              </div>

              <div className="batchTotals fullSpan preservedRecipeCostPreview">
                <div>
                  <span>Estimated Recipe Cost</span>
                  <h4>{formatCurrency(recipeCost)}</h4>
                </div>

                <div>
                  <span>Formula Lines</span>
                  <h4>{recipeForm.ingredients?.length || 0}</h4>
                </div>

                <div>
                  <span>Package Sizes</span>
                  <h4>{recipeForm.packages?.length || 0}</h4>
                </div>
              </div>

              <div className="formActions fullSpan">
                <button
                  className={`primaryButton compactPrimary ${
                    hasUnsavedChanges ? "dirtySaveButton" : ""
                  }`}
                  type="submit"
                >
                  <Save size={15} />
                  {editingRecipeId ? "Update Recipe" : "Save Recipe"}
                </button>

                {editingRecipeId ? (
                  <button
                    className="secondaryButton compactButton"
                    type="button"
                    onClick={() => {
                      setEditingRecipeId(null);
                      setRecipeForm(emptyRecipe);
                    }}
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section
            className="workspacePanel compactPanel scrollAnchor spiceLibraryPanel"
            id="preserved-library"
          >
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Saved Recipes</p>
                <h3>Recipe Library</h3>
              </div>

              <div className="recipeLibraryHeaderTools">
                <div className="searchBox compactSearch">
                  <Search size={16} />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search recipes..."
                  />
                </div>
              </div>
            </div>

            <div className="recipeLibrary compactSavedList spiceRecipeLibraryTall">
              {filteredRecipes.length ? (
                filteredRecipes.map((recipe) => {
                  const isExpanded = expandedRecipeId === recipe.id;
                  const formulaCost = calculateRecipeCost(
                    recipe,
                    availableRecipeIngredients
                  );
                  const sortedIngredients = [...(recipe.ingredients || [])].sort(
                    (a, b) => String(a.ingredientName || "").localeCompare(
                      String(b.ingredientName || "")
                    )
                  );

                  return (
                    <div
                      className={isExpanded ? "savedItemBlock expanded" : "savedItemBlock"}
                      key={recipe.id}
                    >
                      <div className="savedItem recipeItem compactSavedItem expandableSavedItem">
                        <div>
                          <h4 className="recipeTitleWithCost">
                            <button
                              type="button"
                              className="savedItemLink"
                              onClick={() => editRecipe(recipe)}
                            >
                              {recipe.name}
                            </button>

                            <span className="recipeQuickCostBadge">
                              {formatCurrency(formulaCost)} recipe cost
                            </span>
                          </h4>

                          <p>
                            {recipe.type} • {recipe.ingredients?.length || 0} ingredients
                            {recipe.packages?.length
                              ? ` • ${recipe.packages.length} package sizes`
                              : ""}
                            {recipe.targetPh ? ` • Target pH ${recipe.targetPh}` : ""}
                          </p>
                        </div>

                        <div className="itemActions">
                          <button
                            type="button"
                            className="iconButton"
                            aria-label={
                              isExpanded
                                ? "Collapse recipe details"
                                : "Expand recipe details"
                            }
                            onClick={() =>
                              setExpandedRecipeId(isExpanded ? null : recipe.id)
                            }
                          >
                            {isExpanded ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </button>

                          <button type="button" onClick={() => editRecipe(recipe)}>
                            <Edit3 size={14} />
                          </button>

                          <button type="button" onClick={() => removeRecipe(recipe.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {isExpanded ? (
                        <div className="spiceDetailPanel recipeDetailPanel">
                          <div>
                            <strong>Type</strong>
                            <span>{recipe.type || "Other"}</span>
                          </div>

                          <div>
                            <strong>Total Ingredients</strong>
                            <span>{recipe.ingredients?.length || 0}</span>
                          </div>

                          <div>
                            <strong>Formula Cost</strong>
                            <span>{formatCurrency(formulaCost)}</span>
                          </div>

                          <div>
                            <strong>Process Method</strong>
                            <span>{recipe.processMethod || "Not listed"}</span>
                          </div>

                          <div>
                            <strong>Brine %</strong>
                            <span>{recipe.brinePercent || 0}% of jar fill</span>
                          </div>

                          <div>
                            <strong>Vinegar %</strong>
                            <span>{recipe.vinegarPercent || 0}% of brine</span>
                          </div>

                          <div>
                            <strong>Salt %</strong>
                            <span>{recipe.saltPercent || 0}%</span>
                          </div>

                          <div>
                            <strong>Target pH</strong>
                            <span>{recipe.targetPh || "Not listed"}</span>
                          </div>

                          <div className="fullSpan">
                            <strong>Description / Notes</strong>
                            <span>{recipe.description || "No notes saved."}</span>
                          </div>

                          <div className="fullSpan recipePartsList">
                            <strong>Package Sizes</strong>

                            {recipe.packages?.length ? (
                              recipe.packages.map((item) => (
                                <div
                                  className="recipePartsRow"
                                  key={`${recipe.id}-${item.id}`}
                                >
                                  <span>{item.name}</span>
                                  <span>
                                    {item.jarSizeOz} oz
                                    {item.retailPrice
                                      ? ` • ${formatCurrency(item.retailPrice)} retail`
                                      : ""}
                                    {item.wholesalePrice
                                      ? ` • ${formatCurrency(item.wholesalePrice)} wholesale`
                                      : ""}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span>No package sizes saved.</span>
                            )}
                          </div>

                          <div className="fullSpan recipePartsList">
                            <strong>Ingredients</strong>

                            {sortedIngredients.length ? (
                              sortedIngredients.map((line, index) => (
                                <div
                                  className="recipePartsRow"
                                  key={`${line.ingredientId}-${index}`}
                                >
                                  <span>
                                    {getIngredientLabel(line, availableRecipeIngredients)}
                                    {line.pantrySource ? ` • ${line.pantrySource}` : ""}
                                  </span>

                                  <span>
                                    {line.amount} {line.unit}
                                    {line.role ? ` • ${line.role}` : ""}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span>No ingredients saved.</span>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="placeholderBox compactPlaceholder">
                  No recipes saved yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </section>

      <section className="workspacePanel compactPanel scrollAnchor preservedBatchLogPanel" id="preserved-batches">
        <div className="workspaceHeader compactPanelHeader">
          <div>
            <p className="eyebrow">Batch Records</p>
            <h3>Batch Log</h3>
          </div>
        </div>

        <div className="savedList compactSavedList preservedBatchList">
          {batches.length ? (
            batches.map((batch) => (
              <div className="savedItem compactSavedItem" key={batch.id}>
                <div>
                  <h4>{batch.recipeName}</h4>
                  <p>
                    {batch.productionDate || "No date"} • {batch.jarCount || 0} jars
                    {batch.ph ? ` • pH ${batch.ph}` : ""}{" "}
                    {batch.lotNumber ? `• Lot ${batch.lotNumber}` : ""}
                  </p>
                </div>

                <div className="itemActions">
                  <button type="button" onClick={() => removeBatch(batch.id)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="permitEmptyState">No batches logged yet.</div>
          )}
        </div>
      </section>

      <ModuleGuideModal
        isOpen={showGuide}
        moduleKey="preservedFoods"
        title="Preserved Foods Guide"
        onClose={() => setShowGuide(false)}
      >
        <PreservedFoodsGuideContent />
      </ModuleGuideModal>
    </div>
  );
}
