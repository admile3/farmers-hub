/* Mobile/tablet optimization pass: original logic preserved, responsive class hooks added only. */
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Flower2,
  Leaf,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sprout,
  Trash2,
  X
} from "lucide-react";

import { useAuth } from "../AuthContext.jsx";
import StatCard from "../components/StatCard.jsx";
import {
  deletePlantingBatch,
  deletePlantingTemplate,
  getPlantingBatches,
  getPlantingTemplates,
  savePlantingBatch,
  savePlantingTemplate
} from "../services/plantingService.js";

const CROP_CATEGORIES = [
  "Microgreens",
  "Herbs",
  "Vegetables",
  "Flowers",
  "Houseplants",
  "Fruit",
  "Field crop",
  "Plant starts",
  "Other"
];

const GROWING_METHODS = [
  "Microgreen tray",
  "Seed tray",
  "Plug tray",
  "Container",
  "Raised bed",
  "Field row",
  "Hydroponic",
  "Greenhouse bench",
  "Propagation tray",
  "Other"
];

const QUANTITY_UNITS = [
  "trays",
  "pots",
  "cells",
  "plugs",
  "plants",
  "rows",
  "bed feet",
  "sq ft",
  "bunches",
  "units"
];

const BATCH_STATUSES = [
  "Planned",
  "Planted",
  "Germinated",
  "Moved to Light",
  "Transplanted",
  "Ready",
  "Harvested",
  "Failed"
];

const TASK_FILTERS = [
  "All tasks",
  "Plant",
  "Germination",
  "Move",
  "Transplant",
  "Harvest"
];

const TASK_DATE_RANGES = [
  "Today",
  "Next 7 days",
  "Next 14 days",
  "Next 30 days",
  "Overdue",
  "All upcoming"
];

function makeId(prefix = "item") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateString, days) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  date.setDate(date.getDate() + (Number(days) || 0));
  return date.toISOString().slice(0, 10);
}

function daysBetween(dateString) {
  if (!dateString) return null;

  const today = new Date(`${todayString()}T00:00:00`);
  const target = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(target.getTime())) return null;

  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function formatDate(value) {
  if (!value) return "Not set";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatDueText(value) {
  const days = daysBetween(value);

  if (days === null) return "No date";
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function blankTemplate() {
  return {
    id: "",
    cropName: "",
    variety: "",
    category: "Microgreens",
    growingMethod: "Microgreen tray",
    germinationDays: 2,
    blackoutDays: 3,
    daysToHarvest: 10,
    transplantDays: "",
    harvestWindowDays: 3,
    successionIntervalDays: 7,
    defaultQuantityUnit: "trays",
    defaultLocation: "",
    notes: "",
    createdAt: "",
    updatedAt: ""
  };
}

function blankBatch() {
  return {
    id: "",
    templateId: "",
    cropName: "",
    variety: "",
    category: "Microgreens",
    growingMethod: "Microgreen tray",
    plantingDate: todayString(),
    targetHarvestDate: addDays(todayString(), 10),
    germinationDate: addDays(todayString(), 2),
    moveToLightDate: addDays(todayString(), 5),
    transplantDate: "",
    quantity: 1,
    quantityUnit: "trays",
    location: "",
    status: "Planned",
    notes: "",
    createdAt: "",
    updatedAt: ""
  };
}

function batchLabel(batch) {
  const variety = batch.variety ? `, ${batch.variety}` : "";
  return `${batch.cropName || "Untitled Crop"}${variety}`;
}

function batchTaskList(batch) {
  const tasks = [
    {
      type: "Plant",
      date: batch.plantingDate,
      label: `Plant ${batchLabel(batch)}`
    },
    {
      type: "Germination",
      date: batch.germinationDate,
      label: `Check germination: ${batchLabel(batch)}`
    },
    {
      type: "Move",
      date: batch.moveToLightDate,
      label: `Move to light: ${batchLabel(batch)}`
    },
    {
      type: "Transplant",
      date: batch.transplantDate,
      label: `Transplant ${batchLabel(batch)}`
    },
    {
      type: "Harvest",
      date: batch.targetHarvestDate,
      label: `Harvest ${batchLabel(batch)}`
    }
  ];

  return tasks.filter((task) => task.date);
}

function taskStatus(taskDate) {
  const days = daysBetween(taskDate);

  if (days === null) return "neutral";
  if (days < 0) return "danger";
  if (days <= 2) return "warning";
  return "neutral";
}

export default function PlantingScheduler() {
  const { user, loginWithGoogle } = useAuth();

  const [templates, setTemplates] = useState([]);
  const [batches, setBatches] = useState([]);
  const [templateForm, setTemplateForm] = useState(blankTemplate());
  const [batchForm, setBatchForm] = useState(blankBatch());
  const [activePanel, setActivePanel] = useState("batch");
  const [queryText, setQueryText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [statusFilter, setStatusFilter] = useState("Active batches");
  const [taskFilter, setTaskFilter] = useState("All tasks");
  const [taskDateRange, setTaskDateRange] = useState("Next 7 days");
  const [loading, setLoading] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [savingBatch, setSavingBatch] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setTemplates([]);
      setBatches([]);
      setTemplateForm(blankTemplate());
      setBatchForm(blankBatch());
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
      const [savedTemplates, savedBatches] = await Promise.all([
        getPlantingTemplates(user.uid),
        getPlantingBatches(user.uid)
      ]);

      setTemplates(Array.isArray(savedTemplates) ? savedTemplates : []);
      setBatches(Array.isArray(savedBatches) ? savedBatches : []);
    } catch (error) {
      console.error("Could not load planting scheduler data:", error);
      setStatusMessage("Could not load planting scheduler data.");
    } finally {
      setLoading(false);
    }
  }

  function updateTemplateField(field, value) {
    setTemplateForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateBatchField(field, value) {
    setBatchForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateBatchDateMode(field, value) {
    setBatchForm((current) => {
      const next = {
        ...current,
        [field]: value
      };

      if (field === "plantingDate") {
        const template = templates.find((item) => item.id === next.templateId);
        const daysToHarvest =
          Number(template?.daysToHarvest ?? next.daysToHarvest ?? 10) || 0;
        const germinationDays = Number(template?.germinationDays ?? 0) || 0;
        const blackoutDays = Number(template?.blackoutDays ?? 0) || 0;
        const transplantDays = Number(template?.transplantDays ?? 0) || 0;

        next.targetHarvestDate = addDays(value, daysToHarvest);
        next.germinationDate = germinationDays ? addDays(value, germinationDays) : "";
        next.moveToLightDate =
          germinationDays || blackoutDays
            ? addDays(value, germinationDays + blackoutDays)
            : "";
        next.transplantDate = transplantDays ? addDays(value, transplantDays) : "";
      }

      if (field === "targetHarvestDate") {
        const template = templates.find((item) => item.id === next.templateId);
        const daysToHarvest = Number(template?.daysToHarvest || 0);

        if (daysToHarvest) {
          const plantingDate = addDays(value, -daysToHarvest);
          const germinationDays = Number(template?.germinationDays || 0);
          const blackoutDays = Number(template?.blackoutDays || 0);
          const transplantDays = Number(template?.transplantDays || 0);

          next.plantingDate = plantingDate;
          next.germinationDate = germinationDays
            ? addDays(plantingDate, germinationDays)
            : "";
          next.moveToLightDate =
            germinationDays || blackoutDays
              ? addDays(plantingDate, germinationDays + blackoutDays)
              : "";
          next.transplantDate = transplantDays
            ? addDays(plantingDate, transplantDays)
            : "";
        }
      }

      return next;
    });
  }

  function applyTemplate(templateId) {
    const template = templates.find((item) => item.id === templateId);

    if (!template) {
      setBatchForm(blankBatch());
      return;
    }

    const plantingDate = batchForm.plantingDate || todayString();
    const germinationDays = Number(template.germinationDays) || 0;
    const blackoutDays = Number(template.blackoutDays) || 0;
    const daysToHarvest = Number(template.daysToHarvest) || 0;
    const transplantDays = Number(template.transplantDays) || 0;

    setBatchForm((current) => ({
      ...current,
      templateId,
      cropName: template.cropName || "",
      variety: template.variety || "",
      category: template.category || "Other",
      growingMethod: template.growingMethod || "Other",
      plantingDate,
      germinationDate: germinationDays ? addDays(plantingDate, germinationDays) : "",
      moveToLightDate:
        germinationDays || blackoutDays
          ? addDays(plantingDate, germinationDays + blackoutDays)
          : "",
      transplantDate: transplantDays ? addDays(plantingDate, transplantDays) : "",
      targetHarvestDate: daysToHarvest ? addDays(plantingDate, daysToHarvest) : "",
      quantityUnit: template.defaultQuantityUnit || "units",
      location: template.defaultLocation || "",
      notes: current.notes || template.notes || ""
    }));
  }

  function startNewTemplate() {
    setTemplateForm(blankTemplate());
    setActivePanel("template");
    setStatusMessage("Started a new crop template.");
  }

  function startNewBatch() {
    setBatchForm(blankBatch());
    setActivePanel("batch");
    setStatusMessage("Started a new planting batch.");
  }

  function loadTemplate(template) {
    setTemplateForm({
      ...blankTemplate(),
      ...template
    });
    setActivePanel("template");
    setStatusMessage("Crop template loaded.");
  }

  function loadBatch(batch) {
    setBatchForm({
      ...blankBatch(),
      ...batch
    });
    setActivePanel("batch");
    setStatusMessage("Planting batch loaded.");
  }

  async function handleSaveTemplate() {
    if (!user) return;

    if (!templateForm.cropName.trim()) {
      setStatusMessage("Crop name is required.");
      return;
    }

    setSavingTemplate(true);

    try {
      const id = await savePlantingTemplate(user.uid, {
        ...templateForm,
        cropName: templateForm.cropName.trim(),
        variety: templateForm.variety.trim()
      });

      setTemplateForm((current) => ({
        ...current,
        id
      }));

      setStatusMessage("Crop template saved.");
      await loadData();
    } catch (error) {
      console.error("Could not save crop template:", error);
      setStatusMessage("Could not save crop template.");
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleSaveBatch() {
    if (!user) return;

    if (!batchForm.cropName.trim()) {
      setStatusMessage("Crop name is required.");
      return;
    }

    if (!batchForm.plantingDate && !batchForm.targetHarvestDate) {
      setStatusMessage("Add a planting date or target harvest date.");
      return;
    }

    setSavingBatch(true);

    try {
      const id = await savePlantingBatch(user.uid, {
        ...batchForm,
        cropName: batchForm.cropName.trim(),
        variety: batchForm.variety.trim(),
        quantity: Number(batchForm.quantity) || 0
      });

      setBatchForm((current) => ({
        ...current,
        id
      }));

      setStatusMessage("Planting batch saved.");
      await loadData();
    } catch (error) {
      console.error("Could not save planting batch:", error);
      setStatusMessage("Could not save planting batch.");
    } finally {
      setSavingBatch(false);
    }
  }

  async function handleDeleteTemplate(template) {
    if (!user || !template?.id) return;

    const confirmed = window.confirm(`Delete ${template.cropName || "this crop template"}?`);
    if (!confirmed) return;

    try {
      await deletePlantingTemplate(user.uid, template.id);

      if (templateForm.id === template.id) {
        setTemplateForm(blankTemplate());
      }

      setStatusMessage("Crop template deleted.");
      await loadData();
    } catch (error) {
      console.error("Could not delete crop template:", error);
      setStatusMessage("Could not delete crop template.");
    }
  }

  async function handleDeleteBatch(batch) {
    if (!user || !batch?.id) return;

    const confirmed = window.confirm(`Delete ${batchLabel(batch)}?`);
    if (!confirmed) return;

    try {
      await deletePlantingBatch(user.uid, batch.id);

      if (batchForm.id === batch.id) {
        setBatchForm(blankBatch());
      }

      setStatusMessage("Planting batch deleted.");
      await loadData();
    } catch (error) {
      console.error("Could not delete planting batch:", error);
      setStatusMessage("Could not delete planting batch.");
    }
  }

  const filteredBatches = useMemo(() => {
    const search = normalize(queryText);

    return batches.filter((batch) => {
      const matchesSearch = search
        ? [
            batch.cropName,
            batch.variety,
            batch.category,
            batch.growingMethod,
            batch.location,
            batch.status,
            batch.notes
          ]
            .map(normalize)
            .some((value) => value.includes(search))
        : true;

      const matchesCategory =
        categoryFilter === "All categories" || batch.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All batches" ||
        (statusFilter === "Active batches"
          ? !["Harvested", "Failed"].includes(batch.status)
          : batch.status === statusFilter);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [batches, queryText, categoryFilter, statusFilter]);

  const allUpcomingTasks = useMemo(() => {
    return batches
      .filter((batch) => !["Harvested", "Failed"].includes(batch.status))
      .flatMap((batch) =>
        batchTaskList(batch).map((task) => ({
          ...task,
          batchId: batch.id,
          cropName: batch.cropName,
          variety: batch.variety,
          status: batch.status,
          location: batch.location,
          quantity: batch.quantity,
          quantityUnit: batch.quantityUnit
        }))
      )
      .filter((task) => {
        const days = daysBetween(task.date);
        return days !== null && days >= -30 && days <= 60;
      })
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [batches]);

  const upcomingTasks = useMemo(() => {
    return allUpcomingTasks
      .filter((task) => {
        if (taskFilter !== "All tasks" && task.type !== taskFilter) {
          return false;
        }

        const days = daysBetween(task.date);

        if (days === null) return false;
        if (taskDateRange === "Today") return days === 0;
        if (taskDateRange === "Next 7 days") return days >= 0 && days <= 7;
        if (taskDateRange === "Next 14 days") return days >= 0 && days <= 14;
        if (taskDateRange === "Next 30 days") return days >= 0 && days <= 30;
        if (taskDateRange === "Overdue") return days < 0;
        return days >= 0;
      })
      .slice(0, 24);
  }, [allUpcomingTasks, taskFilter, taskDateRange]);

  const stats = useMemo(() => {
    const activeBatches = batches.filter(
      (batch) => !["Harvested", "Failed"].includes(batch.status)
    );
    const readyBatches = activeBatches.filter((batch) => batch.status === "Ready");
    const overdueTasks = allUpcomingTasks.filter((task) => daysBetween(task.date) < 0);
    const dueTodayTasks = allUpcomingTasks.filter((task) => daysBetween(task.date) === 0);

    return {
      templates: templates.length,
      active: activeBatches.length,
      ready: readyBatches.length,
      overdue: overdueTasks.length,
      dueToday: dueTodayTasks.length
    };
  }, [templates, batches, allUpcomingTasks]);

  if (!user) {
    return (
      <div className="plantingModule modulePage plantingSchedulerResponsive">
        <section className="farmModuleHero plantingFarmHero">
          <div className="farmModuleHeroText">
            <p className="eyebrow">Planting Scheduler</p>
            <h2>Sign in to schedule plantings.</h2>
            <p>
              Create crop templates, schedule planting batches, and track growing
              tasks from seed to harvest.
            </p>
          </div>

          <div className="farmModuleHeroActions">
            <button className="primaryButton farmHeroAction farmHeroPrimary" type="button" onClick={loginWithGoogle}>
              Sign in with Google
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="plantingModule modulePage plantingSchedulerResponsive">
      {statusMessage ? (
        <div className="floatingStatus" role="status">
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            <X size={16} />
          </button>
        </div>
      ) : null}

      <section className="farmModuleHero plantingFarmHero">
        <div className="farmModuleHeroText">
          <p className="eyebrow">Planting Scheduler</p>
          <h2>Plan crops, plantings, growing tasks, and harvest windows.</h2>
          <p>
            Build reusable crop templates, schedule batches by planting date or
            target harvest date, and track upcoming crop tasks across trays, beds,
            pots, fields, and greenhouse space.
          </p>
        </div>

        <div className="farmModuleHeroActions">
          <button className="secondaryButton compactButton farmHeroAction farmHeroSecondary" type="button" onClick={startNewTemplate}>
            <Leaf size={16} />
            New Template
          </button>

          <button className="primaryButton compactPrimary farmHeroAction farmHeroPrimary" type="button" onClick={startNewBatch}>
            <Plus size={16} />
            New Planting
          </button>
        </div>
      </section>

      <section className="hubStatGrid plantingStatGrid plantingStatGridResponsive">
        <StatCard
          icon={Leaf}
          label="Templates"
          value={loading ? "..." : stats.templates}
          sub="saved crop profiles"
          accent="planting"
        />
        <StatCard
          icon={Sprout}
          label="Active"
          value={loading ? "..." : stats.active}
          sub="open planting batches"
          accent="market"
        />
        <StatCard
          icon={CalendarDays}
          label="Due Today"
          value={loading ? "..." : stats.dueToday}
          sub="planting tasks"
          accent="sourdough"
        />
        <StatCard
          icon={CheckCircle2}
          label="Ready"
          value={loading ? "..." : stats.ready}
          sub="ready to harvest or sell"
          accent="pricing"
        />
        <StatCard
          icon={ClipboardList}
          label="Overdue"
          value={loading ? "..." : stats.overdue}
          sub="past-due tasks"
          accent="grant"
        />
      </section>

      <section className="plantingTodayPanel workspacePanel compactPanel plantingTasksPanelResponsive">
        <div className="workspaceHeader compactPanelHeader plantingTasksHeader">
          <div className="plantingTasksTitleBlock">
            <div className="plantingTasksEyebrowRow">
              <p className="eyebrow">Tasks</p>

              <div className="plantingTaskFilters plantingTaskFiltersResponsive">
                <label>
                  <span>Task</span>
                  <select
                    value={taskFilter}
                    onChange={(event) => setTaskFilter(event.target.value)}
                  >
                    {TASK_FILTERS.map((task) => (
                      <option key={task}>{task}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Date Range</span>
                  <select
                    value={taskDateRange}
                    onChange={(event) => setTaskDateRange(event.target.value)}
                  >
                    {TASK_DATE_RANGES.map((range) => (
                      <option key={range}>{range}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <h3>Upcoming Planting Tasks</h3>
          </div>

          <button className="secondaryButton compactButton" type="button" onClick={loadData}>
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {upcomingTasks.length ? (
          <div className="plantingTaskGrid plantingTaskGridResponsive">
            {upcomingTasks.map((task) => (
              <button
                className={`plantingTaskCard ${taskStatus(task.date)}`}
                type="button"
                key={`${task.batchId}-${task.type}-${task.date}`}
                onClick={() => {
                  const match = batches.find((batch) => batch.id === task.batchId);
                  if (match) loadBatch(match);
                }}
              >
                <strong>{task.type}</strong>
                <span>{task.label}</span>
                <small>
                  {formatDate(task.date)} • {formatDueText(task.date)}
                </small>
              </button>
            ))}
          </div>
        ) : (
          <p className="dashboardEmpty">
            {loading ? "Loading tasks..." : "No planting tasks match the selected filters."}
          </p>
        )}
      </section>

      <section className="plantingLayout plantingLayoutResponsive">
        <div className="workspacePanel compactPanel plantingDirectoryPanel plantingDirectoryPanelResponsive">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Schedule</p>
              <h3>Planting Batches</h3>
            </div>

            <button className="secondaryButton compactButton" type="button" onClick={loadData}>
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>

          <div className="customersFilterPanel plantingFilterPanel plantingFilterPanelResponsive">
            <div className="searchBox compactSearch customersSearchBox">
              <Search size={17} />
              <input
                type="search"
                value={queryText}
                onChange={(event) => setQueryText(event.target.value)}
                placeholder="Search crop, variety, location, notes, or status"
              />
            </div>

            <label>
              Category
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option>All categories</option>
                {CROP_CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>

            <label>
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option>Active batches</option>
                <option>All batches</option>
                {BATCH_STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="plantingBatchList plantingBatchListResponsive">
            {filteredBatches.length ? (
              filteredBatches.map((batch) => (
                <div className="plantingBatchRow plantingBatchRowResponsive" key={batch.id}>
                  <button type="button" onClick={() => loadBatch(batch)}>
                    <strong>{batchLabel(batch)}</strong>
                    <span>
                      {batch.quantity || 0} {batch.quantityUnit || "units"} •{" "}
                      {batch.location || "No location"}
                    </span>
                    <small>
                      Plant {formatDate(batch.plantingDate)} • Harvest{" "}
                      {formatDate(batch.targetHarvestDate)}
                    </small>
                  </button>

                  <span className={`plantingStatusPill ${normalize(batch.status).replace(/[^a-z0-9]+/g, "-")}`}>
                    {batch.status || "Planned"}
                  </span>

                  <button
                    className="iconButton danger"
                    type="button"
                    onClick={() => handleDeleteBatch(batch)}
                    aria-label="Delete planting batch"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            ) : (
              <p className="dashboardEmpty">
                {loading ? "Loading batches..." : "No planting batches match your filters."}
              </p>
            )}
          </div>
        </div>

        <div className="plantingSideStack plantingSideStackResponsive">
          <div className="workspacePanel compactPanel plantingBuilderPanelResponsive">
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Builder</p>
                <h3>{activePanel === "template" ? "Crop Template" : "Planting Batch"}</h3>
              </div>

              <div className="plantingPanelToggle plantingPanelToggleResponsive">
                <button
                  type="button"
                  className={activePanel === "batch" ? "selected" : ""}
                  onClick={() => setActivePanel("batch")}
                >
                  Batch
                </button>
                <button
                  type="button"
                  className={activePanel === "template" ? "selected" : ""}
                  onClick={() => setActivePanel("template")}
                >
                  Template
                </button>
              </div>
            </div>

            {activePanel === "template" ? (
              <div className="plantingEditorStack">
                <div className="formGrid compactFormGrid plantingFormGridResponsive">
                  <label>
                    Crop Name
                    <input
                      value={templateForm.cropName}
                      onChange={(event) => updateTemplateField("cropName", event.target.value)}
                      placeholder="Basil, Sunflower, Zinnia, Tomato"
                    />
                  </label>

                  <label>
                    Variety
                    <input
                      value={templateForm.variety}
                      onChange={(event) => updateTemplateField("variety", event.target.value)}
                      placeholder="Genovese, Rambo, Queen Lime"
                    />
                  </label>

                  <label>
                    Category
                    <select
                      value={templateForm.category}
                      onChange={(event) => updateTemplateField("category", event.target.value)}
                    >
                      {CROP_CATEGORIES.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Growing Method
                    <select
                      value={templateForm.growingMethod}
                      onChange={(event) =>
                        updateTemplateField("growingMethod", event.target.value)
                      }
                    >
                      {GROWING_METHODS.map((method) => (
                        <option key={method}>{method}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Germination Days
                    <input
                      type="number"
                      value={templateForm.germinationDays}
                      onChange={(event) =>
                        updateTemplateField("germinationDays", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Blackout Days
                    <input
                      type="number"
                      value={templateForm.blackoutDays}
                      onChange={(event) =>
                        updateTemplateField("blackoutDays", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Days to Harvest
                    <input
                      type="number"
                      value={templateForm.daysToHarvest}
                      onChange={(event) =>
                        updateTemplateField("daysToHarvest", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Transplant Days
                    <input
                      type="number"
                      value={templateForm.transplantDays}
                      onChange={(event) =>
                        updateTemplateField("transplantDays", event.target.value)
                      }
                      placeholder="Optional"
                    />
                  </label>

                  <label>
                    Harvest Window Days
                    <input
                      type="number"
                      value={templateForm.harvestWindowDays}
                      onChange={(event) =>
                        updateTemplateField("harvestWindowDays", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Succession Interval Days
                    <input
                      type="number"
                      value={templateForm.successionIntervalDays}
                      onChange={(event) =>
                        updateTemplateField("successionIntervalDays", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Default Quantity Unit
                    <select
                      value={templateForm.defaultQuantityUnit}
                      onChange={(event) =>
                        updateTemplateField("defaultQuantityUnit", event.target.value)
                      }
                    >
                      {QUANTITY_UNITS.map((unit) => (
                        <option key={unit}>{unit}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Default Location
                    <input
                      value={templateForm.defaultLocation}
                      onChange={(event) =>
                        updateTemplateField("defaultLocation", event.target.value)
                      }
                      placeholder="Rack 1, greenhouse, bed A"
                    />
                  </label>

                  <label className="fullSpan">
                    Template Notes
                    <textarea
                      value={templateForm.notes}
                      onChange={(event) => updateTemplateField("notes", event.target.value)}
                      placeholder="Seeding notes, crop timing, spacing, care notes, harvest notes"
                    />
                  </label>
                </div>

                <div className="formActions compactActions">
                  <button className="secondaryButton compactButton farmHeroAction farmHeroSecondary" type="button" onClick={startNewTemplate}>
                    <Plus size={15} />
                    New Template
                  </button>

                  <button
                    className="primaryButton compactPrimary"
                    type="button"
                    onClick={handleSaveTemplate}
                    disabled={savingTemplate}
                  >
                    <Save size={15} />
                    {savingTemplate ? "Saving..." : "Save Template"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="plantingEditorStack">
                <div className="formGrid compactFormGrid plantingFormGridResponsive">
                  <label>
                    Use Template
                    <select
                      value={batchForm.templateId}
                      onChange={(event) => applyTemplate(event.target.value)}
                    >
                      <option value="">No template, manual crop</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.cropName}
                          {template.variety ? `, ${template.variety}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Status
                    <select
                      value={batchForm.status}
                      onChange={(event) => updateBatchField("status", event.target.value)}
                    >
                      {BATCH_STATUSES.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Crop Name
                    <input
                      value={batchForm.cropName}
                      onChange={(event) => updateBatchField("cropName", event.target.value)}
                      placeholder="Crop"
                    />
                  </label>

                  <label>
                    Variety
                    <input
                      value={batchForm.variety}
                      onChange={(event) => updateBatchField("variety", event.target.value)}
                      placeholder="Optional"
                    />
                  </label>

                  <label>
                    Category
                    <select
                      value={batchForm.category}
                      onChange={(event) => updateBatchField("category", event.target.value)}
                    >
                      {CROP_CATEGORIES.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Growing Method
                    <select
                      value={batchForm.growingMethod}
                      onChange={(event) => updateBatchField("growingMethod", event.target.value)}
                    >
                      {GROWING_METHODS.map((method) => (
                        <option key={method}>{method}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Planting Date
                    <input
                      type="date"
                      value={batchForm.plantingDate}
                      onChange={(event) =>
                        updateBatchDateMode("plantingDate", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Target Harvest Date
                    <input
                      type="date"
                      value={batchForm.targetHarvestDate}
                      onChange={(event) =>
                        updateBatchDateMode("targetHarvestDate", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Germination Date
                    <input
                      type="date"
                      value={batchForm.germinationDate}
                      onChange={(event) =>
                        updateBatchField("germinationDate", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Move to Light Date
                    <input
                      type="date"
                      value={batchForm.moveToLightDate}
                      onChange={(event) =>
                        updateBatchField("moveToLightDate", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Transplant Date
                    <input
                      type="date"
                      value={batchForm.transplantDate}
                      onChange={(event) =>
                        updateBatchField("transplantDate", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Quantity
                    <input
                      type="number"
                      value={batchForm.quantity}
                      onChange={(event) => updateBatchField("quantity", event.target.value)}
                    />
                  </label>

                  <label>
                    Quantity Unit
                    <select
                      value={batchForm.quantityUnit}
                      onChange={(event) =>
                        updateBatchField("quantityUnit", event.target.value)
                      }
                    >
                      {QUANTITY_UNITS.map((unit) => (
                        <option key={unit}>{unit}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Location
                    <input
                      value={batchForm.location}
                      onChange={(event) => updateBatchField("location", event.target.value)}
                      placeholder="Rack, bed, field, greenhouse, shelf"
                    />
                  </label>

                  <label className="fullSpan">
                    Batch Notes
                    <textarea
                      value={batchForm.notes}
                      onChange={(event) => updateBatchField("notes", event.target.value)}
                      placeholder="Batch notes, market target, crop condition, amendments, problems, harvest notes"
                    />
                  </label>
                </div>

                <div className="plantingDatePreview plantingDatePreviewResponsive">
                  <div>
                    <span>Plant</span>
                    <strong>{formatDate(batchForm.plantingDate)}</strong>
                  </div>
                  <div>
                    <span>Move / Care</span>
                    <strong>{formatDate(batchForm.moveToLightDate || batchForm.transplantDate)}</strong>
                  </div>
                  <div>
                    <span>Harvest</span>
                    <strong>{formatDate(batchForm.targetHarvestDate)}</strong>
                  </div>
                </div>

                <div className="formActions compactActions">
                  <button className="secondaryButton compactButton" type="button" onClick={startNewBatch}>
                    <Plus size={15} />
                    New Batch
                  </button>

                  <button
                    className="primaryButton compactPrimary"
                    type="button"
                    onClick={handleSaveBatch}
                    disabled={savingBatch}
                  >
                    <Save size={15} />
                    {savingBatch ? "Saving..." : "Save Batch"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="workspacePanel compactPanel plantingBuilderPanelResponsive">
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Templates</p>
                <h3>Crop Template Library</h3>
              </div>
            </div>

            <div className="plantingTemplateList plantingTemplateListResponsive">
              {templates.length ? (
                templates.map((template) => (
                  <div className="plantingTemplateRow plantingTemplateRowResponsive" key={template.id}>
                    <button type="button" onClick={() => loadTemplate(template)}>
                      <strong>{template.cropName || "Untitled Crop"}</strong>
                      <span>
                        {template.variety || template.category} • {template.daysToHarvest || 0} days
                      </span>
                    </button>

                    <button
                      className="iconButton danger"
                      type="button"
                      onClick={() => handleDeleteTemplate(template)}
                      aria-label="Delete crop template"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="dashboardEmpty">
                  No crop templates yet. Save one to speed up future plantings.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
