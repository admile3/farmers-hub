import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUp,
  Beaker,
  BookOpen,
  Calculator,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Edit3,
  Library,
  PackageCheck,
  Plus,
  Save,
  Search,
  Scale,
  Trash2,
  X
} from "lucide-react";
import { useAuth } from "../AuthContext.jsx";
import { useUnsavedChanges } from "../UnsavedChangesContext.jsx";
import StatCard from "../components/StatCard.jsx";
import { addQuantityToMatchedInventoryItem } from "../services/inventoryService.js";
import {
  createSpiceIngredient,
  createSpiceRecipe,
  deleteSpiceIngredient,
  deleteSpiceRecipe,
  getSpiceIngredients,
  getSpiceRecipes,
  updateSpiceIngredient,
  updateSpiceRecipe
} from "../services/spiceKitchenService.js";

const ingredientCategories = [
  "Herb",
  "Chili",
  "Salt",
  "Sugar",
  "Powder",
  "Citrus",
  "Seed",
  "Spice",
  "Pepper",
  "Other"
];

const recipeCategories = [
  "Farmer's Market",
  "Restaurant/Wholesale",
  "DTC/Online",
  "Catering",
  "Test Batch",
  "House Blend",
  "Other"
];

const emptyIngredient = {
  name: "",
  category: "Other",
  supplier: "",
  cost: "",
  costUnit: "oz",
  notes: ""
};

const emptyRecipe = {
  name: "",
  category: "House Blend",
  notes: "",
  listInProductDirectory: false,
  productPackages: [],
  ingredients: []
};

function createBlankRecipeLine() {
  return {
    ingredientId: "",
    ingredientName: "",
    parts: ""
  };
}

function createBlankProductPackage() {
  return {
    name: "",
    size: "",
    unit: "oz"
  };
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value, places = 2) {
  return Number(value || 0).toFixed(places);
}

function formatCurrency(value) {
  if (value === "" || value === null || value === undefined) return "";
  return toNumber(value).toFixed(2);
}

function cleanCurrencyInput(value) {
  if (value === "" || value === null || value === undefined) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "";
}

function formatParts(value) {
  const number = toNumber(value);
  return Number(number.toFixed(2)).toString();
}

function ouncesToGrams(ounces) {
  return ounces * 28.3495;
}

function poundsToGrams(pounds) {
  return ouncesToGrams(pounds * 16);
}

function gramsToOunces(grams) {
  return grams / 28.3495;
}

function convertAmountToOunces(amount, unit) {
  const number = toNumber(amount);

  if (unit === "oz") return number;
  if (unit === "g") return gramsToOunces(number);
  if (unit === "lb") return number * 16;

  return number;
}

function formatLibraryCostLabel(cost, amount, unit) {
  const cleanAmount = toNumber(amount);
  const amountLabel = cleanAmount === 1 ? unit : `${formatParts(cleanAmount)} ${unit}`;

  return `$${round(cost, 2)} / ${amountLabel}`;
}

function getIngredientCostPerOunce(ingredient) {
  if (!ingredient?.cost) return 0;

  const cost = toNumber(ingredient.cost);

  if (ingredient.costUnit === "oz") return cost;
  if (ingredient.costUnit === "g") return cost * 28.3495;
  if (ingredient.costUnit === "lb") return cost / 16;

  return 0;
}

function convertPackageSizeToOunces(size, unit) {
  const amount = toNumber(size);

  if (unit === "oz") return amount;
  if (unit === "g") return gramsToOunces(amount);
  if (unit === "lb") return amount * 16;

  return amount;
}

function getPackageDisplayName(packageItem, index) {
  const sizeLabel = packageItem?.size
    ? `${Number(toNumber(packageItem.size).toFixed(3)).toString()} ${packageItem.unit || ""}`.trim()
    : "";

  return packageItem?.name || sizeLabel || `Package ${index + 1}`;
}

export default function SpiceKitchen() {
  const { user, loginWithGoogle } = useAuth();
  const { isDirty: hasUnsavedChanges, markUnsaved, markSaved } = useUnsavedChanges();

  const builderRef = useRef(null);
  const calculatorRef = useRef(null);
  const pantryRef = useRef(null);
  const libraryRef = useRef(null);

  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [ingredientForm, setIngredientForm] = useState(emptyIngredient);
  const [editingIngredientId, setEditingIngredientId] = useState(null);
  const [expandedIngredientId, setExpandedIngredientId] = useState(null);
  const [recipeForm, setRecipeForm] = useState(emptyRecipe);
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetUnit, setTargetUnit] = useState("oz");
  const [overagePercent, setOveragePercent] = useState("");
  const [libraryCostAmount, setLibraryCostAmount] = useState("1");
  const [libraryCostUnit, setLibraryCostUnit] = useState("oz");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickIngredient, setQuickIngredient] = useState(emptyIngredient);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [inventoryAllocations, setInventoryAllocations] = useState({});
  const [savingInventory, setSavingInventory] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  function markSpiceDirty() {
    markUnsaved({
      source: "Spice Kitchen",
      onSave: savePendingSpiceChanges
    });
  }

  function formHasValues(form) {
    if (!form) return false;

    return Object.values(form).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "boolean") return value;
      return String(value || "").trim() !== "";
    });
  }

  async function savePendingSpiceChanges() {
    if (!user) return;

    if (formHasValues(quickIngredient) && quickAddOpen) {
      await quickAddIngredient();
      return;
    }

    if (editingIngredientId || formHasValues(ingredientForm)) {
      await saveIngredient();
      return;
    }

    if (editingRecipeId || formHasValues(recipeForm)) {
      await saveRecipe();
      return;
    }

    markSaved();
  }

  function clearIngredientDraft() {
    setIngredientForm(emptyIngredient);
    setEditingIngredientId(null);
    markSaved();
  }

  function clearRecipeDraft() {
    setRecipeForm(emptyRecipe);
    setEditingRecipeId(null);
    markSaved();
  }

  function showStatus(message, type = "info") {
    setStatusMessage(message);
    setStatusType(type);
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

    const timer = window.setTimeout(() => {
      setStatusMessage("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  async function loadData() {
    if (!user) return;

    setLoading(true);

    try {
      const [loadedIngredients, loadedRecipes] = await Promise.all([
        getSpiceIngredients(user.uid),
        getSpiceRecipes(user.uid)
      ]);

      setIngredients(loadedIngredients);
      setRecipes(loadedRecipes);
    } catch (error) {
      console.error(error);
      showStatus("Could not load Spice Kitchen data.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setIngredients([]);
      setRecipes([]);
    }
  }, [user]);

  const filteredIngredients = useMemo(() => {
    const search = ingredientSearch.trim().toLowerCase();

    if (!search) return ingredients;

    return ingredients.filter((ingredient) => {
      return (
        ingredient.name?.toLowerCase().includes(search) ||
        ingredient.category?.toLowerCase().includes(search) ||
        ingredient.supplier?.toLowerCase().includes(search)
      );
    });
  }, [ingredients, ingredientSearch]);

  const selectedRecipe = useMemo(() => {
    return recipes.find((recipe) => recipe.id === selectedRecipeId) || null;
  }, [recipes, selectedRecipeId]);

  const recipeCostSummary = useMemo(() => {
    const validLines = recipeForm.ingredients.filter(
      (item) => item.ingredientId && toNumber(item.parts) > 0
    );

    const totalParts = validLines.reduce(
      (sum, item) => sum + toNumber(item.parts),
      0
    );

    if (!totalParts) {
      return {
        costPerOunce: 0,
        productPackages: []
      };
    }

    const costPerOunce = validLines.reduce((sum, item) => {
      const ingredient = ingredients.find((saved) => saved.id === item.ingredientId);
      const share = toNumber(item.parts) / totalParts;
      const ingredientCostPerOunce = getIngredientCostPerOunce(ingredient);

      return sum + share * ingredientCostPerOunce;
    }, 0);

    const productPackages = recipeForm.productPackages.map((item) => {
      const packageOunces = convertPackageSizeToOunces(item.size, item.unit);
      const ingredientCost = packageOunces * costPerOunce;

      return {
        ...item,
        packageOunces,
        ingredientCost
      };
    });

    return {
      costPerOunce,
      productPackages
    };
  }, [recipeForm.ingredients, recipeForm.productPackages, ingredients]);

  const batchRows = useMemo(() => {
    if (!selectedRecipe || !selectedRecipe.ingredients?.length) return [];

    const targetGrams =
      targetUnit === "oz"
        ? ouncesToGrams(toNumber(targetAmount))
        : targetUnit === "lb"
          ? poundsToGrams(toNumber(targetAmount))
          : toNumber(targetAmount);

    const adjustedTargetGrams =
      targetGrams * (1 + toNumber(overagePercent) / 100);

    const totalParts = selectedRecipe.ingredients.reduce(
      (sum, item) => sum + toNumber(item.parts),
      0
    );

    if (!targetGrams || !totalParts) return [];

    return selectedRecipe.ingredients.map((item) => {
      const ingredient = ingredients.find((saved) => saved.id === item.ingredientId);
      const grams = (toNumber(item.parts) / totalParts) * adjustedTargetGrams;
      const ounces = gramsToOunces(grams);
      const estimatedCost = ounces * getIngredientCostPerOunce(ingredient);

      return {
        ingredientId: item.ingredientId || ingredient?.id || "",
        name: item.ingredientName || ingredient?.name || "Unknown ingredient",
        parts: toNumber(item.parts),
        grams,
        ounces,
        estimatedCost
      };
    });
  }, [selectedRecipe, ingredients, targetAmount, targetUnit, overagePercent]);

  const batchTotals = useMemo(() => {
    const grams = batchRows.reduce((sum, row) => sum + row.grams, 0);
    const ounces = gramsToOunces(grams);
    const cost = batchRows.reduce((sum, row) => sum + row.estimatedCost, 0);

    return { grams, ounces, cost };
  }, [batchRows]);

  const inventoryPackages = useMemo(() => {
    return Array.isArray(selectedRecipe?.productPackages)
      ? selectedRecipe.productPackages
          .map((packageItem, index) => {
            const packageOunces =
              Number(packageItem.packageOunces) ||
              convertPackageSizeToOunces(packageItem.size, packageItem.unit);

            return {
              ...packageItem,
              index,
              id: `spice-${selectedRecipe.id}-variant-${index}`,
              displayName: getPackageDisplayName(packageItem, index),
              packageOunces
            };
          })
          .filter((packageItem) => packageItem.packageOunces > 0)
      : [];
  }, [selectedRecipe]);

  const allocatedInventoryOunces = useMemo(() => {
    return inventoryPackages.reduce((sum, packageItem) => {
      const quantity = toNumber(inventoryAllocations[packageItem.id]);
      return sum + quantity * packageItem.packageOunces;
    }, 0);
  }, [inventoryPackages, inventoryAllocations]);

  const remainingInventoryOunces = batchTotals.ounces - allocatedInventoryOunces;

  const spiceSummary = useMemo(() => {
    const recipeIngredientCount = recipes.reduce(
      (sum, recipe) => sum + (recipe.ingredients?.length || 0),
      0
    );

    const productReadyCount = recipes.filter(
      (recipe) => recipe.listInProductDirectory
    ).length;

    return {
      ingredients: ingredients.length,
      recipes: recipes.length,
      recipeIngredientCount,
      selectedBatchRows: batchRows.length,
      productReadyCount
    };
  }, [ingredients, recipes, batchRows]);

  function updateIngredientField(field, value) {
    markSpiceDirty();
    setIngredientForm((current) => ({ ...current, [field]: value }));
  }

  function updateQuickIngredientField(field, value) {
    markSpiceDirty();
    setQuickIngredient((current) => ({ ...current, [field]: value }));
  }

  function updateRecipeField(field, value) {
    markSpiceDirty();
    setRecipeForm((current) => ({ ...current, [field]: value }));
  }

  async function saveIngredient(event) {
    event?.preventDefault?.();
    if (!user) return;

    const cleanIngredient = {
      name: ingredientForm.name.trim(),
      category: ingredientForm.category,
      supplier: ingredientForm.supplier.trim(),
      cost: cleanCurrencyInput(ingredientForm.cost),
      costUnit: ingredientForm.costUnit,
      notes: ingredientForm.notes.trim()
    };

    if (!cleanIngredient.name) {
      showStatus("Ingredient name is required.", "error");
      return;
    }

    try {
      if (editingIngredientId) {
        await updateSpiceIngredient(user.uid, editingIngredientId, cleanIngredient);
        showStatus("Ingredient updated.", "success");
      } else {
        await createSpiceIngredient(user.uid, cleanIngredient);
        showStatus("Ingredient saved.", "success");
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
      cost: cleanCurrencyInput(ingredient.cost),
      costUnit: ingredient.costUnit || "oz",
      notes: ingredient.notes || ""
    });
    scrollToSection(pantryRef);
  }

  function editIngredientById(ingredientId) {
    const ingredient = ingredients.find((item) => item.id === ingredientId);

    if (ingredient) {
      editIngredient(ingredient);
    }
  }

  async function removeIngredient(ingredientId) {
    if (!user) return;

    try {
      await deleteSpiceIngredient(user.uid, ingredientId);
      showStatus("Ingredient deleted.", "success");
      if (expandedIngredientId === ingredientId) setExpandedIngredientId(null);
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not delete ingredient.", "error");
    }
  }

  function addRecipeLine() {
    markSpiceDirty();
    setRecipeForm((current) => ({
      ...current,
      ingredients: [...current.ingredients, createBlankRecipeLine()]
    }));
  }

  function updateRecipeLine(index, field, value) {
    markSpiceDirty();
    setRecipeForm((current) => {
      const nextIngredients = [...current.ingredients];
      const nextLine = { ...nextIngredients[index], [field]: value };

      if (field === "ingredientId") {
        const ingredient = ingredients.find((item) => item.id === value);
        nextLine.ingredientName = ingredient?.name || "";
      }

      nextIngredients[index] = nextLine;

      return {
        ...current,
        ingredients: nextIngredients
      };
    });
  }

  function removeRecipeLine(index) {
    markSpiceDirty();
    setRecipeForm((current) => ({
      ...current,
      ingredients: current.ingredients.filter((_, lineIndex) => lineIndex !== index)
    }));
  }

  function addProductPackage() {
    markSpiceDirty();
    setRecipeForm((current) => ({
      ...current,
      productPackages: [...(current.productPackages || []), createBlankProductPackage()]
    }));
  }

  function updateProductPackage(index, field, value) {
    markSpiceDirty();
    setRecipeForm((current) => {
      const nextPackages = [...(current.productPackages || [])];
      nextPackages[index] = {
        ...nextPackages[index],
        [field]: value
      };

      return {
        ...current,
        productPackages: nextPackages
      };
    });
  }

  function removeProductPackage(index) {
    markSpiceDirty();
    setRecipeForm((current) => ({
      ...current,
      productPackages: (current.productPackages || []).filter(
        (_, packageIndex) => packageIndex !== index
      )
    }));
  }

  async function quickAddIngredient(event) {
    event?.preventDefault?.();
    if (!user) return;

    const cleanIngredient = {
      name: quickIngredient.name.trim(),
      category: quickIngredient.category,
      supplier: quickIngredient.supplier.trim(),
      cost: cleanCurrencyInput(quickIngredient.cost),
      costUnit: quickIngredient.costUnit,
      notes: quickIngredient.notes.trim()
    };

    if (!cleanIngredient.name) {
      showStatus("Quick add ingredient name is required.", "error");
      return;
    }

    try {
      const newId = await createSpiceIngredient(user.uid, cleanIngredient);
      const updatedIngredients = await getSpiceIngredients(user.uid);
      setIngredients(updatedIngredients);

      setRecipeForm((current) => ({
        ...current,
        ingredients: [
          ...current.ingredients,
          {
            ingredientId: newId,
            ingredientName: cleanIngredient.name,
            parts: ""
          }
        ]
      }));

      setQuickIngredient(emptyIngredient);
      setQuickAddOpen(false);
      markSaved();
      showStatus("Ingredient added to pantry and recipe.", "success");
    } catch (error) {
      console.error(error);
      showStatus("Could not quick add ingredient.", "error");
    }
  }

  async function saveRecipe(event) {
    event?.preventDefault?.();
    if (!user) return;

    const cleanRecipe = {
      name: recipeForm.name.trim(),
      category: recipeForm.category,
      notes: recipeForm.notes.trim(),
      listInProductDirectory: Boolean(recipeForm.listInProductDirectory),
      formulaCostPerOunce: recipeCostSummary.costPerOunce,
      productPackages: (recipeForm.productPackages || [])
        .filter((item) => item.name.trim() && toNumber(item.size) > 0)
        .map((item) => {
          const packageOunces = convertPackageSizeToOunces(item.size, item.unit);

          return {
            name: item.name.trim(),
            size: toNumber(item.size),
            unit: item.unit,
            packageOunces,
            ingredientCost: packageOunces * recipeCostSummary.costPerOunce
          };
        }),
      ingredients: recipeForm.ingredients
        .filter((item) => item.ingredientId && toNumber(item.parts) > 0)
        .map((item) => ({
          ingredientId: item.ingredientId,
          ingredientName: item.ingredientName,
          parts: toNumber(item.parts)
        }))
    };

    if (!cleanRecipe.name) {
      showStatus("Recipe name is required.", "error");
      return;
    }

    if (!cleanRecipe.ingredients.length) {
      showStatus("Add at least one ingredient with parts greater than 0.", "error");
      return;
    }

    if (cleanRecipe.listInProductDirectory && !cleanRecipe.productPackages.length) {
      showStatus("Add at least one product package size before listing this recipe.", "error");
      return;
    }

    try {
      if (editingRecipeId) {
        await updateSpiceRecipe(user.uid, editingRecipeId, cleanRecipe);
        showStatus("Recipe updated.", "success");
      } else {
        await createSpiceRecipe(user.uid, cleanRecipe);
        showStatus("Recipe saved.", "success");
      }

      setRecipeForm(emptyRecipe);
      setEditingRecipeId(null);
      markSaved();
      await loadData();
      scrollToSection(libraryRef);
    } catch (error) {
      console.error(error);
      showStatus("Could not save recipe.", "error");
    }
  }

  function editRecipe(recipe) {
    setEditingRecipeId(recipe.id);
    setRecipeForm({
      name: recipe.name || "",
      category: recipe.category || "House Blend",
      notes: recipe.notes || "",
      listInProductDirectory: Boolean(recipe.listInProductDirectory),
      productPackages: recipe.productPackages || [],
      ingredients: recipe.ingredients || []
    });
    scrollToSection(builderRef);
  }

  function editRecipeById(recipeId) {
    const recipe = recipes.find((item) => item.id === recipeId);

    if (recipe) {
      editRecipe(recipe);
    }
  }

  async function removeRecipe(recipeId) {
    if (!user) return;

    try {
      await deleteSpiceRecipe(user.uid, recipeId);
      showStatus("Recipe deleted.", "success");
      if (selectedRecipeId === recipeId) setSelectedRecipeId("");
      if (expandedRecipeId === recipeId) setExpandedRecipeId(null);
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not delete recipe.", "error");
    }
  }

  function openInventoryModal() {
    if (!selectedRecipe) {
      showStatus("Select a saved recipe first.", "error");
      return;
    }

    if (!batchRows.length || batchTotals.ounces <= 0) {
      showStatus("Enter a batch amount before adding inventory.", "error");
      return;
    }

    if (!selectedRecipe.listInProductDirectory || !inventoryPackages.length) {
      showStatus(
        "This recipe needs to be listed in the Product Directory with at least one package size before inventory can be added.",
        "error"
      );
      editRecipe(selectedRecipe);
      return;
    }

    const startingAllocations = inventoryPackages.reduce((next, packageItem) => {
      next[packageItem.id] = "";
      return next;
    }, {});

    setInventoryAllocations(startingAllocations);
    setInventoryModalOpen(true);
  }

  function updateInventoryAllocation(packageId, value) {
    setInventoryAllocations((current) => ({
      ...current,
      [packageId]: value
    }));
  }

  async function saveBatchToInventory() {
  if (!user || !selectedRecipe) return;

  const activeAllocations = inventoryPackages
    .map((packageItem) => ({
      packageItem,
      quantity: toNumber(inventoryAllocations[packageItem.id])
    }))
    .filter((item) => item.quantity > 0);

  if (remainingInventoryOunces < -0.01) {
    showStatus("You allocated more ounces than the batch produced.", "error");
    return;
  }

  setSavingInventory(true);

  try {
    const inventoryUpdates = activeAllocations.map(({ packageItem, quantity }) => {
      const costPerUnit =
        Number(packageItem.ingredientCost) ||
        packageItem.packageOunces * getRecipeFormulaCostPerOunce(selectedRecipe);

      return addQuantityToMatchedInventoryItem({
        userId: user.uid,
        match: {
          recipeId: selectedRecipe.id,
          variantId: packageItem.id,
          sourceModule: "Spice Kitchen"
        },
        itemDefaults: {
          name: `${selectedRecipe.name} - ${packageItem.displayName}`,
          category: "Finished Goods",
          sourceModule: "Spice Kitchen",
          productId: `spice-${selectedRecipe.id}`,
          productName: selectedRecipe.name || "",
          recipeId: selectedRecipe.id,
          recipeName: selectedRecipe.name || "",
          variantId: packageItem.id,
          variantName: packageItem.displayName,
          quantityOnHand: 0,
          unit: "packages",
          costPerUnit,
          status: "In Stock",
          notes: `Added from Spice Kitchen batch calculator. Package size: ${round(
            packageItem.packageOunces,
            3
          )} oz.`
        },
        quantityToAdd: quantity
      });
    });

    if (remainingInventoryOunces > 0.01) {
      inventoryUpdates.push(
        addQuantityToMatchedInventoryItem({
          userId: user.uid,
          match: {
            recipeId: selectedRecipe.id,
            variantId: `spice-${selectedRecipe.id}-unallocated-bulk`,
            sourceModule: "Spice Kitchen"
          },
          itemDefaults: {
            name: `${selectedRecipe.name} - Unallocated Bulk`,
            category: "Finished Goods",
            sourceModule: "Spice Kitchen",
            productId: `spice-${selectedRecipe.id}`,
            productName: selectedRecipe.name || "",
            recipeId: selectedRecipe.id,
            recipeName: selectedRecipe.name || "",
            variantId: `spice-${selectedRecipe.id}-unallocated-bulk`,
            variantName: "Unallocated Bulk",
            quantityOnHand: 0,
            unit: "oz",
            costPerUnit: getRecipeFormulaCostPerOunce(selectedRecipe),
            status: "In Stock",
            notes:
              "Unallocated finished seasoning saved from Spice Kitchen batch calculator."
          },
          quantityToAdd: Number(round(remainingInventoryOunces, 4))
        })
      );
    }

    await Promise.all(inventoryUpdates);

    setInventoryModalOpen(false);
    setInventoryAllocations({});
    showStatus("Batch added to inventory.", "success");
  } catch (error) {
    console.error(error);
    showStatus("Could not add batch to inventory.", "error");
  } finally {
    setSavingInventory(false);
  }
}

  function getIngredientName(line) {
    const ingredient = ingredients.find((item) => item.id === line.ingredientId);
    return line.ingredientName || ingredient?.name || "Unknown ingredient";
  }

  function getRecipeFormulaCostPerOunce(recipe) {
    if (typeof recipe.formulaCostPerOunce === "number") {
      return recipe.formulaCostPerOunce;
    }

    const validLines = (recipe.ingredients || []).filter(
      (item) => item.ingredientId && toNumber(item.parts) > 0
    );

    const totalParts = validLines.reduce(
      (sum, item) => sum + toNumber(item.parts),
      0
    );

    if (!totalParts) return 0;

    return validLines.reduce((sum, item) => {
      const ingredient = ingredients.find((saved) => saved.id === item.ingredientId);
      const share = toNumber(item.parts) / totalParts;

      return sum + share * getIngredientCostPerOunce(ingredient);
    }, 0);
  }

  const sectionCards = [
    {
      title: "Recipe Builder",
      description: "Create blends by parts using your saved pantry ingredients.",
      icon: Beaker,
      ref: builderRef
    },
    {
      title: "Batch Calculator",
      description: "Scale saved recipes to exact ounces, grams, and overage targets.",
      icon: Calculator,
      ref: calculatorRef
    },
    {
      title: "Ingredient Pantry",
      description: "Save ingredients, costs, suppliers, notes, and categories.",
      icon: Library,
      ref: pantryRef
    },
    {
      title: "Recipe Library",
      description: "Review, edit, and manage your saved seasoning recipes.",
      icon: BookOpen,
      ref: libraryRef
    }
  ];

  if (!user) {
    return (
      <div className="modulePage spicePage compactSpicePage">
        <section className="farmModuleHero spiceKitchenHero">
          <div className="farmModuleHeroText">
            <p className="eyebrow">Spice Kitchen</p>
            <h2>Sign in to build and save spice blends.</h2>
            <p>
              Your pantry, recipes, batch calculations, and production notes will be
              saved to your Farmers Hub account.
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
    <div className="modulePage spicePage compactSpicePage">
      <section className="farmModuleHero spiceKitchenHero">
        <div className="farmModuleHeroText">
          <p className="eyebrow">Spice Kitchen</p>
          <h2>Build, scale, and organize seasoning recipes.</h2>
          <p>
            Manage your ingredient pantry, create recipes by parts, quick-add
            ingredients while building a recipe, and calculate exact batch weights.
          </p>
        </div>
      </section>

      {statusMessage ? (
        <div className={`floatingStatus ${statusType}`}>
          <AlertCircle size={18} />
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage("")}>
            <X size={16} />
          </button>
        </div>
      ) : null}

      {loading ? <div className="floatingStatus info">Loading Spice Kitchen...</div> : null}

      <section className="hubStatGrid spiceStatGrid">
        <StatCard
          icon={Library}
          label="Ingredients"
          value={spiceSummary.ingredients}
          sub="Saved pantry items"
          accent="spice"
        />

        <StatCard
          icon={BookOpen}
          label="Recipes"
          value={spiceSummary.recipes}
          sub="Saved seasoning blends"
          accent="sourdough"
        />

        <StatCard
          icon={DollarSign}
          label="Product Ready"
          value={spiceSummary.productReadyCount}
          sub="Listed for Product Directory"
          accent="pricing"
        />

        <StatCard
          icon={Calculator}
          label="Active Batch"
          value={spiceSummary.selectedBatchRows}
          sub="Ingredients in current calculation"
          accent="market"
        />
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

      <section className="spiceWorkspace compactWorkspace">
        <div className="workspacePanel compactPanel scrollAnchor" ref={builderRef}>
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Builder</p>
              <h3>Recipe Builder</h3>
            </div>

            <button
              className="secondaryButton compactButton"
              onClick={() => {
                markSpiceDirty();
                setQuickAddOpen((current) => !current);
              }}
              type="button"
            >
              <Plus size={15} />
              Quick Add Ingredient
            </button>
          </div>

          {quickAddOpen ? (
            <form className="quickAddPanel compactQuickAdd" onSubmit={quickAddIngredient}>
              <div className="quickAddHeader">
                <h4>Quick Add to Pantry</h4>
                <button type="button" onClick={() => setQuickAddOpen(false)}>
                  <X size={16} />
                </button>
              </div>

              <div className="formGrid compactFormGrid">
                <label>
                  Ingredient Name
                  <input
                    value={quickIngredient.name}
                    onChange={(event) =>
                      updateQuickIngredientField("name", event.target.value)
                    }
                    placeholder="e.g., Smoked paprika"
                  />
                </label>

                <label>
                  Category
                  <select
                    value={quickIngredient.category}
                    onChange={(event) =>
                      updateQuickIngredientField("category", event.target.value)
                    }
                  >
                    {ingredientCategories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Cost
                  <input
                    type="number"
                    step="0.0001"
                    value={quickIngredient.cost}
                    onChange={(event) =>
                      updateQuickIngredientField("cost", event.target.value)
                    }
                    onBlur={(event) =>
                      updateQuickIngredientField(
                        "cost",
                        cleanCurrencyInput(event.target.value)
                      )
                    }
                    placeholder="e.g., 2.50"
                  />
                </label>

                <label>
                  Per
                  <select
                    value={quickIngredient.costUnit}
                    onChange={(event) =>
                      updateQuickIngredientField("costUnit", event.target.value)
                    }
                  >
                    <option value="oz">oz</option>
                    <option value="g">g</option>
                    <option value="lb">lb</option>
                  </select>
                </label>
              </div>

              <button
                className={`primaryButton compactPrimary ${
                  hasUnsavedChanges ? "dirtySaveButton" : ""
                }`}
                type="submit"
              >
                Add to Pantry and Recipe
              </button>
            </form>
          ) : null}

          <form onSubmit={saveRecipe}>
            <div className="formGrid compactFormGrid">
              <label>
                Recipe Name
                <input
                  value={recipeForm.name}
                  onChange={(event) => updateRecipeField("name", event.target.value)}
                  placeholder="e.g., Garlic Miso Seasoning"
                />
              </label>

              <label>
                Recipe Category
                <select
                  value={recipeForm.category}
                  onChange={(event) => updateRecipeField("category", event.target.value)}
                >
                  {recipeCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label className="fullSpan">
                Recipe Notes
                <textarea
                  value={recipeForm.notes}
                  onChange={(event) => updateRecipeField("notes", event.target.value)}
                  placeholder="e.g., Production notes, intended use, packaging notes"
                />
              </label>
            </div>

            <div className="recipeLines compactRecipeLines">
              <div className="recipeLineHeader">
                <h4>Ingredients by Parts</h4>
                <button
                  className="secondaryButton compactButton"
                  type="button"
                  onClick={addRecipeLine}
                >
                  <Plus size={15} />
                  Add Line
                </button>
              </div>

              {recipeForm.ingredients.length ? (
                <>
                  <div className="recipeLine compactRecipeLine recipeLineColumnHeader">
                    <span>Ingredient</span>
                    <span>Parts</span>
                    <span>Action</span>
                  </div>

                  {recipeForm.ingredients.map((line, index) => (
                    <div
                      className="recipeLine compactRecipeLine"
                      key={`${line.ingredientId}-${index}`}
                    >
                      <select
                        value={line.ingredientId}
                        onChange={(event) =>
                          updateRecipeLine(index, "ingredientId", event.target.value)
                        }
                      >
                        <option value="">Select ingredient</option>
                        {ingredients.map((ingredient) => (
                          <option key={ingredient.id} value={ingredient.id}>
                            {ingredient.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        step="0.0001"
                        value={line.parts}
                        onChange={(event) =>
                          updateRecipeLine(index, "parts", event.target.value)
                        }
                        placeholder="e.g., 1"
                      />

                      <button
                        className="iconButton danger"
                        type="button"
                        onClick={() => removeRecipeLine(index)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <div className="placeholderBox compactPlaceholder">
                  Add ingredients from your pantry, or use Quick Add Ingredient.
                </div>
              )}
            </div>

            <div className="productDirectoryPanel">
              <label className="checkboxLine">
                <input
                  type="checkbox"
                  checked={recipeForm.listInProductDirectory}
                  onChange={(event) =>
                    updateRecipeField("listInProductDirectory", event.target.checked)
                  }
                />
                <span>List in Product Directory</span>
              </label>

              <p className="helperText">
                When checked, this recipe can be pulled into Products & Pricing as a
                sellable product. Ingredient cost is calculated from the recipe parts,
                not from batch size.
              </p>

              {recipeForm.listInProductDirectory ? (
                <div className="productPackageBuilder">
                  <div className="recipeLineHeader">
                    <h4>Product Package Sizes</h4>
                    <button
                      className="secondaryButton compactButton"
                      type="button"
                      onClick={addProductPackage}
                    >
                      <Plus size={15} />
                      Add Package
                    </button>
                  </div>

                  {recipeForm.productPackages.length ? (
                    <>
                      <div className="productPackageRow productPackageHeader">
                        <span>Package Name</span>
                        <span>Size</span>
                        <span>Unit</span>
                        <span>Ingredient Cost</span>
                        <span>Action</span>
                      </div>

                      {recipeForm.productPackages.map((item, index) => {
                        const costPreview =
                          recipeCostSummary.productPackages[index]?.ingredientCost || 0;

                        return (
                          <div className="productPackageRow" key={`product-package-${index}`}>
                            <input
                              value={item.name}
                              onChange={(event) =>
                                updateProductPackage(index, "name", event.target.value)
                              }
                              placeholder="e.g., 1 oz pouch"
                            />

                            <input
                              type="number"
                              step="0.01"
                              value={item.size}
                              onChange={(event) =>
                                updateProductPackage(index, "size", event.target.value)
                              }
                              placeholder="e.g., 1"
                            />

                            <select
                              value={item.unit}
                              onChange={(event) =>
                                updateProductPackage(index, "unit", event.target.value)
                              }
                            >
                              <option value="oz">oz</option>
                              <option value="g">g</option>
                              <option value="lb">lb</option>
                            </select>

                            <span>${round(costPreview, 2)}</span>

                            <button
                              className="iconButton danger"
                              type="button"
                              onClick={() => removeProductPackage(index)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="placeholderBox compactPlaceholder">
                      Add package sizes like 1 oz pouch, 0.2 oz sample, or 4 oz bulk bag.
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="formActions compactActions">
              <button
                className={`primaryButton compactPrimary ${
                  hasUnsavedChanges ? "dirtySaveButton" : ""
                }`}
                type="submit"
              >
                <Save size={15} />
                {editingRecipeId
                  ? hasUnsavedChanges
                    ? "Update Recipe Changes"
                    : "Update Recipe"
                  : hasUnsavedChanges
                    ? "Save Recipe Changes"
                    : "Save Recipe"}
              </button>

              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={clearRecipeDraft}
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        <div className="workspacePanel compactPanel scrollAnchor" ref={calculatorRef}>
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Batch Calculator</p>
              <h3>Scale a Saved Recipe</h3>
            </div>

            <button
              className="primaryButton compactPrimary"
              type="button"
              onClick={openInventoryModal}
              disabled={!batchRows.length}
            >
              <PackageCheck size={15} />
              Add to Inventory
            </button>
          </div>

          <div className="calculatorControls compactCalculatorControls">
            <label>
              Recipe
              <select
                value={selectedRecipeId}
                onChange={(event) => setSelectedRecipeId(event.target.value)}
              >
                <option value="">Select recipe</option>
                {recipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Target Amount
              <input
                type="number"
                step="0.01"
                value={targetAmount}
                onChange={(event) => setTargetAmount(event.target.value)}
                placeholder="e.g., 10"
              />
            </label>

            <label>
              Unit
              <select
                value={targetUnit}
                onChange={(event) => setTargetUnit(event.target.value)}
              >
                <option value="oz">oz</option>
                <option value="g">g</option>
                <option value="lb">lb</option>
              </select>
            </label>

            <label>
              Overage %
              <input
                type="number"
                step="0.1"
                value={overagePercent}
                onChange={(event) => setOveragePercent(event.target.value)}
                placeholder="e.g., 5"
              />
            </label>
          </div>

          {batchRows.length ? (
            <>
              <div className="hubStatGrid spiceBatchStatGrid">
                <StatCard
                  icon={Scale}
                  label="Total Grams"
                  value={`${round(batchTotals.grams)} g`}
                  sub="Scaled batch weight"
                  accent="spice"
                />

                <StatCard
                  icon={Beaker}
                  label="Total Ounces"
                  value={`${round(batchTotals.ounces)} oz`}
                  sub="Scaled batch weight"
                  accent="sourdough"
                />

                <StatCard
                  icon={DollarSign}
                  label="Estimated Cost"
                  value={`$${round(batchTotals.cost)}`}
                  sub="Ingredient cost estimate"
                  accent="pricing"
                />
              </div>

              <div className="batchTable compactBatchTable">
                <div className="batchTableHeader">
                  <span>Ingredient</span>
                  <span>Parts</span>
                  <span>Grams</span>
                  <span>Ounces</span>
                  <span>Cost</span>
                </div>

                {batchRows.map((row) => (
                  <div
                    className="batchTableRow"
                    key={`${row.ingredientId || row.name}-${row.name}`}
                  >
                    <span>
                      {row.ingredientId ? (
                        <button
                          type="button"
                          className="savedItemLink"
                          onClick={() => editIngredientById(row.ingredientId)}
                        >
                          {row.name}
                        </button>
                      ) : (
                        row.name
                      )}
                    </span>
                    <span>{formatParts(row.parts)}</span>
                    <span>{round(row.grams)}</span>
                    <span>{round(row.ounces)}</span>
                    <span>${round(row.estimatedCost)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="placeholderBox compactPlaceholder">
              Select a saved recipe and enter a target amount to generate batch weights.
            </div>
          )}
        </div>
      </section>

      <section className="lowerSpiceGrid">
        <div className="workspacePanel compactPanel scrollAnchor" ref={pantryRef}>
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Pantry</p>
              <h3>Ingredient Pantry</h3>
            </div>

            <div className="searchBox compactSearch">
              <Search size={17} />
              <input
                value={ingredientSearch}
                onChange={(event) => setIngredientSearch(event.target.value)}
                placeholder="Search ingredients..."
              />
            </div>
          </div>

          <form className="formGrid compactFormGrid" onSubmit={saveIngredient}>
            <label>
              Ingredient Name
              <input
                value={ingredientForm.name}
                onChange={(event) => updateIngredientField("name", event.target.value)}
                placeholder="e.g., Dried thyme"
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
                onChange={(event) =>
                  updateIngredientField("supplier", event.target.value)
                }
                placeholder="e.g., Bulk supplier, farm, store"
              />
            </label>

            <div className="inlineFields">
              <label>
                Cost
                <input
                  type="number"
                  step="0.0001"
                  value={ingredientForm.cost}
                  onChange={(event) => updateIngredientField("cost", event.target.value)}
                  onBlur={(event) =>
                    updateIngredientField("cost", cleanCurrencyInput(event.target.value))
                  }
                  placeholder="e.g., 2.50"
                />
              </label>

              <label>
                Per
                <select
                  value={ingredientForm.costUnit}
                  onChange={(event) =>
                    updateIngredientField("costUnit", event.target.value)
                  }
                >
                  <option value="oz">oz</option>
                  <option value="g">g</option>
                  <option value="lb">lb</option>
                </select>
              </label>
            </div>

            <label className="fullSpan">
              Notes
              <textarea
                value={ingredientForm.notes}
                onChange={(event) => updateIngredientField("notes", event.target.value)}
                placeholder="e.g., Flavor notes, grind size, sourcing notes"
              />
            </label>

            <div className="formActions fullSpan compactActions">
              <button
                className={`primaryButton compactPrimary ${
                  hasUnsavedChanges ? "dirtySaveButton" : ""
                }`}
                type="submit"
              >
                <Save size={15} />
                {editingIngredientId
                  ? hasUnsavedChanges
                    ? "Update Ingredient Changes"
                    : "Update Ingredient"
                  : hasUnsavedChanges
                    ? "Save Ingredient Changes"
                    : "Save Ingredient"}
              </button>

              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={clearIngredientDraft}
              >
                Clear
              </button>
            </div>
          </form>

          <div className="savedList compactSavedList spiceExpandableList">
            <h4 className="smallSectionTitle">Saved Ingredients</h4>

            {filteredIngredients.length ? (
              filteredIngredients.map((ingredient) => {
                const isExpanded = expandedIngredientId === ingredient.id;

                return (
                  <div
                    className={isExpanded ? "savedItemBlock expanded" : "savedItemBlock"}
                    key={ingredient.id}
                  >
                    <div className="savedItem compactSavedItem expandableSavedItem">
                      <div>
                        <h4>
                          <button
                            type="button"
                            className="savedItemLink"
                            onClick={() => editIngredient(ingredient)}
                          >
                            {ingredient.name}
                          </button>
                        </h4>
                        <p>
                          {ingredient.category}
                          {ingredient.supplier ? ` • ${ingredient.supplier}` : ""}
                          {ingredient.cost
                            ? ` • $${formatCurrency(ingredient.cost)} / ${ingredient.costUnit}`
                            : ""}
                        </p>
                      </div>

                      <div className="itemActions">
                        <button
                          type="button"
                          className="iconButton"
                          aria-label={
                            isExpanded
                              ? "Collapse ingredient details"
                              : "Expand ingredient details"
                          }
                          onClick={() =>
                            setExpandedIngredientId(isExpanded ? null : ingredient.id)
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>

                        <button type="button" onClick={() => editIngredient(ingredient)}>
                          <Edit3 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => removeIngredient(ingredient.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {isExpanded ? (
                      <div className="spiceDetailPanel">
                        <div>
                          <strong>Category</strong>
                          <span>{ingredient.category || "Other"}</span>
                        </div>

                        <div>
                          <strong>Supplier / Source</strong>
                          <span>{ingredient.supplier || "Not listed"}</span>
                        </div>

                        <div>
                          <strong>Cost</strong>
                          <span>
                            {ingredient.cost
                              ? `$${formatCurrency(ingredient.cost)} / ${ingredient.costUnit}`
                              : "Not listed"}
                          </span>
                        </div>

                        <div className="fullSpan">
                          <strong>Notes</strong>
                          <span>{ingredient.notes || "No notes saved."}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="placeholderBox compactPlaceholder">
                No ingredients saved yet.
              </div>
            )}
          </div>
        </div>

        <div
          className="workspacePanel compactPanel scrollAnchor spiceLibraryPanel"
          ref={libraryRef}
        >
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Saved Recipes</p>
              <h3>Recipe Library</h3>
            </div>

            <div className="recipeLibraryHeaderTools">
              <div className="libraryCostControl">
                <label>
                  Cost For
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={libraryCostAmount}
                    onChange={(event) => setLibraryCostAmount(event.target.value)}
                    placeholder="1"
                  />
                </label>

                <label>
                  Unit
                  <select
                    value={libraryCostUnit}
                    onChange={(event) => setLibraryCostUnit(event.target.value)}
                  >
                    <option value="oz">oz</option>
                    <option value="g">g</option>
                    <option value="lb">lb</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="recipeLibrary compactSavedList spiceRecipeLibraryTall">
            {recipes.length ? (
              recipes.map((recipe) => {
                const isExpanded = expandedRecipeId === recipe.id;
                const sortedRecipeIngredients = [...(recipe.ingredients || [])].sort(
                  (a, b) => toNumber(b.parts) - toNumber(a.parts)
                );
                const formulaCostPerOunce = getRecipeFormulaCostPerOunce(recipe);
                const libraryCostOunces = convertAmountToOunces(
                  libraryCostAmount,
                  libraryCostUnit
                );
                const libraryCostPreview = formulaCostPerOunce * libraryCostOunces;
                const showLibraryCostPreview = libraryCostOunces > 0;

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

                          {showLibraryCostPreview ? (
                            <span className="recipeQuickCostBadge">
                              {formatLibraryCostLabel(
                                libraryCostPreview,
                                libraryCostAmount,
                                libraryCostUnit
                              )}
                            </span>
                          ) : null}
                        </h4>
                        <p>
                          {recipe.category} • {recipe.ingredients?.length || 0} ingredients
                          {recipe.listInProductDirectory
                            ? " • Listed in Product Directory"
                            : ""}
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
                          <strong>Category</strong>
                          <span>{recipe.category || "House Blend"}</span>
                        </div>

                        <div>
                          <strong>Total Ingredients</strong>
                          <span>{recipe.ingredients?.length || 0}</span>
                        </div>

                        <div>
                          <strong>Formula Cost</strong>
                          <span>${round(formulaCostPerOunce, 2)} per finished oz</span>
                        </div>

                        <div>
                          <strong>Product Directory</strong>
                          <span>
                            {recipe.listInProductDirectory ? "Listed" : "Not listed"}
                          </span>
                        </div>

                        <div className="fullSpan">
                          <strong>Recipe Notes</strong>
                          <span>{recipe.notes || "No notes saved."}</span>
                        </div>

                        {recipe.listInProductDirectory ? (
                          <div className="fullSpan recipePartsList">
                            <strong>Product Package Sizes</strong>

                            {recipe.productPackages?.length ? (
                              recipe.productPackages.map((item, index) => (
                                <div
                                  className="recipePartsRow"
                                  key={`${item.name}-${index}`}
                                >
                                  <span>{item.name}</span>
                                  <span>
                                    {item.size} {item.unit} • $
                                    {round(item.ingredientCost, 2)} ingredient cost
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span>No product packages saved.</span>
                            )}
                          </div>
                        ) : null}

                        <div className="fullSpan recipePartsList">
                          <strong>Ingredients by Parts</strong>

                          {sortedRecipeIngredients.length ? (
                            sortedRecipeIngredients.map((line, index) => (
                              <div
                                className="recipePartsRow"
                                key={`${line.ingredientId}-${index}`}
                              >
                                <span>
                                  {line.ingredientId ? (
                                    <button
                                      type="button"
                                      className="savedItemLink"
                                      onClick={() => editIngredientById(line.ingredientId)}
                                    >
                                      {getIngredientName(line)}
                                    </button>
                                  ) : (
                                    getIngredientName(line)
                                  )}
                                </span>
                                <span>{formatParts(line.parts)} parts</span>
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
        </div>
      </section>

      {inventoryModalOpen ? (
        <div className="inventoryModalOverlay" role="dialog" aria-modal="true">
          <div className="inventoryModal spiceInventoryModal">
            <div className="inventoryModalHeader">
              <div>
                <p className="eyebrow">Add Batch to Inventory</p>
                <h3>{selectedRecipe?.name || "Selected Recipe"}</h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setInventoryModalOpen(false);
                  setInventoryAllocations({});
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="inventoryDetailGrid fullSpan">
              <div>
                <span>Batch Produced</span>
                <strong>{round(batchTotals.ounces, 2)} oz</strong>
              </div>

              <div>
                <span>Allocated</span>
                <strong>{round(allocatedInventoryOunces, 2)} oz</strong>
              </div>

              <div>
                <span>Remaining</span>
                <strong>{round(remainingInventoryOunces, 2)} oz</strong>
              </div>
            </div>

            <div className="productPackageBuilder">
              <div className="recipeLineHeader">
                <h4>Allocate Finished Packages</h4>
              </div>

              {inventoryPackages.map((packageItem) => {
                const quantity = toNumber(inventoryAllocations[packageItem.id]);
                const usedOunces = quantity * packageItem.packageOunces;

                return (
                  <div className="productPackageRow" key={packageItem.id}>
                    <span>
  <strong>{packageItem.displayName}</strong>
  <small>
    {round(packageItem.packageOunces, 3)} oz each •{" "}
    {Math.floor(Math.max(0, remainingInventoryOunces) / packageItem.packageOunces)} available
  </small>
</span>

                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={inventoryAllocations[packageItem.id] || ""}
                      onChange={(event) =>
                        updateInventoryAllocation(packageItem.id, event.target.value)
                      }
                      placeholder="0"
                    />

                    <span>{round(usedOunces, 2)} oz used</span>
                  </div>
                );
              })}
            </div>

            {remainingInventoryOunces > 0.01 ? (
              <div className="placeholderBox compactPlaceholder">
                You still have {round(remainingInventoryOunces, 2)} oz unallocated. You can
                save a partial allocation or adjust the package counts.
              </div>
            ) : null}

            {remainingInventoryOunces < -0.01 ? (
              <div className="placeholderBox compactPlaceholder">
                You still have {round(remainingInventoryOunces, 2)} oz unallocated. This amount will be saved as Unallocated Bulk inventory.
              </div>
            ) : null}

            <div className="inventoryModalActions fullSpan">
              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={() => {
                  setInventoryModalOpen(false);
                  setInventoryAllocations({});
                }}
              >
                Cancel
              </button>

              <button
                className="primaryButton compactPrimary"
                type="button"
                onClick={saveBatchToInventory}
                disabled={savingInventory || remainingInventoryOunces < -0.01}
              >
                <PackageCheck size={15} />
                {savingInventory ? "Adding..." : "Add to Inventory"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showBackToTop ? (
        <button className="backToTopButton" type="button" onClick={scrollToTop}>
          <ArrowUp size={18} />
          Top
        </button>
      ) : null}
    </div>
  );
}
