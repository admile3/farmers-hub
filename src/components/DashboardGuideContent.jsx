import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  Folder,
  PackageCheck,
  Sprout,
  Users
} from "lucide-react";
import StatCard from "../components/StatCard.jsx";
import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import DashboardGuideContent from "../components/DashboardGuideContent.jsx";

export default function DashboardGuideContent() {
  return (
    <div className="moduleGuideContent dashboardGuideContent">
      <section className="moduleGuideIntro">
        <p>
          The Dashboard is your Farmers Hub command center. It gives you a quick view of business activity,
          open work, upcoming deadlines, recent updates, and every module you can jump into.
        </p>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Overview</span>
          <h3>Start with the dashboard cards.</h3>
          <p>
            These cards summarize the most important activity across Farmers Hub, including customers,
            recipes, upcoming permit deadlines, open tasks, and account status.
          </p>
        </div>

        <div className="moduleGuidePreview moduleGuideStatPreview dashboardGuideStatPreview">
          <StatCard icon={Users} label="Customers" value="18" sub="saved contacts" accent="customers" />
          <StatCard icon={BookOpen} label="Saved Recipes" value="12" sub="spice + baking" accent="market" />
          <StatCard icon={FileText} label="Upcoming Permits" value="3" sub="next 60 days" accent="grant" />
          <StatCard icon={Folder} label="Open Tasks" value="9" sub="unchecked list items" accent="lists" />
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 1</span>
          <h3>Use the hero as your account snapshot.</h3>
          <p>
            The top section welcomes you back, summarizes what Farmers Hub helps manage, and gives you
            a quick path to account settings or subscription options.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel dashboardGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Command Center</p>
                <h4>Welcome back, farmer</h4>
              </div>
              <Sprout size={20} />
            </div>

            <div className="guideMiniGrid">
              <div>
                <span>Account</span>
                <strong>Active</strong>
              </div>
              <div>
                <span>Access</span>
                <strong>All modules</strong>
              </div>
            </div>

            <button className="guideMockButton" type="button">
              Manage Account
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 2</span>
          <h3>Jump into a workspace.</h3>
          <p>
            The Workspaces list gives you fast access to every module. Open the area you need,
            whether you are planning production, pricing products, managing customers, or checking inventory.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel dashboardGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Workspaces</p>
                <h4>Jump Back In</h4>
              </div>
              <ClipboardList size={20} />
            </div>

            <div className="dashboardGuideWorkspaceList">
              <div>
                <span className="dashboardGuideDot spice"><PackageCheck size={14} /></span>
                <strong>Spice Kitchen</strong>
                <small>Recipes, batches, and costing</small>
              </div>

              <div>
                <span className="dashboardGuideDot market"><ClipboardList size={14} /></span>
                <strong>Market Prep Planner</strong>
                <small>Pack lists and market planning</small>
              </div>

              <div>
                <span className="dashboardGuideDot customers"><Users size={14} /></span>
                <strong>Customers</strong>
                <small>CRM, notes, and follow-ups</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 3</span>
          <h3>Watch upcoming deadlines.</h3>
          <p>
            The Dashboard pulls permit, grant, license, insurance, and renewal deadlines into one
            upcoming list so you can see what needs attention soon.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel dashboardGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Deadlines</p>
                <h4>Upcoming</h4>
              </div>
              <CalendarDays size={20} />
            </div>

            <div className="guideSavedRecipe">
              <strong>Home-Based Processor Renewal</strong>
              <span>Permit & Grant Tracker • Due in 21 days</span>
            </div>

            <div className="guideSavedRecipe">
              <strong>Market Application</strong>
              <span>Permit & Grant Tracker • Due in 45 days</span>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 4</span>
          <h3>Review recent activity.</h3>
          <p>
            Recent Activity shows saved updates across modules, helping you pick up where you left off
            without searching through every workspace.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel dashboardGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Activity</p>
                <h4>Recent Updates</h4>
              </div>
              <Activity size={20} />
            </div>

            <div className="guideSavedRecipe">
              <strong>Updated recipe: Garlic Miso</strong>
              <span>Spice Kitchen • 2h ago</span>
            </div>

            <div className="guideSavedRecipe">
              <strong>Updated customer: Chef Jordan</strong>
              <span>Customers • Yesterday</span>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 5</span>
          <h3>Keep the dashboard useful.</h3>
          <p>
            The dashboard becomes more helpful as your modules fill with real data. Keep customers,
            recipes, lists, permits, and records updated so the summary cards stay accurate.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel dashboardGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Dashboard Sources</p>
                <h4>Connected Module Data</h4>
              </div>
              <BookOpen size={20} />
            </div>

            <div className="guideMiniGrid three">
              <div>
                <span>Recipes</span>
                <strong>Spice + Baking</strong>
              </div>
              <div>
                <span>Deadlines</span>
                <strong>Permits</strong>
              </div>
              <div>
                <span>Tasks</span>
                <strong>Lists</strong>
              </div>
              <div>
                <span>Contacts</span>
                <strong>Customers</strong>
              </div>
              <div>
                <span>Activity</span>
                <strong>Recent Saves</strong>
              </div>
              <div>
                <span>Account</span>
                <strong>Subscription</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="moduleGuideTip dashboardGuideTip">
        <Sprout size={18} />
        <p>
          Tip: the Dashboard is only as good as the data in your modules. Keeping records current makes
          the command center more useful every time you sign in.
        </p>
      </div>
    </div>
  );
}
