import {
  Beef,
  ClipboardList,
  DollarSign,
  PackageCheck,
  Save,
  Scale
} from "lucide-react";
import StatCard from "./StatCard.jsx";

export default function LivestockGuideContent() {
  return (
    <div className="moduleGuideContent">
      <section className="moduleGuideIntro">
        <p>
          Livestock helps small farms track animal batches, input costs, processing
          yields, finished cuts, and inventory without turning the module into a
          complicated herd-management system.
        </p>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Overview</span>
          <h3>Start with the dashboard cards.</h3>
          <p>
            These show active batches, current head count, total livestock cost, and
            batches ready to send finished products to Inventory.
          </p>
        </div>

        <div className="moduleGuidePreview moduleGuideStatPreview">
          <StatCard icon={Beef} label="Active Batches" value="3" sub="Groups currently tracked" accent="livestock" />
          <StatCard icon={ClipboardList} label="Head Count" value="42" sub="Active animals" accent="market" />
          <StatCard icon={DollarSign} label="Total Cost" value="$2,840" sub="Animal, inputs, and processing" accent="pricing" />
          <StatCard icon={PackageCheck} label="Inventory Ready" value="1" sub="Batches with finished products" accent="inventory" />
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 1</span>
          <h3>Create animal batches instead of individual animal records.</h3>
          <p>
            Add groups like Spring Broilers, Pastured Pork Batch 1, or 2026 Beef
            Steers. This keeps the workflow fast for direct-to-consumer farms.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Batch Manager</p>
                <h4>Animal Batches</h4>
              </div>
              <Beef size={20} />
            </div>

            <div className="guideMiniGrid">
              <div>
                <span>Batch Name</span>
                <strong>Spring Broilers</strong>
              </div>
              <div>
                <span>Species</span>
                <strong>Chicken</strong>
              </div>
              <div>
                <span>Head Count</span>
                <strong>50</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>Growing</strong>
              </div>
            </div>

            <button className="guideMockButton" type="button">
              <Save size={14} />
              Save Batch
            </button>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 2</span>
          <h3>Log feed, hay, vet, processing, and other costs.</h3>
          <p>
            The module rolls these costs into the batch so you can see true cost per
            animal, per packaged pound, and per finished product.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Feed & Inputs</p>
                <h4>Input Cost Log</h4>
              </div>
              <ClipboardList size={20} />
            </div>

            <div className="guideRecipeRows">
              <div className="guideRecipeHeader">
                <span>Input</span>
                <span>Cost</span>
              </div>
              <div>
                <strong>Feed, 4 bags</strong>
                <span>$112.00</span>
              </div>
              <div>
                <strong>Processing deposit</strong>
                <span>$150.00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 3</span>
          <h3>Record processing weights and yield.</h3>
          <p>
            Add live weight, hanging weight, packaged weight, processor, pickup date,
            and processing fee. Livestock calculates yield percentages and cost per
            packaged pound.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Processing</p>
                <h4>Processing & Yield</h4>
              </div>
              <Scale size={20} />
            </div>

            <div className="guideMiniGrid three">
              <div>
                <span>Live</span>
                <strong>1,200 lb</strong>
              </div>
              <div>
                <span>Hanging</span>
                <strong>720 lb</strong>
              </div>
              <div>
                <span>Packaged</span>
                <strong>480 lb</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 4</span>
          <h3>Build finished product yields and add them to Inventory.</h3>
          <p>
            Add cuts like ground beef, ribeye, pork chops, whole chicken, sausage, or
            stew meat, then send the finished pounds or packages directly to Inventory.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Finished Products</p>
                <h4>Cut Yield Builder</h4>
              </div>
              <button className="guideMockButton" type="button">
                <PackageCheck size={14} />
                Add to Inventory
              </button>
            </div>

            <div className="guideRecipeRows">
              <div className="guideRecipeHeader">
                <span>Product</span>
                <span>Qty</span>
              </div>
              <div>
                <strong>Ground Beef</strong>
                <span>145 lb</span>
              </div>
              <div>
                <strong>Ribeye</strong>
                <span>28 lb</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
