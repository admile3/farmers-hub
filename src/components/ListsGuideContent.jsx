import {
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  Folder,
  FolderPlus,
  ListChecks,
  Percent,
  Search,
  Trash2
} from "lucide-react";
import StatCard from "./StatCard.jsx";

export default function ListsGuideContent() {
  return (
    <div className="moduleGuideContent">
      <section className="moduleGuideIntro">
        <p>
          Lists helps you create reusable checklists for market prep, production,
          packaging, delivery, shopping, permits, and repeat vendor workflows.
        </p>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Overview</span>
          <h3>Start with your list dashboard.</h3>
          <p>
            The dashboard shows how many lists you have, how many checklist items
            are saved, how many are completed, and your overall progress.
          </p>
        </div>

        <div className="moduleGuidePreview moduleGuideStatPreview">
          <StatCard icon={Folder} label="Lists" value="4" sub="Saved workflow lists" accent="lists" />
          <StatCard icon={ClipboardList} label="Total Items" value="32" sub="Checklist items across all lists" accent="market" />
          <StatCard icon={CheckSquare} label="Completed" value="18" sub="Items marked complete" accent="pricing" />
          <StatCard icon={Percent} label="Completion" value="56%" sub="Overall checklist progress" accent="sourdough" />
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 1</span>
          <h3>Create a reusable list.</h3>
          <p>
            Click New List, add a name, choose a category, and include a short
            description so the list is easy to recognize later.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">New List</p>
                <h4>Create New List</h4>
              </div>
              <button className="guideMockButton" type="button">
                <FolderPlus size={14} />
                New List
              </button>
            </div>

            <div className="guideMiniGrid">
              <div>
                <span>List Name</span>
                <strong>Saturday Market Pack List</strong>
              </div>
              <div>
                <span>Category</span>
                <strong>Market Prep</strong>
              </div>
              <div>
                <span>Description</span>
                <strong>Items to prep before leaving for market</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>Ready to build</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 2</span>
          <h3>Add checklist items.</h3>
          <p>
            Open a list and add each task one at a time. Use clear task names so
            the list can be reused without needing extra explanation.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Checklist</p>
                <h4>Add Items</h4>
              </div>
              <button className="guideMockButton" type="button">
                <ListChecks size={14} />
                Add Item
              </button>
            </div>

            <div className="guideRecipeRows">
              <div className="guideRecipeHeader">
                <span>Item</span>
                <span>Status</span>
              </div>
              <div>
                <strong>Pack clamshells</strong>
                <span>Open</span>
              </div>
              <div>
                <strong>Load tent weights</strong>
                <span>Open</span>
              </div>
              <div>
                <strong>Print product signs</strong>
                <span>Open</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 3</span>
          <h3>Check items off as you work.</h3>
          <p>
            Click the check circle or item name to mark an item complete. The
            list progress updates automatically.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Progress</p>
                <h4>Saturday Market Pack List</h4>
              </div>
            </div>

            <div className="guideRecipeRows">
              <div>
                <strong>Pack clamshells</strong>
                <span>✓ Done</span>
              </div>
              <div>
                <strong>Load tent weights</strong>
                <span>✓ Done</span>
              </div>
              <div>
                <strong>Print product signs</strong>
                <span>Open</span>
              </div>
            </div>

            <div className="listProgressTrack">
              <div className="listProgressFill" style={{ width: "66%" }} />
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 4</span>
          <h3>Search saved lists quickly.</h3>
          <p>
            Use the search bar to filter lists by name, category, or description
            once you have several saved workflows.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Find Lists</p>
                <h4>Search Saved Lists</h4>
              </div>
              <div className="guideSearchMock">
                <Search size={14} />
                <span>Search lists...</span>
              </div>
            </div>

            <div className="guideSavedRecipe">
              <strong>Saturday Market Pack List</strong>
              <span>Market Prep • 12 items • 8 complete</span>
            </div>

            <div className="guideSavedRecipe">
              <strong>Weekly Production Checklist</strong>
              <span>Production • 9 items • 3 complete</span>
            </div>
          </div>
        </div>
      </section>

      <div className="moduleGuideTip">
        <Trash2 size={18} />
        <p>
          Tip: delete lists and list items carefully. Removing them deletes that
          saved checklist data from the account.
        </p>
      </div>

      <div className="moduleGuideTip">
        <CheckCircle2 size={18} />
        <p>
          Many Farmers Hub modules have a Guide button in the hero section. If a
          user needs help, they can look for Guide at the top of the module.
        </p>
      </div>
    </div>
  );
}
