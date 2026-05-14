import { useEffect, useMemo, useState } from "react";
import {
  Beaker,
  Calculator,
  Edit3,
  Library,
  Plus,
  Save,
  Scale,
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

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value, places = 2) {
  return Number(value || 0).toFixed(places);
}

function ouncesToGrams(ounces) {
  return ounces * 28.3495;
}

function gramsToOunces(grams) {
  return grams / 28.3495;
}

export default function SpiceKitchen() {
  const { user, loginWithGoogle } = useAuth();

  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [ingredientForm, setIngredientForm] = useState(emptyIngredient);
  const [editingIngredientId, setEditingIngredientId] = useState(null);
  const [recipeForm, setRecipeForm] = useState(emptyRecipe);
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [targetAmount, setTargetAmount] = useState("10");
  const [targetUnit, setTargetUnit] = useState("oz");
  const [overagePercent, setOveragePercent] = useState("5");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickIngredient, setQuickIngredient] = useState(emptyIngredient);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
      setStatusMessage("Could not load Spice Kitchen data.");
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

    if (!totalParts) return [];

    return selectedRecipe.ingredients.map((item) => {
      const ingredient = ingredients.find((saved) => saved.id === item.ingredientId);
      const grams = (toNumber(item.parts) / totalParts) * adjustedTargetGrams;
      const ounces = gramsToOunces(grams);

      let estimatedCost = 0;
      if (ingredient?.cost) {
        const cost = toNumber(ingredient.cost);
        if (ingredient.costUnit === "oz") {
          estimatedCost = ounces * cost;
        } else if (ingredient.costUnit === "g") {
          estimatedCost = grams * cost;
        } else if (ingredient.costUnit === "lb") {
          estimatedCost = (ounces / 16) * cost;
        }
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
      setStatusMessage("Ingredient name is required.");
      return;
    }

    try {
      if (editingIngredientId) {
        await updateSpiceIngredient(user.uid, editingIngredientId, cleanIngredient);
        setStatusMessage("Ingredient updated.");
      } else {
        await createSpiceIngredient(user.uid, cleanIngredient);
        setStatusMessage("Ingredient saved.");
      }

      setIngredientForm(emptyIngredient);
      setEditingIngredientId(null);
      await loadData();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not save ingredient.");
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
  }

  async function removeIngredient(ingredientId) {
    if (!user) return;

    try {
      await deleteSpiceIngredient(user.uid, ingredientId);
      setStatusMessage("Ingredient deleted.");
      await loadData();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not delete ingredient.");
    }
  }

  function addRecipeLine() {
    setRecipeForm((current) => ({
      ...current,
      ingredients: [
        ...current.ingredients,
        {
          ingredientId: "",
          ingredientName: "",
          parts: ""
        }
      ]
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
      setStatusMessage("Quick add ingredient name is required.");
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
      setStatusMessage("Ingredient added to pantry and recipe.");
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not quick add ingredient.");
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
      setStatusMessage("Recipe name is required.");
      return;
    }

    if (!cleanRecipe.ingredients.length) {
      setStatusMessage("Add at least one ingredient with parts greater than 0.");
      return;
    }

    try {
      if (editingRecipeId) {
        await updateSpiceRecipe(user.uid, editingRecipeId, cleanRecipe);
        setStatusMessage("Recipe updated.");
      } else {
        await createSpiceRecipe(user.uid, cleanRecipe);
        setStatusMessage("Recipe saved.");
      }

      setRecipeForm(emptyRecipe);
      setEditingRecipeId(null);
      await loadData();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not save recipe.");
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
  }

  async function removeRecipe(recipeId) {
    if (!user) return;

    try {
      await deleteSpiceRecipe(user.uid, recipeId);
      setStatusMessage("Recipe deleted.");
      if (selectedRecipeId === recipeId) setSelectedRecipeId("");
      await loadData();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not delete recipe.");
    }
  }

  if (!user) {
    return (
      <div className="modulePage spicePage">
        <section className="moduleHero">
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
    <div className="modulePage spicePage">
      <section className="moduleHero">
        <div>
          <p className="eyebrow">Spice Kitchen</p>
          <h2>Build, scale, and organize seasoning recipes.</h2>
          <p>
            Manage your ingredient pantry, create recipes by parts, quick-add
            ingredients while building a recipe, and calculate exact batch weights.
          </p>
        </div>

        <button
          className="primaryButton"
          onClick={() => {
            setRecipeForm(emptyRecipe);
            setEditingRecipeId(null);
            setStatusMessage("Ready for a new recipe.");
          }}
        >
          <Plus size={18} />
          New Recipe
        </button>
      </section>

      {statusMessage ? (
        <div className="statusBanner">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage("")}>
            <X size={16} />
          </button>
        </div>
      ) : null}

      {loading ? <div className="statusBanner">Loading Spice Kitchen...</div> : null}

      <section className="toolGrid">
        <div className="toolCard">
          <Library size={24} />
          <h3>Ingredient Pantry</h3>
          <p>Save ingredients, costs, suppliers, notes, and categories.</p>
        </div>

        <div className="toolCard">
          <Beaker size={24} />
          <h3>Recipe Builder</h3>
          <p>Create blends by parts using your saved pantry ingredients.</p>
        </div>

        <div className="toolCard">
          <Scale size={24} />
          <h3>Batch Scaling</h3>
          <p>Scale recipes to ounces, grams, package counts, or overage targets.</p>
        </div>

        <div className="toolCard">
          <Calculator size={24} />
          <h3>Cost Estimates</h3>
          <p>Estimate batch costs from ingredient cost data.</p>
        </div>
      </section>

      <section className="spiceWorkspace">
        <div className="workspacePanel">
          <div className="workspaceHeader">
            <div>
              <p className="eyebrow">Pantry</p>
              <h3>Ingredient Pantry</h3>
            </div>
          </div>

          <form className="formGrid" onSubmit={saveIngredient}>
            <label>
              Ingredient Name
              <input
                value={ingredientForm.name}
                onChange={(event) => updateIngredientField("name", event.target.value)}
                placeholder="Dried thyme"
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
                placeholder="Bulk supplier, farm, store"
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
                  placeholder="2.50"
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
                placeholder="Flavor notes, grind size, sourcing notes, prep notes"
              />
            </label>

            <div className="formActions fullSpan">
              <button className="primaryButton" type="submit">
                <Save size={16} />
                {editingIngredientId ? "Update Ingredient" : "Save Ingredient"}
              </button>

              {editingIngredientId ? (
                <button
                  className="secondaryButton compactButton"
                  type="button"
                  onClick={() => {
                    setIngredientForm(emptyIngredient);
                    setEditingIngredientId(null);
                  }}
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>

          <div className="searchBox">
            <Search size={18} />
            <input
              value={ingredientSearch}
              onChange={(event) => setIngredientSearch(event.target.value)}
              placeholder="Search ingredients, categories, or suppliers"
            />
          </div>

          <div className="savedList">
            {filteredIngredients.length ? (
              filteredIngredients.map((ingredient) => (
                <div className="savedItem" key={ingredient.id}>
                  <div>
                    <h4>{ingredient.name}</h4>
                    <p>
                      {ingredient.category}
                      {ingredient.supplier ? ` • ${ingredient.supplier}` : ""}
                    </p>
                    {ingredient.cost ? (
                      <p>
                        Cost: ${ingredient.cost} per {ingredient.costUnit}
                      </p>
                    ) : null}
                  </div>

                  <div className="itemActions">
                    <button onClick={() => editIngredient(ingredient)}>
                      <Edit3 size={15} />
                    </button>
                    <button onClick={() => removeIngredient(ingredient.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="placeholderBox">
                No ingredients saved yet. Add your first pantry item above.
              </div>
            )}
          </div>
        </div>

        <div className="workspacePanel">
          <div className="workspaceHeader splitHeader">
            <div>
              <p className="eyebrow">Builder</p>
              <h3>Recipe Builder</h3>
            </div>

            <button
              className="secondaryButton compactButton"
              onClick={() => setQuickAddOpen((current) => !current)}
              type="button"
            >
              <Plus size={16} />
              Quick Add Ingredient
            </button>
          </div>

          {quickAddOpen ? (
            <form className="quickAddPanel" onSubmit={quickAddIngredient}>
              <div className="quickAddHeader">
                <h4>Quick Add to Pantry</h4>
                <button type="button" onClick={() => setQuickAddOpen(false)}>
                  <X size={16} />
                </button>
              </div>

              <div className="formGrid">
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
                    placeholder="Smoked paprika"
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
                    placeholder="2.50"
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

              <button className="primaryButton" type="submit">
                Add to Pantry and Recipe
              </button>
            </form>
          ) : null}

          <form onSubmit={saveRecipe}>
            <div className="formGrid">
              <label>
                Recipe Name
                <input
                  value={recipeForm.name}
                  onChange={(event) => updateRecipeField("name", event.target.value)}
                  placeholder="Garlic Miso Seasoning"
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
                  placeholder="Production notes, intended use, packaging notes"
                />
              </label>
            </div>

            <div className="recipeLines">
              <div className="recipeLineHeader">
                <h4>Ingredients by Parts</h4>
                <button
                  className="secondaryButton compactButton"
                  type="button"
                  onClick={addRecipeLine}
                >
                  <Plus size={16} />
                  Add Line
                </button>
              </div>

              {recipeForm.ingredients.length ? (
                recipeForm.ingredients.map((line, index) => (
                  <div className="recipeLine" key={`${line.ingredientId}-${index}`}>
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
                        placeholder="1"
                      />
                    </label>

                    <button
                      className="iconButton danger"
                      type="button"
                      onClick={() => removeRecipeLine(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="placeholderBox">
                  Add ingredients from your pantry, or use Quick Add Ingredient while
                  building the recipe.
                </div>
              )}
            </div>

            <div className="formActions">
              <button className="primaryButton" type="submit">
                <Save size={16} />
                {editingRecipeId ? "Update Recipe" : "Save Recipe"}
              </button>

              {editingRecipeId ? (
                <button
                  className="secondaryButton compactButton"
                  type="button"
                  onClick={() => {
                    setRecipeForm(emptyRecipe);
                    setEditingRecipeId(null);
                  }}
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </section>

      <section className="workspacePanel">
        <div className="workspaceHeader">
          <div>
            <p className="eyebrow">Saved Recipes</p>
            <h3>Recipe Library</h3>
          </div>
        </div>

        <div className="recipeLibrary">
          {recipes.length ? (
            recipes.map((recipe) => (
              <div className="savedItem recipeItem" key={recipe.id}>
                <div>
                  <h4>{recipe.name}</h4>
                  <p>
                    {recipe.category} • {recipe.ingredients?.length || 0} ingredients
                  </p>
                </div>

                <div className="itemActions">
                  <button onClick={() => editRecipe(recipe)}>
                    <Edit3 size={15} />
                  </button>
                  <button onClick={() => removeRecipe(recipe.id)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="placeholderBox">
              No recipes saved yet. Build your first blend above.
            </div>
          )}
        </div>
      </section>

      <section className="workspacePanel">
        <div className="workspaceHeader">
          <div>
            <p className="eyebrow">Batch Calculator</p>
            <h3>Scale a Saved Recipe</h3>
          </div>
        </div>

        <div className="calculatorControls">
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
            />
          </label>
        </div>

        {batchRows.length ? (
          <>
            <div className="batchTotals">
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

            <div className="batchTable">
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
                  <span>{round(row.parts, 4)}</span>
                  <span>{round(row.grams)}</span>
                  <span>{round(row.ounces)}</span>
                  <span>${round(row.estimatedCost)}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="placeholderBox">
            Select a saved recipe to generate batch weights.
          </div>
        )}
      </section>
    </div>
  );
}
