import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  Package,
  Printer,
  Scale,
  Settings,
  Wheat
} from "lucide-react";

export default function BakingPlannerGuideContent({
  selectedMode,
  onSelectMode
}) {
  return (
    <div className="moduleGuideContent">
      <section className="moduleGuideIntro">
        <p>
          Baking Planner helps you build ingredient costs, save recipes, calculate starter needs,
          plan bake cycles, and generate a production sheet for bake day.
        </p>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Overview</span>
          <h3>Choose Basic or Advanced.</h3>
          <p>
            Basic keeps recipe building simpler. Advanced adds professional controls like
            autolyse, fermentolyse, saltolyse, bassinage, initial hydration, and detailed
            fermentation handling.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Baking Planner Setup</p>
                <h4>Choose your baking workflow</h4>
              </div>
              <Settings size={20} />
            </div>

            <div className="bakingGuideModeMiniGrid">
              <div className="bakingGuideModeMiniCard">
                <strong>Basic</strong>
                <span>Simple recipes, fewer fields, quick production planning.</span>
              </div>

              <div className="bakingGuideModeMiniCard featured">
                <strong>Advanced</strong>
                <span>More control for sourdough, fermentation, hydration, and mixing methods.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 1</span>
          <h3>Add Pantry Items.</h3>
          <p>
            Add flours, salt, sweeteners, fats, seeds, packaging, and other recurring ingredients.
            These power recipe costing, pull lists, and inventory alerts.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Pantry</p>
                <h4>Add Pantry Item</h4>
              </div>
              <Package size={20} />
            </div>

            <div className="guideMiniGrid three">
              <div>
                <span>Ingredient</span>
                <strong>Bread Flour</strong>
              </div>
              <div>
                <span>Package</span>
                <strong>50 lb</strong>
              </div>
              <div>
                <span>Cost</span>
                <strong>$32.00</strong>
              </div>
            </div>

            <div className="guideSavedRecipe">
              <strong>Cost calculated automatically</strong>
              <span>Cost per pound and ounce update from package size and package cost.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 2</span>
          <h3>Build Your Recipe Library.</h3>
          <p>
            Create the baked goods you plan to produce. Add dough weight, bake loss, hydration,
            starter, flour formula, added ingredients, timing, mixer capacity, and oven capacity.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Recipes</p>
                <h4>Edit Recipe</h4>
              </div>
              <BookOpen size={20} />
            </div>

            <div className="guideMiniGrid">
              <div>
                <span>Product</span>
                <strong>Country Sourdough</strong>
              </div>
              <div>
                <span>Unit</span>
                <strong>loaves</strong>
              </div>
              <div>
                <span>Dough Weight</span>
                <strong>760 g</strong>
              </div>
              <div>
                <span>Bake Loss</span>
                <strong>12%</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 3</span>
          <h3>Choose Weights or Percentages.</h3>
          <p>
            Fixed Weights uses grams per finished unit. Percentages uses baker’s percentages and
            scales from flour weight. The planner shows the alternate value beside each field.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Recipe Entry Mode</p>
                <h4>Fixed Weights ↔ Percentages</h4>
              </div>
              <Scale size={20} />
            </div>

            <div className="guideRecipeRows">
              <div className="guideRecipeHeader">
                <span>Field</span>
                <span>Value</span>
              </div>
              <div>
                <strong>Base Hydration</strong>
                <span>78%</span>
              </div>
              <div>
                <strong>Starter / Levain</strong>
                <span>20%</span>
              </div>
              <div>
                <strong>Salt</strong>
                <span>2%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 4</span>
          <h3>Set Up Starter or Preferment.</h3>
          <p>
            Enter starter name, hydration, buffer percentage, and feeding ratio. The planner
            calculates mature starter needed, flour to feed, water to feed, and seed starter.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Starter</p>
                <h4>Starter / Preferment Builder</h4>
              </div>
              <FlaskConical size={20} />
            </div>

            <div className="guideMiniGrid three">
              <div>
                <span>Ratio</span>
                <strong>1:2:2</strong>
              </div>
              <div>
                <span>Hydration</span>
                <strong>100%</strong>
              </div>
              <div>
                <span>Buffer</span>
                <strong>10%</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 5</span>
          <h3>Create a Bake Plan.</h3>
          <p>
            Add saved recipes to a bake cycle, enter quantities, and update room conditions.
            The planner checks dough totals, starter needs, mixer load, proofing capacity, and warnings.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Bake Plan</p>
                <h4>Production Quantities</h4>
              </div>
              <ClipboardList size={20} />
            </div>

            <div className="guideRecipeRows">
              <div className="guideRecipeHeader">
                <span>Product</span>
                <span>Qty</span>
              </div>
              <div>
                <strong>Country Sourdough</strong>
                <span>12</span>
              </div>
              <div>
                <strong>Ciabatta</strong>
                <span>24</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 6</span>
          <h3>Review the Production Sheet.</h3>
          <p>
            Use the generated sheet for ingredient pulls, pantry matches, package estimates,
            inventory alerts, environmental adjustments, bake costs, and the production timeline.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Production Sheet</p>
                <h4>Bake Day Checklist</h4>
              </div>
              <Printer size={20} />
            </div>

            <div className="guideMiniGrid">
              <div>
                <span>Total Dough</span>
                <strong>18.4 kg</strong>
              </div>
              <div>
                <span>Cycle Cost</span>
                <strong>$42.80</strong>
              </div>
              <div>
                <span>Timeline</span>
                <strong>6:00 AM</strong>
              </div>
              <div>
                <span>Inventory</span>
                <strong>Checked</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 7</span>
          <h3>Complete Production.</h3>
          <p>
            Confirm finished quantities, save a production record, and optionally add finished
            units directly to Inventory.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Production Complete</p>
                <h4>Finish Bake Cycle</h4>
              </div>
              <CheckCircle2 size={20} />
            </div>

            <div className="guideSavedRecipe">
              <strong>Save Completion Log</strong>
              <span>Record what was planned and what actually came out of the bake.</span>
            </div>

            <div className="guideSavedRecipe">
              <strong>Save and Add to Inventory</strong>
              <span>Add finished baked goods to Inventory after production is complete.</span>
            </div>
          </div>
        </div>
      </section>

      <div className="moduleGuideTip">
        <Wheat size={18} />
        <p>
          Tip: add Pantry items before building recipes so costing, pull lists, and inventory alerts work correctly.
        </p>
      </div>

      <section className="bakingGuideModeSelector">
        <div>
          <p className="eyebrow">Builder Mode</p>
          <h3>Choose your Baking Planner mode.</h3>
          <p>
            You can change this later in Settings.
          </p>
        </div>

        <div className="bakingGuideModeGrid">
          <button
            type="button"
            className={
              selectedMode === "basic"
                ? "bakingGuideModeCard selected"
                : "bakingGuideModeCard"
            }
            onClick={() => onSelectMode?.("basic")}
          >
            <strong>Basic</strong>
            <span>Best for straightforward recipes, simple production planning, and fewer fields.</span>
          </button>

          <button
            type="button"
            className={
              selectedMode === "advanced"
                ? "bakingGuideModeCard selected featured"
                : "bakingGuideModeCard featured"
            }
            onClick={() => onSelectMode?.("advanced")}
          >
            <strong>Advanced / Professional</strong>
            <span>
              Best for sourdough, fermentation control, bassinage, detailed mixing methods,
              and precise hydration management.
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
