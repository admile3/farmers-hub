import { useMemo, useState } from "react";
import {
  Archive,
  CalendarDays,
  CircleHelp,
  Copy,
  DollarSign,
  Edit3,
  Inbox,
  Package,
  Plus,
  Printer,
  RefreshCw,
  Sprout,
  Trash2
} from "lucide-react";

import ActionMenu from "../components/ActionMenu.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import DataTable from "../components/DataTable.jsx";
import EmptyState from "../components/EmptyState.jsx";
import FilterBar from "../components/FilterBar.jsx";
import FormField from "../components/FormField.jsx";
import ModuleHero from "../components/ModuleHero.jsx";
import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import RecordList from "../components/RecordList.jsx";
import SaveButton from "../components/SaveButton.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusPill from "../components/StatusPill.jsx";
import Toast from "../components/Toast.jsx";
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
  const [toast, setToast] = useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [selectedRowId, setSelectedRowId] = useState("order-1");

  const [saveDirty, setSaveDirty] = useState(false);
  const [saveSaving, setSaveSaving] = useState(false);
  const [saveSaved, setSaveSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

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

  function showToast(nextToast) {
    setToast(nextToast);

    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  function handleRowOpen(row) {
    setSelectedRowId(row.id);
  }

  function handleDeleteClick(row) {
    setPendingDeleteRow(row);
    setShowConfirmDialog(true);
  }

  function handleActionToast(title, message, variant = "success") {
    showToast({
      variant,
      title,
      message
    });
  }

  function handleCancelDelete() {
    setShowConfirmDialog(false);
    setPendingDeleteRow(null);
  }

  function handleConfirmDelete() {
    showToast({
      variant: "success",
      title: "Record deleted",
      message: `${pendingDeleteRow?.name || "Record"} was removed.`
    });

    setShowConfirmDialog(false);
    setPendingDeleteRow(null);
  }

  function resetSavePreview() {
    setSaveDirty(false);
    setSaveSaving(false);
    setSaveSaved(false);
    setSaveError(false);
  }

  function markSaveDirty() {
    setSaveDirty(true);
    setSaveSaving(false);
    setSaveSaved(false);
    setSaveError(false);
  }

  function handlePreviewSave() {
    if (!saveDirty || saveSaving) return;

    setSaveSaving(true);
    setSaveSaved(false);
    setSaveError(false);

    window.setTimeout(() => {
      setSaveSaving(false);
      setSaveDirty(false);
      setSaveSaved(true);

      showToast({
        variant: "success",
        title: "Changes saved",
        message: "Your updates were saved successfully."
      });

      window.setTimeout(() => {
        setSaveSaved(false);
      }, 1200);
    }, 900);
  }

  function handlePreviewSaveError() {
    setSaveDirty(false);
    setSaveSaving(false);
    setSaveSaved(false);
    setSaveError(true);

    showToast({
      variant: "error",
      title: "Save failed",
      message: "Your changes could not be saved. Please try again."
    });

    window.setTimeout(() => {
      setSaveError(false);
      setSaveDirty(true);
    }, 1400);
  }

  function getActionMenuItems(row) {
    return [
      {
        label: "Edit",
        icon: Edit3,
        onClick: () => handleRowOpen(row)
      },
      {
        label: "Duplicate",
        icon: Copy,
        onClick: () =>
          handleActionToast("Record duplicated", `${row.name} was duplicated.`)
      },
      {
        label: "Print",
        icon: Printer,
        onClick: () =>
          handleActionToast("Print preview", `${row.name} is ready to print.`, "info")
      },
      {
        divider: true
      },
      {
        label: "Archive",
        icon: Archive,
        onClick: () =>
          handleActionToast("Record archived", `${row.name} was archived.`, "warning")
      },
      {
        label: "Delete",
        icon: Trash2,
        destructive: true,
        onClick: () => handleDeleteClick(row)
      }
    ];
  }

  return (
    <div className="modulePage designSystemPreviewModule">
      <ModuleHero
        eyebrow="Design System"
        accent="orders"
        icon={Package}
        title="Preview shared Farmers Hub layout components."
        description="Use this page to test shared heroes, stat cards, panels, filters, tables, record lists, empty states, buttons, forms, guide modals, status pills, confirmation dialogs, save states, toast notifications, action menus, and form fields before applying them across every module."
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
        <StatCard icon={Package} label="Orders" value="24" sub="active records" accent="orders" />
        <StatCard icon={DollarSign} label="Revenue" value="$1,247.50" sub="month to date" accent="pricing" />
        <StatCard icon={Archive} label="Inventory" value="86" sub="items tracked" accent="inventory" />
        <StatCard icon={CalendarDays} label="Events" value="7" sub="upcoming" accent="calendar" />
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
            { key: "category", label: "Category", width: "140px" },
            {
              key: "status",
              label: "Status",
              width: "140px",
              render: (row) => (
                <StatusPill label={row.status} variant={getStatusVariant(row.status)} />
              )
            },
            { key: "value", label: "Value", width: "120px" },
            { key: "date", label: "Date", width: "120px" },
            {
              key: "actions",
              label: "Actions",
              width: "100px",
              mobileLabel: false,
              render: (row) => (
                <div className="itemActions">
                  <button type="button" aria-label="Edit" onClick={() => handleRowOpen(row)}>
                    <Edit3 size={14} />
                  </button>
                  <button type="button" aria-label="Delete" onClick={() => handleDeleteClick(row)}>
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
        title="Action Menu"
        description="This previews the shared overflow menu for records with three or more available actions."
      >
        <RecordList
          records={sampleRows}
          selectedRecordId={selectedRowId}
          onRecordClick={handleRowOpen}
          getTitle={(record) => record.name}
          getSubtitle={(record) => record.customer}
          getMeta={(record) => [
            { label: "Category", value: record.category },
            { label: "Value", value: record.value },
            { label: "Date", value: record.date }
          ]}
          renderStatus={(record) => (
            <StatusPill label={record.status} variant={getStatusVariant(record.status)} />
          )}
          renderActions={(record) => (
            <ActionMenu items={getActionMenuItems(record)} />
          )}
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
            { label: "Category", value: record.category },
            { label: "Value", value: record.value },
            { label: "Date", value: record.date }
          ]}
          renderStatus={(record) => (
            <StatusPill label={record.status} variant={getStatusVariant(record.status)} />
          )}
          renderActions={(record) => (
            <div className="itemActions">
              <button type="button" aria-label="Edit" onClick={() => handleRowOpen(record)}>
                <Edit3 size={14} />
              </button>
              <button type="button" aria-label="Delete" onClick={() => handleDeleteClick(record)}>
                <Trash2 size={14} />
              </button>
            </div>
          )}
        />
      </WorkspacePanel>

      <WorkspacePanel
        eyebrow="Component"
        title="Save Button"
        description="This previews the shared save workflow for unchanged, unsaved, saving, saved, and failed save states."
        actions={[
          { label: "Mark Changed", icon: Edit3, variant: "secondary", onClick: markSaveDirty },
          { label: "Reset", icon: RefreshCw, variant: "secondary", onClick: resetSavePreview }
        ]}
      >
        <div className="placeholderBox compactPlaceholder">
          Edit the sample field or click <strong>Mark Changed</strong> to preview the orange unsaved state.
        </div>

        <div className="formGrid compactFormGrid">
          <FormField label="Example Editable Field">
            <input placeholder="Type here to trigger Save Changes..." onChange={markSaveDirty} />
          </FormField>

          <FormField label="Example Select">
            <select defaultValue="one" onChange={markSaveDirty}>
              <option value="one">Option One</option>
              <option value="two">Option Two</option>
            </select>
          </FormField>
        </div>

        <div className="button-row" style={{ marginTop: "12px" }}>
          <SaveButton
            dirty={saveDirty}
            saving={saveSaving}
            saved={saveSaved}
            error={saveError}
            onClick={handlePreviewSave}
          />

          <button type="button" className="secondaryButton compactButton" onClick={handlePreviewSaveError}>
            Preview Error
          </button>
        </div>
      </WorkspacePanel>

      <WorkspacePanel
        eyebrow="Component"
        title="Toast"
        description="This previews the shared temporary notification used after saves, deletes, edits, archive actions, errors, and general updates."
      >
        <div className="button-row">
          <button type="button" className="secondaryButton compactButton" onClick={() => showToast({ variant: "success", title: "Changes saved", message: "Your updates were saved successfully." })}>
            Success Toast
          </button>
          <button type="button" className="secondaryButton compactButton" onClick={() => showToast({ variant: "info", title: "Heads up", message: "This is an informational notification." })}>
            Info Toast
          </button>
          <button type="button" className="secondaryButton compactButton" onClick={() => showToast({ variant: "warning", title: "Check this", message: "This action may need your attention." })}>
            Warning Toast
          </button>
          <button type="button" className="secondaryButton compactButton" onClick={() => showToast({ variant: "error", title: "Something went wrong", message: "Please try again." })}>
            Error Toast
          </button>
        </div>
      </WorkspacePanel>

      <WorkspacePanel
        eyebrow="Component"
        title="Form Field"
        description="This previews the shared field wrapper for labels, helper text, required marks, errors, disabled fields, and full-width fields."
      >
        <div className="formGrid compactFormGrid">
          <FormField label="Normal Field">
            <input placeholder="Standard input..." />
          </FormField>

          <FormField label="Required Field" required>
            <input placeholder="Required input..." />
          </FormField>

          <FormField
            label="Field With Helper"
            helper="Helper text gives users extra context without crowding the label."
          >
            <input placeholder="Input with helper text..." />
          </FormField>

          <FormField
            label="Field With Error"
            error="This field needs attention."
            required
          >
            <input placeholder="Error example..." />
          </FormField>

          <FormField
            label="Disabled Field"
            helper="Disabled fields should still be readable, but not editable."
            disabled
          >
            <input placeholder="Disabled input..." disabled />
          </FormField>

          <FormField label="Example Select">
            <select defaultValue="one">
              <option value="one">Option One</option>
              <option value="two">Option Two</option>
            </select>
          </FormField>

          <FormField
            label="Full Width Notes"
            helper="Use fullWidth for longer text fields, descriptions, notes, and instructions."
            fullWidth
          >
            <textarea placeholder="This previews a full-width textarea." />
          </FormField>
        </div>
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
              setPendingDeleteRow({ name: "Example Record" });
              setShowConfirmDialog(true);
            }
          }
        ]}
      >
        <EmptyState
          icon={Trash2}
          title="Shared confirmation pattern"
          message="Use the button above, or the delete icon in the table, record list, or action menu to preview the reusable confirmation dialog."
          actions={[
            {
              label: "Preview Delete Dialog",
              icon: Trash2,
              onClick: () => {
                setPendingDeleteRow({ name: "Example Record" });
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
          <EmptyState icon={Inbox} title="No record selected" message="Click a record name in the shared directory to select it." />
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
            { label: "Add Example", icon: Plus, onClick: () => {} },
            { label: "Learn More", icon: CircleHelp, variant: "secondary", onClick: () => setShowGuide(true) }
          ]}
        />
      </WorkspacePanel>

      <WorkspacePanel
        eyebrow="Editor"
        title="Shared Form Pattern"
        description="This panel demonstrates the standard editor layout used for creating or updating records."
      >
        <div className="formGrid compactFormGrid">
          <FormField label="Example Input">
            <input placeholder="Type something..." onChange={markSaveDirty} />
          </FormField>

          <FormField label="Example Select">
            <select defaultValue="one" onChange={markSaveDirty}>
              <option value="one">Option One</option>
              <option value="two">Option Two</option>
            </select>
          </FormField>

          <FormField label="Example Date">
            <input type="date" onChange={markSaveDirty} />
          </FormField>

          <FormField label="Example Number">
            <input type="number" placeholder="0.00" onChange={markSaveDirty} />
          </FormField>

          <FormField label="Example Notes" fullWidth>
            <textarea placeholder="This previews textarea styling." onChange={markSaveDirty} />
          </FormField>
        </div>

        <div className="button-row" style={{ marginTop: "12px" }}>
          <SaveButton dirty={saveDirty} saving={saveSaving} saved={saveSaved} error={saveError} onClick={handlePreviewSave} />
        </div>
      </WorkspacePanel>

      <ConfirmDialog
        open={showConfirmDialog}
        title="Delete Record?"
        message={`Are you sure you want to delete "${pendingDeleteRow?.name || "this record"}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <Toast
        open={Boolean(toast)}
        variant={toast?.variant}
        title={toast?.title}
        message={toast?.message}
        onClose={() => setToast(null)}
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
              <p>This page lets you test shared Farmers Hub layout components before applying them to production modules.</p>
            </div>
          </section>

          <section className="guideStepGrid">
            <article className="guideStepCard"><h3>Hero</h3><p>Tests ModuleHero layout, accent color, icon, and action buttons.</p></article>
            <article className="guideStepCard"><h3>Stats</h3><p>Tests StatCard colors, spacing, icons, and responsive behavior.</p></article>
            <article className="guideStepCard"><h3>Panels</h3><p>Tests WorkspacePanel headers, toolbars, actions, and body spacing.</p></article>
            <article className="guideStepCard"><h3>Filter Bar</h3><p>Tests shared search, dropdown filters, and toolbar actions.</p></article>
            <article className="guideStepCard"><h3>Data Table</h3><p>Tests clickable record names, selected rows, reusable desktop tables, and mobile card-style behavior.</p></article>
            <article className="guideStepCard"><h3>Record List</h3><p>Tests compact record cards for smaller directories, recent activity, side panels, and mobile-friendly record lists.</p></article>
            <article className="guideStepCard"><h3>Action Menu</h3><p>Tests shared overflow menus for edit, duplicate, print, archive, and delete actions.</p></article>
            <article className="guideStepCard"><h3>Save Button</h3><p>Tests the shared save workflow for unchanged, unsaved, saving, saved, and failed states.</p></article>
            <article className="guideStepCard"><h3>Toast</h3><p>Tests temporary notification messages for saved, deleted, warning, info, and error states.</p></article>
            <article className="guideStepCard"><h3>Form Field</h3><p>Tests shared labels, helper text, required indicators, validation messages, disabled fields, and full-width layouts.</p></article>
            <article className="guideStepCard"><h3>Status Pill</h3><p>Tests shared status labels for records, tables, cards, and module summaries.</p></article>
            <article className="guideStepCard"><h3>Confirm Dialog</h3><p>Tests the shared confirmation pattern for delete, archive, discard, and other important actions.</p></article>
            <article className="guideStepCard"><h3>Empty State</h3><p>Tests reusable no-records messaging and empty directory layouts.</p></article>
            <article className="guideStepCard"><h3>Guide Modal</h3><p>Tests popup layout, scrolling, close behavior, and dismissal checkbox.</p></article>
          </section>
        </div>
      </ModuleGuideModal>
    </div>
  );
}
