import {
  Flower2,
  Library,
  Calculator,
  ClipboardCheck,
  PackageCheck,
  MapPin
} from "lucide-react";
import StatCard from "./StatCard.jsx";

export default function FlowerStudioGuideContent() {
  return (
    <div className="moduleGuideContent">
      <section className="moduleGuideIntro">
        <p>
          Flower Studio helps market flower vendors build stem libraries, create
          arrangements, calculate stem needs, log production, and add finished
          bouquets or arrangements into inventory.
        </p>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Overview</span>
          <h3>Start with your flower dashboard.</h3>
          <p>
            The dashboard summarizes your saved stems, arrangements, production
            logs, and finished arrangement yield.
          </p>
        </div>

        <div className="moduleGuidePreview moduleGuideStatPreview">
          <StatCard icon={Flower2} label="Flowers" value="22" sub="Saved stems" accent="flowers" />
          <StatCard icon={Library} label="Arrangements" value="6" sub="Saved recipes" accent="spice" />
          <StatCard icon={ClipboardCheck} label="Logs" value="9" sub="Production records" accent="market" />
          <StatCard icon={PackageCheck} label="Finished" value="84" sub="Arrangements made" accent="pricing" />
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 1</span>
          <h3>Import flowers by growing zone.</h3>
          <p>
            Enter a ZIP code or choose a USDA zone manually, then select suggested
            flowers to import into your Flower Pantry.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Zone Library</p>
                <h4>USDA Zone 6b</h4>
              </div>
              <MapPin size={18} />
            </div>

            <div className="guideRecipeRows">
              <div>
                <strong>Zinnia</strong>
                <span>Easy annual</span>
              </div>
              <div>
                <strong>Cosmos</strong>
                <span>Airy filler</span>
              </div>
              <div>
                <strong>Sunflower</strong>
                <span>Market focal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 2</span>
          <h3>Build reusable arrangements.</h3>
          <p>
            Create bouquet recipes with stem counts, greenery, filler, packaging,
            retail price, and wholesale price.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Arrangement</p>
                <h4>Summer Market Bouquet</h4>
              </div>
              <Flower2 size={18} />
            </div>

            <div className="guideRecipeRows">
              <div>
                <strong>Sunflower</strong>
                <span>3 stems</span>
              </div>
              <div>
                <strong>Zinnia</strong>
                <span>5 stems</span>
              </div>
              <div>
                <strong>Cosmos</strong>
                <span>4 stems</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 3</span>
          <h3>Calculate production needs.</h3>
          <p>
            Select an arrangement and quantity to calculate total stems, cost,
            revenue potential, and expected profit.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Stem Calculator</p>
                <h4>25 Market Bouquets</h4>
              </div>
              <Calculator size={18} />
            </div>

            <div className="guideMiniGrid three">
              <div>
                <span>Total Stems</span>
                <strong>300</strong>
              </div>
              <div>
                <span>Cost</span>
                <strong>$82.50</strong>
              </div>
              <div>
                <span>Revenue</span>
                <strong>$500</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="moduleGuideTip">
        <PackageCheck size={18} />
        <p>
          Finished arrangements can be added directly to Inventory so market stock
          and production records stay connected.
        </p>
      </div>
    </div>
  );
}
