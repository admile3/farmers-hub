import { useMemo, useState } from "react";
import {
  Archive,
  CalendarDays,
  CircleHelp,
  DollarSign,
  Edit3,
  Inbox,
  Package,
  Plus,
  RefreshCw,
  Save,
  Sprout,
  Trash2
} from "lucide-react";

import DataTable from "../components/DataTable.jsx";
import EmptyState from "../components/EmptyState.jsx";
import FilterBar from "../components/FilterBar.jsx";
import ModuleHero from "../components/ModuleHero.jsx";
import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import StatCard from "../components/StatCard.jsx";
import WorkspacePanel from "../components/WorkspacePanel.jsx";

const sampleRows = [
  {
    id: "order-1",
    name: "Market Order",
    customer: "Lexington Farmers Market",
    category: "Orders",
    status: "Active",
    value: "$124.50",
    date: "Today"
  },
  {
    id: "order-2",
    name: "Wholesale Delivery",
    customer: "Chef Account",
    category: "Customers",
    status: "Completed",
    value: "$268.00",
    date: "Tomorrow"
  },
  {
    id: "order-3",
    name: "Freezer Inventory",
    customer: "Internal",
    category: "Inventory",
    status: "Archived",
    value: "$86.25",
    date: "Jun 28"
  }
];

export default function DesignSystemPreview() {
  const [showGuide, setShowGuide] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [selectedRowId, setSelectedRowId] = useState("order-1");

  const filteredRows = useMemo(() => {
    return sampleRows.filter((row) => {
      const searchText = `${row.name} ${row.customer} ${row.category} ${row.status}`
        .toLowerCase()
        .trim();

      const matchesSearch =
        !search.trim() || searchText.includes(search.toLowerCase().trim());
      const matchesCategory = category === "All" || row.category === category;
      const matchesStatus = status === "All" || row.status === status;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [search, category, status]);

  function handleRowOpen(row) {
    setSelectedRowId(row.id);
  }

  return (
    <div className="modulePage designSystemPreviewModule">
      <ModuleHero
        eyebrow="Design System"
        accent="orders"
        icon={Package}
        title="Preview shared Farmers Hub layout components."
        description="Use this page to test shared heroes, stat cards, panels, filters, tables, empty states, buttons, forms, lists, and guide modals before applying them across every module."
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
        eyebrow="Directory"
        title="Shared Directory Pattern"
        description="Click a record name or double-click a row to open it. On mobile, the same table automatically becomes stacked cards."
        actions={[
          {
            label: "Refresh",
            icon: RefreshCw,
            variant: "secondary",
            onClick: () => {}
          }
        ]}
        toolbar={
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search records..."
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
        <DataTable
          rows={filteredRows}
          selectedRowId={selectedRowId}
          onRowClick={handleRowOpen}
          emptyMessage="No sample records match your filters."
          columns={[
            {
              key: "name",
              label: "Record",
              width: "minmax(210px, 1.3fr)",
              isPrimary: true,
              mobileLabel: false,
              render: (row) => (
                <>
                  <strong>{row.name}</strong>
                  <span>{row.customer}</span>
                </>
              )
            },
            {
              key: "category",
              label: "Category",
              width: "140px"
            },
            {
              key: "status",
              label: "Status",
              width: "140px",
              render: (row) => (
                <span className={`orderStatusPill ${row.status.toLowerCase()}`}>
                  {row.status}
                </span>
              )
            },
            {
              key: "value",
              label: "Value",
              width: "120px"
            },
            {
              key: "date",
              label: "Date",
              width: "120px"
            },
            {
              key: "actions",
              label: "Actions",
              width: "100px",
              mobileLabel: false,
              render: (row) => (
                <div className="itemActions">
                  <button
                    type="button"
                    aria-label="Edit"
                    onClick={() => handleRowOpen(row)}
                  >
                    <Edit3 size={14} />
                  </button>
                  <button type="button" aria-label="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            }
          ]}
        />
      </WorkspacePanel>

      <WorkspacePanel
        eyebrow="Selected Record"
        title="Directory Interaction Preview"
        description="This panel confirms that clicking a record name or edit icon selects the row and can open a future editor."
      >
        {selectedRowId ? (
          <div className="placeholderBox compactPlaceholder">
            Selected record: <strong>{selectedRowId}</strong>
          </div>
        ) : (
          <EmptyState
            icon={Inbox}
            title="No record selected"
            message="Click a record name in the shared directory to select it."
          />
        )}
      </WorkspacePanel>

      <WorkspacePanel
        eyebrow="Empty States"
        title="Shared Empty State Pattern"
        description="This previews the standard no-records state used when tables, lists, or directories do not have content yet."
      >
        <EmptyState
          icon={Inbox}
          title="No sample records yet"
          message="Use this component whenever a module has no saved records, no filtered results, or no activity yet."
          actions={[
            {
              label: "Add Example",
              icon: Plus,
              onClick: () => {}
            },
            {
              label: "Learn More",
              icon: CircleHelp,
              variant: "secondary",
              onClick: () => setShowGuide(true)
            }
          ]}
        />
      </WorkspacePanel>

      <WorkspacePanel
        eyebrow="Editor"
        title="Shared Form Pattern"
        description="This panel demonstrates the standard editor layout used for creating or updating records."
        actions={[
          {
            label: "Save",
            icon: Save,
            onClick: () => {}
          }
        ]}
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

          <label>
            Example Date
            <input type="date" />
          </label>

          <label>
            Example Number
            <input type="number" placeholder="0.00" />
          </label>

          <label className="fullSpan">
            Example Notes
            <textarea placeholder="This previews textarea styling." />
          </label>
        </div>
      </WorkspacePanel>

      <WorkspacePanel
        eyebrow="Cards"
        title="Shared Card / List Pattern"
        description="This panel previews compact saved item rows for modules that use card-style directories."
      >
        <div className="savedList compactSavedList">
          {["Market Order", "Wholesale Delivery", "Custom Bundle"].map((item) => (
            <div className="savedItem compactSavedItem" key={item}>
              <div>
                <h4>{item}</h4>
                <p>Example supporting text, status, date, and value.</p>
              </div>

              <div className="itemActions">
                <button type="button">
                  <Edit3 size={14} />
                </button>
                <button type="button">
                  <Trash2 size={14} />
                </button>
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
              <p>Tests WorkspacePanel headers, toolbars, actions, and body spacing.</p>
            </article>

            <article className="guideStepCard">
              <h3>Filter Bar</h3>
              <p>Tests shared search, dropdown filters, and toolbar actions.</p>
            </article>

            <article className="guideStepCard">
              <h3>Data Table</h3>
              <p>
                Tests clickable record names, selected rows, reusable desktop tables,
                and mobile card-style behavior.
              </p>
            </article>

            <article className="guideStepCard">
              <h3>Empty State</h3>
              <p>Tests reusable no-records messaging and empty directory layouts.</p>
            </article>

            <article className="guideStepCard">
              <h3>Guide Modal</h3>
              <p>Tests popup layout, scrolling, close behavior, and dismissal checkbox.</p>
            </article>
          </section>
        </div>
      </ModuleGuideModal>
    </div>
  );
}
