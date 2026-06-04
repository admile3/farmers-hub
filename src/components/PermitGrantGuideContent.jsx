import {
  AlertTriangle,
  CalendarDays,
  ExternalLink,
  FileText,
  Filter,
  Plus,
  Save,
  ShieldCheck,
  Upload
} from "lucide-react";

export default function PermitGrantGuideContent() {
  return (
    <div className="moduleGuideContent permitGrantGuideContent">
      <section className="moduleGuideIntro">
        <p>
          Permits & Grants helps you track permits, grants, licenses, insurance,
          renewals, deadlines, documents, and application links in one organized workspace.
        </p>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 1</span>
          <h3>Add a record.</h3>
          <p>
            Create a record for a permit, grant, license, certification, insurance policy,
            tax filing, market application, or other important requirement.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel permitGrantGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Record</p>
                <h4>New Permit or Grant</h4>
              </div>
              <FileText size={20} />
            </div>

            <div className="guideMiniGrid three">
              <div>
                <span>Type</span>
                <strong>Permit</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>In Progress</strong>
              </div>
              <div>
                <span>Priority</span>
                <strong>High</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 2</span>
          <h3>Enter status and deadline details.</h3>
          <p>
            Track the agency, status, priority, issue date, due date, renewal date,
            submitted date, approved date, fee, and reminder window.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel permitGrantGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Deadlines</p>
                <h4>Renewal Details</h4>
              </div>
              <CalendarDays size={20} />
            </div>

            <div className="guideMiniGrid">
              <div>
                <span>Agency</span>
                <strong>State Department</strong>
              </div>
              <div>
                <span>Renewal</span>
                <strong>Mar 31, 2026</strong>
              </div>
              <div>
                <span>Reminder</span>
                <strong>30 days</strong>
              </div>
              <div>
                <span>Fee</span>
                <strong>$50.00</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 3</span>
          <h3>Watch deadline status.</h3>
          <p>
            Use the dashboard cards to monitor active records, expiring items, expired records,
            missing documents, and upcoming grant deadlines.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel permitGrantGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Dashboard</p>
                <h4>Status Snapshot</h4>
              </div>
              <ShieldCheck size={20} />
            </div>

            <div className="guideMiniGrid three">
              <div>
                <span>Active</span>
                <strong>4</strong>
              </div>
              <div>
                <span>Expiring</span>
                <strong>2</strong>
              </div>
              <div>
                <span>Missing Docs</span>
                <strong>1</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 4</span>
          <h3>Attach documents and links.</h3>
          <p>
            Add application links, portal links, uploaded document names, or reference files
            so everything related to the record stays easy to find.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel permitGrantGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Documents</p>
                <h4>Files and Links</h4>
              </div>
              <Upload size={20} />
            </div>

            <div className="guideSavedRecipe">
              <strong>Home-Based Processor Permit.pdf</strong>
              <span>Uploaded document attached to record</span>
            </div>

            <div className="guideSavedRecipe">
              <strong>Application Portal</strong>
              <span>Saved reference link for renewal</span>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 5</span>
          <h3>Search and filter records.</h3>
          <p>
            Use search, type filters, status filters, and record filters to quickly find
            permits, grants, missing documents, expired records, or upcoming renewals.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel permitGrantGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Filters</p>
                <h4>Find Records</h4>
              </div>
              <Filter size={20} />
            </div>

            <div className="guideMiniGrid three">
              <div>
                <span>Type</span>
                <strong>Grant</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>Submitted</strong>
              </div>
              <div>
                <span>Record</span>
                <strong>Missing Docs</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 6</span>
          <h3>Update or delete records.</h3>
          <p>
            Open any record to update status, add notes, adjust renewal details,
            save changes, or remove outdated records.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel permitGrantGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Manage</p>
                <h4>Record Actions</h4>
              </div>
              <Save size={20} />
            </div>

            <div className="guideRecipeRows">
              <div className="guideRecipeHeader">
                <span>Action</span>
                <span>Use</span>
              </div>
              <div>
                <strong>Edit</strong>
                <span>Update details</span>
              </div>
              <div>
                <strong>Open Link</strong>
                <span>Visit portal</span>
              </div>
              <div>
                <strong>Delete</strong>
                <span>Remove old records</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="moduleGuideTip permitGrantGuideTip">
        <AlertTriangle size={18} />
        <p>
          Tip: keep renewal dates and document fields updated so this module works as a compliance reminder system, not just a file list.
        </p>
      </div>
    </div>
  );
}
