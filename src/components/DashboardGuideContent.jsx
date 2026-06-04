import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarDays,
  FileText,
  Folder,
  PackageCheck,
  Sprout,
  Users
} from "lucide-react";
import StatCard from "./StatCard.jsx";

export default function DashboardGuideContent() {
  return (
    <div className="moduleGuideContent dashboardGuideContent">
      <section className="moduleGuideIntro">
        <p>
          The Dashboard gives you a central snapshot of your business activity, saved records,
          upcoming deadlines, recent updates, and quick links into each Farmers Hub module.
        </p>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Overview</span>
          <h3>Start with the dashboard cards.</h3>
          <p>
            The stat cards summarize key activity across Farmers Hub, including customers,
            trial or account status, saved recipes, upcoming permits, and open checklist tasks.
          </p>
        </div>

        <div className="moduleGuidePreview moduleGuideStatPreview dashboardGuideStatPreview">
          <StatCard icon={Users} label="Customers" value="18" sub="saved contacts" accent="customers" />
          <StatCard icon={CalendarDays} label="Trial Days" value="12" sub="days remaining" accent="sourdough" />
          <StatCard icon={BookOpen} label="Saved Recipes" value="9" sub="Spice + Baking" accent="market" />
          <StatCard icon={FileText} label="Upcoming Permits" value="2" sub="next 60 days" accent="grant" />
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 1</span>
          <h3>Use Workspaces to open modules.</h3>
          <p>
            Jump back into the tools you use most, including recipes, pricing, market prep,
            orders, customers, inventory, planting, permits, lists, and calendar planning.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel dashboardGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Workspaces</p>
                <h4>Jump Back In</h4>
              </div>
              <Sprout size={20} />
            </div>

            <div className="guideSavedRecipe">
              <strong>Spice Kitchen</strong>
              <span>Build recipes, scale batches, and manage ingredients.</span>
            </div>

            <div className="guideSavedRecipe">
              <strong>Market Prep Planner</strong>
              <span>Plan packing quantities and prep for market day.</span>
            </div>

            <div className="guideSavedRecipe">
              <strong>Orders</strong>
              <span>Create customer orders and track fulfillment.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 2</span>
          <h3>Check upcoming deadlines.</h3>
          <p>
            The deadline panel pulls near-term permit, grant, license, insurance, and renewal
            dates so important records are easier to keep in front of you.
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
              <strong>Home-Based Processor Permit</strong>
              <span>Permit • Due in 18 days • Mar 31</span>
            </div>

            <div className="guideSavedRecipe">
              <strong>Local Food Innovation Grant</strong>
              <span>Grant • Due in 42 days • May 30</span>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 3</span>
          <h3>Review recent activity.</h3>
          <p>
            Recent Activity helps you quickly see what has been updated, such as recipes,
            permit records, lists, and customer profiles.
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
              <strong>Updated recipe: Garlic Miso Seasoning</strong>
              <span>Spice Kitchen • 2h ago</span>
            </div>

            <div className="guideSavedRecipe">
              <strong>Updated customer: Jordan Miller</strong>
              <span>Customers • Yesterday</span>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 4</span>
          <h3>Manage account and subscription status.</h3>
          <p>
            Use the account area to manage setup, subscription status, plan options,
            and account settings when you need to make changes.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel dashboardGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Account</p>
                <h4>Subscription Tools</h4>
              </div>
              <PackageCheck size={20} />
            </div>

            <div className="guideMiniGrid">
              <div>
                <span>Status</span>
                <strong>Trial</strong>
              </div>
              <div>
                <span>Plan</span>
                <strong>Full access</strong>
              </div>
              <div>
                <span>Action</span>
                <strong>Manage Account</strong>
              </div>
              <div>
                <span>Upgrade</span>
                <strong>View Plans</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="moduleGuideTip dashboardGuideTip">
        <ArrowRight size={18} />
        <p>
          Tip: the Dashboard becomes more useful as you add records in each module. Saved recipes,
          customers, permits, and lists all help create a better command center.
        </p>
      </div>
    </div>
  );
}
