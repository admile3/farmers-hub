import {
  ClipboardList,
  DollarSign,
  Package,
  Plus,
  Search,
  Truck,
  Users
} from "lucide-react";

import StatusPill from "./StatusPill.jsx";

export default function OrdersGuideContent() {
  return (
    <div className="moduleGuideContent ordersGuideContent">
      <section className="moduleGuideIntro">
        <p>
          Orders helps you create customer orders, connect them to customer records,
          add products or custom line items, and track fulfillment from request to
          completion.
        </p>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 1</span>
          <h3>Start a new order.</h3>
          <p>
            Create a new order and let the system assign the next order number. Set
            the order date, due date, status, fulfillment type, and retail or
            wholesale pricing.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel ordersGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Editor</p>
                <h4>New Order</h4>
              </div>
              <ClipboardList size={20} />
            </div>

            <div className="ordersGuideFieldGrid">
              <div>
                <span>Order #</span>
                <strong>ORD-000014</strong>
              </div>
              <div>
                <span>Status</span>
                <StatusPill label="Draft" variant="neutral" />
              </div>
              <div>
                <span>Pricing</span>
                <strong>Retail</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 2</span>
          <h3>Add customer info.</h3>
          <p>
            Choose a saved customer, quick-add a new customer to Customers, or enter
            a one-time customer just for this order.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel ordersGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Customer</p>
                <h4>Customer Info</h4>
              </div>
              <Users size={20} />
            </div>

            <div className="ordersGuideChoiceGrid">
              <span className="selected">Saved customer</span>
              <span>Quick add</span>
              <span>One-time</span>
            </div>

            <div className="ordersGuideFieldGrid two">
              <div>
                <span>Name</span>
                <strong>Jordan Miller</strong>
              </div>
              <div>
                <span>Contact</span>
                <strong>Email</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 3</span>
          <h3>Add line items.</h3>
          <p>
            Build the order using products you&apos;ve created elsewhere in Farmers
            Hub. Select products from your product catalog or manually enter custom
            items when needed. Product pricing, package sizes, and product details
            can be pulled directly into the order.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel ordersGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Products</p>
                <h4>Line Items</h4>
              </div>
              <Package size={20} />
            </div>

            <div className="ordersGuideLineRows">
              <div>
                <strong>Country Sourdough</strong>
                <span>$24.00</span>
              </div>
              <div>
                <strong>Custom add-on</strong>
                <span>$8.00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 4</span>
          <h3>Review order totals.</h3>
          <p>
            Add discounts, service or delivery fees, tax rate, and deposit paid. The
            order summary calculates subtotal, tax, total, and balance due.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel ordersGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Totals</p>
                <h4>Order Summary</h4>
              </div>
              <DollarSign size={20} />
            </div>

            <div className="ordersGuideFieldGrid two">
              <div>
                <span>Subtotal</span>
                <strong>$32.00</strong>
              </div>
              <div>
                <span>Balance Due</span>
                <strong>$32.00</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 5</span>
          <h3>Track order status.</h3>
          <p>
            Move orders from Draft to Confirmed, In Production, Ready, Completed,
            or Cancelled so the dashboard reflects what needs attention.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel ordersGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Fulfillment</p>
                <h4>Status Flow</h4>
              </div>
              <Truck size={20} />
            </div>

            <div className="ordersGuideStatusFlow">
              <StatusPill label="Draft" variant="neutral" />
              <StatusPill label="Confirmed" variant="success" />
              <StatusPill label="In Production" variant="warning" />
              <StatusPill label="Ready" variant="primary" />
              <StatusPill label="Completed" variant="success" />
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 6</span>
          <h3>Use the order directory.</h3>
          <p>
            Search and filter orders by customer, product, order number, due date,
            or status. Open any order to update details or delete it.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel ordersGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Directory</p>
                <h4>Order Directory</h4>
              </div>
              <Search size={20} />
            </div>

            <div className="ordersGuideDirectoryRows">
              <div>
                <strong>ORD-000014</strong>
                <span>Jordan Miller</span>
                <StatusPill label="Ready" variant="primary" />
                <b>$32.00</b>
              </div>
              <div>
                <strong>ORD-000015</strong>
                <span>One-time customer</span>
                <StatusPill label="Draft" variant="neutral" />
                <b>$18.00</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="moduleGuideTip ordersGuideTip">
        <Plus size={18} />
        <p>
          Tip: use saved customer profiles whenever possible so order details stay
          connected to your CRM and repeat customers are easier to manage.
        </p>
      </div>
    </div>
  );
}
