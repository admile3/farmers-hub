import { useState } from "react";
import {
  Archive,
  CalendarDays,
  CircleHelp,
  DollarSign,
  Package,
  Plus,
  RefreshCw,
  Save,
  Sprout
} from "lucide-react";

import FilterBar from "../components/FilterBar.jsx";
import ModuleHero from "../components/ModuleHero.jsx";
import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import StatCard from "../components/StatCard.jsx";
import WorkspacePanel from "../components/WorkspacePanel.jsx";

export default function DesignSystemPreview() {
  const [showGuide, setShowGuide] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");

  return (
    <div className="modulePage designSystemPreviewModule">
      <ModuleHero
        eyebrow="Design System"
        accent="orders"
        icon={Package}
        title="Preview shared Farmers Hub layout components."
        description="Use this page to test shared heroes, stat cards, panels, filters, buttons, forms, lists, and guide modals before applying them across every module."
        actions={[
          {
            label: "Guide",
            icon: CircleHelp,
            variant: "secondary",
            onClick: () => setShowGuide(true)
          },
          {
            label: "Primary Action",
            icon: Plus,
            onClick: () => {}
          }
        ]}
      />

      <section className="hubStatGrid">
        <StatCard
          icon={Package}
          label="Orders"
          value="24"
          sub="active records"
          accent="orders"
        />

        <StatCard
          icon={DollarSign}
          label="Revenue"
          value="$1,247.50"
          sub="month to date"
          accent="pricing"
        />

        <StatCard
          icon={Archive}
          label="Inventory"
          value="86"
          sub="items tracked"
          accent="inventory"
        />

        <StatCard
          icon={CalendarDays}
          label="Events"
          value="7"
          sub="upcoming"
          accent="calendar"
        />
      </section>

      <WorkspacePanel
        eyebrow="Workspace Panel"
        title="Shared Panel Header"
        description="This panel previews the shared section card used for directories, editors, calculators, logs, and summaries."
        actions={[
          {
            label: "Refresh",
            icon: RefreshCw,
            variant: "secondary",
            onClick: () => {}
          },
          {
            label: "Save",
            icon: Save,
            onClick: () => {}
          }
        ]}
        toolbar={
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search example records..."
            filters={[
              {
                label: "Category",
                value: category,
                onChange: setCategory,
                options: ["All", "Orders", "Customers", "Inventory"]
              },
              {
                label: "Status",
                value: status,
                onChange: setStatus,
                options: ["All", "Active", "Completed", "Archived"]
              }
            ]}
            actions={[
              {
                label: "New Record",
                icon: Plus,
                onClick: () => {}
              }
            ]}
          />
        }
      >
        <div className="formGrid compactFormGrid">
          <label>
            Example Input
            <input placeholder="Type something..." />
          </label>

          <label>
            Example Select
            <select defaultValue="one">
              <option value="one">Option One</option>
              <option value="two">Option Two</option>
            </select>
          </label>

          <label className="fullSpan">
            Example Notes
            <textarea placeholder="This previews textarea styling." />
          </label>
        </div>
      </WorkspacePanel>

      <WorkspacePanel
        eyebrow="Directory"
        title="Shared List Preview"
        description="This previews saved item rows and action buttons."
      >
        <div className="savedList compactSavedList">
          {["Market Order", "Wholesale Delivery", "Custom Bundle"].map((item) => (
            <div className="savedItem compactSavedItem" key={item}>
              <div>
                <h4>{item}</h4>
                <p>Example supporting text, status, date, and value.</p>
              </div>

              <div className="itemActions">
                <button type="button">Edit</button>
                <button type="button">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </WorkspacePanel>

      <ModuleGuideModal
        isOpen={showGuide}
        moduleKey="design-system-preview"
        accent="orders"
        icon={Sprout}
        title="Design System Preview Guide"
        onClose={() => setShowGuide(false)}
      >
        <div className="guideContent">
          <section className="guideIntro">
            <div className="guideIconCircle">
              <Sprout size={26} />
            </div>

            <div>
              <h2>Shared Component Testing</h2>
              <p>
                This page lets you test shared Farmers Hub layout components before
                applying them to production modules.
              </p>
            </div>
          </section>

          <section className="guideStepGrid">
            <article className="guideStepCard">
              <h3>Hero</h3>
              <p>Tests ModuleHero layout, accent color, icon, and action buttons.</p>
            </article>

            <article className="guideStepCard">
              <h3>Stats</h3>
              <p>Tests StatCard colors, spacing, icons, and responsive behavior.</p>
            </article>

            <article className="guideStepCard">
              <h3>Panels</h3>
              <p>Tests WorkspacePanel headers, actions, forms, and saved rows.</p>
            </article>

            <article className="guideStepCard">
              <h3>Filter Bar</h3>
              <p>Tests shared search, dropdown filters, and toolbar actions.</p>
            </article>

            <article className="guideStepCard">
              <h3>Guide Modal</h3>
              <p>Tests guide popup layout, scrolling, close behavior, and dismissal checkbox.</p>
            </article>
          </section>
        </div>
      </ModuleGuideModal>
    </div>
  );
}
