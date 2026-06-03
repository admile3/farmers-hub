import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Leaf,
  Search,
  Sprout
} from "lucide-react";

export default function PlantingSchedulerGuideContent() {
  return (
    <div className="moduleGuideContent plantingGuideContent">
      <section className="moduleGuideIntro">
        <p>
          Planting Scheduler helps you save crop templates, schedule planting batches,
          and track growing tasks from seed to harvest.
        </p>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 1</span>
          <h3>Create crop templates.</h3>
          <p>
            Save reusable crop profiles with the crop name, variety, growing method,
            germination days, blackout days, days to harvest, default quantity unit,
            location, and notes.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Templates</p>
                <h4>Crop Template</h4>
              </div>
              <Leaf size={20} />
            </div>

            <div className="guideMiniGrid three">
              <div>
                <span>Crop</span>
                <strong>Sunflower</strong>
              </div>
              <div>
                <span>Method</span>
                <strong>Microgreen tray</strong>
              </div>
              <div>
                <span>Harvest</span>
                <strong>10 days</strong>
              </div>
            </div>

            <div className="guideSavedRecipe">
              <strong>Template timing</strong>
              <span>Use timing once, then reuse it for future batches.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 2</span>
          <h3>Schedule a planting batch.</h3>
          <p>
            Use a saved template or enter a crop manually. Add the planting date,
            target harvest date, quantity, location, and current status.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Builder</p>
                <h4>Planting Batch</h4>
              </div>
              <Sprout size={20} />
            </div>

            <div className="guideMiniGrid">
              <div>
                <span>Template</span>
                <strong>Rambo Radish</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>Planted</strong>
              </div>
              <div>
                <span>Quantity</span>
                <strong>4 trays</strong>
              </div>
              <div>
                <span>Location</span>
                <strong>Rack 2</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 3</span>
          <h3>Let dates auto-calculate.</h3>
          <p>
            When you choose a template and planting date, the scheduler calculates
            germination, move-to-light, transplant, and harvest dates. You can also
            work backward from a target harvest date.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Date Preview</p>
                <h4>Plant → Move → Harvest</h4>
              </div>
              <CalendarDays size={20} />
            </div>

            <div className="guideMiniGrid three">
              <div>
                <span>Plant</span>
                <strong>Jun 3</strong>
              </div>
              <div>
                <span>Move</span>
                <strong>Jun 8</strong>
              </div>
              <div>
                <span>Harvest</span>
                <strong>Jun 13</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 4</span>
          <h3>Review upcoming tasks.</h3>
          <p>
            Use the task board to see planting, germination, move, transplant, and
            harvest tasks. Filter by task type or date range to focus on what needs
            attention next.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Tasks</p>
                <h4>Upcoming Planting Tasks</h4>
              </div>
              <ClipboardList size={20} />
            </div>

            <div className="plantingGuideTaskList">
              <div>
                <strong>Plant</strong>
                <span>Plant Basil, Genovese</span>
                <small>Today</small>
              </div>
              <div>
                <strong>Harvest</strong>
                <span>Harvest Sunflower</span>
                <small>In 2 days</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 5</span>
          <h3>Track active batches.</h3>
          <p>
            Use the batch list to search, filter, load, update, or delete plantings.
            Statuses help separate planned, active, ready, harvested, and failed crops.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Schedule</p>
                <h4>Planting Batches</h4>
              </div>
              <Search size={20} />
            </div>

            <div className="guideSavedRecipe">
              <strong>Rambo Radish</strong>
              <span>4 trays • Rack 2 • Harvest Jun 13 • Ready</span>
            </div>

            <div className="guideSavedRecipe">
              <strong>Basil, Genovese</strong>
              <span>24 cells • Greenhouse • Plant Jun 3 • Planned</span>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 6</span>
          <h3>Use the template library.</h3>
          <p>
            Reload saved templates to speed up recurring crops and keep timing consistent
            across repeated plantings.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Templates</p>
                <h4>Crop Template Library</h4>
              </div>
              <CheckCircle2 size={20} />
            </div>

            <div className="guideRecipeRows">
              <div className="guideRecipeHeader">
                <span>Template</span>
                <span>Days</span>
              </div>
              <div>
                <strong>Sunflower</strong>
                <span>10</span>
              </div>
              <div>
                <strong>Rambo Radish</strong>
                <span>8</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="moduleGuideTip plantingGuideTip">
        <Leaf size={18} />
        <p>
          Tip: start with templates for crops you grow often, then use those templates
          to create faster, more consistent planting batches.
        </p>
      </div>
    </div>
  );
}
