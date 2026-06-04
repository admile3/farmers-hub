import {
  CalendarDays,
  Clock,
  Eye,
  Link as LinkIcon,
  MousePointerClick,
  Plus,
  Save
} from "lucide-react";
import StatCard from "./StatCard.jsx";

export default function CalendarGuideContent() {
  return (
    <div className="moduleGuideContent">
      <section className="moduleGuideIntro">
        <p>
          Calendar pulls dated work from other Farmers Hub modules and combines it
          with your own manually added events, giving you one place to track markets,
          deadlines, production days, deliveries, reminders, and meetings.
        </p>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Overview</span>
          <h3>Start with the calendar dashboard cards.</h3>
          <p>
            These cards show how many items are on the current month, how many are
            coming up, how many came from other modules, and how many were added manually.
          </p>
        </div>

        <div className="moduleGuidePreview moduleGuideStatPreview">
          <StatCard icon={CalendarDays} label="This Month" value="12" sub="calendar items" accent="calendar" />
          <StatCard icon={Clock} label="Upcoming" value="8" sub="next visible events" accent="sourdough" />
          <StatCard icon={LinkIcon} label="Imported" value="9" sub="from other modules" accent="market" />
          <StatCard icon={Plus} label="Manual" value="3" sub="custom calendar events" accent="pricing" />
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 1</span>
          <h3>Choose the calendar view.</h3>
          <p>
            Use Day, Week, or Month view depending on how much detail you want to see.
            Month is best for the big picture, while Day and Week are better for planning.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Month View</p>
                <h4>June 2026</h4>
              </div>

              <div className="calendarViewToggle">
                <button type="button">Day</button>
                <button type="button">Week</button>
                <button className="selected" type="button">Month</button>
              </div>
            </div>

            <div className="guideMiniGrid three">
              <div>
                <span>Day</span>
                <strong>Focused daily schedule</strong>
              </div>
              <div>
                <span>Week</span>
                <strong>Short-term planning</strong>
              </div>
              <div>
                <span>Month</span>
                <strong>Big-picture calendar</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 2</span>
          <h3>Review imported events.</h3>
          <p>
            Calendar automatically brings in dated items from Market Prep, Permit and
            Grant Tracker, and Baking Planner when those modules have saved dates.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Imported Events</p>
                <h4>Connected Module Items</h4>
              </div>

              <LinkIcon size={18} />
            </div>

            <div className="guideRecipeRows">
              <div className="guideRecipeHeader">
                <span>Event</span>
                <span>Source</span>
              </div>
              <div>
                <strong>Southland Market Plan</strong>
                <span>Market Prep</span>
              </div>
              <div>
                <strong>Health Permit Renewal</strong>
                <span>Permits</span>
              </div>
              <div>
                <strong>Baking Production Day</strong>
                <span>Baking Planner</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 3</span>
          <h3>Add your own calendar events.</h3>
          <p>
            Click Add Event to create a manual event, such as a delivery, meeting,
            reminder, production task, or vendor deadline that does not come from
            another module.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Manual Event</p>
                <h4>Add Calendar Event</h4>
              </div>

              <button className="guideMockButton" type="button">
                <Plus size={14} />
                Add Event
              </button>
            </div>

            <div className="guideMiniGrid">
              <div>
                <span>Title</span>
                <strong>Restaurant Delivery</strong>
              </div>
              <div>
                <span>Type</span>
                <strong>Delivery</strong>
              </div>
              <div>
                <span>Date</span>
                <strong>Jun 18, 2026</strong>
              </div>
              <div>
                <span>Time</span>
                <strong>10:00 AM</strong>
              </div>
            </div>

            <button className="guideMockButton" type="button">
              <Save size={14} />
              Save Event
            </button>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 4</span>
          <h3>Open events for more detail.</h3>
          <p>
            Click an event on the calendar, selected day panel, or upcoming agenda
            to view details. Imported events can link back to their source module.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Event Detail</p>
                <h4>Health Permit Renewal</h4>
              </div>

              <Eye size={18} />
            </div>

            <div className="guideMiniGrid">
              <div>
                <span>Type</span>
                <strong>Permit</strong>
              </div>
              <div>
                <span>Date</span>
                <strong>Jul 1, 2026</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>Renewal Needed</strong>
              </div>
              <div>
                <span>Source</span>
                <strong>Permit Tracker</strong>
              </div>
            </div>

            <button className="guideMockButton secondary" type="button">
              <MousePointerClick size={14} />
              Open Source
            </button>
          </div>
        </div>
      </section>

      <div className="moduleGuideTip">
        <CalendarDays size={18} />
        <p>
          Tip: double-click a day on the calendar to quickly start a new event
          for that date.
        </p>
      </div>

      <div className="moduleGuideTip">
        <LinkIcon size={18} />
        <p>
          Imported events are managed in their original modules. Use Open Source
          to update the related market plan, permit, grant, or baking schedule.
        </p>
      </div>
    </div>
  );
}
