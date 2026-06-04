import {
  CheckCircle2,
  ClipboardList,
  FolderPlus,
  ListChecks,
  Search,
  Trash2
} from "lucide-react";

export default function ListsGuideContent() {
  return (
    <div className="moduleGuideContent">
      <section className="guideIntroCard">
        <div className="guideIntroIcon">
          <ClipboardList size={28} />
        </div>

        <div>
          <p className="eyebrow">Lists Guide</p>
          <h3>Use Lists to build reusable checklists for repeat workflows.</h3>
          <p>
            Lists are helpful for market prep, production runs, packaging,
            delivery, shopping, permits, and ideas you want to keep organized.
          </p>
        </div>
      </section>

      <section className="guideSection">
        <h4>Basic Workflow</h4>

        <div className="guideStepGrid">
          <div className="guideStepCard">
            <FolderPlus size={20} />
            <strong>1. Create a list</strong>
            <p>
              Click <b>New List</b>, give it a clear name, choose a category,
              and add an optional description.
            </p>
          </div>

          <div className="guideStepCard">
            <ListChecks size={20} />
            <strong>2. Add checklist items</strong>
            <p>
              Open the list and type each task into the add item field. Save
              each item as you build the list.
            </p>
          </div>

          <div className="guideStepCard">
            <CheckCircle2 size={20} />
            <strong>3. Check things off</strong>
            <p>
              Click the check circle or item name to mark an item complete.
              Progress updates automatically.
            </p>
          </div>
        </div>
      </section>

      <section className="guideSection">
        <h4>What the Dashboard Shows</h4>

        <ul className="guideBullets">
          <li>
            <b>Lists</b> shows how many saved workflow lists you have.
          </li>
          <li>
            <b>Total Items</b> counts all checklist items across every list.
          </li>
          <li>
            <b>Completed</b> shows how many items have been checked off.
          </li>
          <li>
            <b>Completion</b> gives your overall progress percentage.
          </li>
        </ul>
      </section>

      <section className="guideSection">
        <h4>Finding Lists</h4>

        <div className="guideCallout">
          <Search size={18} />
          <p>
            Use the search bar to filter lists by name, category, or description.
            This is useful once you have several reusable workflows saved.
          </p>
        </div>
      </section>

      <section className="guideSection">
        <h4>Cleaning Up</h4>

        <div className="guideCallout warning">
          <Trash2 size={18} />
          <p>
            Use the trash icon carefully. Deleting a list or item removes it
            from your saved account data.
          </p>
        </div>
      </section>

      <section className="guideSection">
        <h4>Good List Ideas</h4>

        <ul className="guideBullets">
          <li>Saturday market pack list</li>
          <li>Weekly production checklist</li>
          <li>Ingredient shopping list</li>
          <li>Packaging restock checklist</li>
          <li>Restaurant delivery prep</li>
          <li>Permit and compliance reminders</li>
        </ul>
      </section>
    </div>
  );
}
