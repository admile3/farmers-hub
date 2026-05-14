import { Beaker, Calculator, Library, Plus, Scale } from "lucide-react";

export default function SpiceKitchen() {
  return (
    <div className="modulePage spicePage">
      <section className="moduleHero">
        <div>
          <p className="eyebrow">Spice Kitchen</p>
          <h2>Build, scale, and organize seasoning recipes.</h2>
          <p>
            This module will become the production workspace for spice blends,
            ingredient tracking, recipe scaling, and batch prep.
          </p>
        </div>

        <button className="primaryButton">
          <Plus size={18} />
          New Recipe
        </button>
      </section>

      <section className="toolGrid">
        <div className="toolCard">
          <Library size={24} />
          <h3>Ingredient Pantry</h3>
          <p>
            Save ingredients, categories, notes, supplier links, and production flags.
          </p>
        </div>

        <div className="toolCard">
          <Beaker size={24} />
          <h3>Recipe Builder</h3>
          <p>
            Create blends by parts, percentages, or grams with reusable ingredients.
          </p>
        </div>

        <div className="toolCard">
          <Scale size={24} />
          <h3>Batch Scaling</h3>
          <p>
            Scale recipes to finished ounces, grams, package counts, or overage targets.
          </p>
        </div>

        <div className="toolCard">
          <Calculator size={24} />
          <h3>Cost Calculator</h3>
          <p>
            Estimate batch cost, cost per package, margins, and wholesale pricing.
          </p>
        </div>
      </section>

      <section className="workspacePanel">
        <div className="workspaceHeader">
          <div>
            <p className="eyebrow">Starter workspace</p>
            <h3>Next build area</h3>
          </div>
        </div>

        <div className="placeholderBox">
          <p>
            The next step is adding the real Spice Kitchen tools: Ingredient Pantry,
            Saved Recipes, Recipe Builder, and Batch Calculator.
          </p>
        </div>
      </section>
    </div>
  );
}
