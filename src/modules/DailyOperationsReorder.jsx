import { useEffect, useMemo, useRef, useState } from "react";
import {
  Barcode,
  Check,
  Edit3,
  ExternalLink,
  PackagePlus,
  Plus,
  Printer,
  RotateCcw,
  Save,
  ShoppingCart,
  Trash2,
  X
} from "lucide-react";

import ConfirmDialog from "../components/ConfirmDialog.jsx";
import StatusPill from "../components/StatusPill.jsx";
import Toast from "../components/Toast.jsx";
import WorkspacePanel from "../components/WorkspacePanel.jsx";
import { useAuth } from "../AuthContext.jsx";
import {
  addReorderRequest,
  deleteReorderItem,
  deleteReorderRequest,
  getReorderItems,
  getReorderRequests,
  markReorderRequestOrdered,
  reopenReorderRequest,
  saveReorderItem
} from "../services/dailyOperationsReorderService.js";

const REORDER_CATEGORIES = [
  "General Supplies",
  "Packaging",
  "Cleaning Supplies",
  "Growing Supplies",
  "Ingredients",
  "Market Supplies",
  "Office Supplies",
  "Equipment Parts",
  "Labels & Printing",
  "Other"
];

const blankItem = {
  id: "",
  name: "",
  category: "General Supplies",
  vendor: "",
  purchaseUrl: "",
  notes: "",
  barcode: "",
  active: true,
  sortOrder: 0
};

function toDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function code39Bars(text) {
  const patterns = {
    "0": "nnnwwnwnn", "1": "wnnwnnnnw", "2": "nnwwnnnnw", "3": "wnwwnnnnn",
    "4": "nnnwwnnnw", "5": "wnnwwnnnn", "6": "nnwwwnnnn", "7": "nnnwnnwnw",
    "8": "wnnwnnwnn", "9": "nnwwnnwnn", A: "wnnnnwnnw", B: "nnwnnwnnw",
    C: "wnwnnwnnn", D: "nnnnwwnnw", E: "wnnnwwnnn", F: "nnwnwwnnn",
    G: "nnnnnwwnw", H: "wnnnnwwnn", I: "nnwnnwwnn", J: "nnnnwwwnn",
    K: "wnnnnnnww", L: "nnwnnnnww", M: "wnwnnnnwn", N: "nnnnwnnww",
    O: "wnnnwnnwn", P: "nnwnwnnwn", Q: "nnnnnnwww", R: "wnnnnnwwn",
    S: "nnwnnnwwn", T: "nnnnwnwwn", U: "wwnnnnnnw", V: "nwwnnnnnw",
    W: "wwwnnnnnn", X: "nwnnwnnnw", Y: "wwnnwnnnn", Z: "nwwnwnnnn",
    "-": "nwnnnnwnw", ".": "wwnnnnwnn", " ": "nwwnnnwnn", "$": "nwnwnwnnn",
    "/": "nwnwnnnwn", "+": "nwnnnwnwn", "%": "nnnwnwnwn", "*": "nwnnwnwnn"
  };

  const safe = String(text || "").toUpperCase().replace(/[^0-9A-Z. $/+%-]/g, "-");
  const encoded = `*${safe}*`;
  const bars = [];
  let x = 0;

  [...encoded].forEach((char, charIndex) => {
    const pattern = patterns[char] || patterns["-"];
    [...pattern].forEach((widthType, index) => {
      const width = widthType === "w" ? 3 : 1;
      if (index % 2 === 0) bars.push({ x, width });
      x += width;
    });
    if (charIndex < encoded.length - 1) x += 1;
  });

  return { bars, width: x };
}

function BarcodeGraphic({ value, height = 54 }) {
  const { bars, width } = code39Bars(value);
  return (
    <svg className="dailyOpsBarcodeSvg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Barcode ${value}`}>
      {bars.map((bar, index) => (
        <rect key={`${bar.x}-${index}`} x={bar.x} y="0" width={bar.width} height={height} />
      ))}
    </svg>
  );
}

export default function DailyOperationsReorder() {
  const { user } = useAuth();
  const scanRef = useRef(null);
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("list");
  const [scanValue, setScanValue] = useState("");
  const [editor, setEditor] = useState(null);
  const [printItem, setPrintItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState({ open: false, variant: "success", title: "", message: "" });

  const needed = useMemo(
    () => requests.filter((request) => request.status === "needed"),
    [requests]
  );

  const recentlyOrdered = useMemo(
    () => requests
      .filter((request) => request.status === "ordered")
      .sort((a, b) => (toDate(b.orderedAt)?.getTime() || 0) - (toDate(a.orderedAt)?.getTime() || 0))
      .slice(0, 15),
    [requests]
  );

  async function loadData() {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const [itemData, requestData] = await Promise.all([
        getReorderItems(user.uid),
        getReorderRequests(user.uid)
      ]);
      setItems(itemData);
      setRequests(requestData);
    } catch (error) {
      showToast("error", "Could not load re-order list", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  useEffect(() => {
    if (mode === "scan") window.setTimeout(() => scanRef.current?.focus(), 50);
  }, [mode]);

  function showToast(variant, title, message = "") {
    setToast({ open: true, variant, title, message });
  }

  async function addToList(item, method = "manual") {
    try {
      const result = await addReorderRequest(user.uid, item, method);
      if (result.alreadyExists) {
        showToast("info", "Already on the re-order list", `${item.name} is still waiting to be ordered.`);
      } else {
        showToast("success", "Added to re-order list", item.name);
      }
      const requestData = await getReorderRequests(user.uid);
      setRequests(requestData);
    } catch (error) {
      showToast("error", "Could not add item", error.message);
    }
  }

  async function handleScan(event) {
    event.preventDefault();
    const code = scanValue.trim().toUpperCase();
    if (!code) return;

    const item = items.find(
      (record) => record.active !== false && String(record.barcode || "").toUpperCase() === code
    );

    setScanValue("");

    if (!item) {
      showToast("warning", "Re-order tag not recognized", code);
      window.setTimeout(() => scanRef.current?.focus(), 50);
      return;
    }

    await addToList(item, "barcode");
    window.setTimeout(() => scanRef.current?.focus(), 50);
  }

  async function saveItem(event) {
    event.preventDefault();
    try {
      await saveReorderItem(user.uid, editor);
      setEditor(null);
      await loadData();
      showToast("success", "Re-order tag saved");
    } catch (error) {
      showToast("error", "Could not save tag", error.message);
    }
  }

  async function markOrdered(request) {
    try {
      await markReorderRequestOrdered(user.uid, request.id);
      await loadData();
      showToast("success", "Marked as ordered", request.itemName);
    } catch (error) {
      showToast("error", "Could not update item", error.message);
    }
  }

  async function reopen(request) {
    try {
      await reopenReorderRequest(user.uid, request.id);
      await loadData();
      showToast("success", "Returned to re-order list", request.itemName);
    } catch (error) {
      showToast("error", "Could not reopen item", error.message);
    }
  }

  async function performDelete() {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.type === "item") {
        await deleteReorderItem(user.uid, confirmDelete.item.id);
      } else {
        await deleteReorderRequest(user.uid, confirmDelete.item.id);
      }
      setConfirmDelete(null);
      await loadData();
      showToast("success", "Removed");
    } catch (error) {
      showToast("error", "Could not remove item", error.message);
    }
  }

  function printTag(item) {
    setPrintItem({ ...item, type: "reorder" });
    window.setTimeout(() => window.print(), 100);
  }

  return (
    <div className="dailyOpsReorder">
      <div className="dailyOpsReorderModeTabs">
        <button className={mode === "list" ? "active" : ""} type="button" onClick={() => setMode("list")}>
          <ShoppingCart size={16} /> Re-Order List
          {needed.length ? <span>{needed.length}</span> : null}
        </button>
        <button className={mode === "scan" ? "active" : ""} type="button" onClick={() => setMode("scan")}>
          <Barcode size={16} /> Scan Item
        </button>
        <button className={mode === "tags" ? "active" : ""} type="button" onClick={() => setMode("tags")}>
          <PackagePlus size={16} /> Manage Tags
        </button>
      </div>

      {mode === "list" ? (
        <>
          <WorkspacePanel
            eyebrow="Supplies to purchase"
            title={`Needs Ordering${needed.length ? ` (${needed.length})` : ""}`}
            description="Items appear here when their physical tag is scanned or when you add them manually. Check an item off after the order has been placed."
          >
            {loading ? <p className="dailyOpsEmpty">Loading re-order list...</p> : null}
            {!loading && !needed.length ? (
              <div className="dailyOpsEmpty">
                <ShoppingCart size={30} />
                <h3>Your re-order list is clear.</h3>
                <p>Scan a consumable tag when something needs replenished.</p>
              </div>
            ) : null}

            <div className="dailyOpsReorderList">
              {needed.map((request) => (
                <div className="dailyOpsReorderRow" key={request.id}>
                  <button className="dailyOpsReorderCheck" type="button" onClick={() => markOrdered(request)} title="Mark ordered">
                    <span />
                  </button>
                  <div className="dailyOpsReorderMain">
                    <div className="dailyOpsReorderTitle">
                      <strong>{request.itemName}</strong>
                      <StatusPill label="Needs ordering" variant="warning" size="small" />
                    </div>
                    <div className="dailyOpsReorderMeta">
                      <span>{request.category || "General Supplies"}</span>
                      {request.vendor ? <span>{request.vendor}</span> : null}
                      <span>Added {formatDateTime(request.requestedAt)}</span>
                      <span>{request.requestMethod === "barcode" ? "Scanned tag" : "Added manually"}</span>
                    </div>
                    {request.notes ? <p>{request.notes}</p> : null}
                  </div>
                  <div className="dailyOpsReorderActions">
                    {request.purchaseUrl ? (
                      <a href={request.purchaseUrl} target="_blank" rel="noreferrer" className="secondaryButton compactButton">
                        <ExternalLink size={14} /> Buy
                      </a>
                    ) : null}
                    <button className="primaryButton compactPrimary" type="button" onClick={() => markOrdered(request)}>
                      <Check size={15} /> Ordered
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </WorkspacePanel>

          {recentlyOrdered.length ? (
            <WorkspacePanel eyebrow="Recent" title="Recently Ordered" description="Recently completed re-order requests remain here so you can see what was handled.">
              <div className="dailyOpsReorderHistory">
                {recentlyOrdered.map((request) => (
                  <div className="dailyOpsReorderHistoryRow" key={request.id}>
                    <div>
                      <strong>{request.itemName}</strong>
                      <span>Ordered {formatDateTime(request.orderedAt)}</span>
                    </div>
                    <StatusPill label="Ordered" variant="success" size="small" />
                    <button className="secondaryButton compactButton" type="button" onClick={() => reopen(request)}>
                      <RotateCcw size={14} /> Reopen
                    </button>
                  </div>
                ))}
              </div>
            </WorkspacePanel>
          ) : null}
        </>
      ) : null}

      {mode === "scan" ? (
        <WorkspacePanel eyebrow="Re-order scanner" title="Scan a Consumable Tag" description="Put the tag where the item is stored. When stock is getting low, scan it once and the item appears on the Re-Order List.">
          <form className="dailyOpsScanPanel" onSubmit={handleScan}>
            <div className="dailyOpsScanIcon"><ShoppingCart size={42} /></div>
            <label htmlFor="dailyOpsReorderScan">Ready to scan</label>
            <input
              id="dailyOpsReorderScan"
              ref={scanRef}
              value={scanValue}
              onChange={(event) => setScanValue(event.target.value)}
              autoComplete="off"
              placeholder="Scan re-order tag or type code"
            />
            <button className="primaryButton" type="submit">Add to Re-Order List</button>
            <p>If the item is already waiting to be ordered, Farmers Hub will leave the existing request in place instead of creating a duplicate.</p>
          </form>
        </WorkspacePanel>
      ) : null}

      {mode === "tags" ? (
        <WorkspacePanel
          eyebrow="Reusable supply tags"
          title="Manage Re-Order Tags"
          description="Create one reusable record for each consumable or supply you want to flag by scanning."
          actions={[{ label: "New Re-Order Tag", icon: Plus, onClick: () => setEditor({ ...blankItem, sortOrder: items.length }) }]}
        >
          <div className="dailyOpsManageList">
            {items.map((item) => {
              const waiting = needed.some((request) => request.itemId === item.id);
              return (
                <div className="dailyOpsManageRow" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.category}{item.vendor ? ` · ${item.vendor}` : ""}</span>
                    <code>{item.barcode}</code>
                  </div>
                  <StatusPill
                    label={item.active === false ? "Inactive" : waiting ? "On list" : "Ready"}
                    variant={item.active === false ? "neutral" : waiting ? "warning" : "success"}
                    size="small"
                  />
                  <div className="dailyOpsRowActions">
                    {!waiting && item.active !== false ? <button type="button" onClick={() => addToList(item, "manual")}><Plus size={15} />Add</button> : null}
                    <button type="button" onClick={() => setEditor({ ...blankItem, ...item })}><Edit3 size={15} />Edit</button>
                    <button type="button" onClick={() => printTag(item)}><Printer size={15} />Tag</button>
                    <button className="danger" type="button" onClick={() => setConfirmDelete({ type: "item", item })}><Trash2 size={15} /></button>
                  </div>
                </div>
              );
            })}
            {!items.length ? <p className="dailyOpsEmpty">No re-order tags yet. Create one for a consumable you regularly need to replenish.</p> : null}
          </div>
        </WorkspacePanel>
      ) : null}

      {editor ? (
        <div className="dailyOpsModalOverlay" role="dialog" aria-modal="true">
          <form className="dailyOpsModal" onSubmit={saveItem}>
            <div className="dailyOpsModalHeader">
              <div><p className="eyebrow">Re-order tag</p><h3>{editor.id ? "Edit Re-Order Tag" : "New Re-Order Tag"}</h3></div>
              <button type="button" onClick={() => setEditor(null)}><X size={18} /></button>
            </div>
            <div className="dailyOpsFormGrid">
              <label className="wide">Item name<input required value={editor.name} onChange={(e) => setEditor({ ...editor, name: e.target.value })} placeholder="Paper towels" /></label>
              <label>Category<select value={editor.category} onChange={(e) => setEditor({ ...editor, category: e.target.value })}>{REORDER_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label>Preferred vendor<input value={editor.vendor} onChange={(e) => setEditor({ ...editor, vendor: e.target.value })} placeholder="Costco, Amazon, Webstaurant..." /></label>
              <label className="wide">Purchase link<input type="url" value={editor.purchaseUrl} onChange={(e) => setEditor({ ...editor, purchaseUrl: e.target.value })} placeholder="https://..." /></label>
              <label className="wide">Notes<textarea rows="2" value={editor.notes} onChange={(e) => setEditor({ ...editor, notes: e.target.value })} placeholder="Size, preferred brand, reorder quantity, SKU, etc." /></label>
              <label className="wide dailyOpsCheck"><input type="checkbox" checked={editor.active !== false} onChange={(e) => setEditor({ ...editor, active: e.target.checked })} />Active re-order tag</label>
            </div>
            <div className="dailyOpsModalActions">
              <button className="secondaryButton" type="button" onClick={() => setEditor(null)}>Cancel</button>
              <button className="primaryButton" type="submit"><Save size={15} />Save Tag</button>
            </div>
          </form>
        </div>
      ) : null}

      {printItem ? (
        <div className="dailyOpsPrintTag" aria-hidden="true">
          <strong>{printItem.name}</strong>
          <span>SCAN TO RE-ORDER</span>
          <BarcodeGraphic value={printItem.barcode} />
          <code>{printItem.barcode}</code>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Remove this item?"
        message={confirmDelete?.type === "item" ? "This removes the reusable re-order tag record." : "This removes this re-order request from history."}
        confirmLabel="Remove"
        onConfirm={performDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <Toast {...toast} onClose={() => setToast((current) => ({ ...current, open: false }))} />
    </div>
  );
}
