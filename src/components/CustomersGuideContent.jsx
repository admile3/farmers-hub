import {
  CalendarClock,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  UserRound,
  Users
} from "lucide-react";

export default function CustomersGuideContent() {
  return (
    <div className="moduleGuideContent customersGuideContent">
      <section className="moduleGuideIntro">
        <p>
          Customers helps you manage contacts, leads, wholesale accounts, follow-up dates,
          product interests, and notes that can support future orders.
        </p>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 1</span>
          <h3>Add a customer.</h3>
          <p>
            Create a record for retail customers, market regulars, wholesale buyers,
            restaurants, event clients, custom orders, leads, or subscription customers.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Customer record</p>
                <h4>Add Customer</h4>
              </div>
              <Plus size={20} />
            </div>

            <div className="guideMiniGrid">
              <div>
                <span>Name</span>
                <strong>Chef Jordan</strong>
              </div>
              <div>
                <span>Type</span>
                <strong>Restaurant</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>Lead</strong>
              </div>
              <div>
                <span>Source</span>
                <strong>Farmers Market</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 2</span>
          <h3>Fill out contact details.</h3>
          <p>
            Add business name, email, phone, preferred contact method, customer type,
            status, and where the customer came from.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Contact</p>
                <h4>How to reach them</h4>
              </div>
              <Mail size={20} />
            </div>

            <div className="guideRecipeRows customersGuideRows">
              <div className="guideRecipeHeader">
                <span>Field</span>
                <span>Example</span>
              </div>
              <div>
                <strong>Preferred Contact</strong>
                <span>Email</span>
              </div>
              <div>
                <strong>Status</strong>
                <span>Follow-up</span>
              </div>
              <div>
                <strong>Customer Type</strong>
                <span>Wholesale</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 3</span>
          <h3>Track interests and notes.</h3>
          <p>
            Use product interests and notes to remember what they buy, what they asked
            about, preferences, past conversations, or special order details.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Notes</p>
                <h4>Customer context</h4>
              </div>
              <MessageSquare size={20} />
            </div>

            <div className="guideSavedRecipe">
              <strong>Product Interests</strong>
              <span>Pea shoots, spicy salad mix, 1 oz seasoning pouches</span>
            </div>

            <div className="guideSavedRecipe">
              <strong>Notes</strong>
              <span>Prefers text follow-ups and usually buys for weekend events.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 4</span>
          <h3>Set follow-up dates.</h3>
          <p>
            Add last contact and follow-up dates so the dashboard can surface upcoming
            and overdue customer reminders.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Follow-ups</p>
                <h4>Reminder tracking</h4>
              </div>
              <CalendarClock size={20} />
            </div>

            <div className="guideMiniGrid">
              <div>
                <span>Last Contact</span>
                <strong>Jun 1, 2026</strong>
              </div>
              <div>
                <span>Follow-up</span>
                <strong>Jun 8, 2026</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 5</span>
          <h3>Search and filter the directory.</h3>
          <p>
            Use search, customer type, and status filters to quickly find customers,
            leads, wholesale accounts, or records needing follow-up.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Directory</p>
                <h4>Saved Customers</h4>
              </div>
              <Search size={20} />
            </div>

            <div className="guideMiniGrid three">
              <div>
                <span>Search</span>
                <strong>spicy mix</strong>
              </div>
              <div>
                <span>Type</span>
                <strong>Wholesale</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>Active</strong>
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
            Open any customer from the directory to edit contact details, update status,
            add notes, change follow-up dates, or remove the record.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Actions</p>
                <h4>Edit customer profiles</h4>
              </div>
              <Pencil size={20} />
            </div>

            <div className="guideSavedRecipe">
              <strong>Saved Customer Row</strong>
              <span>Open, update, save, or delete a customer record from the directory.</span>
            </div>
          </div>
        </div>
      </section>

      <div className="moduleGuideTip customersGuideTip">
        <Users size={18} />
        <p>
          Tip: keep customer profiles current because their details can also help fill in
          customer information in the Orders module.
        </p>
      </div>

      <div className="moduleGuideTip customersGuideSecondaryTip">
        <UserRound size={18} />
        <p>
          A useful CRM is more than a contact list. Follow-up dates, product interests,
          and notes are what make it actionable.
        </p>
      </div>
    </div>
  );
}
