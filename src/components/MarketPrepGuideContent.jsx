import {
  CalendarDays,
  ClipboardList,
  CloudSun,
  PackageCheck,
  Printer,
  Save,
  Sprout
} from "lucide-react";

export default function MarketPrepGuideContent() {
  return (
    <div className="moduleGuideContent marketPrepGuideContent">
      <section className="moduleGuideIntro">
        <p>
          Market Prep Planner helps you set up each market day, forecast what to bring,
          build a pack list, check weather, save plans, and print a working prep sheet.
        </p>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 1</span>
          <h3>Set Market Details.</h3>
          <p>
            Add the market name, date, location, zip code, and weather or demand notes.
            These details give the plan context and appear on the printed prep sheet.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Setup</p>
                <h4>Market Details</h4>
              </div>
              <CalendarDays size={20} />
            </div>

            <div className="guideMiniGrid">
              <div>
                <span>Market</span>
                <strong>Downtown Farmers Market</strong>
              </div>
              <div>
                <span>Date</span>
                <strong>Saturday</strong>
              </div>
              <div>
                <span>Location</span>
                <strong>Pavilion</strong>
              </div>
              <div>
                <span>Zip Code</span>
                <strong>40508</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 2</span>
          <h3>Check Weather.</h3>
          <p>
            Use the zip code and market date to pull a weather preview. Heat, rain,
            wind, or humidity can help you decide whether to adjust quantities or packing.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Weather Preview</p>
                <h4>Market Conditions</h4>
              </div>
              <CloudSun size={20} />
            </div>

            <div className="guideMiniGrid three">
              <div>
                <span>Temp</span>
                <strong>82°F / 66°F</strong>
              </div>
              <div>
                <span>Rain</span>
                <strong>25%</strong>
              </div>
              <div>
                <span>Wind</span>
                <strong>8 mph</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 3</span>
          <h3>Add Products to the Forecast.</h3>
          <p>
            Choose an existing product from linked modules, or enter one manually.
            Add its unit label, planned quantity, amount per unit, and optional buffer.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Add Product</p>
                <h4>Product Forecast</h4>
              </div>
              <Sprout size={20} />
            </div>

            <div className="guideMiniGrid">
              <div>
                <span>Product</span>
                <strong>Sourdough Loaf</strong>
              </div>
              <div>
                <span>Unit</span>
                <strong>loaf</strong>
              </div>
              <div>
                <span>Planned Qty</span>
                <strong>18</strong>
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
          <span className="moduleGuideStepNumber">Step 4</span>
          <h3>Review Category Summary.</h3>
          <p>
            The summary groups your plan by product type so you can quickly see how many
            items and planned units are assigned to categories like Produce, Bread, Spices, or Flowers.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Summary</p>
                <h4>Category Summary</h4>
              </div>
              <ClipboardList size={20} />
            </div>

            <div className="guideSavedRecipe">
              <strong>Bread</strong>
              <span>2 items • 42 planned units</span>
            </div>

            <div className="guideSavedRecipe">
              <strong>Spices</strong>
              <span>3 items • 75 planned units</span>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 5</span>
          <h3>Build the Pack List.</h3>
          <p>
            Review each product line, adjust quantities, add notes, and check items off as packed.
            The planner calculates total target amounts with buffers included.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Pack List</p>
                <h4>Market Pack + Prep Plan</h4>
              </div>
              <PackageCheck size={20} />
            </div>

            <div className="guideRecipeRows">
              <div className="guideRecipeHeader">
                <span>Product</span>
                <span>Target</span>
              </div>
              <div>
                <strong>Tomatoes</strong>
                <span>14 lb</span>
              </div>
              <div>
                <strong>Seasoning Pouch</strong>
                <span>6 oz</span>
              </div>
              <div>
                <strong>Sourdough Loaf</strong>
                <span>18</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 6</span>
          <h3>Save, Print, or Reuse Plans.</h3>
          <p>
            Save a market plan for later, print a prep sheet for market day, or load a saved
            plan to reuse it as a starting point for a future market.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Saved Plans</p>
                <h4>Plan Actions</h4>
              </div>
              <Save size={20} />
            </div>

            <div className="marketPrepGuideActionRow">
              <span><Save size={14} /> Save</span>
              <span><Printer size={14} /> Print</span>
              <span><ClipboardList size={14} /> Load Saved</span>
            </div>
          </div>
        </div>
      </section>

      <div className="moduleGuideTip">
        <Sprout size={18} />
        <p>
          Tip: load sample products when learning the module, then replace them with your real market items.
        </p>
      </div>
    </div>
  );
}
