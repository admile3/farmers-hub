import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Users,
  X
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../firebase";
import { useAuth } from "../AuthContext.jsx";
import StatCard from "../components/StatCard.jsx";
import { getCustomers, saveCustomer } from "../services/customerService.js";
import { getProducts } from "../services/productService.js";
import { getSpiceRecipes } from "../services/spiceKitchenService.js";
import { deleteOrder, getOrders, saveOrder } from "../services/orderService.js";

const ORDER_STATUSES = [
  "Draft",
  "Confirmed",
  "In Production",
  "Ready",
  "Completed",
  "Cancelled"
];

const FULFILLMENT_TYPES = [
  "Market pickup",
  "Farm pickup",
  "Delivery",
  "Shipping",
  "Event pickup",
  "Other"
];

const CUSTOMER_MODES = [
  { value: "saved", label: "Saved customer" },
  { value: "quickAdd", label: "Quick add to Customers" },
  { value: "oneTime", label: "One-time customer" }
];

function makeId(prefix = "item") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function money(value) {
  return `$${(Number(value) || 0).toFixed(2)}`;
}

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function blankCustomerSnapshot() {
  return {
    name: "",
    businessName: "",
    email: "",
    phone: "",
    customerType: "Retail customer",
    preferredContact: "Email",
    notes: ""
  };
}

function blankLineItem() {
  return {
    id: makeId("line"),
    mode: "manual",
    productId: "",
    productName: "",
    sourceLabel: "",
    category: "",
    unitLabel: "each",
    quantity: 1,
    unitPrice: "",
    notes: ""
  };
}

function blankOrder() {
  return {
    id: "",
    orderNumber: "",
    orderDate: todayString(),
    dueDate: "",
    status: "Draft",
    fulfillmentType: "Market pickup",
    pricingMode: "retail",
    customerMode: "saved",
    customerId: "",
    customerSnapshot: blankCustomerSnapshot(),
    lineItems: [blankLineItem()],
    discountAmount: "",
    taxRate: "",
    depositPaid: "",
    internalNotes: "",
    customerNotes: "",
    createdAt: "",
    updatedAt: ""
  };
}

function calculateOrder(order) {
  const subtotal = (order.lineItems || []).reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }, 0);

  const discountAmount = Number(order.discountAmount) || 0;
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableSubtotal * ((Number(order.taxRate) || 0) / 100);
  const total = taxableSubtotal + taxAmount;
  const balanceDue = Math.max(0, total - (Number(order.depositPaid) || 0));

  return {
    subtotal,
    discountAmount,
    taxableSubtotal,
    taxAmount,
    total,
    balanceDue
  };
}

function isLineItemFilled(item) {
  return Boolean(
    String(item?.productId || "").trim() ||
      String(item?.productName || "").trim() ||
      Number(item?.quantity) ||
      Number(item?.unitPrice)
  );
}

function getProductPrice(product, pricingMode, fallback = "") {
  if (!product) return fallback;

  if (pricingMode === "wholesale") {
    return product.wholesalePrice || product.retailPrice || fallback || "";
  }

  return product.retailPrice || product.wholesalePrice || fallback || "";
}

function formatPackageSize(size, unit) {
  const amount = Number(size) || 0;
  if (!amount) return "";
  return `${Number(amount.toFixed(3)).toString()} ${unit || ""}`.trim();
}

function buildSpiceOrderProducts(spiceRecipes = []) {
  const products = [];

  spiceRecipes
    .filter((recipe) => recipe?.listInProductDirectory)
    .forEach((recipe) => {
      const packageRows = Array.isArray(recipe.productPackages)
        ? recipe.productPackages
        : [];
      const costPerOunce = Number(recipe.formulaCostPerOunce) || 0;
      const listSizesAsUniqueProducts = Boolean(recipe.listSizesAsUniqueProducts);

      if (packageRows.length) {
        packageRows.forEach((packageItem, index) => {
          const packageName =
            packageItem.name ||
            formatPackageSize(packageItem.size, packageItem.unit) ||
            `Size ${index + 1}`;

          const ingredientCost =
            Number(packageItem.ingredientCost) ||
            (Number(packageItem.packageOunces) || 0) * costPerOunce;

          products.push({
            id: listSizesAsUniqueProducts
              ? `spice-${recipe.id}-${index}`
              : `spice-${recipe.id}-variant-${index}`,
            name: listSizesAsUniqueProducts
              ? `${recipe.name} - ${packageName}`
              : `${recipe.name} - ${packageName}`,
            parentName: recipe.name || "",
            category: "Spices",
            unitLabel: packageName,
            sourceLabel: "Spice Kitchen",
            retailPrice: "",
            wholesalePrice: "",
            costPerUnit: ingredientCost
          });
        });

        return;
      }

      products.push({
        id: `spice-${recipe.id}`,
        name: recipe.name || "Untitled Spice Blend",
        parentName: recipe.name || "",
        category: "Spices",
        unitLabel: "package",
        sourceLabel: "Spice Kitchen",
        retailPrice: "",
        wholesalePrice: "",
        costPerUnit: costPerOunce
      });
    });

  return products;
}

function buildBakingOrderProducts(bakingRecipes = []) {
  return bakingRecipes
    .filter((recipe) => recipe?.listInProductDirectory)
    .map((recipe) => {
      const directory = recipe.productDirectory || {};

      return {
        id: `baking-${recipe.id}`,
        name: directory.productName || recipe.name || "Untitled Baking Product",
        parentName: recipe.name || "",
        category:
          ["Loaf", "Baguette", "Pan Loaf"].includes(recipe.category)
            ? "Bread"
            : "Baked Goods",
        unitLabel: directory.sellingUnit || recipe.unitsLabel || "unit",
        sourceLabel: "Baking Planner",
        retailPrice: "",
        wholesalePrice: "",
        costPerUnit: recipe.pricingSummary?.costPerUnit || ""
      };
    });
}

function orderCustomerDisplay(order) {
  const customer = order.customerSnapshot || {};
  return (
    customer.businessName ||
    customer.name ||
    (order.customerMode === "oneTime" ? "One-time customer" : "No customer")
  );
}

function orderStatusClass(status) {
  return normalize(status).replace(/[^a-z0-9]+/g, "-");
}

export default function Orders() {
  const { user, loginWithGoogle } = useAuth();

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(blankOrder());
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [queryText, setQueryText] = useState("");
  const [statusFilter, setStatusFilter] = useState("Open orders");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setOrders([]);
      setCustomers([]);
      setProducts([]);
      setForm(blankOrder());
      setSelectedOrderId("");
    }
  }, [user]);

  useEffect(() => {
    if (!statusMessage) return undefined;

    const timer = window.setTimeout(() => setStatusMessage(""), 3200);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  async function loadData() {
    if (!user) return;

    setLoading(true);

    try {
      const [savedOrders, savedCustomers, manualProducts, spiceRecipes, bakingSnapshot] =
        await Promise.all([
          getOrders(user.uid),
          getCustomers(user.uid),
          getProducts(user.uid),
          getSpiceRecipes(user.uid).catch(() => []),
          getDoc(doc(db, "users", user.uid, "bakingPlanner", "main")).catch(() => null)
        ]);

      const bakingRecipes = bakingSnapshot?.exists?.()
        ? bakingSnapshot.data()?.recipes || []
        : [];

      const normalizedManualProducts = (Array.isArray(manualProducts) ? manualProducts : []).map(
        (product) => ({
          id: product.id,
          name: product.name || "Untitled Product",
          parentName: "",
          category: product.category || "Other",
          unitLabel: product.unitLabel || "each",
          sourceLabel: product.sourceLabel || "Products & Pricing",
          retailPrice: product.retailPrice || "",
          wholesalePrice: product.wholesalePrice || "",
          costPerUnit: product.pricingSummary?.costPerUnit || ""
        })
      );

      setOrders(Array.isArray(savedOrders) ? savedOrders : []);
      setCustomers(Array.isArray(savedCustomers) ? savedCustomers : []);
      setProducts([
        ...normalizedManualProducts,
        ...buildSpiceOrderProducts(spiceRecipes),
        ...buildBakingOrderProducts(bakingRecipes)
      ]);
    } catch (error) {
      console.error("Could not load orders data:", error);
      setStatusMessage("Could not load Orders data.");
    } finally {
      setLoading(false);
    }
  }

  function updateOrderField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateCustomerSnapshot(field, value) {
    setForm((current) => ({
      ...current,
      customerSnapshot: {
        ...current.customerSnapshot,
        [field]: value
      }
    }));
  }

  function updateCustomerMode(value) {
    setForm((current) => ({
      ...current,
      customerMode: value,
      customerId: "",
      customerSnapshot: blankCustomerSnapshot()
    }));
  }

  function selectSavedCustomer(customerId) {
    const customer = customers.find((item) => item.id === customerId);

    setForm((current) => ({
      ...current,
      customerId,
      customerSnapshot: customer
        ? {
            name: customer.name || "",
            businessName: customer.businessName || "",
            email: customer.email || "",
            phone: customer.phone || "",
            customerType: customer.customerType || "Retail customer",
            preferredContact: customer.preferredContact || "Email",
            notes: customer.notes || ""
          }
        : blankCustomerSnapshot()
    }));
  }

  function updatePricingMode(value) {
    setForm((current) => ({
      ...current,
      pricingMode: value,
      lineItems: current.lineItems.map((item) => {
        if (!item.productId) return item;

        const product = products.find((saved) => saved.id === item.productId);
        if (!product) return item;

        return {
          ...item,
          unitPrice: getProductPrice(product, value, item.unitPrice)
        };
      })
    }));
  }

  function updateLineItem(lineId, field, value) {
    setForm((current) => ({
      ...current,
      lineItems: current.lineItems.map((item) => {
        if (item.id !== lineId) return item;

        if (field === "productId") {
          const product = products.find((saved) => saved.id === value);

          return {
            ...item,
            mode: value ? "product" : "manual",
            productId: value,
            productName: product?.name || "",
            sourceLabel: product?.sourceLabel || "",
            category: product?.category || "",
            unitLabel: product?.unitLabel || "each",
            unitPrice: getProductPrice(product, current.pricingMode, item.unitPrice),
            notes: item.notes
          };
        }

        return {
          ...item,
          [field]: value
        };
      })
    }));
  }

  function addLineItem() {
    setForm((current) => ({
      ...current,
      lineItems: [...current.lineItems, blankLineItem()]
    }));
  }

  function removeLineItem(lineId) {
    setForm((current) => ({
      ...current,
      lineItems:
        current.lineItems.length > 1
          ? current.lineItems.filter((item) => item.id !== lineId)
          : [blankLineItem()]
    }));
  }

  function startNewOrder() {
    setSelectedOrderId("");
    setForm({
      ...blankOrder(),
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`
    });
    setEditorOpen(true);
    setStatusMessage("Started a new order.");
  }

  function loadOrder(order) {
    setSelectedOrderId(order.id);
    setForm({
      ...blankOrder(),
      ...order,
      customerSnapshot: {
        ...blankCustomerSnapshot(),
        ...(order.customerSnapshot || {})
      },
      lineItems: order.lineItems?.length ? order.lineItems : [blankLineItem()]
    });
    setEditorOpen(true);
    setStatusMessage("Order loaded.");
  }

  async function quickAddCustomerIfNeeded(orderToSave) {
    if (orderToSave.customerMode !== "quickAdd") return orderToSave;

    const snapshot = orderToSave.customerSnapshot || {};
    const customerName = String(snapshot.name || snapshot.businessName || "").trim();

    if (!customerName) {
      throw new Error("Customer name is required for Quick Add.");
    }

    const customerToSave = {
      name: snapshot.name || snapshot.businessName || "",
      businessName: snapshot.businessName || "",
      customerType: snapshot.customerType || "Retail customer",
      status: "Active",
      email: snapshot.email || "",
      phone: snapshot.phone || "",
      preferredContact: snapshot.preferredContact || "Email",
      productInterests: "",
      source: "Order quick add",
      lastContactDate: todayString(),
      followUpDate: "",
      notes: snapshot.notes || ""
    };

    const customerId = await saveCustomer(user.uid, customerToSave);

    return {
      ...orderToSave,
      customerMode: "saved",
      customerId,
      customerSnapshot: {
        ...snapshot,
        customerType: customerToSave.customerType,
        preferredContact: customerToSave.preferredContact
      }
    };
  }

  async function handleSaveOrder() {
    if (!user) return;

    const customerName = String(
      form.customerSnapshot?.name || form.customerSnapshot?.businessName || ""
    ).trim();

    if (!customerName) {
      setStatusMessage("Add a customer name, select a saved customer, or use one-time customer.");
      return;
    }

    const filledLineItems = (form.lineItems || []).filter(isLineItemFilled);

    if (
      !filledLineItems.length ||
      filledLineItems.every((item) => !String(item.productName || "").trim())
    ) {
      setStatusMessage("Add at least one line item.");
      return;
    }

    setSaving(true);

    try {
      const cleanLineItems = filledLineItems.map((item) => ({
        ...item,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        lineTotal: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
      }));

      const totals = calculateOrder({
        ...form,
        lineItems: cleanLineItems
      });

      const orderToSave = await quickAddCustomerIfNeeded({
        ...form,
        orderNumber: form.orderNumber || `ORD-${Date.now().toString().slice(-6)}`,
        lineItems: cleanLineItems,
        totals
      });

      const savedId = await saveOrder(user.uid, orderToSave);
      setSelectedOrderId(savedId);
      setForm({
        ...blankOrder(),
        ...orderToSave,
        id: savedId,
        customerSnapshot: {
          ...blankCustomerSnapshot(),
          ...(orderToSave.customerSnapshot || {})
        },
        lineItems: orderToSave.lineItems?.length
          ? orderToSave.lineItems
          : [blankLineItem()]
      });
      setEditorOpen(false);
      setStatusMessage("Order saved.");
      await loadData();
    } catch (error) {
      console.error("Could not save order:", error);
      setStatusMessage(error.message || "Could not save order.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteOrder(order) {
    if (!user || !order?.id) return;

    const confirmed = window.confirm(`Delete ${order.orderNumber || "this order"}?`);
    if (!confirmed) return;

    try {
      await deleteOrder(user.uid, order.id);

      if (selectedOrderId === order.id) {
        setSelectedOrderId("");
        setForm(blankOrder());
        setEditorOpen(false);
      }

      setStatusMessage("Order deleted.");
      await loadData();
    } catch (error) {
      console.error("Could not delete order:", error);
      setStatusMessage("Could not delete order.");
    }
  }

  const filteredOrders = useMemo(() => {
    const search = normalize(queryText);

    return orders.filter((order) => {
      const customer = order.customerSnapshot || {};
      const matchesSearch = search
        ? [
            order.orderNumber,
            customer.name,
            customer.businessName,
            customer.email,
            customer.phone,
            order.status,
            order.fulfillmentType,
            order.internalNotes,
            ...(order.lineItems || []).map((item) => item.productName)
          ]
            .map(normalize)
            .some((value) => value.includes(search))
        : true;

      const matchesStatus =
        statusFilter === "All orders" ||
        (statusFilter === "Open orders"
          ? !["Completed", "Cancelled"].includes(order.status)
          : order.status === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [orders, queryText, statusFilter]);

  const stats = useMemo(() => {
    const openOrders = orders.filter(
      (order) => !["Completed", "Cancelled"].includes(order.status)
    );
    const readyOrders = orders.filter((order) => order.status === "Ready");
    const totalOpenValue = openOrders.reduce((sum, order) => {
      return sum + (Number(order.totals?.balanceDue ?? order.totals?.total) || 0);
    }, 0);

    return {
      open: openOrders.length,
      ready: readyOrders.length,
      total: orders.length,
      openValue: totalOpenValue
    };
  }, [orders]);

  const totals = calculateOrder(form);

  if (!user) {
    return (
      <div className="ordersModule modulePage">
        <section className="moduleHero compactHero">
          <div>
            <p className="eyebrow">Orders</p>
            <h2>Sign in to manage customer orders.</h2>
            <p>
              Create orders, connect customers, add products, and track fulfillment
              from draft through completion.
            </p>
          </div>

          <button className="primaryButton" type="button" onClick={loginWithGoogle}>
            Sign in with Google
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="ordersModule modulePage">
      {statusMessage ? (
        <div className="floatingStatus" role="status">
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            <X size={16} />
          </button>
        </div>
      ) : null}

      <section className="moduleHero compactHero">
        <div>
          <p className="eyebrow">Orders</p>
          <h2>Manage customer orders from request to fulfillment.</h2>
          <p>
            Select saved customers, quick-add new customers, enter one-time orders,
            and build line items from your product directory or manual entries.
          </p>
        </div>

        <button className="primaryButton" type="button" onClick={startNewOrder}>
          <Plus size={18} />
          New Order
        </button>
      </section>

      <section className="hubStatGrid ordersStatGrid">
        <StatCard
          icon={ClipboardList}
          label="Open"
          value={loading ? "..." : stats.open}
          sub="active orders"
          accent="orders"
        />
        <StatCard
          icon={CheckCircle2}
          label="Ready"
          value={loading ? "..." : stats.ready}
          sub="ready for fulfillment"
          accent="market"
        />
        <StatCard
          icon={DollarSign}
          label="Open Value"
          value={loading ? "..." : money(stats.openValue)}
          sub="balance due"
          accent="pricing"
        />
        <StatCard
          icon={Package}
          label="Products"
          value={loading ? "..." : products.length}
          sub="available line items"
          accent="sourdough"
        />
      </section>

      <section className="ordersDirectoryOnlyLayout">
        <div className="workspacePanel compactPanel ordersDirectoryPanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Directory</p>
              <h3>Order Directory</h3>
            </div>

            <button className="secondaryButton compactButton" type="button" onClick={loadData}>
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>

          <div className="ordersFilterGrid">
            <div className="searchBox compactSearch customersSearchBox">
              <Search size={17} />
              <input
                type="search"
                value={queryText}
                onChange={(event) => setQueryText(event.target.value)}
                placeholder="Search orders, customers, or products"
              />
            </div>

            <label>
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option>Open orders</option>
                <option>All orders</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="ordersList">
            {filteredOrders.length ? (
              filteredOrders.map((order) => (
                <div
                  className={`ordersListItem ${
                    selectedOrderId === order.id ? "selected" : ""
                  }`}
                  key={order.id}
                >
                  <button type="button" onClick={() => loadOrder(order)}>
                    <strong>{order.orderNumber || "Untitled Order"}</strong>
                    <span>{orderCustomerDisplay(order)}</span>
                    <small>
                      {order.dueDate || "No due date"} • {money(order.totals?.total || 0)}
                    </small>
                  </button>

                  <span className={`orderStatusPill ${orderStatusClass(order.status)}`}>
                    {order.status || "Draft"}
                  </span>

                  <button
                    className="iconButton danger"
                    type="button"
                    onClick={() => handleDeleteOrder(order)}
                    aria-label="Delete order"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            ) : (
              <p className="dashboardEmpty">
                {loading ? "Loading orders..." : "No orders match your filters."}
              </p>
            )}
          </div>
        </div>
      </section>

      {editorOpen ? (
        <div className="ordersEditorOverlay" role="dialog" aria-modal="true">
          <div className="workspacePanel compactPanel ordersEditorPanel ordersEditorModal">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Editor</p>
              <h3>{form.id ? form.orderNumber || "Edit Order" : "New Order"}</h3>
            </div>

            <div className="formActions compactActions">
              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={() => setEditorOpen(false)}
              >
                <X size={15} />
                Close
              </button>

              <button
                className="primaryButton compactPrimary"
                type="button"
                onClick={handleSaveOrder}
                disabled={saving}
              >
                <Save size={15} />
                {saving ? "Saving..." : "Save Order"}
              </button>
            </div>
          </div>

          <div className="formGrid compactFormGrid">
            <label>
              Order Number
              <input
                value={form.orderNumber}
                onChange={(event) => updateOrderField("orderNumber", event.target.value)}
                placeholder="ORD-000001"
              />
            </label>

            <label>
              Status
              <select
                value={form.status}
                onChange={(event) => updateOrderField("status", event.target.value)}
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>

            <label>
              Order Date
              <input
                type="date"
                value={form.orderDate}
                onChange={(event) => updateOrderField("orderDate", event.target.value)}
              />
            </label>

            <label>
              Due / Fulfillment Date
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => updateOrderField("dueDate", event.target.value)}
              />
            </label>

            <label>
              Fulfillment
              <select
                value={form.fulfillmentType}
                onChange={(event) =>
                  updateOrderField("fulfillmentType", event.target.value)
                }
              >
                {FULFILLMENT_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>

            <label>
              Pricing
              <select
                value={form.pricingMode}
                onChange={(event) => updatePricingMode(event.target.value)}
              >
                <option value="retail">Retail pricing</option>
                <option value="wholesale">Wholesale pricing</option>
              </select>
            </label>
          </div>

          <div className="ordersSubPanel">
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Customer</p>
                <h3>Customer Info</h3>
              </div>
              <Users size={20} />
            </div>

            <div className="ordersCustomerModeGrid">
              {CUSTOMER_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  className={`ordersChoiceButton ${
                    form.customerMode === mode.value ? "selected" : ""
                  }`}
                  onClick={() => updateCustomerMode(mode.value)}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {form.customerMode === "saved" ? (
              <label>
                Saved Customer
                <select
                  value={form.customerId}
                  onChange={(event) => selectSavedCustomer(event.target.value)}
                >
                  <option value="">Select saved customer...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.businessName
                        ? `${customer.businessName} (${customer.name || "contact"})`
                        : customer.name || "Unnamed Customer"}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="formGrid compactFormGrid">
              <label>
                Customer Name
                <input
                  value={form.customerSnapshot.name}
                  disabled={form.customerMode === "saved" && Boolean(form.customerId)}
                  onChange={(event) => updateCustomerSnapshot("name", event.target.value)}
                  placeholder="Customer or contact name"
                />
              </label>

              <label>
                Business Name
                <input
                  value={form.customerSnapshot.businessName}
                  disabled={form.customerMode === "saved" && Boolean(form.customerId)}
                  onChange={(event) =>
                    updateCustomerSnapshot("businessName", event.target.value)
                  }
                  placeholder="Optional"
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={form.customerSnapshot.email}
                  disabled={form.customerMode === "saved" && Boolean(form.customerId)}
                  onChange={(event) => updateCustomerSnapshot("email", event.target.value)}
                  placeholder="name@example.com"
                />
              </label>

              <label>
                Phone
                <input
                  value={form.customerSnapshot.phone}
                  disabled={form.customerMode === "saved" && Boolean(form.customerId)}
                  onChange={(event) => updateCustomerSnapshot("phone", event.target.value)}
                  placeholder="Optional"
                />
              </label>

              {form.customerMode === "quickAdd" ? (
                <>
                  <label>
                    Customer Type
                    <input
                      value={form.customerSnapshot.customerType}
                      onChange={(event) =>
                        updateCustomerSnapshot("customerType", event.target.value)
                      }
                      placeholder="Retail customer"
                    />
                  </label>

                  <label>
                    Preferred Contact
                    <input
                      value={form.customerSnapshot.preferredContact}
                      onChange={(event) =>
                        updateCustomerSnapshot("preferredContact", event.target.value)
                      }
                      placeholder="Email, Phone, Text"
                    />
                  </label>
                </>
              ) : null}

              <label className="fullSpan">
                Customer / Order Notes
                <input
                  value={form.customerSnapshot.notes || ""}
                  disabled={form.customerMode === "saved" && Boolean(form.customerId)}
                  onChange={(event) => updateCustomerSnapshot("notes", event.target.value)}
                  placeholder="Preferences, allergies, delivery notes, or context"
                />
              </label>
            </div>

            {form.customerMode === "quickAdd" ? (
              <p className="ordersHelperText">
                This customer will be saved to the Customers module when the order is saved.
              </p>
            ) : null}

            {form.customerMode === "oneTime" ? (
              <p className="ordersHelperText">
                This customer will only be stored on this order and will not be added to Customers.
              </p>
            ) : null}
          </div>

          <div className="ordersSubPanel">
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Products</p>
                <h3>Line Items</h3>
              </div>

              <button className="secondaryButton compactButton" type="button" onClick={addLineItem}>
                <Plus size={15} />
                Add Line
              </button>
            </div>

            <div className="ordersLineHeader">
              <span>Item</span>
              <span>Qty</span>
              <span>Unit</span>
              <span>Price</span>
              <span>Total</span>
              <span></span>
            </div>

            <div className="ordersLineList">
              {form.lineItems.map((item) => (
                <div className="ordersLineRow" key={item.id}>
                  <div className="ordersLineProduct">
                    <div className="ordersLineMode">
                      <button
                        type="button"
                        className={item.productId ? "selected" : ""}
                        onClick={() =>
                          updateLineItem(item.id, "productId", products[0]?.id || "")
                        }
                        disabled={!products.length}
                      >
                        Product
                      </button>
                      <button
                        type="button"
                        className={!item.productId ? "selected" : ""}
                        onClick={() => updateLineItem(item.id, "productId", "")}
                      >
                        Manual
                      </button>
                    </div>

                    {item.productId ? (
                      <select
                        value={item.productId}
                        onChange={(event) =>
                          updateLineItem(item.id, "productId", event.target.value)
                        }
                      >
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.sourceLabel})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={item.productName}
                        onChange={(event) =>
                          updateLineItem(item.id, "productName", event.target.value)
                        }
                        placeholder="Manual item name"
                      />
                    )}
                  </div>

                  <input
                    type="number"
                    step="0.01"
                    value={item.quantity}
                    onChange={(event) =>
                      updateLineItem(item.id, "quantity", event.target.value)
                    }
                  />

                  <input
                    value={item.unitLabel}
                    onChange={(event) =>
                      updateLineItem(item.id, "unitLabel", event.target.value)
                    }
                    placeholder="each"
                  />

                  <input
                    type="number"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(event) =>
                      updateLineItem(item.id, "unitPrice", event.target.value)
                    }
                    placeholder="0.00"
                  />

                  <span className="ordersLineTotal">
                    {money((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                  </span>

                  <button
                    className="iconButton danger"
                    type="button"
                    onClick={() => removeLineItem(item.id)}
                    aria-label="Remove line item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="ordersSubPanel">
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Totals</p>
                <h3>Order Summary</h3>
              </div>
              <DollarSign size={20} />
            </div>

            <div className="ordersTotalsGrid">
              <label>
                Discount $
                <input
                  type="number"
                  step="0.01"
                  value={form.discountAmount}
                  onChange={(event) =>
                    updateOrderField("discountAmount", event.target.value)
                  }
                  placeholder="0.00"
                />
              </label>

              <label>
                Tax %
                <input
                  type="number"
                  step="0.01"
                  value={form.taxRate}
                  onChange={(event) => updateOrderField("taxRate", event.target.value)}
                  placeholder="0"
                />
              </label>

              <label>
                Deposit Paid $
                <input
                  type="number"
                  step="0.01"
                  value={form.depositPaid}
                  onChange={(event) =>
                    updateOrderField("depositPaid", event.target.value)
                  }
                  placeholder="0.00"
                />
              </label>

              <div>
                <span>Subtotal</span>
                <strong>{money(totals.subtotal)}</strong>
              </div>

              <div>
                <span>Tax</span>
                <strong>{money(totals.taxAmount)}</strong>
              </div>

              <div>
                <span>Total</span>
                <strong>{money(totals.total)}</strong>
              </div>

              <div className="ordersBalanceDue">
                <span>Balance Due</span>
                <strong>{money(totals.balanceDue)}</strong>
              </div>
            </div>

            <div className="formGrid compactFormGrid">
              <label className="fullSpan">
                Customer Notes
                <textarea
                  value={form.customerNotes}
                  onChange={(event) => updateOrderField("customerNotes", event.target.value)}
                  placeholder="Notes visible to the customer, packing slip, or invoice later"
                />
              </label>

              <label className="fullSpan">
                Internal Notes
                <textarea
                  value={form.internalNotes}
                  onChange={(event) => updateOrderField("internalNotes", event.target.value)}
                  placeholder="Internal production notes, delivery notes, or reminders"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
      ) : null}
    </div>
  );
}
