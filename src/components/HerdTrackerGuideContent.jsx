import {
  Beef,
  ClipboardList,
  DollarSign,
  History,
  PackageSearch,
  RefreshCcw,
} from "lucide-react";

export default function HerdTrackerGuideContent() {
  return (
    <div className="guideContent">
      <section className="guideIntro">
        <div className="guideIconCircle">
          <Beef size={26} />
        </div>

        <div>
          <h2>Herd Tracker Guide</h2>
          <p>
            Use Herd Tracker to follow animals from birth or purchase through care,
            costs, sale, loss, or processing transfer.
          </p>
        </div>
      </section>

      <section className="guideStepGrid">
        <article className="guideStepCard">
          <ClipboardList size={20} />
          <h3>1. Add Animal Records</h3>
          <p>
            Create records for purchased animals, animals born on the farm, or
            animals transferred into your operation.
          </p>
        </article>

        <article className="guideStepCard">
          <History size={20} />
          <h3>2. Track Timeline Events</h3>
          <p>
            Log weight checks, vet treatments, feed costs, pasture moves, vet
            treatments, breeding notes, sales, losses, and general notes.
          </p>
        </article>

        <article className="guideStepCard">
          <DollarSign size={20} />
          <h3>3. Watch Cost Basis</h3>
          <p>
            Purchase cost plus timeline costs creates the animal’s cost basis,
            helping you understand profitability later.
          </p>
        </article>

        <article className="guideStepCard">
          <RefreshCcw size={20} />
          <h3>4. Send to Butcher Board</h3>
          <p>
            When an animal is ready for processing, mark it for Butcher Board.
            The processing module can later use this record as its starting point.
          </p>
        </article>

        <article className="guideStepCard">
          <PackageSearch size={20} />
          <h3>5. Keep Modules Separate</h3>
          <p>
            Herd Tracker manages the live animal. Butcher Board manages processing.
            Inventory tracks finished meat. Products & Pricing handles sellable items.
          </p>
        </article>
      </section>
    </div>
  );
}
