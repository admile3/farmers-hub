import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  BarChart3,
  CalendarCheck2,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  DollarSign,
  FileCheck2,
  PackagePlus,
  Plus,
  Receipt,
  RefreshCw,
  Save,
  Search,
  SquareStack,
  Trash2,
  TrendingUp,
  X
} from "lucide-react";

import { useAuth } from "../AuthContext.jsx";
import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import SalesGuideContent from "../components/SalesGuideContent.jsx";
import StatCard from "../components/StatCard.jsx";
import { getProducts } from "../services/productService.js";
import {
  connectSquare,
  getSquareConnectionStatus,
  importSquareSales
} from "../services/squareService.js";
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
    id: "",
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
    notes: "",
    createdAt: ""
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

function buildChartRows(sales, chartRange = "week") {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rangeDays = {
    week: 7,
    month: 30,
    quarter: 90,
    year: 365
  };

  const daysToShow = rangeDays[chartRange] || 7;
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - daysToShow + 1);

  const totals = sales.reduce((accumulator, sale) => {
    const date = sale.saleDate || "";
    if (!date) return accumulator;

    accumulator[date] = (accumulator[date] || 0) + numberValue(sale.netSales);
    return accumulator;
  }, {});

  return Array.from({ length: daysToShow }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    const key = date.toISOString().slice(0, 10);

    return {
      date: key,
      total: totals[key] || 0
    };
  });
}

function formatChartDateLabel(dateString, chartRange) {
  const [year, month, day] = String(dateString).split("-").map(Number);
  if (!year || !month || !day) return dateString;

  const date = new Date(year, month - 1, day);

  if (chartRange === "week" || chartRange === "month") {
    return `${month}/${day}`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

function getChartTickIndexes(rows, chartRange) {
  if (!rows.length) return [];

  const tickCounts = {
    week: 7,
    month: 8,
    quarter: 8,
    year: 12
  };

  const tickCount = Math.min(tickCounts[chartRange] || 7, rows.length);
  const lastIndex = rows.length - 1;

  return Array.from({ length: tickCount }, (_, index) =>
    Math.round((index / Math.max(tickCount - 1, 1)) * lastIndex)
  ).filter((value, index, array) => array.indexOf(value) === index);
}

function buildYAxisTicks(maxValue) {
  const normalizedMax = Math.max(Number(maxValue) || 0, 100);
  const magnitude = 10 ** Math.floor(Math.log10(normalizedMax));
  const normalized = normalizedMax / magnitude;

  let roundedMax;

  if (normalized <= 1) {
    roundedMax = magnitude;
  } else if (normalized <= 2) {
    roundedMax = 2 * magnitude;
  } else if (normalized <= 5) {
    roundedMax = 5 * magnitude;
  } else {
    roundedMax = 10 * magnitude;
  }

  const step = roundedMax / 4;

  return Array.from({ length: 5 }, (_, index) => step * index);
}

export default function Sales() {
  const { user, loginWithGoogle } = useAuth();

  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeMode, setActiveMode] = useState("line-items");
  const [saleDraft, setSaleDraft] = useState(blankSale);
  const [dailyDraft, setDailyDraft] = useState(blankDailyEntry);
  const [queryText, setQueryText] = useState("");
  const [timeframe, setTimeframe] = useState("30");
  const [saleTypeFilter, setSaleTypeFilter] = useState("All sales");
  const [chartRange, setChartRange] = useState("week");
  const [statusMessage, setStatusMessage] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [loading, setLoading] = useState(false);
  const [squareImporting, setSquareImporting] = useState(false);
  const [squareStatusLoading, setSquareStatusLoading] = useState(false);
  const [squareConnection, setSquareConnection] = useState({ connected: false });
  const [squareStartDate, setSquareStartDate] = useState(startDateForTimeframe("7"));
  const [squareEndDate, setSquareEndDate] = useState(todayString());

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

  const filteredSales = useMemo(() => {
    const startDate = startDateForTimeframe(timeframe);
    const search = String(queryText || "").toLowerCase().trim();

    return sales.filter((sale) => {
      const matchesDate = !startDate || String(sale.saleDate || "") >= startDate;
      const matchesType =
        saleTypeFilter === "All sales" || sale.saleType === saleTypeFilter;

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
  }, [sales, queryText, timeframe, saleTypeFilter]);

  const reportingSales = useMemo(() => {
    const chartStartDate = {
      week: startDateForTimeframe("7"),
      month: startDateForTimeframe("30"),
      quarter: startDateForTimeframe("90"),
      year: startDateForTimeframe("365")
    }[chartRange];

    return sales.filter((sale) => {
      return !chartStartDate || String(sale.saleDate || "") >= chartStartDate;
    });
  }, [sales, chartRange]);

  const reportingSummary = useMemo(
    () => summarizeSales(reportingSales),
    [reportingSales]
  );

  const allTimeSummary = useMemo(() => summarizeSales(sales), [sales]);

  const chartRows = useMemo(
    () => buildChartRows(reportingSales, chartRange),
    [reportingSales, chartRange]
  );
  const saleTotals = useMemo(() => calculateSaleTotals(saleDraft), [saleDraft]);

  async function loadData() {
    if (!user?.uid) return;

    setLoading(true);

    try {
      const [savedSales, savedProducts] = await Promise.all([
        getSales(user.uid),
        getProducts(user.uid)
      ]);

      setSales(savedSales);
      setProducts(savedProducts);
    } catch (error) {
      console.error("Could not load sales:", error);
      setStatusMessage("Could not load Sales data.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSquareStatus() {
    if (!user?.uid) return;

    setSquareStatusLoading(true);

    try {
      const status = await getSquareConnectionStatus(user.uid);
      setSquareConnection(status || { connected: false });
    } catch (error) {
      console.error("Could not check Square connection:", error);
      setSquareConnection({ connected: false });
    } finally {
      setSquareStatusLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    loadSquareStatus();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    const guideHidden = localStorage.getItem("hideModuleGuide_sales") === "true";

    if (!guideHidden) {
      setShowGuide(true);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    const params = new URLSearchParams(window.location.search);
    const squareStatus = params.get("square");
    const squareMessage = params.get("message");

    if (squareStatus === "connected") {
      setStatusMessage("Square connected successfully.");
      loadSquareStatus();
      loadData();
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (squareStatus === "error") {
      setStatusMessage(squareMessage || "Square connection failed.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
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

  function startNewProductSale() {
    setActiveMode("line-items");
    setSaleDraft(blankSale());
  }

  function startNewDailyTotal() {
    setActiveMode("daily-total");
    setDailyDraft(blankDailyEntry());
  }

  function editSale(sale) {
    if (sale.entryMode === "daily-total") {
      setActiveMode("daily-total");
      setDailyDraft({
        ...blankDailyEntry(),
        ...sale,
        netSales: sale.netSales || ""
      });
      setStatusMessage("Daily total loaded.");
      return;
    }

    setActiveMode("line-items");
    setSaleDraft({
      ...blankSale(),
      ...sale,
      lines: Array.isArray(sale.lines) && sale.lines.length ? sale.lines : [blankLineItem()]
    });
    setStatusMessage("Sale loaded.");
  }

  async function handleSaveLineItemSale() {
    if (!user?.uid) {
      setStatusMessage("Sign in before saving a sale.");
      return;
    }

    const filledLines = saleDraft.lines.filter((line) => {
      return (
        String(line.productName || "").trim() ||
        line.productId ||
        numberValue(line.quantity) ||
        numberValue(line.unitPrice)
      );
    });

    if (!filledLines.length) {
      setStatusMessage("Add at least one product or manual line item.");
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
      await loadData();
      setStatusMessage("Sale saved.");
    } catch (error) {
      console.error("Could not save sale:", error);
      setStatusMessage("Could not save that sale.");
    }
  }

  async function handleSaveDailyEntry() {
    if (!user?.uid) {
      setStatusMessage("Sign in before saving a daily total.");
      return;
    }

    if (!dailyDraft.grossSales && !dailyDraft.netSales) {
      setStatusMessage("Enter at least a gross or net sales number.");
      return;
    }

    try {
      await saveDailySalesEntry(user.uid, {
        ...dailyDraft,
        netSales: calculateDailyNet(dailyDraft)
      });

      setDailyDraft(blankDailyEntry());
      await loadData();
      setStatusMessage("Daily sales total saved.");
    } catch (error) {
      console.error("Could not save daily total:", error);
      setStatusMessage("Could not save that daily total.");
    }
  }

  async function handleDeleteSale(sale) {
    if (!user?.uid || !sale?.id) return;

    const confirmed = window.confirm("Delete this sales record?");
    if (!confirmed) return;

    try {
      await deleteSale(user.uid, sale.id);
      await loadData();
      setStatusMessage("Sale deleted.");
    } catch (error) {
      console.error("Could not delete sale:", error);
      setStatusMessage("Could not delete that sale.");
    }
  }

  async function handleConnectSquare() {
    if (!user?.uid) {
      setStatusMessage("Sign in before connecting Square.");
      return;
    }

    try {
      await connectSquare(user.uid);
    } catch (error) {
      console.error("Could not connect Square:", error);
      setStatusMessage(error.message || "Could not connect Square.");
    }
  }

  async function handleImportSquareSales() {
    if (!user?.uid) {
      setStatusMessage("Sign in before importing Square sales.");
      return;
    }

    if (!squareStartDate || !squareEndDate) {
      setStatusMessage("Choose a Square import start and end date.");
      return;
    }

    if (squareStartDate > squareEndDate) {
      setStatusMessage("Square import start date must be before the end date.");
      return;
    }

    setSquareImporting(true);

    try {
      const result = await importSquareSales({
        uid: user.uid,
        startDate: squareStartDate,
        endDate: squareEndDate
      });

      await loadData();
      await loadSquareStatus();

      setStatusMessage(
        `Imported ${result.dailyRecordCount || 0} daily Square sales record${
          result.dailyRecordCount === 1 ? "" : "s"
        } from ${result.paymentCount || 0} payment${
          result.paymentCount === 1 ? "" : "s"
        }.`
      );
    } catch (error) {
      console.error("Square import failed:", error);
      setStatusMessage(error.message || "Square import failed.");
    } finally {
      setSquareImporting(false);
    }
  }

  function saleTitle(sale) {
    if (sale.entryMode === "daily-total") {
      return sale.marketName || sale.saleType || "Daily Total";
    }

    return sale.customerName || sale.marketName || sale.saleType || "Sale";
  }

  if (!user) {
    return (
      <div className="salesModule modulePage">
        <ModuleGuideModal
          isOpen={showGuide}
          moduleKey="sales"
          title="How to Use Sales"
          onClose={() => setShowGuide(false)}
        >
          <SalesGuideContent />
        </ModuleGuideModal>

        <section className="farmModuleHero salesHero">
          <div className="farmModuleHeroText salesHeroText">
            <p className="eyebrow">Sales</p>
            <h2>Sign in to track sales.</h2>
            <p>
              Track product sales, daily totals, market revenue, and completed
              order revenue.
            </p>
          </div>

          <div className="farmModuleHeroActions salesHeroActions">
            <button className="primaryButton farmHeroAction" type="button" onClick={loginWithGoogle}>
              Sign in with Google
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="salesModule modulePage">
      <ModuleGuideModal
        isOpen={showGuide}
        moduleKey="sales"
        title="How to Use Sales"
        onClose={() => setShowGuide(false)}
      >
        <SalesGuideContent />
      </ModuleGuideModal>

      {statusMessage ? (
        <div className="floatingStatus" role="status">
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            <X size={16} />
          </button>
        </div>
      ) : null}

      <section className="farmModuleHero salesHero">
        <div className="farmModuleHeroText salesHeroText">
          <p className="eyebrow">Sales</p>
          <h2>Track revenue across your farm business.</h2>
          <p>
            Log individual sales, record quick daily totals, review sales trends,
            and keep completed order revenue connected.
          </p>
        </div>

        <div className="farmModuleHeroActions salesHeroActions">
          <button className="primaryButton compactPrimary farmHeroAction" type="button" onClick={startNewProductSale}>
            <Plus size={16} />
            Add Sale
          </button>

          <button className="secondaryButton compactButton farmHeroAction" type="button" onClick={startNewDailyTotal}>
            <CalendarDays size={16} />
            Daily Total
          </button>

          <button className="secondaryButton compactButton farmHeroAction" type="button" onClick={() => setShowGuide(true)}>
            <CircleHelp size={16} />
            Guide
          </button>
        </div>
      </section>

      <section className="hubStatGrid salesStatGrid">
        <StatCard
          icon={Banknote}
          label="Net Sales"
          value={loading ? "..." : money(reportingSummary.totalNetSales)}
          sub="after discounts and fees"
          accent="pricing"
        />
        <StatCard
          icon={ClipboardList}
          label="Sales Records"
          value={loading ? "..." : reportingSummary.totalSalesCount}
          sub="in current view"
          accent="orders"
        />
        <StatCard
          icon={TrendingUp}
          label="Average Sale"
          value={loading ? "..." : money(reportingSummary.averageSale)}
          sub="current filters"
          accent="pricing"
        />
        <StatCard
          icon={CalendarCheck2}
          label="Best Sales Day"
          value={loading ? "..." : money(allTimeSummary.bestSalesDay?.total || 0)}
          sub={allTimeSummary.bestSalesDay?.date ? formatDate(allTimeSummary.bestSalesDay.date) : "no sales yet"}
          accent="market"
        />
      </section>

      <section className="salesOverviewGrid">
        <div className="workspacePanel compactPanel salesChartPanel">
          <div className="workspaceHeader compactPanelHeader salesChartHeader">
            <div>
              <p className="eyebrow">Reporting</p>
              <h3>Sales Trend</h3>
            </div>

            <div className="salesChartControls">
              <div className="salesChartRangeToggle">
                <button
                  type="button"
                  className={chartRange === "week" ? "active" : ""}
                  onClick={() => setChartRange("week")}
                >
                  Week
                </button>
                <button
                  type="button"
                  className={chartRange === "month" ? "active" : ""}
                  onClick={() => setChartRange("month")}
                >
                  Month
                </button>
                <button
                  type="button"
                  className={chartRange === "quarter" ? "active" : ""}
                  onClick={() => setChartRange("quarter")}
                >
                  Qtr
                </button>
                <button
                  type="button"
                  className={chartRange === "year" ? "active" : ""}
                  onClick={() => setChartRange("year")}
                >
                  Year
                </button>
              </div>

              <button className="secondaryButton compactButton" type="button" onClick={loadData}>
                <RefreshCw size={15} />
                Refresh
              </button>
            </div>
          </div>

          {chartRows.length ? (
            <div className="salesLineChart salesChartWrapper">
              {(() => {
                const chartHeight = 300;
                const chartWidth = 1000;
                const paddingLeft = 58;
                const paddingRight = 22;
                const paddingTop = 24;
                const paddingBottom = 42;
                const highestValue = Math.max(...chartRows.map((row) => row.total), 0);
                const maxValue = Math.max(highestValue * 1.1, 100);
                const yTicks = buildYAxisTicks(maxValue);
                const yMax = Math.max(...yTicks, 100);
                const tickIndexes = getChartTickIndexes(chartRows, chartRange);

                const plotWidth = chartWidth - paddingLeft - paddingRight;
                const plotHeight = chartHeight - paddingTop - paddingBottom;

                const points = chartRows.map((row, index) => {
                  const x =
                    paddingLeft +
                    (index / Math.max(chartRows.length - 1, 1)) * plotWidth;

                  const y =
                    paddingTop +
                    plotHeight -
                    (row.total / Math.max(yMax, 1)) * plotHeight;

                  return {
                    ...row,
                    x,
                    y
                  };
                });

                const linePoints = points
                  .map((point) => `${point.x},${point.y}`)
                  .join(" ");

                return (
                  <svg
                    className="salesLineChartSvg"
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    role="img"
                    aria-label="Sales trend line chart"
                  >
                    {yTicks.map((tick) => {
                      const y =
                        paddingTop +
                        plotHeight -
                        (tick / Math.max(yMax, 1)) * plotHeight;

                      return (
                        <g key={tick}>
                          <line
                            x1={paddingLeft}
                            x2={chartWidth - paddingRight}
                            y1={y}
                            y2={y}
                            className="salesChartGridLine"
                          />
                          <text
                            x={paddingLeft - 10}
                            y={y + 4}
                            textAnchor="end"
                            className="salesChartAxisLabel"
                          >
                            {money(tick).replace(".00", "")}
                          </text>
                        </g>
                      );
                    })}

                    <polyline
                      points={linePoints}
                      fill="none"
                      className="salesChartLine"
                    />

                    {points
                      .filter((point) => point.total > 0 && chartRange !== "year")
                      .map((point) => (
                        <circle
                          key={`${point.date}-dot`}
                          cx={point.x}
                          cy={point.y}
                          r="3.5"
                          className="salesChartPoint"
                        />
                      ))}

                    {tickIndexes.map((index) => {
                      const point = points[index];

                      return (
                        <text
                          key={`${point.date}-${index}`}
                          x={point.x}
                          y={chartHeight - 12}
                          textAnchor="middle"
                          className="salesChartDateLabel"
                        >
                          {formatChartDateLabel(point.date, chartRange)}
                        </text>
                      );
                    })}
                  </svg>
                );
              })()}
            </div>
          ) : (
            <p className="dashboardEmpty">
              {loading ? "Loading sales trend..." : "No sales in this view yet."}
            </p>
          )}
        </div>

        <div className="workspacePanel compactPanel squareImportPanel salesSquarePanel">
          <div className="workspaceHeader compactPanelHeader salesSquareHeader">
            <div>
              <p className="eyebrow">Square Sync</p>
              <h3>Import Square Sales</h3>
            </div>
            <SquareStack size={22} />
          </div>

          <div className={`salesSquareConnection ${squareConnection.connected ? "connected" : "notConnected"}`}>
            <span className="salesSquareConnectionDot" />
            <div>
              <strong>
                {squareStatusLoading
                  ? "Checking Square connection..."
                  : squareConnection.connected
                    ? "Connected"
                    : "Not connected"}
              </strong>
              <p>
                {squareConnection.connected
                  ? squareConnection.merchantId
                    ? `Square merchant ID: ${squareConnection.merchantId}`
                    : "Square account connected."
                  : "Connect Square before importing daily sales totals."}
              </p>
            </div>
          </div>

          <p className="dashboardEmpty">
            Import completed Square payments as daily Sales records. Imports are grouped by
            date and saved as Square daily totals.
          </p>

          <div className="salesSquareDateGrid">
            <label>
              Start Date
              <input
                type="date"
                value={squareStartDate}
                onChange={(event) => setSquareStartDate(event.target.value)}
              />
            </label>

            <label>
              End Date
              <input
                type="date"
                value={squareEndDate}
                onChange={(event) => setSquareEndDate(event.target.value)}
              />
            </label>
          </div>

          <div className="salesSquareActions">
            {squareConnection.connected ? (
              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={loadSquareStatus}
                disabled={squareStatusLoading}
              >
                <RefreshCw size={15} />
                {squareStatusLoading ? "Checking..." : "Check Status"}
              </button>
            ) : (
              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={handleConnectSquare}
              >
                <SquareStack size={15} />
                Connect Square
              </button>
            )}

            <button
              className="primaryButton compactPrimary"
              type="button"
              onClick={handleImportSquareSales}
              disabled={squareImporting || !squareConnection.connected}
            >
              <RefreshCw size={15} />
              {squareImporting ? "Importing..." : "Import Sales"}
            </button>
          </div>
        </div>
      </section>

      <section className="salesWorkspaceGrid">
        <div className="workspacePanel compactPanel salesEntryPanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Entry</p>
              <h3>{activeMode === "line-items" ? "Product Sale" : "Daily Sales Total"}</h3>
            </div>

            <div className="salesModeToggle">
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
              <div className="salesFormGrid three">
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
                    onChange={(event) => updateSaleDraft("paymentMethod", event.target.value)}
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="salesFormGrid two">
                <label>
                  Customer or Buyer
                  <input
                    type="text"
                    value={saleDraft.customerName}
                    onChange={(event) => updateSaleDraft("customerName", event.target.value)}
                    placeholder="Optional"
                  />
                </label>

                <label>
                  Market or Event
                  <input
                    type="text"
                    value={saleDraft.marketName}
                    onChange={(event) => updateSaleDraft("marketName", event.target.value)}
                    placeholder="Optional"
                  />
                </label>
              </div>

              <div className="salesLineItemsHeader">
                <h4>Line Items</h4>
                <button type="button" className="secondaryButton compactButton" onClick={addLineItem}>
                  <Plus size={15} />
                  Add Line
                </button>
              </div>

              <div className="salesLineItems">
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
                        onChange={(event) => updateLineItem(line.id, "productName", event.target.value)}
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
                        onChange={(event) => updateLineItem(line.id, "quantity", event.target.value)}
                      />
                    </label>

                    <label>
                      Price
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(event) => updateLineItem(line.id, "unitPrice", event.target.value)}
                        onBlur={(event) => updateLineItem(line.id, "unitPrice", cleanCurrencyInput(event.target.value))}
                      />
                    </label>

                    <label>
                      Discount
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.discount}
                        onChange={(event) => updateLineItem(line.id, "discount", event.target.value)}
                        onBlur={(event) => updateLineItem(line.id, "discount", cleanCurrencyInput(event.target.value))}
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

              <div className="salesFormGrid three">
                <label>
                  Sale Discount
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={saleDraft.discounts}
                    onChange={(event) => updateSaleDraft("discounts", event.target.value)}
                    onBlur={(event) => updateSaleDraft("discounts", cleanCurrencyInput(event.target.value))}
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
                    onBlur={(event) => updateSaleDraft("fees", cleanCurrencyInput(event.target.value))}
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
                    onBlur={(event) => updateSaleDraft("tax", cleanCurrencyInput(event.target.value))}
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
              <div className="salesFormGrid three">
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
                    onChange={(event) => updateDailyDraft("paymentMethod", event.target.value)}
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

              <div className="salesFormGrid three">
                <label>
                  Gross Sales
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={dailyDraft.grossSales}
                    onChange={(event) => updateDailyDraft("grossSales", event.target.value)}
                    onBlur={(event) => updateDailyDraft("grossSales", cleanCurrencyInput(event.target.value))}
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
                    onBlur={(event) => updateDailyDraft("discounts", cleanCurrencyInput(event.target.value))}
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
                    onBlur={(event) => updateDailyDraft("fees", cleanCurrencyInput(event.target.value))}
                  />
                </label>
              </div>

              <div className="salesFormGrid two">
                <label>
                  Tax
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={dailyDraft.tax}
                    onChange={(event) => updateDailyDraft("tax", event.target.value)}
                    onBlur={(event) => updateDailyDraft("tax", cleanCurrencyInput(event.target.value))}
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
                    onBlur={(event) => updateDailyDraft("netSales", cleanCurrencyInput(event.target.value))}
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

        <div className="workspacePanel compactPanel salesDirectoryPanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Directory</p>
              <h3>Sales Log</h3>
            </div>

            <button className="secondaryButton compactButton" type="button" onClick={loadData}>
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>

          <div className="salesFilterGrid">
            <div className="searchBox compactSearch customersSearchBox">
              <Search size={17} />
              <input
                type="search"
                value={queryText}
                onChange={(event) => setQueryText(event.target.value)}
                placeholder="Search sales, buyers, markets, or products"
              />
            </div>

            <label>
              Timeframe
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
            </label>

            <label>
              Type
              <select
                value={saleTypeFilter}
                onChange={(event) => setSaleTypeFilter(event.target.value)}
              >
                <option>All sales</option>
                {SALE_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="salesList">
            {filteredSales.length ? (
              filteredSales.map((sale) => (
                <div className="salesListItem" key={sale.id}>
                  <button type="button" onClick={() => editSale(sale)}>
                    <strong>{saleTitle(sale)}</strong>
                    <span>
                      {formatDate(sale.saleDate)} • {sale.saleType || "Sale"} •{" "}
                      {sale.paymentMethod || "Not Recorded"}
                    </span>

                    {sale.lines?.length ? (
                      <small>
                        {sale.lines
                          .slice(0, 2)
                          .map((line) => `${line.quantity} × ${line.productName || "Item"}`)
                          .join(" • ")}
                        {sale.lines.length > 2 ? ` • +${sale.lines.length - 2} more` : ""}
                      </small>
                    ) : (
                      <small>{sale.notes || "Daily total entry"}</small>
                    )}
                  </button>

                  <div className="salesListValue">
                    <span>Net</span>
                    <strong>{money(sale.netSales)}</strong>
                  </div>

                  <button
                    className="iconButton danger"
                    type="button"
                    onClick={() => handleDeleteSale(sale)}
                    aria-label="Delete sale"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            ) : (
              <p className="dashboardEmpty">
                {loading ? "Loading sales..." : "No saved sales match this view."}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
