import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarClock,
  CircleHelp,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Search,
  Star,
  Trash2,
  UserRound,
  Users,
  X
} from "lucide-react";

import { useAuth } from "../AuthContext.jsx";
import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import CustomersGuideContent from "../components/CustomersGuideContent.jsx";
import StatCard from "../components/StatCard.jsx";
import ModuleHero from "../components/ModuleHero.jsx";
import {
  deleteCustomer,
  getCustomers,
  saveCustomer
} from "../services/customerService.js";

const CUSTOMER_TYPES = [
  "Retail customer",
  "Market regular",
  "Wholesale buyer",
  "Restaurant / food service",
  "Retail shop",
  "Event client",
  "Subscription customer",
  "Custom order customer",
  "Lead / prospect",
  "Other"
];

const CUSTOMER_STATUSES = ["Lead", "Active", "Follow-up", "Inactive"];

const CONTACT_METHODS = ["Email", "Phone", "Text", "In person", "Social media", "Other"];

const CUSTOMER_TABLE_COLUMNS =
  "minmax(210px, 1.25fr) minmax(210px, 1fr) minmax(110px, 0.55fr) minmax(190px, 1fr) minmax(130px, 0.7fr) minmax(190px, 1fr) 96px";

function blankCustomer() {
  return {
    id: "",
    name: "",
    customerType: "Retail customer",
    status: "Lead",
    email: "",
    phone: "",
    preferredContact: "Email",
    businessName: "",
    productInterests: "",
    source: "",
    lastContactDate: "",
    followUpDate: "",
    notes: ""
  };
}

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function slugify(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function formatDate(value) {
  if (!value) return "Not set";

  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function isUpcomingFollowUp(value) {
  if (!value) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return false;
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((target.getTime() - today.getTime()) / 86400000);
  return diffDays >= 0 && diffDays <= 14;
}

function isPastDueFollowUp(value) {
  if (!value) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return false;
  target.setHours(0, 0, 0, 0);

  return target.getTime() < today.getTime();
}

export default function Customers() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [queryText, setQueryText] = useState("");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(blankCustomer());
  const [saving, setSaving] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [user]);

  useEffect(() => {
    if (!statusMessage) return undefined;

    const timer = window.setTimeout(() => {
      setStatusMessage("");
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    const customerId = searchParams.get("customer");
    if (!customerId || !customers.length) return;

    const match = customers.find((customer) => customer.id === customerId);
    if (match) openCustomer(match);
  }, [searchParams, customers]);

  useEffect(() => {
    const guideHidden = localStorage.getItem("hideModuleGuide_customers") === "true";

    if (!guideHidden) {
      setShowGuide(true);
    }
  }, []);

  async function loadCustomers() {
    if (!user) return;

    setLoading(true);
    try {
      const records = await getCustomers(user.uid);
      setCustomers(Array.isArray(records) ? records : []);
    } catch (error) {
      console.error("Could not load customers:", error);
      setStatusMessage("Could not load customers.");
    } finally {
      setLoading(false);
    }
  }

  function openNewCustomer() {
    setForm(blankCustomer());
    setModalOpen(true);
    setSearchParams({});
  }

  function openCustomer(customer) {
    setForm({ ...blankCustomer(), ...customer });
    setModalOpen(true);
  }

  function closeModal() {
    setForm(blankCustomer());
    setModalOpen(false);
    setSearchParams({});
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await saveCustomer(user.uid, form);
      await loadCustomers();
      closeModal();
      setStatusMessage("Customer saved.");
    } catch (error) {
      console.error("Could not save customer:", error);
      setStatusMessage("Could not save customer.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(customer) {
    if (!user || !customer?.id) return;

    const confirmed = window.confirm(`Delete ${customer.name || "this customer"}?`);
    if (!confirmed) return;

    try {
      await deleteCustomer(user.uid, customer.id);
      await loadCustomers();
      closeModal();
      setStatusMessage("Customer deleted.");
    } catch (error) {
      console.error("Could not delete customer:", error);
      setStatusMessage("Could not delete customer.");
    }
  }

  const filteredCustomers = useMemo(() => {
    const search = normalize(queryText);

    return customers.filter((customer) => {
      const matchesSearch = search
        ? [
            customer.name,
            customer.businessName,
            customer.email,
            customer.phone,
            customer.productInterests,
            customer.notes,
            customer.source
          ]
            .map(normalize)
            .some((value) => value.includes(search))
        : true;

      const matchesType =
        typeFilter === "All types" || customer.customerType === typeFilter;

      const matchesStatus =
        statusFilter === "All statuses" || customer.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [customers, queryText, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const activeCount = customers.filter((customer) => customer.status === "Active").length;
    const followUps = customers.filter(
      (customer) =>
        isUpcomingFollowUp(customer.followUpDate) ||
        isPastDueFollowUp(customer.followUpDate)
    ).length;
    const wholesaleCount = customers.filter((customer) =>
      ["Wholesale buyer", "Restaurant / food service", "Retail shop"].includes(
        customer.customerType
      )
    ).length;

    return {
      activeCount,
      followUps,
      wholesaleCount
    };
  }, [customers]);

  return (
    <div className="customersModule modulePage">
      <ModuleGuideModal
        isOpen={showGuide}
        moduleKey="customers"
        title="How to Use Customers"
        onClose={() => setShowGuide(false)}
      >
        <CustomersGuideContent />
      </ModuleGuideModal>

      {statusMessage ? (
        <div className="floatingStatus" role="status">
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            <X size={16} />
          </button>
        </div>
      ) : null}

      <ModuleHero
        eyebrow="Customer CRM"
        accent="customers"
        icon={Users}
        title="Customers"
        description="Keep track of repeat buyers, leads, wholesale accounts, event clients, custom order customers, and follow-up reminders in one place."
        actions={[
          {
            label: "Add Customer",
            icon: Plus,
            variant: "primary",
            onClick: openNewCustomer
          },
          {
            label: "Guide",
            icon: CircleHelp,
            variant: "secondary",
            onClick: () => setShowGuide(true)
          }
        ]}
      />

      <section className="hubStatGrid customersStatGrid">
        <StatCard
          icon={Users}
          label="Customers"
          value={loading ? "..." : customers.length}
          sub="saved contacts"
          accent="customers"
        />
        <StatCard
          icon={Star}
          label="Active"
          value={loading ? "..." : stats.activeCount}
          sub="active relationships"
          accent="market"
        />
        <StatCard
          icon={CalendarClock}
          label="Follow-ups"
          value={loading ? "..." : stats.followUps}
          sub="due or next 14 days"
          accent="sourdough"
        />
        <StatCard
          icon={UserRound}
          label="Wholesale"
          value={loading ? "..." : stats.wholesaleCount}
          sub="buyer accounts"
          accent="pricing"
        />
      </section>

      <section className="workspacePanel compactPanel customersFilterPanel customersSharedFilterPanel">
        <div className="searchBox compactSearch customersSearchBox">
          <Search size={17} />
          <input
            type="search"
            placeholder="Search customers, products, notes, email, or phone"
            value={queryText}
            onChange={(event) => setQueryText(event.target.value)}
          />
        </div>

        <label>
          Type
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option>All types</option>
            {CUSTOMER_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>

        <label>
          Status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option>All statuses</option>
            {CUSTOMER_STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="workspacePanel customersTablePanel customersSharedDirectoryPanel">
        <div className="workspaceHeader compactPanelHeader">
          <div>
            <p className="eyebrow">Directory</p>
            <h3>Saved Customers</h3>
          </div>
          <button className="secondaryButton compactButton" type="button" onClick={loadCustomers}>
            Refresh
          </button>
        </div>

        <div className="customersTable customersSharedTable">
          <div className="customersTableHeader" style={{ gridTemplateColumns: CUSTOMER_TABLE_COLUMNS }}>
            <span>Name</span>
            <span>Type</span>
            <span>Status</span>
            <span>Interests</span>
            <span>Follow-up</span>
            <span>Contact</span>
            <span>Actions</span>
          </div>

          {filteredCustomers.length ? (
            filteredCustomers.map((customer) => (
              <div
                className="customersTableRow"
                key={customer.id}
                style={{ gridTemplateColumns: CUSTOMER_TABLE_COLUMNS }}
              >
                <button
                  className="clickableName customerNameButton"
                  type="button"
                  onClick={() => openCustomer(customer)}
                >
                  <strong>{customer.name || "Unnamed Customer"}</strong>
                  {customer.businessName ? <small>{customer.businessName}</small> : null}
                </button>

                <span className="customerTypeCell" title={customer.customerType || "Other"}>
                  <span className="customerTypePill">{customer.customerType || "Other"}</span>
                </span>

                <span className={`customerStatusPill ${slugify(customer.status)}`}>
                  {customer.status || "Lead"}
                </span>

                <span className="customerMuted" title={customer.productInterests || ""}>
                  {customer.productInterests || "No interests listed"}
                </span>

                <span
                  className={`customerFollowUp ${
                    isPastDueFollowUp(customer.followUpDate)
                      ? "danger"
                      : isUpcomingFollowUp(customer.followUpDate)
                        ? "warning"
                        : "neutral"
                  }`}
                >
                  {formatDate(customer.followUpDate)}
                </span>

                <span className="customerMuted" title={customer.email || customer.phone || ""}>
                  {customer.email || customer.phone || "No contact info"}
                </span>

                <div className="customerActions">
                  <button type="button" onClick={() => openCustomer(customer)} aria-label="Edit customer">
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(customer)}
                    aria-label="Delete customer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="customerEmptyState">
              {loading ? "Loading customers..." : "No customers match your filters yet."}
            </p>
          )}
        </div>
      </section>

      {modalOpen ? (
        <div className="customersModalOverlay" role="dialog" aria-modal="true">
          <div className="customersModal">
            <div className="customersModalHeader">
              <div>
                <p className="eyebrow">Customer record</p>
                <h3>{form.id ? form.name || "Edit Customer" : "Add Customer"}</h3>
              </div>

              <button type="button" onClick={closeModal} aria-label="Close customer modal">
                <X size={19} />
              </button>
            </div>

            <form className="customersModalForm" onSubmit={handleSave}>
              <label>
                Customer name
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Name or primary contact"
                  required
                />
              </label>

              <label>
                Business / account name
                <input
                  value={form.businessName}
                  onChange={(event) => updateField("businessName", event.target.value)}
                  placeholder="Optional"
                />
              </label>

              <label>
                Customer type
                <select
                  value={form.customerType}
                  onChange={(event) => updateField("customerType", event.target.value)}
                >
                  {CUSTOMER_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label>
                Status
                <select
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value)}
                >
                  {CUSTOMER_STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label>
                Email
                <div className="customerInputWithIcon">
                  <Mail size={16} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="name@example.com"
                  />
                </div>
              </label>

              <label>
                Phone
                <div className="customerInputWithIcon">
                  <Phone size={16} />
                  <input
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </label>

              <label>
                Preferred contact
                <select
                  value={form.preferredContact}
                  onChange={(event) => updateField("preferredContact", event.target.value)}
                >
                  {CONTACT_METHODS.map((method) => (
                    <option key={method}>{method}</option>
                  ))}
                </select>
              </label>

              <label>
                Source
                <input
                  value={form.source}
                  onChange={(event) => updateField("source", event.target.value)}
                  placeholder="Market, referral, event, website, social media"
                />
              </label>

              <label>
                Last contact date
                <input
                  type="date"
                  value={form.lastContactDate}
                  onChange={(event) => updateField("lastContactDate", event.target.value)}
                />
              </label>

              <label>
                Follow-up date
                <input
                  type="date"
                  value={form.followUpDate}
                  onChange={(event) => updateField("followUpDate", event.target.value)}
                />
              </label>

              <label className="fullSpan">
                Product interests
                <input
                  value={form.productInterests}
                  onChange={(event) => updateField("productInterests", event.target.value)}
                  placeholder="Bread, produce, candles, jewelry, flowers, spices, custom orders, wholesale cases"
                />
              </label>

              <label className="fullSpan">
                Notes
                <div className="customerNotesWrap">
                  <MessageSquare size={16} />
                  <textarea
                    value={form.notes}
                    onChange={(event) => updateField("notes", event.target.value)}
                    placeholder="Preferences, past conversations, order notes, allergies, booth interactions, wholesale terms, or follow-up context."
                  />
                </div>
              </label>

              <div className="customersModalActions fullSpan">
                {form.id ? (
                  <button
                    className="secondaryButton dangerButton compactButton"
                    type="button"
                    onClick={() => handleDelete(form)}
                  >
                    Delete
                  </button>
                ) : null}

                <button className="secondaryButton compactButton" type="button" onClick={closeModal}>
                  Cancel
                </button>

                <button className="primaryButton compactPrimary" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
