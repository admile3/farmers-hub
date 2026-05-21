import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUp,
  Beaker,
  BookOpen,
  Calculator,
  ChevronDown,
  ChevronUp,
  Edit3,
  Library,
  Plus,
  Save,
  Search,
  Trash2,
  X
} from "lucide-react";
import { useAuth } from "../AuthContext.jsx";
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
  ingredients: []
};

function createBlankRecipeLine() {
  return {
    ingredientId: "",
    ingredientName: "",
    parts: ""
  };
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value, places = 2) {
  return Number(value || 0).toFixed(places);
}

function formatParts(value) {
  const number = toNumber(value);
  return Number(number.toFixed(2)).toString();
}

function ouncesToGrams(ounces) {
  return ounces * 28.3495;
}

function gramsToOunces(grams) {
  return grams / 28.3495;
}

export default function SpiceKitchen() {
  const { user, loginWithGoogle } = useAuth();

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
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickIngredient, setQuickIngredient] = useState(emptyIngredient);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

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
    if (!statusMessage) return;

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

  const batchRows = useMemo(() => {
    if (!selectedRecipe || !selectedRecipe.ingredients?.length) return [];

    const targetGrams =
      targetUnit === "oz"
        ? ouncesToGrams(toNumber(targetAmount))
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

      let estimatedCost = 0;

      if (ingredient?.cost) {
        const cost = toNumber(ingredient.cost);

        if (ingredient.costUnit === "oz") estimatedCost = ounces * cost;
        if (ingredient.costUnit === "g") estimatedCost = grams * cost;
        if (ingredient.costUnit === "lb") estimatedCost = (ounces / 16) * cost;
      }

      return {
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

  function updateIngredientField(field, value) {
    setIngredientForm((current) => ({ ...current, [field]: value }));
  }

  function updateRecipeField(field, value) {
    setRecipeForm((current) => ({ ...current, [field]: value }));
  }

  async function saveIngredient(event) {
    event.preventDefault();
    if (!user) return;

    const cleanIngredient = {
      name: ingredientForm.name.trim(),
      category: ingredientForm.category,
      supplier: ingredientForm.supplier.trim(),
      cost: ingredientForm.cost,
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
      cost: ingredient.cost || "",
      costUnit: ingredient.costUnit || "oz",
      notes: ingredient.notes || ""
    });
    scrollToSection(pantryRef);
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
    setRecipeForm((current) => ({
      ...current,
      ingredients: [...current.ingredients, createBlankRecipeLine()]
    }));
  }

  function updateRecipeLine(index, field, value) {
    setRecipeForm((current) => {
      const nextIngredients = [...current.ingredients];
      const nextLine = { ...nextIngredients[index], [field]: value };

      if (field === "ingredientId") {
        const ingredient = ingredients.find((item) => item.id === value);
        nextLine.ingredientName = ingredient?.name || "";
      }

      nextIngredients[index] = nextLine;

      const isPartsField = field === "parts";
      const hasPartsValue = String(value).trim() !== "";
      const isLastLine = index === nextIngredients.length - 1;
      const lastLine = nextIngredients[nextIngredients.length - 1];
      const lastLineHasAnyValue =
        lastLine?.ingredientId ||
        lastLine?.ingredientName ||
        String(lastLine?.parts || "").trim();

      if (isPartsField && hasPartsValue && isLastLine && lastLineHasAnyValue) {
        nextIngredients.push(createBlankRecipeLine());
      }

      return {
        ...current,
        ingredients: nextIngredients
      };
    });
  }

  function removeRecipeLine(index) {
    setRecipeForm((current) => ({
      ...current,
      ingredients: current.ingredients.filter((_, lineIndex) => lineIndex !== index)
    }));
  }

  async function quickAddIngredient(event) {
    event.preventDefault();
    if (!user) return;

    const cleanIngredient = {
      name: quickIngredient.name.trim(),
      category: quickIngredient.category,
      supplier: quickIngredient.supplier.trim(),
      cost: quickIngredient.cost,
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
      showStatus("Ingredient added to pantry and recipe.", "success");
    } catch (error) {
      console.error(error);
      showStatus("Could not quick add ingredient.", "error");
    }
  }

  async function saveRecipe(event) {
    event.preventDefault();
    if (!user) return;

    const cleanRecipe = {
      name: recipeForm.name.trim(),
      category: recipeForm.category,
      notes: recipeForm.notes.trim(),
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
      ingredients: recipe.ingredients || []
    });
    scrollToSection(builderRef);
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

  function getIngredientName(line) {
    const ingredient = ingredients.find((item) => item.id === line.ingredientId);
    return line.ingredientName || ingredient?.name || "Unknown ingredient";
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
        <section className="moduleHero compactHero">
          <div>
            <p className="eyebrow">Spice Kitchen</p>
            <h2>Sign in to build and save spice blends.</h2>
            <p>
              Your pantry, recipes, batch calculations, and production notes will be
              saved to your Farmers Hub account.
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
    <div className="modulePage spicePage compactSpicePage">
      <section className="moduleHero compactHero noActionHero">
        <div>
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
              onClick={() => setQuickAddOpen((current) => !current)}
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
                      setQuickIngredient((current) => ({
                        ...current,
                        name: event.target.value
                      }))
                    }
                    placeholder="e.g., Smoked paprika"
                  />
                </label>

                <label>
                  Category
                  <select
                    value={quickIngredient.category}
                    onChange={(event) =>
                      setQuickIngredient((current) => ({
                        ...current,
                        category: event.target.value
                      }))
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
                      setQuickIngredient((current) => ({
                        ...current,
                        cost: event.target.value
                      }))
                    }
                    placeholder="e.g., 2.50"
                  />
                </label>

                <label>
                  Per
                  <select
                    value={quickIngredient.costUnit}
                    onChange={(event) =>
                      setQuickIngredient((current) => ({
                        ...current,
                        costUnit: event.target.value
                      }))
                    }
                  >
                    <option value="oz">oz</option>
                    <option value="g">g</option>
                    <option value="lb">lb</option>
                  </select>
                </label>
              </div>

              <button className="primaryButton compactPrimary" type="submit">
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
                recipeForm.ingredients.map((line, index) => (
                  <div className="recipeLine compactRecipeLine" key={`${line.ingredientId}-${index}`}>
                    <label>
                      Ingredient
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
                    </label>

                    <label>
                      Parts
                      <input
                        type="number"
                        step="0.0001"
                        value={line.parts}
                        onChange={(event) =>
                          updateRecipeLine(index, "parts", event.target.value)
                        }
                        placeholder="e.g., 1"
                      />
                    </label>

                    <button
                      className="iconButton danger"
                      type="button"
                      onClick={() => removeRecipeLine(index)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="placeholderBox compactPlaceholder">
                  Add ingredients from your pantry, or use Quick Add Ingredient.
                </div>
              )}
            </div>

            <div className="formActions compactActions">
              <button className="primaryButton compactPrimary" type="submit">
                <Save size={15} />
                {editingRecipeId ? "Update Recipe" : "Save Recipe"}
              </button>

              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={() => {
                  setRecipeForm(emptyRecipe);
                  setEditingRecipeId(null);
                }}
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
              <div className="batchTotals compactBatchTotals">
                <div>
                  <p className="eyebrow">Total Grams</p>
                  <h4>{round(batchTotals.grams)} g</h4>
                </div>
                <div>
                  <p className="eyebrow">Total Ounces</p>
                  <h4>{round(batchTotals.ounces)} oz</h4>
                </div>
                <div>
                  <p className="eyebrow">Estimated Cost</p>
                  <h4>${round(batchTotals.cost)}</h4>
                </div>
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
                  <div className="batchTableRow" key={row.name}>
                    <span>{row.name}</span>
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
              <button className="primaryButton compactPrimary" type="submit">
                <Save size={15} />
                {editingIngredientId ? "Update Ingredient" : "Save Ingredient"}
              </button>

              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={() => {
                  setIngredientForm(emptyIngredient);
                  setEditingIngredientId(null);
                }}
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
                    <button
                      className="savedItem compactSavedItem expandableSavedItem"
                      type="button"
                      onClick={() =>
                        setExpandedIngredientId(isExpanded ? null : ingredient.id)
                      }
                    >
                      <div>
                        <h4>{ingredient.name}</h4>
                        <p>
                          {ingredient.category}
                          {ingredient.supplier ? ` • ${ingredient.supplier}` : ""}
                          {ingredient.cost
                            ? ` • $${ingredient.cost} / ${ingredient.costUnit}`
                            : ""}
                        </p>
                      </div>

                      <div className="itemActions">
                        <span className="expandIcon">
                          {isExpanded ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </span>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            editIngredient(ingredient);
                          }}
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeIngredient(ingredient.id);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </button>

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
                              ? `$${ingredient.cost} / ${ingredient.costUnit}`
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

        <div className="workspacePanel compactPanel scrollAnchor spiceLibraryPanel" ref={libraryRef}>
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Saved Recipes</p>
              <h3>Recipe Library</h3>
            </div>
          </div>

          <div className="recipeLibrary compactSavedList spiceRecipeLibraryTall">
            {recipes.length ? (
              recipes.map((recipe) => {
                const isExpanded = expandedRecipeId === recipe.id;
                const sortedRecipeIngredients = [...(recipe.ingredients || [])].sort(
                  (a, b) => toNumber(b.parts) - toNumber(a.parts)
                );

                return (
                  <div
                    className={isExpanded ? "savedItemBlock expanded" : "savedItemBlock"}
                    key={recipe.id}
                  >
                    <button
                      className="savedItem recipeItem compactSavedItem expandableSavedItem"
                      type="button"
                      onClick={() =>
                        setExpandedRecipeId(isExpanded ? null : recipe.id)
                      }
                    >
                      <div>
                        <h4>{recipe.name}</h4>
                        <p>
                          {recipe.category} • {recipe.ingredients?.length || 0} ingredients
                        </p>
                      </div>

                      <div className="itemActions">
                        <span className="expandIcon">
                          {isExpanded ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </span>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            editRecipe(recipe);
                          }}
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeRecipe(recipe.id);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </button>

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

                        <div className="fullSpan">
                          <strong>Recipe Notes</strong>
                          <span>{recipe.notes || "No notes saved."}</span>
                        </div>

                        <div className="fullSpan recipePartsList">
                          <strong>Ingredients by Parts</strong>

                          {sortedRecipeIngredients.length ? (
                            sortedRecipeIngredients.map((line, index) => (
                              <div
                                className="recipePartsRow"
                                key={`${line.ingredientId}-${index}`}
                              >
                                <span>{getIngredientName(line)}</span>
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

      {showBackToTop ? (
        <button className="backToTopButton" type="button" onClick={scrollToTop}>
          <ArrowUp size={18} />
          Top
        </button>
      ) : null}
    </div>
  );
}
