import {
  BarChart3,
  CalendarDays,
  DollarSign,
  FileCheck2,
  PackagePlus,
  Receipt,
  ShoppingCart,
  SquareStack,
  TrendingUp
} from "lucide-react";

export default function SalesGuideContent() {
  return (
    <div className="moduleGuideContent salesGuideContent">
      <section className="moduleGuideIntro">
        <p>
          Sales helps you track daily revenue, product-based sales, market totals,
          completed order revenue, and sales trends across your farm business.
        </p>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 1</span>
          <h3>Add a product-based sale.</h3>
          <p>
            Build a sale from products already saved in your Product Directory,
            or quick-add a new product while entering the sale.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">New Sale</p>
                <h4>Line Item Sale</h4>
              </div>
              <ShoppingCart size={20} />
            </div>

            <div className="guideMiniGrid two">
              <div>
                <strong>Sunflower Shoots</strong>
                <span>2 × $7.00</span>
              </div>
              <div>
                <strong>Basil Salt</strong>
                <span>1 × $12.00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 2</span>
          <h3>Use daily totals when you need speed.</h3>
          <p>
            For busy market days, enter one overall daily sales total instead of
            logging every individual customer transaction.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Daily Total</p>
                <h4>Saturday Market</h4>
              </div>
              <CalendarDays size={20} />
            </div>

            <div className="guideMiniGrid three">
              <div>
                <span>Gross</span>
                <strong>$725.00</strong>
              </div>
              <div>
                <span>Fees</span>
                <strong>$22.00</strong>
              </div>
              <div>
                <span>Net</span>
                <strong>$703.00</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 3</span>
          <h3>Convert completed orders into sales.</h3>
          <p>
            When an order is completed in the Orders module, it can become a
            sales record without needing to be entered twice.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Order Source</p>
                <h4>Completed Order</h4>
              </div>
              <FileCheck2 size={20} />
            </div>

            <div className="guideSavedRecipe salesGuideOrderPreview">
              <strong>ORD-000124</strong>
              <span>Converted to sale, $86.50</span>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 4</span>
          <h3>Watch your sales cards.</h3>
          <p>
            Track total sales, net sales, average sale, best sales day, and sales
            for the current month.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniGrid two salesGuideStatPreview">
              <div>
                <DollarSign size={16} />
                <span>Net Sales</span>
                <strong>$3,428</strong>
              </div>
              <div>
                <TrendingUp size={16} />
                <span>Best Day</span>
                <strong>$725</strong>
              </div>
              <div>
                <Receipt size={16} />
                <span>Sales</span>
                <strong>38</strong>
              </div>
              <div>
                <BarChart3 size={16} />
                <span>Avg Sale</span>
                <strong>$90</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 5</span>
          <h3>Review trends by timeframe.</h3>
          <p>
            Use the chart to compare daily, weekly, or monthly revenue and spot
            which sales periods are performing best.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Sales Trend</p>
                <h4>Last 7 Days</h4>
              </div>
              <BarChart3 size={20} />
            </div>

            <div className="salesGuideChartMock">
              <span style={{ height: "35%" }} />
              <span style={{ height: "55%" }} />
              <span style={{ height: "42%" }} />
              <span style={{ height: "72%" }} />
              <span style={{ height: "48%" }} />
              <span style={{ height: "88%" }} />
              <span style={{ height: "60%" }} />
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 6</span>
          <h3>Use Square imports later.</h3>
          <p>
            Square integration can be added as a future upgrade to pull in daily,
            weekly, or monthly sales totals once the core Sales records are working.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Coming Soon</p>
                <h4>Square Import</h4>
              </div>
              <SquareStack size={20} />
            </div>

            <div className="guideSavedRecipe salesGuideOrderPreview">
              <strong>Import daily totals</strong>
              <span>Match Square sales to Farmers Hub reports.</span>
            </div>
          </div>
        </div>
      </section>

      <div className="moduleGuideTip">
        <PackagePlus size={18} />
        <p>
          Tip: use detailed product sales when you want product performance data,
          and use daily totals when you just need quick revenue tracking.
        </p>
      </div>
    </div>
  );
}
