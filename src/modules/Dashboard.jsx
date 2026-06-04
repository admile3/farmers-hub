import {
  Beaker,
  BookOpen,
  Calculator,
  DollarSign,
  Library,
  PackageCheck,
  Plus,
  Save,
  Search
} from "lucide-react";
import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import DashboardGuideContent from "../components/DashboardGuideContent.jsx";
import StatCard from "../components/StatCard.jsx";

export default function SpiceKitchenGuideContent() {
  return (
    <div className="moduleGuideContent">
      <section className="moduleGuideIntro">
        <p>
          Spice Kitchen helps you store ingredients, build recipes, scale batches, and
          prepare finished products for inventory.
        </p>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Overview</span>
          <h3>Start with the dashboard cards.</h3>
          <p>
            These give you a quick snapshot of your saved ingredients, recipes, product-ready
            blends, and active batch calculations.
          </p>
        </div>

        <div className="moduleGuidePreview moduleGuideStatPreview">
          <StatCard icon={Library} label="Ingredients" value="12" sub="Saved pantry items" accent="spice" />
          <StatCard icon={BookOpen} label="Recipes" value="6" sub="Saved seasoning blends" accent="sourdough" />
          <StatCard icon={DollarSign} label="Product Ready" value="4" sub="Listed for Product Directory" accent="pricing" />
          <StatCard icon={Calculator} label="Active Batch" value="5" sub="Ingredients in current calculation" accent="market" />
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 1</span>
          <h3>Add ingredients in the Ingredient Pantry.</h3>
          <p>
            Add each ingredient, where it comes from, and its cost so recipe and batch costs
            can calculate correctly.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Pantry</p>
                <h4>Ingredient Pantry</h4>
              </div>
              <div className="guideSearchMock">
                <Search size={14} />
                <span>Search ingredients...</span>
              </div>
            </div>

            <div className="guideMiniGrid">
              <div>
                <span>Ingredient Name</span>
                <strong>Garlic Powder</strong>
              </div>
              <div>
                <span>Category</span>
                <strong>Powder</strong>
              </div>
              <div>
                <span>Supplier / Source</span>
                <strong>Bulk Supplier</strong>
              </div>
              <div>
                <span>Cost</span>
                <strong>$4.50 / oz</strong>
              </div>
            </div>

            <button className="guideMockButton" type="button">
              <Save size={14} />
              Save Ingredient
            </button>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 2</span>
          <h3>Build a recipe by parts.</h3>
          <p>
            Name the recipe, choose a category, add ingredient lines, then enter how many
            parts each ingredient makes up.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Builder</p>
                <h4>Recipe Builder</h4>
              </div>
              <button className="guideMockButton secondary" type="button">
                <Plus size={14} />
                Quick Add
              </button>
            </div>

            <div className="guideRecipeRows">
              <div className="guideRecipeHeader">
                <span>Ingredient</span>
                <span>Parts</span>
              </div>
              <div>
                <strong>Salt</strong>
                <span>10</span>
              </div>
              <div>
                <strong>Garlic Powder</strong>
                <span>3</span>
              </div>
              <div>
                <strong>Onion Powder</strong>
                <span>2</span>
              </div>
            </div>

            <div className="guideCheckboxMock">
              <span>✓</span>
              List in Product Directory
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 3</span>
          <h3>Scale a saved recipe.</h3>
          <p>
            Select a saved recipe, enter the finished amount you want to make, and the batch
            calculator shows ingredient weights and estimated cost.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Batch Calculator</p>
                <h4>Scale a Saved Recipe</h4>
              </div>
              <button className="guideMockButton" type="button">
                <PackageCheck size={14} />
                Add to Inventory
              </button>
            </div>

            <div className="guideMiniGrid three">
              <div>
                <span>Recipe</span>
                <strong>Garlic Miso</strong>
              </div>
              <div>
                <span>Target</span>
                <strong>16 oz</strong>
              </div>
              <div>
                <span>Cost</span>
                <strong>$64.29</strong>
              </div>
            </div>

            <div className="guideRecipeRows">
              <div className="guideRecipeHeader">
                <span>Ingredient</span>
                <span>Grams</span>
              </div>
              <div>
                <strong>Salt</strong>
                <span>302.4 g</span>
              </div>
              <div>
                <strong>Miso Powder</strong>
                <span>151.2 g</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 4</span>
          <h3>Use the Recipe Library as your saved blend list.</h3>
          <p>
            Review saved recipes, check product package sizes, edit formulas, or use saved
            recipes in the batch calculator.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Saved Recipes</p>
                <h4>Recipe Library</h4>
              </div>
            </div>

            <div className="guideSavedRecipe">
              <strong>Garlic Miso Seasoning</strong>
              <span>House Blend • 5 ingredients • Listed in Product Directory</span>
            </div>

            <div className="guideSavedRecipe">
              <strong>Firecracker Salt</strong>
              <span>Farmer&apos;s Market • 4 ingredients</span>
            </div>
          </div>
        </div>
      </section>

      <div className="moduleGuideTip">
        <Beaker size={18} />
        <p>
          Tip: keep ingredient costs updated so product pricing and batch costs stay accurate.
        </p>
      </div>
    </div>
  );
}
