import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Barcode,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Edit3,
  History,
  MapPin,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Settings2,
  Trash2,
  X
} from "lucide-react";

import ConfirmDialog from "../components/ConfirmDialog.jsx";
import ModuleHero from "../components/ModuleHero.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusPill from "../components/StatusPill.jsx";
import Toast from "../components/Toast.jsx";
import WorkspacePanel from "../components/WorkspacePanel.jsx";
import { useAuth } from "../AuthContext.jsx";
import {
  completeDailyOperationTask,
  deleteDailyOperationLog,
  deleteDailyOperationStation,
  deleteDailyOperationTask,
  getDailyOperationLogs,
  getDailyOperationStations,
  getDailyOperationTasks,
  saveDailyOperationStation,
  saveDailyOperationTask
} from "../services/dailyOperationsService.js";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" }
];

const CATEGORIES = [
  "General",
  "Grow Room",
  "Harvest",
  "Production",
  "Packaging",
  "Market Prep",
  "Cleaning",
  "Equipment",
  "Livestock",
  "Kitchen",
  "Other"
];

const blankTask = {
  id: "",
  name: "",
  description: "",
  stationId: "",
  stationName: "",
  category: "General",
  scheduleType: "daily",
  daysOfWeek: [],
  availableTime: "",
  dueTime: "",
  completionType: "simple",
  responseType: "none",
  unit: "",
  allowMultipleCompletions: false,
  barcode: "",
  active: true,
  sortOrder: 0
};

const blankStation = {
  id: "",
  name: "",
  description: "",
  barcode: "",
  active: true,
  sortOrder: 0
};

function localDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function formatLongDate(date = new Date()) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
}

function toDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatTime(value) {
  const date = toDate(value);
  if (!date) return "";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatHistoryDate(dateKey) {
  if (!dateKey) return "";
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function timeToMinutes(value) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function taskRunsToday(task, date = new Date()) {
  if (task.active === false) return false;
  if (task.scheduleType === "daily") return true;
  if (task.scheduleType === "weekdays") return date.getDay() >= 1 && date.getDay() <= 5;
  if (task.scheduleType === "custom") return (task.daysOfWeek || []).includes(date.getDay());
  return true;
}

function getTaskState(task, logs, now = new Date()) {
  const taskLogs = logs.filter((log) => log.taskId === task.id);
  if (taskLogs.length) return { state: "complete", log: taskLogs[taskLogs.length - 1] };

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dueMinutes = timeToMinutes(task.dueTime);
  const availableMinutes = timeToMinutes(task.availableTime);

  if (dueMinutes !== null && currentMinutes > dueMinutes) return { state: "overdue", log: null };
  if (availableMinutes !== null && currentMinutes < availableMinutes) return { state: "upcoming", log: null };
  return { state: "due", log: null };
}

function taskStatusPill(state) {
  if (state === "complete") return <StatusPill label="Complete" variant="success" size="small" />;
  if (state === "overdue") return <StatusPill label="Overdue" variant="danger" size="small" />;
  if (state === "upcoming") return <StatusPill label="Upcoming" variant="neutral" size="small" />;
  return <StatusPill label="Ready" variant="info" size="small" />;
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

export default function DailyOperations() {
  const { user } = useAuth();
  const scanRef = useRef(null);
  const [view, setView] = useState("today");
  const [tasks, setTasks] = useState([]);
  const [stations, setStations] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskEditor, setTaskEditor] = useState(null);
  const [stationEditor, setStationEditor] = useState(null);
  const [completionTask, setCompletionTask] = useState(null);
  const [completionValue, setCompletionValue] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [scanValue, setScanValue] = useState("");
  const [printItem, setPrintItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState({ open: false, variant: "success", title: "", message: "" });

  const todayKey = localDateKey();
  const todayTasks = useMemo(() => tasks.filter((task) => taskRunsToday(task)), [tasks]);
  const completedTaskIds = useMemo(() => new Set(todayLogs.map((log) => log.taskId)), [todayLogs]);
  const completedCount = todayTasks.filter((task) => completedTaskIds.has(task.id)).length;
  const overdueCount = todayTasks.filter((task) => getTaskState(task, todayLogs).state === "overdue").length;
  const remainingCount = Math.max(todayTasks.length - completedCount, 0);
  const completionPercent = todayTasks.length ? Math.round((completedCount / todayTasks.length) * 100) : 0;

  const groupedTodayTasks = useMemo(() => {
    return todayTasks.reduce((groups, task) => {
      const key = task.stationName || task.category || "General";
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
      return groups;
    }, {});
  }, [todayTasks]);

  async function loadData() {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const [taskData, stationData, logData] = await Promise.all([
        getDailyOperationTasks(user.uid),
        getDailyOperationStations(user.uid),
        getDailyOperationLogs(user.uid, todayKey)
      ]);
      setTasks(taskData);
      setStations(stationData);
      setTodayLogs(logData);
    } catch (error) {
      console.error(error);
      showToast("error", "Could not load Daily Operations", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  useEffect(() => {
    if (view === "scan") window.setTimeout(() => scanRef.current?.focus(), 50);
  }, [view]);

  function showToast(variant, title, message = "") {
    setToast({ open: true, variant, title, message });
  }

  async function loadHistory() {
    if (!user?.uid) return;
    try {
      const logs = await getDailyOperationLogs(user.uid);
      setHistoryLogs(logs);
      setView("history");
    } catch (error) {
      showToast("error", "Could not load history", error.message);
    }
  }

  function beginCompletion(task, method = "manual") {
    const existing = todayLogs.filter((log) => log.taskId === task.id);
    if (existing.length && !task.allowMultipleCompletions) {
      showToast("info", "Already completed today", `${task.name} was completed at ${formatTime(existing[existing.length - 1].completedAt)}.`);
      return;
    }

    if (task.completionType === "reading") {
      setCompletionTask({ ...task, completionMethod: method });
      setCompletionValue("");
      setCompletionNotes("");
      return;
    }

    finishCompletion(task, method);
  }

  async function finishCompletion(task, method = "manual", value = "", notes = "") {
    try {
      await completeDailyOperationTask(user.uid, task, {
        dateKey: todayKey,
        value,
        notes,
        completionMethod: method
      });
      const logs = await getDailyOperationLogs(user.uid, todayKey);
      setTodayLogs(logs);
      setCompletionTask(null);
      showToast("success", `${task.name} completed`, `Logged at ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.`);
    } catch (error) {
      showToast("error", "Could not complete task", error.message);
    }
  }

  async function handleScan(event) {
    event.preventDefault();
    const code = scanValue.trim().toUpperCase();
    if (!code) return;

    const task = tasks.find((item) => String(item.barcode || "").toUpperCase() === code);
    if (task) {
      setScanValue("");
      beginCompletion(task, "barcode");
      window.setTimeout(() => scanRef.current?.focus(), 50);
      return;
    }

    const station = stations.find((item) => String(item.barcode || "").toUpperCase() === code);
    if (station) {
      setScanValue("");
      setView("today");
      showToast("info", station.name, "Station found. Its tasks are shown in Today's Operations.");
      return;
    }

    showToast("warning", "Barcode not recognized", code);
    setScanValue("");
    window.setTimeout(() => scanRef.current?.focus(), 50);
  }

  async function saveTask(event) {
    event.preventDefault();
    const station = stations.find((item) => item.id === taskEditor.stationId);
    try {
      await saveDailyOperationTask(user.uid, {
        ...taskEditor,
        stationName: station?.name || ""
      });
      setTaskEditor(null);
      await loadData();
      showToast("success", "Routine saved", "The task is ready for its scheduled days.");
    } catch (error) {
      showToast("error", "Could not save routine", error.message);
    }
  }

  async function saveStation(event) {
    event.preventDefault();
    try {
      await saveDailyOperationStation(user.uid, stationEditor);
      setStationEditor(null);
      await loadData();
      showToast("success", "Station saved");
    } catch (error) {
      showToast("error", "Could not save station", error.message);
    }
  }

  async function performDelete() {
    try {
      if (confirmDelete.type === "task") await deleteDailyOperationTask(user.uid, confirmDelete.item.id);
      if (confirmDelete.type === "station") await deleteDailyOperationStation(user.uid, confirmDelete.item.id);
      if (confirmDelete.type === "log") await deleteDailyOperationLog(user.uid, confirmDelete.item.id);
      setConfirmDelete(null);
      await loadData();
      if (view === "history") await loadHistory();
      showToast("success", "Removed");
    } catch (error) {
      showToast("error", "Could not remove item", error.message);
    }
  }

  function printTag(item, type) {
    setPrintItem({ ...item, type });
    window.setTimeout(() => window.print(), 100);
  }

  const nav = (
    <div className="dailyOpsTabs" role="tablist" aria-label="Daily Operations views">
      <button className={view === "today" ? "active" : ""} type="button" onClick={() => setView("today")}><ClipboardCheck size={16} />Today</button>
      <button className={view === "routines" ? "active" : ""} type="button" onClick={() => setView("routines")}><Settings2 size={16} />Routines</button>
      <button className={view === "scan" ? "active" : ""} type="button" onClick={() => setView("scan")}><Barcode size={16} />Scan</button>
      <button className={view === "history" ? "active" : ""} type="button" onClick={loadHistory}><History size={16} />History</button>
      <button className={view === "stations" ? "active" : ""} type="button" onClick={() => setView("stations")}><MapPin size={16} />Stations & Tags</button>
    </div>
  );

  return (
    <div className="dailyOperationsPage">
      <ModuleHero
        eyebrow="Daily workflow"
        title="Daily Operations"
        description="Run recurring routines, verify work by barcode or manually, record readings, and see what still needs attention today."
        icon={ClipboardCheck}
        accent="dailyOperations"
        actions={[
          { label: "Scan Task", icon: Barcode, onClick: () => setView("scan") },
          { label: "New Routine", icon: Plus, variant: "secondary", onClick: () => { setTaskEditor({ ...blankTask, sortOrder: tasks.length }); setView("routines"); } }
        ]}
      />

      {nav}

      {view === "today" ? (
        <>
          <div className="hubStatsGrid dailyOpsStats">
            <StatCard icon={CheckCircle2} label="Complete" value={`${completedCount} / ${todayTasks.length}`} sub={`${completionPercent}% of today's routine`} accent="green" />
            <StatCard icon={Clock3} label="Remaining" value={remainingCount} sub="Tasks still open today" accent="blue" />
            <StatCard icon={AlertTriangle} label="Overdue" value={overdueCount} sub={overdueCount ? "Needs attention" : "Nothing overdue"} accent={overdueCount ? "orange" : "green"} />
          </div>

          <WorkspacePanel eyebrow="Today's operations" title={formatLongDate()} description="Complete a task manually here, or scan its physical tag at the point of work.">
            {loading ? <p className="dailyOpsEmpty">Loading today's routine...</p> : null}
            {!loading && !todayTasks.length ? (
              <div className="dailyOpsEmpty">
                <ClipboardCheck size={30} />
                <h3>No routines are scheduled today.</h3>
                <p>Create your first recurring routine to start the daily operations board.</p>
                <button className="primaryButton compactPrimary" type="button" onClick={() => { setTaskEditor({ ...blankTask, sortOrder: tasks.length }); setView("routines"); }}><Plus size={15} />Create Routine</button>
              </div>
            ) : null}

            <div className="dailyOpsGroups">
              {Object.entries(groupedTodayTasks).map(([group, groupTasks]) => (
                <section className="dailyOpsGroup" key={group}>
                  <div className="dailyOpsGroupHeader"><MapPin size={16} /><h4>{group}</h4><span>{groupTasks.filter((task) => completedTaskIds.has(task.id)).length}/{groupTasks.length}</span></div>
                  <div className="dailyOpsTaskList">
                    {groupTasks.map((task) => {
                      const status = getTaskState(task, todayLogs);
                      return (
                        <div className={`dailyOpsTaskRow ${status.state}`} key={task.id}>
                          <button className="dailyOpsCompleteButton" type="button" onClick={() => beginCompletion(task)} aria-label={`Complete ${task.name}`}>
                            {status.state === "complete" ? <CheckCircle2 size={24} /> : <span className="dailyOpsOpenCircle" />}
                          </button>
                          <div className="dailyOpsTaskMain">
                            <div className="dailyOpsTaskTitleRow"><strong>{task.name}</strong>{taskStatusPill(status.state)}</div>
                            <div className="dailyOpsTaskMeta">
                              {task.dueTime ? <span><Clock3 size={13} />Due {new Date(`2000-01-01T${task.dueTime}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span> : null}
                              {status.log ? <span>Completed {formatTime(status.log.completedAt)}{status.log.value !== "" ? ` · ${status.log.value}${status.log.unit ? ` ${status.log.unit}` : ""}` : ""}</span> : null}
                              {task.completionType === "reading" && !status.log ? <span>Reading required{task.unit ? ` · ${task.unit}` : ""}</span> : null}
                            </div>
                          </div>
                          <button className="dailyOpsIconButton" type="button" title="Print task tag" onClick={() => printTag(task, "task")}><Printer size={16} /></button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </WorkspacePanel>
        </>
      ) : null}

      {view === "routines" ? (
        <WorkspacePanel eyebrow="Routine builder" title="Recurring Tasks" description="Define the work Farmers Hub should expect on each day." actions={[{ label: "New Routine", icon: Plus, onClick: () => setTaskEditor({ ...blankTask, sortOrder: tasks.length }) }]}>
          <div className="dailyOpsManageList">
            {tasks.map((task) => (
              <div className="dailyOpsManageRow" key={task.id}>
                <div><strong>{task.name}</strong><span>{task.stationName || task.category} · {task.scheduleType === "daily" ? "Every day" : task.scheduleType === "weekdays" ? "Weekdays" : (task.daysOfWeek || []).map((day) => WEEKDAYS.find((item) => item.value === day)?.label).filter(Boolean).join(", ")}</span></div>
                <StatusPill label={task.active === false ? "Inactive" : "Active"} variant={task.active === false ? "neutral" : "success"} size="small" />
                <div className="dailyOpsRowActions"><button type="button" onClick={() => setTaskEditor({ ...blankTask, ...task })}><Edit3 size={15} />Edit</button><button type="button" onClick={() => printTag(task, "task")}><Printer size={15} />Tag</button><button className="danger" type="button" onClick={() => setConfirmDelete({ type: "task", item: task })}><Trash2 size={15} /></button></div>
              </div>
            ))}
            {!tasks.length ? <p className="dailyOpsEmpty">No routines yet. Create the first task you want Farmers Hub to expect.</p> : null}
          </div>
        </WorkspacePanel>
      ) : null}

      {view === "scan" ? (
        <WorkspacePanel eyebrow="Scanner mode" title="Scan a Task or Station" description="Keep this screen open. USB, Bluetooth, and 2.4 GHz scanners that type like a keyboard can submit tags here.">
          <form className="dailyOpsScanPanel" onSubmit={handleScan}>
            <div className="dailyOpsScanIcon"><Barcode size={44} /></div>
            <label htmlFor="dailyOpsScanInput">Ready to scan</label>
            <input id="dailyOpsScanInput" ref={scanRef} value={scanValue} onChange={(event) => setScanValue(event.target.value)} autoComplete="off" placeholder="Scan barcode or type code" />
            <button className="primaryButton" type="submit">Process Scan</button>
            <p>The scanner should be configured to send Enter after each scan. A successful task scan logs the completion immediately unless the routine requires a reading.</p>
          </form>
        </WorkspacePanel>
      ) : null}

      {view === "history" ? (
        <WorkspacePanel eyebrow="Audit trail" title="Completion History" description="Each completion remains as a timestamped operational record rather than disappearing when the day resets.">
          <div className="dailyOpsHistoryList">
            {historyLogs.map((log) => (
              <div className="dailyOpsHistoryRow" key={log.id}>
                <div className="dailyOpsHistoryDate"><strong>{formatHistoryDate(log.dateKey)}</strong><span>{formatTime(log.completedAt)}</span></div>
                <div><strong>{log.taskName}</strong><span>{log.stationName || "General"}{log.value !== "" ? ` · ${log.value}${log.unit ? ` ${log.unit}` : ""}` : ""}</span></div>
                <StatusPill label={log.completionMethod === "barcode" ? "Scanned" : "Manual"} variant={log.completionMethod === "barcode" ? "info" : "neutral"} size="small" />
                <button className="dailyOpsIconButton danger" type="button" title="Remove completion" onClick={() => setConfirmDelete({ type: "log", item: log })}><RotateCcw size={15} /></button>
              </div>
            ))}
            {!historyLogs.length ? <p className="dailyOpsEmpty">No completion history yet.</p> : null}
          </div>
        </WorkspacePanel>
      ) : null}

      {view === "stations" ? (
        <WorkspacePanel eyebrow="Physical workflow" title="Stations & Tags" description="Group routines by point of work and print station tags for your grow room, harvest area, production space, equipment, or market storage." actions={[{ label: "New Station", icon: Plus, onClick: () => setStationEditor({ ...blankStation, sortOrder: stations.length }) }]}>
          <div className="dailyOpsStationGrid">
            {stations.map((station) => (
              <article className="dailyOpsStationCard" key={station.id}>
                <div className="dailyOpsStationIcon"><MapPin size={20} /></div>
                <div className="dailyOpsStationText"><strong>{station.name}</strong><span>{station.description || `${tasks.filter((task) => task.stationId === station.id).length} linked routines`}</span><code>{station.barcode}</code></div>
                <div className="dailyOpsRowActions"><button type="button" onClick={() => setStationEditor({ ...blankStation, ...station })}><Edit3 size={15} />Edit</button><button type="button" onClick={() => printTag(station, "station")}><Printer size={15} />Tag</button><button className="danger" type="button" onClick={() => setConfirmDelete({ type: "station", item: station })}><Trash2 size={15} /></button></div>
              </article>
            ))}
            {!stations.length ? <p className="dailyOpsEmpty">No stations yet. Stations are optional, but they make physical barcode workflows much easier to organize.</p> : null}
          </div>
        </WorkspacePanel>
      ) : null}

      {taskEditor ? (
        <div className="dailyOpsModalOverlay" role="dialog" aria-modal="true">
          <form className="dailyOpsModal" onSubmit={saveTask}>
            <div className="dailyOpsModalHeader"><div><p className="eyebrow">Routine</p><h3>{taskEditor.id ? "Edit Routine" : "New Routine"}</h3></div><button type="button" onClick={() => setTaskEditor(null)}><X size={18} /></button></div>
            <div className="dailyOpsFormGrid">
              <label className="wide">Task name<input required value={taskEditor.name} onChange={(e) => setTaskEditor({ ...taskEditor, name: e.target.value })} placeholder="Morning watering" /></label>
              <label>Category<select value={taskEditor.category} onChange={(e) => setTaskEditor({ ...taskEditor, category: e.target.value })}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label>Station<select value={taskEditor.stationId} onChange={(e) => setTaskEditor({ ...taskEditor, stationId: e.target.value })}><option value="">No station</option>{stations.filter((station) => station.active !== false).map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}</select></label>
              <label>Schedule<select value={taskEditor.scheduleType} onChange={(e) => setTaskEditor({ ...taskEditor, scheduleType: e.target.value })}><option value="daily">Every day</option><option value="weekdays">Weekdays</option><option value="custom">Specific days</option></select></label>
              <label>Available after<input type="time" value={taskEditor.availableTime} onChange={(e) => setTaskEditor({ ...taskEditor, availableTime: e.target.value })} /></label>
              <label>Due by<input type="time" value={taskEditor.dueTime} onChange={(e) => setTaskEditor({ ...taskEditor, dueTime: e.target.value })} /></label>
              <label>Completion<select value={taskEditor.completionType} onChange={(e) => setTaskEditor({ ...taskEditor, completionType: e.target.value, responseType: e.target.value === "reading" ? "number" : "none" })}><option value="simple">Simple completion</option><option value="reading">Completion + reading</option></select></label>
              {taskEditor.completionType === "reading" ? <label>Reading unit<input value={taskEditor.unit} onChange={(e) => setTaskEditor({ ...taskEditor, unit: e.target.value })} placeholder="pH, %, °F, EC..." /></label> : null}
              {taskEditor.scheduleType === "custom" ? <div className="wide dailyOpsDayPicker"><span>Scheduled days</span>{WEEKDAYS.map((day) => <button key={day.value} type="button" className={(taskEditor.daysOfWeek || []).includes(day.value) ? "selected" : ""} onClick={() => setTaskEditor({ ...taskEditor, daysOfWeek: (taskEditor.daysOfWeek || []).includes(day.value) ? taskEditor.daysOfWeek.filter((value) => value !== day.value) : [...(taskEditor.daysOfWeek || []), day.value] })}>{day.label}</button>)}</div> : null}
              <label className="wide">Description<textarea rows="2" value={taskEditor.description} onChange={(e) => setTaskEditor({ ...taskEditor, description: e.target.value })} placeholder="Optional instructions or reminder" /></label>
              <label className="wide dailyOpsCheck"><input type="checkbox" checked={taskEditor.allowMultipleCompletions} onChange={(e) => setTaskEditor({ ...taskEditor, allowMultipleCompletions: e.target.checked })} />Allow this task to be completed multiple times per day</label>
              <label className="dailyOpsCheck"><input type="checkbox" checked={taskEditor.active !== false} onChange={(e) => setTaskEditor({ ...taskEditor, active: e.target.checked })} />Active routine</label>
            </div>
            <div className="dailyOpsModalActions"><button className="secondaryButton" type="button" onClick={() => setTaskEditor(null)}>Cancel</button><button className="primaryButton" type="submit"><Save size={15} />Save Routine</button></div>
          </form>
        </div>
      ) : null}

      {stationEditor ? (
        <div className="dailyOpsModalOverlay" role="dialog" aria-modal="true">
          <form className="dailyOpsModal dailyOpsSmallModal" onSubmit={saveStation}>
            <div className="dailyOpsModalHeader"><div><p className="eyebrow">Station</p><h3>{stationEditor.id ? "Edit Station" : "New Station"}</h3></div><button type="button" onClick={() => setStationEditor(null)}><X size={18} /></button></div>
            <div className="dailyOpsFormGrid"><label className="wide">Station name<input required value={stationEditor.name} onChange={(e) => setStationEditor({ ...stationEditor, name: e.target.value })} placeholder="Harvest Station" /></label><label className="wide">Description<textarea rows="2" value={stationEditor.description} onChange={(e) => setStationEditor({ ...stationEditor, description: e.target.value })} /></label><label className="wide dailyOpsCheck"><input type="checkbox" checked={stationEditor.active !== false} onChange={(e) => setStationEditor({ ...stationEditor, active: e.target.checked })} />Active station</label></div>
            <div className="dailyOpsModalActions"><button className="secondaryButton" type="button" onClick={() => setStationEditor(null)}>Cancel</button><button className="primaryButton" type="submit"><Save size={15} />Save Station</button></div>
          </form>
        </div>
      ) : null}

      {completionTask ? (
        <div className="dailyOpsModalOverlay" role="dialog" aria-modal="true">
          <form className="dailyOpsModal dailyOpsSmallModal" onSubmit={(event) => { event.preventDefault(); finishCompletion(completionTask, completionTask.completionMethod, completionValue, completionNotes); }}>
            <div className="dailyOpsModalHeader"><div><p className="eyebrow">Reading required</p><h3>{completionTask.name}</h3></div><button type="button" onClick={() => setCompletionTask(null)}><X size={18} /></button></div>
            <div className="dailyOpsReadingInput"><label>Record reading<div><input autoFocus required type="number" step="any" value={completionValue} onChange={(e) => setCompletionValue(e.target.value)} /><span>{completionTask.unit}</span></div></label><label>Notes<textarea rows="2" value={completionNotes} onChange={(e) => setCompletionNotes(e.target.value)} placeholder="Optional" /></label></div>
            <div className="dailyOpsModalActions"><button className="secondaryButton" type="button" onClick={() => setCompletionTask(null)}>Cancel</button><button className="primaryButton" type="submit"><CheckCircle2 size={15} />Complete Task</button></div>
          </form>
        </div>
      ) : null}

      {printItem ? (
        <div className="dailyOpsPrintTag" aria-hidden="true">
          <strong>{printItem.name}</strong>
          <span>{printItem.type === "station" ? "STATION" : "SCAN WHEN COMPLETE"}</span>
          <BarcodeGraphic value={printItem.barcode} />
          <code>{printItem.barcode}</code>
        </div>
      ) : null}

      <ConfirmDialog open={Boolean(confirmDelete)} title="Remove this item?" message={confirmDelete?.type === "log" ? "This removes the completion record from history." : "This cannot be undone."} confirmLabel="Remove" onConfirm={performDelete} onCancel={() => setConfirmDelete(null)} danger />
      <Toast {...toast} onClose={() => setToast((current) => ({ ...current, open: false }))} />
    </div>
  );
}
