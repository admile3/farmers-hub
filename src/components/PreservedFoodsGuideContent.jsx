import {
  Beaker,
  BookOpen,
  Calculator,
  ClipboardCheck,
  FlaskConical,
  PackageCheck,
  Save,
  Scale
} from "lucide-react";
import StatCard from "./StatCard.jsx";

export default function PreservedFoodsGuideContent() {
  return (
    <div className="moduleGuideContent">
      <section className="moduleGuideIntro">
        <p>
          Preserved Foods helps vendors build recipes, calculate brines, track
          production batches, record pH and processing details, and add finished jars
          into inventory.
        </p>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Overview</span>
          <h3>Start with the dashboard cards.</h3>
          <p>
            These summarize saved ingredients, recipes, logged batches, and finished
            jars from preserved food production.
          </p>
        </div>

        <div className="moduleGuidePreview moduleGuideStatPreview">
          <StatCard icon={Beaker} label="Ingredients" value="18" sub="Saved inputs" accent="preserved" />
          <StatCard icon={BookOpen} label="Recipes" value="7" sub="Saved formulas" accent="spice" />
          <StatCard icon={ClipboardCheck} label="Batches" value="12" sub="Production records" accent="market" />
          <StatCard icon={PackageCheck} label="Finished Jars" value="144" sub="Logged yield" accent="pricing" />
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 1</span>
          <h3>Add ingredients and packaging.</h3>
          <p>
            Save produce, vinegar, salt, sugar, spices, jars, lids, labels, and other
            inputs with cost information.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Pantry</p>
                <h4>Ingredient Pantry</h4>
              </div>
              <button className="guideMockButton" type="button">
                <Save size={14} />
                Save Ingredient
              </button>
            </div>

            <div className="guideMiniGrid">
              <div>
                <span>Ingredient</span>
                <strong>Cucumbers</strong>
              </div>
              <div>
                <span>Category</span>
                <strong>Produce</strong>
              </div>
              <div>
                <span>Cost</span>
                <strong>$2.40 / lb</strong>
              </div>
              <div>
                <span>Use</span>
                <strong>Recipe and batch costing</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 2</span>
          <h3>Build preserved food recipes.</h3>
          <p>
            Create recipes for pickles, ferments, relishes, hot sauces, canned vegetables,
            infused vinegars, jams, jellies, and similar products.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Recipe</p>
                <h4>Dill Pickle Spears</h4>
              </div>
              <FlaskConical size={18} />
            </div>

            <div className="guideRecipeRows">
              <div className="guideRecipeHeader">
                <span>Ingredient</span>
                <span>Amount</span>
              </div>
              <div>
                <strong>Cucumbers</strong>
                <span>12 lb</span>
              </div>
              <div>
                <strong>Vinegar</strong>
                <span>64 oz</span>
              </div>
              <div>
                <strong>Salt</strong>
                <span>3.5%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 3</span>
          <h3>Use the brine calculator.</h3>
          <p>
            Select a saved recipe, choose jar size and jar count, then calculate total
            fill volume, estimated brine volume, vinegar, water, salt, and sugar.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Calculator</p>
                <h4>Batch Brine</h4>
              </div>
              <Calculator size={18} />
            </div>

            <div className="guideMiniGrid three">
              <div>
                <span>Jars</span>
                <strong>24</strong>
              </div>
              <div>
                <span>Jar Size</span>
                <strong>16 oz</strong>
              </div>
              <div>
                <span>Brine Needed</span>
                <strong>172.8 oz</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 4</span>
          <h3>Log production batches.</h3>
          <p>
            Save the production date, lot number, pH, process method, jar yield,
            best-by date, and production notes for each batch.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Batch Log</p>
                <h4>Production Record</h4>
              </div>
              <ClipboardCheck size={18} />
            </div>

            <div className="guideMiniGrid">
              <div>
                <span>Lot</span>
                <strong>PF-2026-0618</strong>
              </div>
              <div>
                <span>pH</span>
                <strong>3.7</strong>
              </div>
              <div>
                <span>Process</span>
                <strong>Water Bath</strong>
              </div>
              <div>
                <span>Yield</span>
                <strong>24 jars</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="moduleGuideTip">
        <Scale size={18} />
        <p>
          Tip: keep ingredient, jar, lid, and label costs updated so each batch has
          better cost estimates.
        </p>
      </div>

      <div className="moduleGuideTip">
        <PackageCheck size={18} />
        <p>
          Finished batches can be added directly into Inventory so stock counts stay
          connected to production records.
        </p>
      </div>
    </div>
  );
}
