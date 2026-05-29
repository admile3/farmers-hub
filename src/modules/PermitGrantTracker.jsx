import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Edit3,
  ExternalLink,
  FileText,
  Filter,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { useAuth } from "../AuthContext.jsx";
import { useUnsavedChanges } from "../UnsavedChangesContext.jsx";
import StatCard from "../components/StatCard.jsx";
import {
  deletePermitGrantItem,
  getPermitGrantItems,
  savePermitGrantItem
} from "../services/permitGrantService.js";

const itemTypes = [
  "Permit",
  "Grant",
  "License",
  "Certification",
  "Registration",
  "Insurance",
  "Tax Filing",
  "Market Application",
  "Other"
];

const statusOptions = [
  "Not Started",
  "In Progress",
  "Submitted",
  "Approved",
  "Denied",
  "Renewal Needed",
  "Complete"
];

const priorityOptions = ["Low", "Normal", "High", "Urgent"];

const blankRecord = {
  id: "",
  name: "",
  type: "Permit",
  agency: "",
  status: "Not Started",
  priority: "Normal",
  issueDate: "",
  dueDate: "",
  submittedDate: "",
  approvedDate: "",
  renewalDate: "",
  reminderAmount: 30,
  reminderUnit: "days",
  fee: "",
  link: "",
  documentName: "",
  documentUrl: "",
  notes: ""
};

const starterItems = [
  {
    id: "sample-home-processor",
    name: "SAMPLE - Home-Based Processor",
    type: "Permit",
    agency: "Kentucky Food and Safety Branch",
    status: "Approved",
    priority: "High",
    issueDate: "2025-07-16",
    dueDate: "2026-03-31",
    submittedDate: "",
    approvedDate: "2025-07-16",
    renewalDate: "2026-03-31",
    reminderAmount: 30,
    reminderUnit: "days",
    fee: 50,
    link: "",
    documentName: "Sample Homebased Processor Permit.pdf",
    documentUrl: "",
    notes: "Example record. Replace with your own permit or renewal."
  },
  {
    id: "sample-insurance",
    name: "SAMPLE - General Liability Insurance",
    type: "Insurance",
    agency: "FarmGuard Insurance",
    status: "Renewal Needed",
    priority: "Urgent",
    issueDate: "2025-04-01",
    dueDate: "2026-04-01",
    submittedDate: "",
    approvedDate: "",
    renewalDate: "2026-04-01",
    reminderAmount: 30,
    reminderUnit: "days",
    fee: 0,
    link: "",
    documentName: "",
    documentUrl: "",
    notes: "Example insurance renewal. Edit or delete anytime."
  },
  {
    id: "sample-grant",
    name: "SAMPLE - Local Food Innovation Grant",
    type: "Grant",
    agency: "County Economic Development",
    status: "Submitted",
    priority: "Normal",
    issueDate: "",
    dueDate: "2026-05-30",
    submittedDate: "2026-05-01",
    approvedDate: "",
    renewalDate: "",
    reminderAmount: 15,
    reminderUnit: "days",
    fee: 0,
    link: "",
    documentName: "",
    documentUrl: "",
    notes: "Example grant application. Edit or delete anytime."
  }
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createSampleItems() {
  return starterItems.map((item) =>
    normalizeRecord({
      ...item,
      id: `${item.id}-${makeId()}`
    })
  );
}

function daysUntil(dateString) {
  if (!dateString) return null;

  const today = new Date(todayISO());
  const date = new Date(dateString);
  const diff = date.getTime() - today.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getRelevantDate(item) {
  if (item.status === "Approved" && item.renewalDate) return item.renewalDate;
  if (item.renewalDate) return item.renewalDate;
  return item.dueDate || "";
}

function getDueStatus(item) {
  const relevantDate = getRelevantDate(item);
  const days = daysUntil(relevantDate);

  if (days === null) return { label: "No Date", tone: "neutral", days: null };
  if (days < 0) return { label: "Expired", tone: "danger", days };
  if (days === 0) return { label: "Due Today", tone: "danger", days };
  if (days <= 7) return { label: `Due in ${days}d`, tone: "danger", days };
  if (days <= 30) return { label: `In ${days}d`, tone: "warning", days };
  return { label: `In ${days}d`, tone: "good", days };
}

function statusClass(status) {
  return String(status || "").toLowerCase().replaceAll(" ", "-");
}

function normalizeRecord(record) {
  return {
    ...blankRecord,
    ...record,
    fee: record.fee === "" ? "" : Number(record.fee) || 0,
    reminderAmount: Number(record.reminderAmount) || 30
  };
}

export default function PermitGrantTracker() {
  const { user, loginWithGoogle } = useAuth();
  const { isDirty: hasUnsavedChanges, markUnsaved, markSaved } =
    useUnsavedChanges();

  const [items, setItems] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(blankRecord);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [recordFilter, setRecordFilter] = useState("All Records");

  function markPermitGrantDirty() {
    markUnsaved({
      source: "Permit & Grant Tracker",
      onSave: async () => {
        const saved = await saveRecord(editingRecord);

        if (!saved) {
          throw new Error("Permit or grant record could not be saved.");
        }
      }
    });
  }

  useEffect(() => {
    if (!statusMessage) return;

    const timer = window.setTimeout(() => {
      setStatusMessage("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  async function loadItems() {
    if (!user) return;

    setLoadingItems(true);

    try {
      const savedItems = await getPermitGrantItems(user.uid);
      setItems(Array.isArray(savedItems) ? savedItems.map(normalizeRecord) : []);
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not load permit and grant records.");
    } finally {
      setLoadingItems(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadItems();
    } else {
      setItems([]);
    }
  }, [user]);

  const summary = useMemo(() => {
    return items.reduce(
      (sum, item) => {
        const dueStatus = getDueStatus(item);
        const isActive = ["Approved", "Complete"].includes(item.status);
        const isMissingDocs = !item.documentName && !item.documentUrl;
        const isGrant = item.type === "Grant";
        const isUpcomingGrant =
          isGrant &&
          dueStatus.days !== null &&
          dueStatus.days >= 0 &&
          dueStatus.days <= 60;

        return {
          active: sum.active + (isActive ? 1 : 0),
          expiringSoon:
            sum.expiringSoon +
            (dueStatus.days !== null && dueStatus.days >= 0 && dueStatus.days <= 30
              ? 1
              : 0),
          expired: sum.expired + (dueStatus.days !== null && dueStatus.days < 0 ? 1 : 0),
          missingDocs: sum.missingDocs + (isMissingDocs ? 1 : 0),
          upcomingGrants: sum.upcomingGrants + (isUpcomingGrant ? 1 : 0)
        };
      },
      {
        active: 0,
        expiringSoon: 0,
        expired: 0,
        missingDocs: 0,
        upcomingGrants: 0
      }
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const dueStatus = getDueStatus(item);

      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.agency.toLowerCase().includes(query) ||
        item.notes.toLowerCase().includes(query);

      const matchesType = typeFilter === "All Types" || item.type === typeFilter;
      const matchesStatus =
        statusFilter === "All Statuses" || item.status === statusFilter;

      const matchesRecord =
        recordFilter === "All Records" ||
        (recordFilter === "Expiring Soon" &&
          dueStatus.days !== null &&
          dueStatus.days >= 0 &&
          dueStatus.days <= 30) ||
        (recordFilter === "Expired" && dueStatus.days !== null && dueStatus.days < 0) ||
        (recordFilter === "Missing Docs" && !item.documentName && !item.documentUrl) ||
        (recordFilter === "Grants" && item.type === "Grant");

      return matchesSearch && matchesType && matchesStatus && matchesRecord;
    });
  }, [items, searchTerm, typeFilter, statusFilter, recordFilter]);

  function openNewRecord() {
    setEditingRecord({
      ...blankRecord,
      id: makeId()
    });
    setIsModalOpen(true);
  }

  function openEditRecord(item) {
    setEditingRecord(normalizeRecord(item));
    setIsModalOpen(true);
  }

  function closeModal({ discardChanges = true } = {}) {
    setIsModalOpen(false);
    setEditingRecord(blankRecord);

    if (discardChanges) {
      markSaved();
    }
  }

  function updateEditingRecord(field, value) {
    markPermitGrantDirty();

    setEditingRecord((current) => ({
      ...current,
      [field]: value
    }));
  }

  function handleDocumentSelection(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    markPermitGrantDirty();

    setEditingRecord((current) => ({
      ...current,
      documentName: file.name,
      documentUrl: ""
    }));
  }

  async function saveRecord(record = editingRecord) {
    if (!record.name.trim()) {
      setStatusMessage("Record name is required.");
      return false;
    }

    const cleanRecord = normalizeRecord({
      ...record,
      name: record.name.trim(),
      agency: record.agency.trim(),
      link: record.link.trim(),
      notes: record.notes.trim()
    });

    if (!user) {
      setItems((current) => {
        const exists = current.some((item) => item.id === cleanRecord.id);
        return exists
          ? current.map((item) => (item.id === cleanRecord.id ? cleanRecord : item))
          : [...current, cleanRecord];
      });
      setStatusMessage("Record saved locally.");
      closeModal({ discardChanges: false });
      markSaved();
      return true;
    }

    setSaving(true);

    try {
      const savedId = await savePermitGrantItem(user.uid, cleanRecord);
      const savedRecord = { ...cleanRecord, id: savedId };

      setItems((current) => {
        const exists = current.some((item) => item.id === savedRecord.id);
        return exists
          ? current.map((item) => (item.id === savedRecord.id ? savedRecord : item))
          : [...current, savedRecord];
      });

      setStatusMessage("Record saved.");
      closeModal({ discardChanges: false });
      await loadItems();
      markSaved();
      return true;
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not save record.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveSampleRecord(record) {
    if (!user) {
      setItems((current) => [...current, record]);
      return;
    }

    await savePermitGrantItem(user.uid, record);
  }

  async function loadSampleRecords() {
    if (items.length > 0) {
      const confirmed = window.confirm(
        "This will add sample permit, insurance, and grant records. Continue?"
      );

      if (!confirmed) return;
    }

    const sampleRecords = createSampleItems();

    setSaving(true);

    try {
      if (user) {
        await Promise.all(sampleRecords.map((record) => saveSampleRecord(record)));
        await loadItems();
      } else {
        setItems((current) => [...current, ...sampleRecords]);
      }

      setStatusMessage("Sample records added. You can edit or delete them anytime.");
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not add sample records.");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id) {
    if (!user) {
      setItems((current) => current.filter((item) => item.id !== id));
      setStatusMessage("Record deleted locally.");
      return;
    }

    try {
      await deletePermitGrantItem(user.uid, id);
      setStatusMessage("Record deleted.");
      await loadItems();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not delete record.");
    }
  }

  if (!user) {
    return (
      <div className="modulePage permitGrantModule compactSpicePage">
        <section className="moduleHero compactHero">
          <div>
            <p className="eyebrow">Permits & Grants</p>
            <h2>Sign in to save permits, grants, licenses, insurance, and renewals.</h2>
            <p>
              Track required records, application links, documents, renewal dates,
              deadlines, and reminders in one organized workspace.
            </p>
          </div>

          <button className="primaryButton" onClick={loginWithGoogle}>
            Sign in with Google
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="modulePage permitGrantModule compactSpicePage">
      {statusMessage ? (
        <div className="floatingStatus success">
          <span>ⓘ</span>
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            ×
          </button>
        </div>
      ) : null}

      <section className="moduleHero compactHero noActionHero">
        <div>
          <p className="eyebrow">Permits & Grants</p>
          <h2>Track permits, grants, licenses, insurance, and renewal deadlines.</h2>
          <p>
            Keep required records, application links, documents, renewal dates,
            deadlines, and reminders in one place.
          </p>
        </div>
      </section>

      <section className="formActions compactActions permitGrantTopActions">
        <button
          className="secondaryButton compactButton"
          type="button"
          onClick={loadSampleRecords}
          disabled={saving}
        >
          <FileText size={15} />
          Load Sample Records
        </button>

        <button className="primaryButton compactPrimary" type="button" onClick={openNewRecord}>
          <Plus size={15} />
          Add Record
        </button>
      </section>

      <section className="hubStatGrid">
        <StatCard
          icon={ShieldCheck}
          label="Active"
          value={summary.active}
          sub="Currently active"
          accent="market"
        />

        <StatCard
          icon={CalendarDays}
          label="Expiring Soon"
          value={summary.expiringSoon}
          sub="In reminder window"
          accent="sourdough"
        />

        <StatCard
          icon={AlertTriangle}
          label="Expired"
          value={summary.expired}
          sub="Overdue records"
          accent="spice"
        />

        <StatCard
          icon={Upload}
          label="Missing Docs"
          value={summary.missingDocs}
          sub="Need upload"
          accent="pricing"
        />

        <StatCard
          icon={FileText}
          label="Upcoming Grants"
          value={summary.upcomingGrants}
          sub="Deadlines approaching"
          accent="grant"
        />
      </section>

      <section className="permitFilterBar">
        <div className="permitSearch">
          <Search size={18} />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name, agency, or notes..."
          />
        </div>

        <label>
          <Filter size={16} />
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option>All Types</option>
            {itemTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>

        <label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option>All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>

        <label>
          <select
            value={recordFilter}
            onChange={(event) => setRecordFilter(event.target.value)}
          >
            <option>All Records</option>
            <option>Expiring Soon</option>
            <option>Expired</option>
            <option>Missing Docs</option>
            <option>Grants</option>
          </select>
        </label>
      </section>

      <section className="permitTablePanel">
        <div className="permitTable">
          <div className="permitTableHeader">
            <span>Name</span>
            <span>Type</span>
            <span>Organization</span>
            <span>Status</span>
            <span>Priority</span>
            <span>Issue</span>
            <span>Due / Renewal</span>
            <span>Reminder</span>
            <span>Document</span>
            <span>Actions</span>
          </div>

          {loadingItems ? (
            <div className="permitEmptyState">Loading records...</div>
          ) : filteredItems.length ? (
            filteredItems.map((item) => {
              const dueStatus = getDueStatus(item);

              return (
                <div className="permitTableRow" key={item.id}>
                  <span className="permitName">
                    <button
                      type="button"
                      className="permitNameButton clickableName"
                      onClick={() => openEditRecord(item)}
                    >
                      {item.name}
                    </button>
                  </span>

                  <span>
                    <span className="permitTypePill">{item.type}</span>
                  </span>

                  <span className="permitMuted">{item.agency || "None listed"}</span>

                  <span>
                    <span className={`permitStatusPill ${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </span>

                  <span>
                    <span className={`permitPriorityPill ${item.priority.toLowerCase()}`}>
                      {item.priority}
                    </span>
                  </span>

                  <span className="permitMuted">{item.issueDate || "—"}</span>

                  <span className="permitMuted">{getRelevantDate(item) || "—"}</span>

                  <span>
                    <span className={`permitDeadlinePill ${dueStatus.tone}`}>
                      {dueStatus.tone === "danger" ? (
                        <AlertTriangle size={13} />
                      ) : (
                        <CalendarDays size={13} />
                      )}
                      {dueStatus.label}
                    </span>
                  </span>

                  <span>
                    {item.documentName || item.documentUrl ? (
                      <span className="permitDocument">
                        <FileText size={14} />
                        {item.documentUrl ? (
                          <a href={item.documentUrl} target="_blank" rel="noreferrer">
                            {item.documentName || "Open Document"}
                          </a>
                        ) : (
                          <span>{item.documentName}</span>
                        )}
                      </span>
                    ) : (
                      <span className="permitMissingDoc">
                        <Upload size={14} />
                        Missing
                      </span>
                    )}
                  </span>

                  <span className="permitActions">
                    {item.link ? (
                      <a href={item.link} target="_blank" rel="noreferrer">
                        <ExternalLink size={16} />
                      </a>
                    ) : null}

                    <button type="button" onClick={() => openEditRecord(item)}>
                      <Edit3 size={16} />
                    </button>

                    <button type="button" onClick={() => removeItem(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </span>
                </div>
              );
            })
          ) : (
            <div className="permitEmptyState">
              No records yet. Add your first permit, grant, license, insurance,
              or renewal, or load sample records to explore the tracker.
            </div>
          )}
        </div>
      </section>

      {isModalOpen ? (
        <div className="permitModalOverlay" role="dialog" aria-modal="true">
          <div className="permitModal">
            <div className="permitModalHeader">
              <h3>
                {items.some((item) => item.id === editingRecord.id)
                  ? "Edit Permit / Grant / Document"
                  : "Add Permit / Grant / Document"}
              </h3>

              <button type="button" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form
              className="permitModalForm"
              onSubmit={(event) => {
                event.preventDefault();
                saveRecord();
              }}
            >
              <label className="permitFull">
                Name *
                <input
                  value={editingRecord.name}
                  onChange={(event) => updateEditingRecord("name", event.target.value)}
                  placeholder="e.g., Cottage Food License"
                />
              </label>

              <label>
                Type *
                <select
                  value={editingRecord.type}
                  onChange={(event) => updateEditingRecord("type", event.target.value)}
                >
                  {itemTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label>
                Status *
                <select
                  value={editingRecord.status}
                  onChange={(event) =>
                    updateEditingRecord("status", event.target.value)
                  }
                >
                  {statusOptions.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label>
                Priority
                <select
                  value={editingRecord.priority}
                  onChange={(event) =>
                    updateEditingRecord("priority", event.target.value)
                  }
                >
                  {priorityOptions.map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>
              </label>

              <label>
                Fee
                <input
                  type="number"
                  step="0.01"
                  value={editingRecord.fee}
                  onChange={(event) => updateEditingRecord("fee", event.target.value)}
                  placeholder="e.g., 25"
                />
              </label>

              <label className="permitFull">
                Issuing Organization
                <input
                  value={editingRecord.agency}
                  onChange={(event) => updateEditingRecord("agency", event.target.value)}
                  placeholder="e.g., State Department of Agriculture"
                />
              </label>

              <label>
                Issue Date
                <input
                  type="date"
                  value={editingRecord.issueDate}
                  onChange={(event) =>
                    updateEditingRecord("issueDate", event.target.value)
                  }
                />
              </label>

              <label>
                Expiration / Deadline Date
                <input
                  type="date"
                  value={editingRecord.dueDate}
                  onChange={(event) => updateEditingRecord("dueDate", event.target.value)}
                />
              </label>

              <label>
                Renewal Date
                <input
                  type="date"
                  value={editingRecord.renewalDate}
                  onChange={(event) =>
                    updateEditingRecord("renewalDate", event.target.value)
                  }
                />
              </label>

              <label>
                Submitted Date
                <input
                  type="date"
                  value={editingRecord.submittedDate}
                  onChange={(event) =>
                    updateEditingRecord("submittedDate", event.target.value)
                  }
                />
              </label>

              <label>
                Approved Date
                <input
                  type="date"
                  value={editingRecord.approvedDate}
                  onChange={(event) =>
                    updateEditingRecord("approvedDate", event.target.value)
                  }
                />
              </label>

              <label>
                Reminder Amount
                <input
                  type="number"
                  value={editingRecord.reminderAmount}
                  onChange={(event) =>
                    updateEditingRecord("reminderAmount", event.target.value)
                  }
                />
              </label>

              <label>
                Reminder Unit
                <select
                  value={editingRecord.reminderUnit}
                  onChange={(event) =>
                    updateEditingRecord("reminderUnit", event.target.value)
                  }
                >
                  <option>days</option>
                  <option>weeks</option>
                  <option>months</option>
                </select>
              </label>

              <label className="permitFull">
                Link
                <input
                  value={editingRecord.link}
                  onChange={(event) => updateEditingRecord("link", event.target.value)}
                  placeholder="Application, portal, or reference URL"
                />
              </label>

              <label className="permitFull">
                Notes
                <textarea
                  value={editingRecord.notes}
                  onChange={(event) => updateEditingRecord("notes", event.target.value)}
                  placeholder="Additional notes or details..."
                />
              </label>

              <label className="permitFull">
                Document Upload
                <input type="file" onChange={handleDocumentSelection} />
                {editingRecord.documentName ? (
                  <span className="permitSelectedFile">
                    Selected: {editingRecord.documentName}
                  </span>
                ) : null}
              </label>

              <div className="permitModalActions permitFull">
                <button
                  className="secondaryButton compactButton"
                  type="button"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  className={`primaryButton compactPrimary ${
                    hasUnsavedChanges ? "dirtySaveButton" : ""
                  }`}
                  type="submit"
                  disabled={saving}
                >
                  <Save size={15} />
                  {saving ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
