import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CircleHelp,
  DollarSign,
  FileCheck2,
  PackagePlus,
  Plus,
  Receipt,
  Save,
  Search,
  SquareStack,
  Trash2,
  TrendingUp,
  X
} from "lucide-react";

import { useAuth } from "../AuthContext.jsx";
import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import ModuleHero from "../components/ModuleHero.jsx";
import SalesGuideContent from "../components/SalesGuideContent.jsx";
import StatCard from "../components/StatCard.jsx";
import { getProducts } from "../services/productService.js";
import {
  deleteSale,
  getSales,
  saveDailySalesEntry,
  saveSale,
  summarizeSales
} from "../services/salesService.js";

const SALE_TYPES = [
  "Individual Sale",
  "Market Day",
  "Restaurant",
  "Wholesale",
  "Event",
  "Retail Shop",
  "Custom"
];

const PAYMENT_METHODS = [
  "Not Recorded",
  "Cash",
  "Card",
  "Square",
  "Check",
  "ACH",
  "Invoice",
  "Other"
];

const TIMEFRAME_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
  { value: "all", label: "All time" }
];

function makeId(prefix = "item") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function money(value) {
  return (Number(value) || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function cleanCurrencyInput(value) {
  if (value === "" || value === null || value === undefined) return "";
  return numberValue(value).toFixed(2);
}

function formatDate(dateString) {
  if (!dateString) return "No date";

  const [year, month, day] = String(dateString).split("-").map(Number);
  if (!year || !month || !day) return dateString;

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function startDateForTimeframe(timeframe) {
  if (timeframe === "all") return "";

  const days = Number(timeframe);
  if (!days) return "";

  const date = new Date();
  date.setDate(date.getDate() - days + 1);
  return date.toISOString().slice(0, 10);
}

function blankLineItem() {
  return {
    id: makeId("line"),
    productId: "",
    productName: "",
    productCategory: "",
    variantId: "",
    variantName: "",
    quantity: 1,
    unit: "each",
    unitPrice: "",
    discount: "",
    lineTotal: 0,
    deductFromInventory: false,
    notes: ""
  };
}

function blankSale() {
  return {
    id: "",
    entryMode: "line-items",
    source: "manual",
    sourceOrderId: "",
    saleDate: todayString(),
    saleType: "Individual Sale",
    customerId: "",
    customerName: "",
    marketName: "",
    paymentMethod: "Not Recorded",
    paymentStatus: "Paid",
    lines: [blankLineItem()],
    grossSales: 0,
    discounts: "",
    fees: "",
    tax: "",
    tips: "",
    netSales: 0,
    notes: "",
    createdAt: "",
    updatedAt: ""
  };
}

function blankDailyEntry() {
  return {
    saleDate: todayString(),
    saleType: "Market Day",
    marketName: "",
    paymentMethod: "Not Recorded",
    grossSales: "",
    discounts: "",
    fees: "",
    tax: "",
    tips: "",
    netSales: "",
    notes: ""
  };
}

function getProductDisplayName(product) {
  return product?.name || product?.productName || product?.recipeName || "Unnamed product";
}

function getProductCategory(product) {
  return product?.category || product?.productCategory || product?.sourceModule || "";
}

function getProductRetailPrice(product) {
  return (
    product?.retailPrice ||
    product?.price ||
    product?.suggestedRetailPrice ||
    product?.unitPrice ||
    ""
  );
}

function getProductWholesalePrice(product) {
  return product?.wholesalePrice || product?.retailPrice || product?.price || "";
}

function getProductUnit(product) {
  return product?.unit || product?.unitLabel || product?.packageUnit || "each";
}

function lineTotal(line) {
  const subtotal = numberValue(line.quantity) * numberValue(line.unitPrice);
  return Math.max(subtotal - numberValue(line.discount), 0);
}

function calculateSaleTotals(sale) {
  const grossSales = (sale.lines || []).reduce(
    (sum, line) => sum + lineTotal(line),
    0
  );

  const netSales = Math.max(
    grossSales -
      numberValue(sale.discounts) -
      numberValue(sale.fees) +
      numberValue(sale.tax) +
      numberValue(sale.tips),
    0
  );

  return {
    grossSales,
    netSales
  };
}

function calculateDailyNet(entry) {
  if (entry.netSales !== "" && entry.netSales !== null && entry.netSales !== undefined) {
    return numberValue(entry.netSales);
  }

  return Math.max(
    numberValue(entry.grossSales) -
      numberValue(entry.discounts) -
      numberValue(entry.fees) +
      numberValue(entry.tax) +
      numberValue(entry.tips),
    0
  );
}

function buildChartRows(sales) {
  const totals = sales.reduce((accumulator, sale) => {
    const date = sale.saleDate || "No date";
    accumulator[date] = (accumulator[date] || 0) + numberValue(sale.netSales);
    return accumulator;
  }, {});

  return Object.entries(totals)
    .sort(([dateA], [dateB]) => String(dateA).localeCompare(String(dateB)))
    .map(([date, total]) => ({
      date,
      total
    }));
}

export default function Sales() {
  const { user, loginWithGoogle } = useAuth();

  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeMode, setActiveMode] = useState("line-items");
  const [saleDraft, setSaleDraft] = useState(blankSale);
  const [dailyDraft, setDailyDraft] = useState(blankDailyEntry);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeframe, setTimeframe] = useState("30");
  const [saleTypeFilter, setSaleTypeFilter] = useState("All");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("success");
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const saleTotals = useMemo(() => calculateSaleTotals(saleDraft), [saleDraft]);

  const filteredSales = useMemo(() => {
    const startDate = startDateForTimeframe(timeframe);
    const search = searchTerm.toLowerCase().trim();

    return sales.filter((sale) => {
      const matchesDate = !startDate || String(sale.saleDate || "") >= startDate;
      const matchesType =
        saleTypeFilter === "All" || sale.saleType === saleTypeFilter;

      const searchableText = [
        sale.saleType,
        sale.customerName,
        sale.marketName,
        sale.paymentMethod,
        sale.notes,
        ...(sale.lines || []).map((line) => line.productName)
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);

      return matchesDate && matchesType && matchesSearch;
    });
  }, [sales, searchTerm, timeframe, saleTypeFilter]);

  const salesSummary = useMemo(() => summarizeSales(filteredSales), [filteredSales]);
  const chartRows = useMemo(() => buildChartRows(filteredSales), [filteredSales]);
  const chartMax = useMemo(
    () => Math.max(...chartRows.map((row) => row.total), 1),
    [chartRows]
  );

  const productOptions = useMemo(() => {
    return products
      .map((product) => ({
        id: product.id || "",
        name: getProductDisplayName(product),
        category: getProductCategory(product),
        retailPrice: getProductRetailPrice(product),
        wholesalePrice: getProductWholesalePrice(product),
        unit: getProductUnit(product)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  function showStatus(message, type = "success") {
    setStatusMessage(message);
    setStatusType(type);
  }

  async function loadSalesModuleData() {
    if (!user?.uid) return;

    setIsLoading(true);

    try {
      const [savedSales, savedProducts] = await Promise.all([
        getSales(user.uid),
        getProducts(user.uid)
      ]);

      setSales(savedSales);
      setProducts(savedProducts);
    } catch (error) {
      console.error(error);
      showStatus("Could not load Sales data.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSalesModuleData();
  }, [user?.uid]);

  useEffect(() => {
    if (!statusMessage) return;

    const timer = window.setTimeout(() => {
      setStatusMessage("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  function updateSaleDraft(field, value) {
    setSaleDraft((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateDailyDraft(field, value) {
    setDailyDraft((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateLineItem(lineId, field, value) {
    setSaleDraft((current) => ({
      ...current,
      lines: current.lines.map((line) =>
        line.id === lineId
          ? {
              ...line,
              [field]: value
            }
          : line
      )
    }));
  }

  function handleProductSelect(lineId, productId) {
    const selectedProduct = productOptions.find((product) => product.id === productId);

    setSaleDraft((current) => ({
      ...current,
      lines: current.lines.map((line) => {
        if (line.id !== lineId) return line;

        if (!selectedProduct) {
          return {
            ...line,
            productId: "",
            productName: "",
            productCategory: "",
            unitPrice: ""
          };
        }

        return {
          ...line,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productCategory: selectedProduct.category,
          unit: selectedProduct.unit,
          unitPrice: selectedProduct.retailPrice || selectedProduct.wholesalePrice || ""
        };
      })
    }));
  }

  function addLineItem() {
    setSaleDraft((current) => ({
      ...current,
      lines: [...current.lines, blankLineItem()]
    }));
  }

  function removeLineItem(lineId) {
    setSaleDraft((current) => ({
      ...current,
      lines:
        current.lines.length > 1
          ? current.lines.filter((line) => line.id !== lineId)
          : [blankLineItem()]
    }));
  }

  function startEditSale(sale) {
    if (sale.entryMode === "daily-total") {
      setActiveMode("daily-total");
      setDailyDraft({
        id: sale.id,
        saleDate: sale.saleDate || todayString(),
        saleType: sale.saleType || "Market Day",
        marketName: sale.marketName || "",
        paymentMethod: sale.paymentMethod || "Not Recorded",
        grossSales: sale.grossSales || "",
        discounts: sale.discounts || "",
        fees: sale.fees || "",
        tax: sale.tax || "",
        tips: sale.tips || "",
        netSales: sale.netSales || "",
        notes: sale.notes || "",
        createdAt: sale.createdAt || ""
      });
      return;
    }

    setActiveMode("line-items");
    setSaleDraft({
      ...blankSale(),
      ...sale,
      lines: Array.isArray(sale.lines) && sale.lines.length ? sale.lines : [blankLineItem()]
    });
  }

  async function handleSaveLineItemSale() {
    if (!user?.uid) {
      showStatus("Sign in before saving a sale.", "error");
      return;
    }

    const filledLines = saleDraft.lines.filter((line) => {
      return (
        line.productName.trim() ||
        line.productId ||
        numberValue(line.quantity) ||
        numberValue(line.unitPrice)
      );
    });

    if (!filledLines.length) {
      showStatus("Add at least one product or manual line item.", "error");
      return;
    }

    try {
      const cleanLines = filledLines.map((line) => ({
        ...line,
        lineTotal: lineTotal(line),
        unitPrice: cleanCurrencyInput(line.unitPrice),
        discount: cleanCurrencyInput(line.discount)
      }));

      await saveSale(user.uid, {
        ...saleDraft,
        entryMode: "line-items",
        source: saleDraft.source || "manual",
        lines: cleanLines,
        grossSales: saleTotals.grossSales,
        netSales: saleTotals.netSales
      });

      setSaleDraft(blankSale());
      await loadSalesModuleData();
      showStatus("Sale saved.");
    } catch (error) {
      console.error(error);
      showStatus("Could not save that sale.", "error");
    }
  }

  async function handleSaveDailyEntry() {
    if (!user?.uid) {
      showStatus("Sign in before saving a daily total.", "error");
      return;
    }

    if (!dailyDraft.grossSales && !dailyDraft.netSales) {
      showStatus("Enter at least a gross or net sales number.", "error");
      return;
    }

    try {
      await saveDailySalesEntry(user.uid, {
        ...dailyDraft,
        netSales: calculateDailyNet(dailyDraft)
      });

      setDailyDraft(blankDailyEntry());
      await loadSalesModuleData();
      showStatus("Daily sales total saved.");
    } catch (error) {
      console.error(error);
      showStatus("Could not save that daily total.", "error");
    }
  }

  async function handleDeleteSale(saleId) {
    if (!user?.uid || !saleId) return;

    const confirmed = window.confirm("Delete this sales record?");
    if (!confirmed) return;

    try {
      await deleteSale(user.uid, saleId);
      await loadSalesModuleData();
      showStatus("Sale deleted.");
    } catch (error) {
      console.error(error);
      showStatus("Could not delete that sale.", "error");
    }
  }

  if (!user) {
    return (
      <div className="salesModule">
        <ModuleHero
          eyebrow="Sales"
          title="Sign in to track sales."
          description="Track product sales, daily totals, market revenue, and completed order revenue."
          className="salesHero"
          actions={[
            {
              label: "Sign in with Google",
              icon: DollarSign,
              onClick: loginWithGoogle
            }
          ]}
        />
      </div>
    );
  }

  return (
    <div className="salesModule">
      {statusMessage ? (
        <div className={`floatingStatus ${statusType}`}>
          <span>ⓘ</span>
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            <X size={16} />
          </button>
        </div>
      ) : null}

      <ModuleHero
        eyebrow="Sales"
        title="Track revenue across your farm business."
        description="Log individual sales, record quick daily totals, review sales trends, and keep completed order revenue connected."
        className="salesHero"
        actions={[
          {
            label: "Add Sale",
            icon: Plus,
            onClick: () => setActiveMode("line-items")
          },
          {
            label: "Add Daily Total",
            icon: CalendarDays,
            onClick: () => setActiveMode("daily-total"),
            variant: "secondary"
          },
          {
            label: "Guide",
            icon: CircleHelp,
            onClick: () => setIsGuideOpen(true),
            variant: "secondary"
          }
        ]}
      />

      <div className="statsGrid salesStatsGrid">
        <StatCard
          icon={DollarSign}
          label="Net Sales"
          value={money(salesSummary.totalNetSales)}
          tone="sales"
        />
        <StatCard
          icon={Receipt}
          label="Sales Records"
          value={salesSummary.totalSalesCount}
          tone="sales"
        />
        <StatCard
          icon={TrendingUp}
          label="Average Sale"
          value={money(salesSummary.averageSale)}
          tone="sales"
        />
        <StatCard
          icon={BarChart3}
          label="Best Sales Day"
          value={money(salesSummary.bestSalesDay?.total || 0)}
          helper={salesSummary.bestSalesDay?.date ? formatDate(salesSummary.bestSalesDay.date) : ""}
          tone="sales"
        />
      </div>

      <section className="salesToolbar moduleToolbar">
        <div className="searchBox">
          <Search size={16} />
          <input
            type="search"
            placeholder="Search sales..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <select
          value={timeframe}
          onChange={(event) => setTimeframe(event.target.value)}
        >
          {TIMEFRAME_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={saleTypeFilter}
          onChange={(event) => setSaleTypeFilter(event.target.value)}
        >
          <option value="All">All sale types</option>
          {SALE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </section>

      <section className="salesGrid">
        <div className="panelCard salesEntryPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Entry</p>
              <h3>{activeMode === "line-items" ? "Product Sale" : "Daily Sales Total"}</h3>
            </div>

            <div className="segmentedControl">
              <button
                type="button"
                className={activeMode === "line-items" ? "active" : ""}
                onClick={() => setActiveMode("line-items")}
              >
                Sale
              </button>
              <button
                type="button"
                className={activeMode === "daily-total" ? "active" : ""}
                onClick={() => setActiveMode("daily-total")}
              >
                Daily Total
              </button>
            </div>
          </div>

          {activeMode === "line-items" ? (
            <div className="salesFormStack">
              <div className="formGrid three">
                <label>
                  Sale Date
                  <input
                    type="date"
                    value={saleDraft.saleDate}
                    onChange={(event) => updateSaleDraft("saleDate", event.target.value)}
                  />
                </label>

                <label>
                  Sale Type
                  <select
                    value={saleDraft.saleType}
                    onChange={(event) => updateSaleDraft("saleType", event.target.value)}
                  >
                    {SALE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Payment
                  <select
                    value={saleDraft.paymentMethod}
                    onChange={(event) =>
                      updateSaleDraft("paymentMethod", event.target.value)
                    }
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="formGrid two">
                <label>
                  Customer or Buyer
                  <input
                    type="text"
                    value={saleDraft.customerName}
                    onChange={(event) =>
                      updateSaleDraft("customerName", event.target.value)
                    }
                    placeholder="Optional"
                  />
                </label>

                <label>
                  Market or Event
                  <input
                    type="text"
                    value={saleDraft.marketName}
                    onChange={(event) =>
                      updateSaleDraft("marketName", event.target.value)
                    }
                    placeholder="Optional"
                  />
                </label>
              </div>

              <div className="salesLineItems">
                <div className="salesLineItemsHeader">
                  <h4>Line Items</h4>
                  <button type="button" className="secondaryButton compactPrimary" onClick={addLineItem}>
                    <Plus size={15} />
                    Add Line
                  </button>
                </div>

                {saleDraft.lines.map((line) => (
                  <div className="salesLineItem" key={line.id}>
                    <label>
                      Product
                      <select
                        value={line.productId}
                        onChange={(event) => handleProductSelect(line.id, event.target.value)}
                      >
                        <option value="">Manual or quick-add product</option>
                        {productOptions.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Name
                      <input
                        type="text"
                        value={line.productName}
                        onChange={(event) =>
                          updateLineItem(line.id, "productName", event.target.value)
                        }
                        placeholder="Product name"
                      />
                    </label>

                    <label>
                      Qty
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={line.quantity}
                        onChange={(event) =>
                          updateLineItem(line.id, "quantity", event.target.value)
                        }
                      />
                    </label>

                    <label>
                      Unit Price
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(event) =>
                          updateLineItem(line.id, "unitPrice", event.target.value)
                        }
                        onBlur={(event) =>
                          updateLineItem(line.id, "unitPrice", cleanCurrencyInput(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Discount
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.discount}
                        onChange={(event) =>
                          updateLineItem(line.id, "discount", event.target.value)
                        }
                        onBlur={(event) =>
                          updateLineItem(line.id, "discount", cleanCurrencyInput(event.target.value))
                        }
                      />
                    </label>

                    <div className="salesLineTotal">
                      <span>Total</span>
                      <strong>{money(lineTotal(line))}</strong>
                    </div>

                    <button
                      type="button"
                      className="iconButton danger"
                      onClick={() => removeLineItem(line.id)}
                      aria-label="Remove line item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="formGrid three">
                <label>
                  Sale-Level Discount
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={saleDraft.discounts}
                    onChange={(event) => updateSaleDraft("discounts", event.target.value)}
                    onBlur={(event) =>
                      updateSaleDraft("discounts", cleanCurrencyInput(event.target.value))
                    }
                  />
                </label>

                <label>
                  Fees
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={saleDraft.fees}
                    onChange={(event) => updateSaleDraft("fees", event.target.value)}
                    onBlur={(event) =>
                      updateSaleDraft("fees", cleanCurrencyInput(event.target.value))
                    }
                  />
                </label>

                <label>
                  Tax
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={saleDraft.tax}
                    onChange={(event) => updateSaleDraft("tax", event.target.value)}
                    onBlur={(event) =>
                      updateSaleDraft("tax", cleanCurrencyInput(event.target.value))
                    }
                  />
                </label>
              </div>

              <label>
                Notes
                <textarea
                  value={saleDraft.notes}
                  onChange={(event) => updateSaleDraft("notes", event.target.value)}
                  placeholder="Optional notes"
                  rows={3}
                />
              </label>

              <div className="salesTotalBar">
                <div>
                  <span>Gross</span>
                  <strong>{money(saleTotals.grossSales)}</strong>
                </div>
                <div>
                  <span>Net</span>
                  <strong>{money(saleTotals.netSales)}</strong>
                </div>
                <button type="button" className="primaryButton compactPrimary" onClick={handleSaveLineItemSale}>
                  <Save size={16} />
                  Save Sale
                </button>
              </div>
            </div>
          ) : (
            <div className="salesFormStack">
              <div className="formGrid three">
                <label>
                  Date
                  <input
                    type="date"
                    value={dailyDraft.saleDate}
                    onChange={(event) => updateDailyDraft("saleDate", event.target.value)}
                  />
                </label>

                <label>
                  Category
                  <select
                    value={dailyDraft.saleType}
                    onChange={(event) => updateDailyDraft("saleType", event.target.value)}
                  >
                    {SALE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Payment
                  <select
                    value={dailyDraft.paymentMethod}
                    onChange={(event) =>
                      updateDailyDraft("paymentMethod", event.target.value)
                    }
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Market, Channel, or Label
                <input
                  type="text"
                  value={dailyDraft.marketName}
                  onChange={(event) => updateDailyDraft("marketName", event.target.value)}
                  placeholder="Saturday Market, online sales, restaurant drop, etc."
                />
              </label>

              <div className="formGrid three">
                <label>
                  Gross Sales
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={dailyDraft.grossSales}
                    onChange={(event) => updateDailyDraft("grossSales", event.target.value)}
                    onBlur={(event) =>
                      updateDailyDraft("grossSales", cleanCurrencyInput(event.target.value))
                    }
                  />
                </label>

                <label>
                  Discounts
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={dailyDraft.discounts}
                    onChange={(event) => updateDailyDraft("discounts", event.target.value)}
                    onBlur={(event) =>
                      updateDailyDraft("discounts", cleanCurrencyInput(event.target.value))
                    }
                  />
                </label>

                <label>
                  Fees
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={dailyDraft.fees}
                    onChange={(event) => updateDailyDraft("fees", event.target.value)}
                    onBlur={(event) =>
                      updateDailyDraft("fees", cleanCurrencyInput(event.target.value))
                    }
                  />
                </label>
              </div>

              <div className="formGrid two">
                <label>
                  Tax
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={dailyDraft.tax}
                    onChange={(event) => updateDailyDraft("tax", event.target.value)}
                    onBlur={(event) =>
                      updateDailyDraft("tax", cleanCurrencyInput(event.target.value))
                    }
                  />
                </label>

                <label>
                  Net Sales
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={dailyDraft.netSales}
                    onChange={(event) => updateDailyDraft("netSales", event.target.value)}
                    onBlur={(event) =>
                      updateDailyDraft("netSales", cleanCurrencyInput(event.target.value))
                    }
                    placeholder={money(calculateDailyNet(dailyDraft))}
                  />
                </label>
              </div>

              <label>
                Notes
                <textarea
                  value={dailyDraft.notes}
                  onChange={(event) => updateDailyDraft("notes", event.target.value)}
                  placeholder="Optional notes"
                  rows={3}
                />
              </label>

              <div className="salesTotalBar">
                <div>
                  <span>Calculated Net</span>
                  <strong>{money(calculateDailyNet(dailyDraft))}</strong>
                </div>
                <button type="button" className="primaryButton compactPrimary" onClick={handleSaveDailyEntry}>
                  <Save size={16} />
                  Save Daily Total
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="panelCard salesChartPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Reporting</p>
              <h3>Sales Trend</h3>
            </div>
            <BarChart3 size={22} />
          </div>

          {chartRows.length ? (
            <div className="salesChart">
              {chartRows.map((row) => (
                <div className="salesChartBar" key={row.date}>
                  <div className="salesChartBarTrack">
                    <span style={{ height: `${Math.max((row.total / chartMax) * 100, 8)}%` }} />
                  </div>
                  <small>{formatDate(row.date).replace(", 2026", "")}</small>
                  <strong>{money(row.total)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="emptyState salesEmptyState">
              <BarChart3 size={28} />
              <h4>No sales in this view yet.</h4>
              <p>Add a sale or daily total to start seeing trend data.</p>
            </div>
          )}

          <div className="squareComingSoon">
            <SquareStack size={18} />
            <div>
              <strong>Square import placeholder</strong>
              <span>
                Future upgrade: pull Square daily totals into this report without manual entry.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="panelCard salesLogPanel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Sales Log</p>
            <h3>Saved Sales</h3>
          </div>
          {isLoading ? <span className="subtleText">Loading...</span> : null}
        </div>

        {filteredSales.length ? (
          <div className="salesLogList">
            {filteredSales.map((sale) => (
              <article className="salesLogCard" key={sale.id}>
                <div className="salesLogMain">
                  <div className="salesLogIcon">
                    {sale.entryMode === "daily-total" ? (
                      <CalendarDays size={18} />
                    ) : sale.source === "order" ? (
                      <FileCheck2 size={18} />
                    ) : (
                      <Receipt size={18} />
                    )}
                  </div>

                  <div>
                    <h4>
                      {sale.entryMode === "daily-total"
                        ? sale.marketName || sale.saleType || "Daily Total"
                        : sale.customerName || sale.marketName || sale.saleType || "Sale"}
                    </h4>
                    <p>
                      {formatDate(sale.saleDate)} · {sale.saleType || "Sale"} ·{" "}
                      {sale.paymentMethod || "Not Recorded"}
                    </p>

                    {sale.lines?.length ? (
                      <div className="salesLineSummary">
                        {sale.lines.slice(0, 3).map((line) => (
                          <span key={line.id || line.productName}>
                            {line.quantity} × {line.productName || "Item"}
                          </span>
                        ))}
                        {sale.lines.length > 3 ? <span>+{sale.lines.length - 3} more</span> : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="salesLogTotals">
                  <span>Net</span>
                  <strong>{money(sale.netSales)}</strong>
                </div>

                <div className="salesLogActions">
                  <button
                    type="button"
                    className="secondaryButton compactPrimary"
                    onClick={() => startEditSale(sale)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="iconButton danger"
                    onClick={() => handleDeleteSale(sale.id)}
                    aria-label="Delete sale"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="emptyState salesEmptyState">
            <PackagePlus size={28} />
            <h4>No saved sales match this view.</h4>
            <p>Try changing your filters or add your first sales record.</p>
          </div>
        )}
      </section>

      <ModuleGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="Sales Guide"
      >
        <SalesGuideContent />
      </ModuleGuideModal>
    </div>
  );
}
