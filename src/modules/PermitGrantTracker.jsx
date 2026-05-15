import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Landmark,
  Plus,
  Save,
  Trash2
} from "lucide-react";
import { useAuth } from "../AuthContext.jsx";
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

const starterItems = [
  {
    id: "sample-permit",
    name: "Market Vendor Application",
    type: "Market Application",
    agency: "Farmers Market",
    status: "In Progress",
    priority: "High",
    dueDate: "",
    submittedDate: "",
    approvedDate: "",
    renewalDate: "",
    fee: 0,
    link: "",
    notes: "Example item. Replace with your own permit, grant, or application."
  }
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function daysUntil(dateString) {
  if (!dateString) return null;

  const today = new Date(todayISO());
  const date = new Date(dateString);
  const diff = date.getTime() - today.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getDueStatus(item) {
  const dueDays = daysUntil(item.dueDate);
  const renewalDays = daysUntil(item.renewalDate);
  const relevantDays =
    renewalDays !== null && item.status === "Approved" ? renewalDays : dueDays;

  if (relevantDays === null) return "No date";
  if (relevantDays < 0) return "Past due";
  if (relevantDays <= 7) return "Due soon";
  if (relevantDays <= 30) return "Upcoming";
  return "On track";
}

function getDateLabel(item) {
  if (item.status === "Approved" && item.renewalDate) {
    return `Renews ${item.renewalDate}`;
  }

  if (item.dueDate) {
    return `Due ${item.dueDate}`;
  }

  return "No due date";
}

export default function PermitGrantTracker() {
  const { user, loginWithGoogle } = useAuth();

  const overviewRef = useRef(null);
  const addRef = useRef(null);
  const trackerRef = useRef(null);

  const [items, setItems] = useState(starterItems);
  const [statusMessage, setStatusMessage] = useState("");
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const [newItem, setNewItem] = useState({
    name: "",
    type: "Permit",
    agency: "",
    status: "Not Started",
    priority: "Normal",
    dueDate: "",
    submittedDate: "",
    approvedDate: "",
    renewalDate: "",
    fee: "",
    link: "",
    notes: ""
  });

  useEffect(() => {
    function handleScroll() {
      setShowBackToTop(window.scrollY > 50);
    }

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      setItems(savedItems.length ? savedItems : starterItems);
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not load permit and grant tracker.");
    } finally {
      setLoadingItems(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadItems();
    } else {
      setItems(starterItems);
    }
  }, [user]);

  function scrollToSection(ref) {
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function preventNumberScroll(event) {
    event.target.blur();
  }

  const summary = useMemo(() => {
    return items.reduce(
      (sum, item) => {
        const dueStatus = getDueStatus(item);

        return {
          total: sum.total + 1,
          inProgress:
            sum.inProgress +
            (["Not Started", "In Progress", "Submitted", "Renewal Needed"].includes(
              item.status
            )
              ? 1
              : 0),
          approved: sum.approved + (item.status === "Approved" ? 1 : 0),
          urgent:
            sum.urgent +
            (["Past due", "Due soon"].includes(dueStatus) ||
            item.priority === "Urgent"
              ? 1
              : 0)
        };
      },
      {
        total: 0,
        inProgress: 0,
        approved: 0,
        urgent: 0
      }
    );
  }, [items]);

  async function saveItem(item) {
    if (!user) {
      setStatusMessage("Sign in from the Farmers Hub sidebar to save tracker items.");
      return;
    }

    setSaving(true);

    try {
      const savedId = await savePermitGrantItem(user.uid, item);

      setItems((current) =>
        current.map((existing) =>
          existing.id === item.id ? { ...item, id: savedId } : existing
        )
      );

      setStatusMessage("Tracker item saved.");
      await loadItems();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not save tracker item.");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id) {
    if (!user) {
      setItems((current) => current.filter((item) => item.id !== id));
      return;
    }

    try {
      await deletePermitGrantItem(user.uid, id);
      setStatusMessage("Tracker item deleted.");
      await loadItems();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not delete tracker item.");
    }
  }

  function updateItem(id, field, value) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  async function addItem(event) {
    event.preventDefault();

    if (!newItem.name.trim()) {
      setStatusMessage("Item name is required.");
      return;
    }

    const item = {
      id: makeId(),
      name: newItem.name.trim(),
      type: newItem.type,
      agency: newItem.agency.trim(),
      status: newItem.status,
      priority: newItem.priority,
      dueDate: newItem.dueDate,
      submittedDate: newItem.submittedDate,
      approvedDate: newItem.approvedDate,
      renewalDate: newItem.renewalDate,
      fee: Number(newItem.fee) || 0,
      link: newItem.link.trim(),
      notes: newItem.notes.trim()
    };

    setItems((current) => [...current, item]);

    setNewItem({
      name: "",
      type: "Permit",
      agency: "",
      status: "Not Started",
      priority: "Normal",
      dueDate: "",
      submittedDate: "",
      approvedDate: "",
      renewalDate: "",
      fee: "",
      link: "",
      notes: ""
    });

    setStatusMessage("Tracker item added.");
    scrollToSection(trackerRef);

    if (user) {
      await saveItem(item);
    }
  }

  const sectionCards = [
    {
      title: "Overview",
      description: "Review active items, approvals, and urgent deadlines.",
      icon: ClipboardCheck,
      ref: overviewRef
    },
    {
      title: "Add Item",
      description: "Create a permit, grant, application, license, or renewal.",
      icon: Plus,
      ref: addRef
    },
    {
      title: "Tracker",
      description: "Edit due dates, statuses, agencies, links, fees, and notes.",
      icon: FileText,
      ref: trackerRef
    },
    {
      title: "Compliance",
      description: "Keep renewals and recurring obligations visible.",
      icon: Landmark,
      ref: trackerRef
    }
  ];

  if (!user) {
    return (
      <div className="modulePage permitGrantPage compactSpicePage">
        <section className="moduleHero compactHero">
          <div>
            <p className="eyebrow">Permit & Grant Tracker</p>
            <h2>Sign in to save permits, grants, and renewals.</h2>
            <p>
              Track deadlines locally, then sign in to save permit, grant, license,
              market application, and renewal records to your Farmers Hub account.
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
    <div className="modulePage permitGrantPage compactSpicePage">
      <section className="moduleHero compactHero noActionHero">
        <div>
          <p className="eyebrow">Permit & Grant Tracker</p>
          <h2>Track applications, renewals, permits, licenses, and deadlines.</h2>
          <p>
            Keep important vendor paperwork organized with due dates, renewal dates,
            agency contacts, fees, status tracking, notes, and useful links.
          </p>
        </div>
      </section>

      {statusMessage ? (
        <div className="floatingStatus success">
          <span>ⓘ</span>
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            ×
          </button>
        </div>
      ) : null}

      <section className="toolGrid compactToolGrid">
        {sectionCards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              className="toolCard compactToolCard clickableToolCard"
              key={card.title}
              type="button"
              onClick={() => scrollToSection(card.ref)}
            >
              <Icon size={22} />
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </button>
          );
        })}
      </section>

      <section className="workspacePanel compactPanel scrollAnchor" ref={overviewRef}>
        <div className="workspaceHeader compactPanelHeader">
          <div>
            <p className="eyebrow">Overview</p>
            <h3>Tracker Summary</h3>
          </div>

          <button
            className="primaryButton compactPrimary"
            type="button"
            onClick={loadItems}
            disabled={loadingItems}
          >
            <CalendarDays size={15} />
            {loadingItems ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="batchTotals compactBatchTotals">
          <div>
            <p className="eyebrow">Total Items</p>
            <h4>{summary.total}</h4>
          </div>
          <div>
            <p className="eyebrow">In Progress</p>
            <h4>{summary.inProgress}</h4>
          </div>
          <div>
            <p className="eyebrow">Approved</p>
            <h4>{summary.approved}</h4>
          </div>
          <div>
            <p className="eyebrow">Urgent</p>
            <h4>{summary.urgent}</h4>
          </div>
        </div>
      </section>

      <section className="workspacePanel compactPanel scrollAnchor" ref={addRef}>
        <div className="workspaceHeader compactPanelHeader">
          <div>
            <p className="eyebrow">Add Item</p>
            <h3>New Permit, Grant, or Renewal</h3>
          </div>
        </div>

        <form className="formGrid compactFormGrid" onSubmit={addItem}>
          <label>
            Item Name
            <input
              value={newItem.name}
              onChange={(event) =>
                setNewItem((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="e.g., Home-Based Processor Renewal"
            />
          </label>

          <label>
            Type
            <select
              value={newItem.type}
              onChange={(event) =>
                setNewItem((current) => ({ ...current, type: event.target.value }))
              }
            >
              {itemTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>

          <label>
            Agency / Organization
            <input
              value={newItem.agency}
              onChange={(event) =>
                setNewItem((current) => ({ ...current, agency: event.target.value }))
              }
              placeholder="e.g., Kentucky Department of Agriculture"
            />
          </label>

          <label>
            Status
            <select
              value={newItem.status}
              onChange={(event) =>
                setNewItem((current) => ({ ...current, status: event.target.value }))
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
              value={newItem.priority}
              onChange={(event) =>
                setNewItem((current) => ({
                  ...current,
                  priority: event.target.value
                }))
              }
            >
              {priorityOptions.map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
          </label>

          <label>
            Due Date
            <input
              type="date"
              value={newItem.dueDate}
              onChange={(event) =>
                setNewItem((current) => ({ ...current, dueDate: event.target.value }))
              }
            />
          </label>

          <label>
            Submitted Date
            <input
              type="date"
              value={newItem.submittedDate}
              onChange={(event) =>
                setNewItem((current) => ({
                  ...current,
                  submittedDate: event.target.value
                }))
              }
            />
          </label>

          <label>
            Approved Date
            <input
              type="date"
              value={newItem.approvedDate}
              onChange={(event) =>
                setNewItem((current) => ({
                  ...current,
                  approvedDate: event.target.value
                }))
              }
            />
          </label>

          <label>
            Renewal Date
            <input
              type="date"
              value={newItem.renewalDate}
              onChange={(event) =>
                setNewItem((current) => ({
                  ...current,
                  renewalDate: event.target.value
                }))
              }
            />
          </label>

          <label>
            Fee
            <input
              type="number"
              step="0.01"
              value={newItem.fee}
              onWheel={preventNumberScroll}
              onChange={(event) =>
                setNewItem((current) => ({ ...current, fee: event.target.value }))
              }
              placeholder="e.g., 25"
            />
          </label>

          <label>
            Link
            <input
              value={newItem.link}
              onChange={(event) =>
                setNewItem((current) => ({ ...current, link: event.target.value }))
              }
              placeholder="Application, portal, or reference URL"
            />
          </label>

          <label>
            Notes
            <input
              value={newItem.notes}
              onChange={(event) =>
                setNewItem((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Requirements, documents needed, next steps"
            />
          </label>

          <div className="formActions fullSpan compactActions">
            <button className="primaryButton compactPrimary" type="submit">
              <Plus size={15} />
              Add Item
            </button>
          </div>
        </form>
      </section>

      <section className="workspacePanel compactPanel scrollAnchor" ref={trackerRef}>
        <div className="workspaceHeader compactPanelHeader">
          <div>
            <p className="eyebrow">Tracker</p>
            <h3>Permit & Grant Items</h3>
          </div>
        </div>

        <div className="batchTable compactBatchTable permitGrantTable">
          <div className="batchTableHeader permitGrantHeader">
            <span>Item</span>
            <span>Type</span>
            <span>Agency</span>
            <span>Status</span>
            <span>Priority</span>
            <span>Due</span>
            <span>Renewal</span>
            <span>Fee</span>
            <span>Link</span>
            <span>Notes</span>
            <span>Due Status</span>
            <span></span>
          </div>

          {items.map((item) => {
            const dueStatus = getDueStatus(item);

            return (
              <div className="batchTableRow permitGrantRow" key={item.id}>
                <span>
                  <input
                    value={item.name}
                    onChange={(event) =>
                      updateItem(item.id, "name", event.target.value)
                    }
                  />
                </span>

                <span>
                  <select
                    value={item.type}
                    onChange={(event) =>
                      updateItem(item.id, "type", event.target.value)
                    }
                  >
                    {itemTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </span>

                <span>
                  <input
                    value={item.agency}
                    onChange={(event) =>
                      updateItem(item.id, "agency", event.target.value)
                    }
                  />
                </span>

                <span>
                  <select
                    value={item.status}
                    onChange={(event) =>
                      updateItem(item.id, "status", event.target.value)
                    }
                  >
                    {statusOptions.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </span>

                <span>
                  <select
                    value={item.priority}
                    onChange={(event) =>
                      updateItem(item.id, "priority", event.target.value)
                    }
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>
                </span>

                <span>
                  <input
                    type="date"
                    value={item.dueDate || ""}
                    onChange={(event) =>
                      updateItem(item.id, "dueDate", event.target.value)
                    }
                  />
                </span>

                <span>
                  <input
                    type="date"
                    value={item.renewalDate || ""}
                    onChange={(event) =>
                      updateItem(item.id, "renewalDate", event.target.value)
                    }
                  />
                </span>

                <span>
                  <input
                    type="number"
                    step="0.01"
                    value={item.fee}
                    onWheel={preventNumberScroll}
                    onChange={(event) =>
                      updateItem(item.id, "fee", event.target.value)
                    }
                  />
                </span>

                <span>
                  <input
                    value={item.link}
                    onChange={(event) =>
                      updateItem(item.id, "link", event.target.value)
                    }
                  />
                </span>

                <span>
                  <input
                    value={item.notes}
                    onChange={(event) =>
                      updateItem(item.id, "notes", event.target.value)
                    }
                  />
                </span>

                <span className={`deadlinePill ${dueStatus.replaceAll(" ", "").toLowerCase()}`}>
                  {getDateLabel(item)}
                  <small>{dueStatus}</small>
                </span>

                <span className="permitGrantActions">
                  <button
                    className="iconButton"
                    type="button"
                    onClick={() => saveItem(item)}
                    disabled={saving}
                  >
                    <Save size={15} />
                  </button>

                  <button
                    className="iconButton danger"
                    type="button"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {showBackToTop ? (
        <button className="backToTopButton" type="button" onClick={scrollToTop}>
          <ArrowUp size={18} />
          Top
        </button>
      ) : null}
    </div>
  );
}
