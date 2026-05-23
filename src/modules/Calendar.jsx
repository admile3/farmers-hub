import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Link as LinkIcon,
  Plus,
  Save,
  Trash2,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

import { useAuth } from "../AuthContext.jsx";
import { db } from "../firebase";
import {
  deleteCalendarEvent,
  getCalendarEvents,
  saveCalendarEvent
} from "../services/calendarService.js";
import { getMarketPrepPlans } from "../services/marketPrepService.js";
import { getPermitGrantItems } from "../services/permitGrantService.js";
import StatCard from "../components/StatCard.jsx";

const blankEvent = {
  id: "",
  title: "",
  type: "Market",
  date: "",
  startTime: "",
  endTime: "",
  location: "",
  notes: ""
};

const eventTypes = [
  "Market",
  "Event",
  "Delivery",
  "Production",
  "Deadline",
  "Reminder",
  "Meeting",
  "Other"
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function parseLocalDate(dateString) {
  if (!dateString) return null;

  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDisplayDate(dateString) {
  const date = parseLocalDate(dateString);
  if (!date) return "";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function daysUntil(dateString) {
  const date = parseLocalDate(dateString);
  if (!date) return null;

  const today = parseLocalDate(todayISO());
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDue(days) {
  if (days === null) return "";
  if (days < 0) return "Past due";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

function getMonthDays(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();

  const gridStart = new Date(year, month, 1 - startDay);
  const days = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    days.push({
      date,
      iso: date.toISOString().slice(0, 10),
      isCurrentMonth: date.getMonth() === month,
      isToday: date.toISOString().slice(0, 10) === todayISO()
    });
  }

  return days;
}

function normalizeImportedEvents({ marketPlans, permitItems, bakingData }) {
  const events = [];

  marketPlans.forEach((plan) => {
    if (!plan.marketDate) return;

    events.push({
      id: `market-${plan.id}`,
      title: plan.marketName || "Market Plan",
      type: "Market Prep",
      date: plan.marketDate,
      startTime: "",
      endTime: "",
      location: plan.location || "",
      notes: plan.weatherNotes || "",
      source: "marketPrep",
      sourcePath: "/market-prep",
      accent: "market"
    });
  });

  permitItems.forEach((item) => {
    const renewalDate = item.renewalDate || "";
    const dueDate = item.dueDate || "";

    if (renewalDate) {
      events.push({
        id: `permit-renewal-${item.id}`,
        title: `${item.name || "Permit"} renewal`,
        type: item.type || "Permit",
        date: renewalDate,
        startTime: "",
        endTime: "",
        location: item.agency || "",
        notes: item.notes || "",
        source: "permitGrant",
        sourcePath: `/permit-grants?record=${encodeURIComponent(item.id || "")}`,
        accent: "grant"
      });
    }

    if (dueDate && dueDate !== renewalDate) {
      events.push({
        id: `permit-due-${item.id}`,
        title: `${item.name || "Permit"} deadline`,
        type: item.type || "Permit",
        date: dueDate,
        startTime: "",
        endTime: "",
        location: item.agency || "",
        notes: item.notes || "",
        source: "permitGrant",
        sourcePath: `/permit-grants?record=${encodeURIComponent(item.id || "")}`,
        accent: "grant"
      });
    }
  });

  if (bakingData?.productionDate) {
    events.push({
      id: "baking-production-date",
      title: "Baking production day",
      type: "Production",
      date: bakingData.productionDate,
      startTime: bakingData.settings?.defaultStartTime || "",
      endTime: "",
      location: "",
      notes: "Generated from Baking Planner production date.",
      source: "bakingPlanner",
      sourcePath: "/baking-planner",
      accent: "sourdough"
    });
  }

  return events;
}

export default function Calendar() {
  const { user, loginWithGoogle } = useAuth();

  const [viewDate, setViewDate] = useState(() => new Date());
  const [manualEvents, setManualEvents] = useState([]);
  const [importedEvents, setImportedEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ ...blankEvent, date: todayISO() });
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadCalendarData() {
    if (!user) return;

    setLoading(true);

    try {
      const [savedEvents, marketPlans, permitItems, bakingSnapshot] =
        await Promise.all([
          getCalendarEvents(user.uid),
          getMarketPrepPlans(user.uid),
          getPermitGrantItems(user.uid),
          getDoc(doc(db, "users", user.uid, "bakingPlanner", "main"))
        ]);

      const bakingData = bakingSnapshot.exists() ? bakingSnapshot.data() : {};

      setManualEvents(
        savedEvents.map((event) => ({
          ...event,
          source: "manual",
          accent: "calendar"
        }))
      );

      setImportedEvents(
        normalizeImportedEvents({
          marketPlans: Array.isArray(marketPlans) ? marketPlans : [],
          permitItems: Array.isArray(permitItems) ? permitItems : [],
          bakingData
        })
      );
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not load calendar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadCalendarData();
    } else {
      setManualEvents([]);
      setImportedEvents([]);
    }
  }, [user]);

  useEffect(() => {
    if (!statusMessage) return;

    const timer = window.setTimeout(() => {
      setStatusMessage("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const allEvents = useMemo(() => {
    return [...manualEvents, ...importedEvents].sort((a, b) => {
      const dateCompare = String(a.date || "").localeCompare(String(b.date || ""));
      if (dateCompare !== 0) return dateCompare;

      return String(a.startTime || "").localeCompare(String(b.startTime || ""));
    });
  }, [manualEvents, importedEvents]);

  const calendarDays = useMemo(() => getMonthDays(viewDate), [viewDate]);

  const eventsByDate = useMemo(() => {
    return allEvents.reduce((map, event) => {
      if (!event.date) return map;

      if (!map[event.date]) {
        map[event.date] = [];
      }

      map[event.date].push(event);

      return map;
    }, {});
  }, [allEvents]);

  const selectedDateEvents = eventsByDate[selectedDate] || [];

  const upcomingEvents = useMemo(() => {
    return allEvents
      .map((event) => ({
        ...event,
        days: daysUntil(event.date)
      }))
      .filter((event) => event.days !== null && event.days >= 0)
      .sort((a, b) => a.days - b.days)
      .slice(0, 8);
  }, [allEvents]);

  const monthEventsCount = useMemo(() => {
    const key = monthKey(viewDate);

    return allEvents.filter((event) => {
      const date = parseLocalDate(event.date);
      return date && monthKey(date) === key;
    }).length;
  }, [allEvents, viewDate]);

  function shiftMonth(direction) {
    setViewDate((current) => {
      const next = new Date(current);
      next.setMonth(current.getMonth() + direction);
      return next;
    });
  }

  function openNewEvent(date = selectedDate) {
    setEventForm({
      ...blankEvent,
      date: date || todayISO()
    });
    setSelectedEvent(null);
    setIsEventFormOpen(true);
  }

  function openEditEvent(event) {
    if (event.source !== "manual") {
      setSelectedEvent(event);
      return;
    }

    setEventForm({
      id: event.id || "",
      title: event.title || "",
      type: event.type || "Market",
      date: event.date || todayISO(),
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      location: event.location || "",
      notes: event.notes || ""
    });

    setSelectedEvent(event);
    setIsEventFormOpen(true);
  }

  async function saveEvent(event) {
    event.preventDefault();

    if (!user) return;

    if (!eventForm.title.trim() || !eventForm.date) {
      setStatusMessage("Event title and date are required.");
      return;
    }

    try {
      await saveCalendarEvent(user.uid, {
        ...eventForm,
        title: eventForm.title.trim(),
        location: eventForm.location.trim(),
        notes: eventForm.notes.trim()
      });

      setStatusMessage("Calendar event saved.");
      setIsEventFormOpen(false);
      setEventForm({ ...blankEvent, date: todayISO() });
      await loadCalendarData();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not save calendar event.");
    }
  }

  async function removeEvent(eventId) {
    if (!user || !eventId) return;

    try {
      await deleteCalendarEvent(user.uid, eventId);
      setStatusMessage("Calendar event deleted.");
      setIsEventFormOpen(false);
      setSelectedEvent(null);
      await loadCalendarData();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not delete calendar event.");
    }
  }

  const monthLabel = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  if (!user) {
    return (
      <div className="calendarModule">
        <section className="moduleHero compactHero calendarHero">
          <div>
            <p className="eyebrow">Calendar</p>
            <h2>Sign in to view your vendor calendar.</h2>
            <p>
              Calendar events are built from your market plans, permits, grants,
              baking schedule, and manually added events.
            </p>
          </div>

          <button
            className="primaryButton calendarAddButton"
            type="button"
            onClick={loginWithGoogle}
          >
            Sign in with Google
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="calendarModule">
      {statusMessage ? (
        <div className="floatingStatus success">
          <span>ⓘ</span>
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            ×
          </button>
        </div>
      ) : null}

      <section className="moduleHero compactHero calendarHero">
        <div>
          <p className="eyebrow">Calendar</p>
          <h2>See every dated vendor task in one place.</h2>
          <p>
            Market plans, permit deadlines, grant renewals, baking production dates,
            and manually added events appear together on your calendar.
          </p>
        </div>

        <button
          className="primaryButton calendarAddButton"
          type="button"
          onClick={() => openNewEvent()}
        >
          <Plus size={16} />
          Add Event
        </button>
      </section>

      <section className="hubStatGrid calendarStatGrid">
        <StatCard
          icon={CalendarDays}
          label="This Month"
          value={loading ? "..." : monthEventsCount}
          sub="calendar items"
          accent="calendar"
        />

        <StatCard
          icon={Clock}
          label="Upcoming"
          value={loading ? "..." : upcomingEvents.length}
          sub="next visible events"
          accent="sourdough"
        />

        <StatCard
          icon={LinkIcon}
          label="Imported"
          value={loading ? "..." : importedEvents.length}
          sub="from other modules"
          accent="market"
        />

        <StatCard
          icon={Plus}
          label="Manual"
          value={loading ? "..." : manualEvents.length}
          sub="custom calendar events"
          accent="pricing"
        />
      </section>

      <section className="calendarLayout">
        <div className="calendarPanel calendarMainPanel">
          <div className="calendarToolbar">
            <div>
              <p className="eyebrow">Month View</p>
              <h3>{monthLabel}</h3>
            </div>

            <div className="calendarToolbarActions">
              <button
                type="button"
                className="secondaryButton compactButton"
                onClick={() => shiftMonth(-1)}
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                className="secondaryButton compactButton"
                onClick={() => setViewDate(new Date())}
              >
                Today
              </button>

              <button
                type="button"
                className="secondaryButton compactButton"
                onClick={() => shiftMonth(1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="calendarWeekHeader">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="calendarGrid">
            {calendarDays.map((day) => {
              const dayEvents = eventsByDate[day.iso] || [];
              const isSelected = selectedDate === day.iso;

              return (
                <button
                  type="button"
                  key={day.iso}
                  className={[
                    "calendarDay",
                    day.isCurrentMonth ? "" : "muted",
                    day.isToday ? "today" : "",
                    isSelected ? "selected" : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => setSelectedDate(day.iso)}
                  onDoubleClick={() => openNewEvent(day.iso)}
                >
                  <span className="calendarDayNumber">{day.date.getDate()}</span>

                  <div className="calendarDayEvents">
                    {dayEvents.slice(0, 3).map((event) => (
                      <span
                        key={event.id}
                        className={`calendarEventDot ${event.accent || "calendar"}`}
                      >
                        {event.title}
                      </span>
                    ))}

                    {dayEvents.length > 3 ? (
                      <small>+{dayEvents.length - 3} more</small>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="calendarSideStack">
          <div className="calendarPanel">
            <div className="calendarPanelHeader">
              <div>
                <p className="eyebrow">Selected Day</p>
                <h3>{formatDisplayDate(selectedDate)}</h3>
              </div>

              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={() => openNewEvent(selectedDate)}
              >
                <Plus size={15} />
                Add
              </button>
            </div>

            <div className="calendarAgendaList">
              {selectedDateEvents.length ? (
                selectedDateEvents.map((event) => (
                  <button
                    type="button"
                    key={event.id}
                    className="calendarAgendaItem"
                    onClick={() => openEditEvent(event)}
                  >
                    <span className={`calendarAgendaColor ${event.accent || "calendar"}`} />

                    <div>
                      <strong>{event.title}</strong>
                      <p>
                        {event.startTime
                          ? `${event.startTime}${event.endTime ? ` - ${event.endTime}` : ""}`
                          : event.type}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="dashboardEmpty">No events for this day.</p>
              )}
            </div>
          </div>

          <div className="calendarPanel">
            <div className="calendarPanelHeader">
              <div>
                <p className="eyebrow">Agenda</p>
                <h3>Upcoming</h3>
              </div>
            </div>

            <div className="calendarAgendaList">
              {upcomingEvents.length ? (
                upcomingEvents.map((event) => (
                  <button
                    type="button"
                    key={event.id}
                    className="calendarAgendaItem"
                    onClick={() => openEditEvent(event)}
                  >
                    <span className={`calendarAgendaColor ${event.accent || "calendar"}`} />

                    <div>
                      <strong>{event.title}</strong>
                      <p>
                        {formatDisplayDate(event.date)} • {formatDue(event.days)}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="dashboardEmpty">No upcoming events found.</p>
              )}
            </div>
          </div>
        </aside>
      </section>

      {selectedEvent && !isEventFormOpen ? (
        <div className="permitModalOverlay" role="dialog" aria-modal="true">
          <div className="permitModal calendarModal">
            <div className="permitModalHeader">
              <h3>{selectedEvent.title}</h3>

              <button type="button" onClick={() => setSelectedEvent(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="calendarEventDetail calendarEventDetailV2">
  <div className="calendarDetailGrid">
    <div>
      <span>Type</span>
      <strong>{selectedEvent.type}</strong>
    </div>

    <div>
      <span>Date</span>
      <strong>{formatDisplayDate(selectedEvent.date)}</strong>
    </div>

    {selectedEvent.startTime ? (
      <div>
        <span>Time</span>
        <strong>
          {selectedEvent.startTime}
          {selectedEvent.endTime ? ` - ${selectedEvent.endTime}` : ""}
        </strong>
      </div>
    ) : null}

    {selectedEvent.location ? (
      <div>
        <span>Location</span>
        <strong>{selectedEvent.location}</strong>
      </div>
    ) : null}
  </div>

  {selectedEvent.notes ? (
    <div className="calendarDetailNotes">
      <span>Notes</span>
      <p>{selectedEvent.notes}</p>
    </div>
  ) : null}

  <div className="calendarDetailActions">
    {selectedEvent.sourcePath ? (
      <Link to={selectedEvent.sourcePath} className="primaryButton compactPrimary">
        Open Source
      </Link>
    ) : null}

    {selectedEvent.source === "manual" ? (
      <button
        type="button"
        className="secondaryButton compactButton"
        onClick={() => {
          setEventForm({
            id: selectedEvent.id || "",
            title: selectedEvent.title || "",
            type: selectedEvent.type || "Market",
            date: selectedEvent.date || todayISO(),
            startTime: selectedEvent.startTime || "",
            endTime: selectedEvent.endTime || "",
            location: selectedEvent.location || "",
            notes: selectedEvent.notes || ""
          });
          setIsEventFormOpen(true);
        }}
      >
        Edit Event
      </button>
    ) : null}
  </div>
</div>
          </div>
        </div>
      ) : null}

      {isEventFormOpen ? (
        <div className="permitModalOverlay" role="dialog" aria-modal="true">
          <div className="permitModal calendarModal">
            <div className="permitModalHeader">
              <h3>{eventForm.id ? "Edit Calendar Event" : "Add Calendar Event"}</h3>

              <button type="button" onClick={() => setIsEventFormOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form className="permitModalForm" onSubmit={saveEvent}>
              <label className="permitFull">
                Title *
                <input
                  value={eventForm.title}
                  onChange={(event) =>
                    setEventForm((current) => ({
                      ...current,
                      title: event.target.value
                    }))
                  }
                  placeholder="e.g., Southland Market"
                />
              </label>

              <label>
                Type
                <select
                  value={eventForm.type}
                  onChange={(event) =>
                    setEventForm((current) => ({
                      ...current,
                      type: event.target.value
                    }))
                  }
                >
                  {eventTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label>
                Date *
                <input
                  type="date"
                  value={eventForm.date}
                  onChange={(event) =>
                    setEventForm((current) => ({
                      ...current,
                      date: event.target.value
                    }))
                  }
                />
              </label>

              <label>
                Start Time
                <input
                  type="time"
                  value={eventForm.startTime}
                  onChange={(event) =>
                    setEventForm((current) => ({
                      ...current,
                      startTime: event.target.value
                    }))
                  }
                />
              </label>

              <label>
                End Time
                <input
                  type="time"
                  value={eventForm.endTime}
                  onChange={(event) =>
                    setEventForm((current) => ({
                      ...current,
                      endTime: event.target.value
                    }))
                  }
                />
              </label>

              <label className="permitFull">
                Location
                <input
                  value={eventForm.location}
                  onChange={(event) =>
                    setEventForm((current) => ({
                      ...current,
                      location: event.target.value
                    }))
                  }
                  placeholder="Market location, venue, or delivery area"
                />
              </label>

              <label className="permitFull">
                Notes
                <textarea
                  value={eventForm.notes}
                  onChange={(event) =>
                    setEventForm((current) => ({
                      ...current,
                      notes: event.target.value
                    }))
                  }
                  placeholder="Optional details..."
                />
              </label>

              <div className="permitModalActions permitFull">
                {eventForm.id ? (
                  <button
                    className="secondaryButton compactButton dangerButton"
                    type="button"
                    onClick={() => removeEvent(eventForm.id)}
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                ) : null}

                <button
                  className="secondaryButton compactButton"
                  type="button"
                  onClick={() => setIsEventFormOpen(false)}
                >
                  Cancel
                </button>

                <button className="primaryButton compactPrimary" type="submit">
                  <Save size={15} />
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
