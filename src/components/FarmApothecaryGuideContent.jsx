import {
  ClipboardList,
  FlaskConical,
  Leaf,
  PackageCheck,
  ShoppingBag
} from "lucide-react";
import StatCard from "./StatCard.jsx";

export default function FarmApothecaryGuideContent() {
  return (
    <div className="moduleGuideContent">
      <section className="moduleGuideIntro">
        <p>
          Farm Apothecary helps you manage soaps, candles, balms, lotions, infused oils,
          materials, production events, finished products, pricing, and inventory from
          one batch-based workspace.
        </p>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Overview</span>
          <h3>Start with one working batch.</h3>
          <p>
            Create a new batch or edit an existing batch, then use the same central
            workspace to update details, ingredients, process events, and finished products.
          </p>
        </div>

        <div className="moduleGuidePreview moduleGuideStatPreview">
          <StatCard icon={Leaf} label="Active Batches" value="4" sub="batches tracked" accent="apothecary" />
          <StatCard icon={ClipboardList} label="Material Cost" value="$186.40" sub="saved ingredients" accent="pricing" />
          <StatCard icon={PackageCheck} label="Finished Products" value="8" sub="saved products" accent="inventory" />
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 1</span>
          <h3>Choose the product type.</h3>
          <p>
            Soap, Candle, Balm / Salve, Lotion / Cream, Infused Oil, and Other each
            use the same batch workflow, with product-specific timing and event options.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Batch Details</p>
                <h4>Product Batch</h4>
              </div>
              <FlaskConical size={20} />
            </div>

            <div className="guideMiniGrid">
              <div><span>Product Type</span><strong>Soap</strong></div>
              <div><span>Status</span><strong>Curing</strong></div>
              <div><span>Yield</span><strong>48 bars</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 2</span>
          <h3>Log ingredients and supplies.</h3>
          <p>
            Add oils, waxes, butters, herbs, fragrance, containers, labels, lids, jars,
            and packaging so every batch has an accurate material cost.
          </p>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 3</span>
          <h3>Track production events.</h3>
          <p>
            Log each step, such as pour, cut, cure complete, wick trim, bottle, label,
            or package, so the batch history stays clear.
          </p>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 4</span>
          <h3>Send finished products forward.</h3>
          <p>
            Finished products can be added to Products & Pricing or sent directly to
            Inventory using the same pattern as other Farmers Hub modules.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Finished Products</p>
                <h4>Product Yield</h4>
              </div>
              <div className="guideMiniActions">
                <ShoppingBag size={16} />
                <PackageCheck size={16} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
