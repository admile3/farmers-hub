import {
  Calculator,
  DollarSign,
  Package,
  Plus,
  Save,
  Search,
  Tag,
  Target
} from "lucide-react";
import StatCard from "./StatCard.jsx";

export default function PricingGuideContent() {
  return (
    <div className="moduleGuideContent pricingGuideContent">
      <section className="moduleGuideIntro">
        <p>
          Products & Pricing helps you manage your product catalog, calculate true cost per unit,
          set retail and wholesale prices, and keep pricing consistent across Farmers Hub.
        </p>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 1</span>
          <h3>Build your Product Directory.</h3>
          <p>
            Create products manually or pull products that were generated in other Farmers Hub modules.
            Products created elsewhere can still be priced and analyzed here.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Directory</p>
                <h4>Product Directory</h4>
              </div>

              <button className="guideMockButton" type="button">
                <Plus size={14} />
                New Product
              </button>
            </div>

            <div className="guideSearchMock pricingGuideSearchMock">
              <Search size={14} />
              <span>Search products...</span>
            </div>

            <div className="pricingGuideProductList">
              <div className="pricingGuideProductCard">
                <div>
                  <strong>Garlic Miso Seasoning</strong>
                  <span>Spices • 1 oz pouch</span>
                </div>
                <div className="pricingGuideProductMetrics">
                  <span>Retail $12.00</span>
                  <span>Margin 82.5%</span>
                </div>
              </div>

              <div className="pricingGuideProductCard">
                <div>
                  <strong>Sourdough Loaf</strong>
                  <span>Bread • each</span>
                </div>
                <div className="pricingGuideProductMetrics">
                  <span>Retail $9.00</span>
                  <span>Margin 71.0%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 2</span>
          <h3>Load a product and review details.</h3>
          <p>
            Select a product to review or edit its name, category, SKU, status, unit label,
            description, and notes. Generated products stay connected to their source module.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Product</p>
                <h4>Product Details</h4>
              </div>

              <button className="guideMockButton" type="button">
                <Save size={14} />
                Save Product
              </button>
            </div>

            <div className="guideMiniGrid">
              <div>
                <span>Product Name</span>
                <strong>Garlic Miso Seasoning</strong>
              </div>
              <div>
                <span>SKU</span>
                <strong>GM-001</strong>
              </div>
              <div>
                <span>Category</span>
                <strong>Spices</strong>
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
          <span className="moduleGuideStepNumber">Step 3</span>
          <h3>Select package variants.</h3>
          <p>
            Some products may have multiple package sizes or variants. Select the variant you want
            to price and analyze. Each variant can have its own cost, retail price, wholesale price,
            and profit margin.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Selected</p>
                <h4>Garlic Miso Seasoning</h4>
              </div>
              <Tag size={20} />
            </div>

            <div className="pricingGuideVariantStack">
              <div className="pricingGuideVariantCard">
                <strong>0.2 oz Pouch</strong>
                <span>Sample size • retail $4.00</span>
              </div>
              <div className="pricingGuideVariantCard selected">
                <strong>1 oz Pouch</strong>
                <span>Standard size • retail $12.00</span>
              </div>
              <div className="pricingGuideVariantCard">
                <strong>1 lb Bulk Bag</strong>
                <span>Wholesale size • quote as needed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 4</span>
          <h3>Enter production costs.</h3>
          <p>
            Add ingredient or material costs, packaging costs, labor, and overhead expenses.
            The calculator uses these values to determine your true production cost per unit.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Pricing</p>
                <h4>Pricing Analysis</h4>
              </div>
              <Calculator size={20} />
            </div>

            <div className="guideMiniGrid three">
              <div>
                <span>Material Cost</span>
                <strong>$32.00</strong>
              </div>
              <div>
                <span>Batch Units</span>
                <strong>24</strong>
              </div>
              <div>
                <span>Packaging</span>
                <strong>$0.35</strong>
              </div>
              <div>
                <span>Labor Hours</span>
                <strong>1.5</strong>
              </div>
              <div>
                <span>Labor Rate</span>
                <strong>$18.00</strong>
              </div>
              <div>
                <span>Overhead</span>
                <strong>$6.00</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 5</span>
          <h3>Review suggested pricing.</h3>
          <p>
            The module calculates cost per unit, suggested retail price, suggested wholesale price,
            retail margin, and wholesale margin before you commit to a price.
          </p>
        </div>

        <div className="moduleGuidePreview moduleGuideStatPreview pricingGuideStatPreview">
          <StatCard icon={DollarSign} label="Retail" value="$12.00" sub="per 1 oz pouch" accent="pricing" />
          <StatCard icon={DollarSign} label="Wholesale" value="$7.50" sub="per 1 oz pouch" accent="sourdough" />
          <StatCard icon={Target} label="Cost" value="$2.10" sub="estimated per unit" accent="market" />
          <StatCard icon={Package} label="Suggested Retail" value="$7.00" sub="70% target" accent="spice" />
          <StatCard icon={Package} label="Suggested Wholesale" value="$4.20" sub="50% target" accent="pricing" />
          <StatCard icon={Calculator} label="Retail Margin" value="82.5%" sub="$9.90 profit" accent="market" />
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 6</span>
          <h3>Save and manage products.</h3>
          <p>
            Save products to your directory, search existing products, filter by category or status,
            and update pricing as costs change.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Manage</p>
                <h4>Saved Products</h4>
              </div>

              <button className="guideMockButton" type="button">
                <Save size={14} />
                Save Product
              </button>
            </div>

            <div className="pricingGuideManageGrid">
              <div className="pricingGuideManageCard">
                <Search size={16} />
                <strong>Search</strong>
                <span>Find products by name, SKU, category, or notes.</span>
              </div>
              <div className="pricingGuideManageCard">
                <Package size={16} />
                <strong>Filter</strong>
                <span>Sort by category, status, or product type.</span>
              </div>
              <div className="pricingGuideManageCard">
                <DollarSign size={16} />
                <strong>Update</strong>
                <span>Adjust prices when costs or packaging change.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="moduleGuideTip">
        <Tag size={18} />
        <p>
          Tip: keep products linked to their source modules whenever possible so recipes,
          package sizes, costs, orders, and inventory records stay connected across Farmers Hub.
        </p>
      </div>
    </div>
  );
}
