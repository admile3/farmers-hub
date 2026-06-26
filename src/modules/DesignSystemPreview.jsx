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

import ConfirmDialog from "../components/ConfirmDialog.jsx";
import DataTable from "../components/DataTable.jsx";
import EmptyState from "../components/EmptyState.jsx";
import FilterBar from "../components/FilterBar.jsx";
import ModuleHero from "../components/ModuleHero.jsx";
import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import RecordList from "../components/RecordList.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusPill from "../components/StatusPill.jsx";
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

function getStatusVariant(status) {
  switch (status) {
    case "Active":
      return "success";
    case "Completed":
      return "primary";
    case "Archived":
      return "neutral";
    default:
      return "neutral";
  }
}

export default function DesignSystemPreview() {
  const [showGuide, setShowGuide] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingDeleteRow, setPendingDeleteRow] = useState(null);

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

  function handleDeleteClick(row) {
    setPendingDeleteRow(row);
    setShowConfirmDialog(true);
  }

  function handleCancelDelete() {
    setShowConfirmDialog(false);
    setPendingDeleteRow(null);
  }

  function handleConfirmDelete() {
    setShowConfirmDialog(false);
    setPendingDeleteRow(null);
  }

  return (
    <div className="modulePage designSystemPreviewModule">
      <ModuleHero
        eyebrow="Design System"
        accent="orders"
        icon={Package}
        title="Preview shared Farmers Hub layout components."
        description="Use this page to test shared heroes, stat cards, panels, filters, tables, record lists, empty states, buttons, forms, guide modals, status pills, and confirmation dialogs before applying them across every module."
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
                <StatusPill
                  label={row.status}
                  variant={getStatusVariant(row.status)}
                />
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
                  <button
                    type="button"
                    aria-label="Delete"
                    onClick={() => handleDeleteClick(row)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            }
          ]}
        />
      </WorkspacePanel>

      <WorkspacePanel
        eyebrow="Component"
        title="Record List"
        description="This previews compact record cards for modules that need a lighter directory pattern than a full table."
      >
        <RecordList
          records={sampleRows}
          selectedRecordId={selectedRowId}
          onRecordClick={handleRowOpen}
          getTitle={(record) => record.name}
          getSubtitle={(record) => record.customer}
          getMeta={(record) => [
            record.category,
            record.value,
            record.date
          ]}
          renderStatus={(record) => (
            <StatusPill
              label={record.status}
              variant={getStatusVariant(record.status)}
            />
          )}
          renderActions={(record) => (
            <div className="itemActions">
              <button
                type="button"
                aria-label="Edit"
                onClick={() => handleRowOpen(record)}
              >
                <Edit3 size={14} />
              </button>
              <button
                type="button"
                aria-label="Delete"
                onClick={() => handleDeleteClick(record)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        />
      </WorkspacePanel>

      <WorkspacePanel
        eyebrow="Component"
        title="Status Pill"
        description="This previews the shared status label used in tables, cards, record summaries, and module dashboards."
      >
        <div className="designSystemPreviewStack">
          <div className="designSystemPreviewRow">
            <StatusPill label="Success" variant="success" />
            <StatusPill label="Warning" variant="warning" />
            <StatusPill label="Danger" variant="danger" />
            <StatusPill label="Info" variant="info" />
            <StatusPill label="Neutral" variant="neutral" />
            <StatusPill label="Primary" variant="primary" />
          </div>

          <div className="designSystemPreviewRow">
            <StatusPill label="Open" variant="primary" />
            <StatusPill label="Paid" variant="success" />
            <StatusPill label="Low Stock" variant="warning" />
            <StatusPill label="Expired" variant="danger" />
            <StatusPill label="Draft" variant="neutral" />
          </div>
        </div>
      </WorkspacePanel>

      <WorkspacePanel
        eyebrow="Component"
        title="Confirm Dialog"
        description="This previews the shared confirmation dialog used for delete, archive, discard, and other confirmation actions."
        actions={[
          {
            label: "Open Dialog",
            icon: Trash2,
            variant: "secondary",
            onClick: () => {
              setPendingDeleteRow({
                name: "Example Record"
              });
              setShowConfirmDialog(true);
            }
          }
        ]}
      >
        <EmptyState
          icon={Trash2}
          title="Shared confirmation pattern"
          message="Use the button above, or the delete icon in the table or record list, to preview the reusable confirmation dialog."
          actions={[
            {
              label: "Preview Delete Dialog",
              icon: Trash2,
              onClick: () => {
                setPendingDeleteRow({
                  name: "Example Record"
                });
                setShowConfirmDialog(true);
              }
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

      <ConfirmDialog
        open={showConfirmDialog}
        title="Delete Record?"
        message={`Are you sure you want to delete "${
          pendingDeleteRow?.name || "this record"
        }"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

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
              <h3>Record List</h3>
              <p>
                Tests compact record cards for smaller directories, recent activity,
                side panels, and mobile-friendly record lists.
              </p>
            </article>

            <article className="guideStepCard">
              <h3>Status Pill</h3>
              <p>
                Tests shared status labels for records, tables, cards, and module
                summaries.
              </p>
            </article>

            <article className="guideStepCard">
              <h3>Confirm Dialog</h3>
              <p>
                Tests the shared confirmation pattern for delete, archive, discard,
                and other important actions.
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
