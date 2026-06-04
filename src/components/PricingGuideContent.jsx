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
          <div className="guideMiniPanel pricingGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Directory</p>
                <h4>Product Directory</h4>
              </div>
              <Package size={20} />
            </div>

            <div className="guideSearchMock pricingGuideSearchMock">
              <Search size={14} />
              <span>Search products...</span>
            </div>

            <div className="guideSavedRecipe">
              <strong>Garlic Miso Seasoning</strong>
              <span>Spices • 1 oz pouch • Retail $12.00</span>
            </div>

            <div className="guideSavedRecipe">
              <strong>Country Sourdough</strong>
              <span>Bread • each • Retail $9.00</span>
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
          <div className="guideMiniPanel pricingGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Product</p>
                <h4>Product Details</h4>
              </div>
              <Tag size={20} />
            </div>

            <div className="guideMiniGrid three">
              <div>
                <span>Name</span>
                <strong>Garlic Miso</strong>
              </div>
              <div>
                <span>Category</span>
                <strong>Spices</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>Active</strong>
              </div>
              <div>
                <span>SKU</span>
                <strong>GM-001</strong>
              </div>
              <div>
                <span>Unit</span>
                <strong>1 oz pouch</strong>
              </div>
              <div>
                <span>Source</span>
                <strong>Linked</strong>
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
          <div className="guideMiniPanel pricingGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Variants</p>
                <h4>Package Sizes</h4>
              </div>
              <Package size={20} />
            </div>

            <div className="pricingGuideChoiceGrid">
              <span>0.2 oz pouch</span>
              <span className="selected">1 oz pouch</span>
              <span>1 lb bulk bag</span>
            </div>

            <div className="guideSavedRecipe">
              <strong>Selected Variant</strong>
              <span>1 oz pouch • Retail $12.00 • Wholesale $7.50</span>
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
          <div className="guideMiniPanel pricingGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Pricing</p>
                <h4>Cost Inputs</h4>
              </div>
              <Calculator size={20} />
            </div>

            <div className="guideMiniGrid three">
              <div>
                <span>Materials</span>
                <strong>$32.00</strong>
              </div>
              <div>
                <span>Units</span>
                <strong>24</strong>
              </div>
              <div>
                <span>Packaging</span>
                <strong>$0.35</strong>
              </div>
              <div>
                <span>Labor</span>
                <strong>1.5 hr</strong>
              </div>
              <div>
                <span>Rate</span>
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

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel pricingGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Analysis</p>
                <h4>Pricing Summary</h4>
              </div>
              <Target size={20} />
            </div>

            <div className="guideMiniGrid three">
              <div>
                <span>Cost</span>
                <strong>$2.10</strong>
              </div>
              <div>
                <span>Retail</span>
                <strong>$12.00</strong>
              </div>
              <div>
                <span>Wholesale</span>
                <strong>$7.50</strong>
              </div>
              <div>
                <span>Retail Margin</span>
                <strong>82.5%</strong>
              </div>
              <div>
                <span>Wholesale Margin</span>
                <strong>72.0%</strong>
              </div>
              <div>
                <span>Profit</span>
                <strong>$9.90</strong>
              </div>
            </div>
          </div>
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
          <div className="guideMiniPanel pricingGuidePanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Manage</p>
                <h4>Saved Products</h4>
              </div>
              <Save size={20} />
            </div>

            <div className="guideRecipeRows pricingGuideRows">
              <div className="guideRecipeHeader">
                <span>Action</span>
                <span>Use</span>
              </div>
              <div>
                <strong>Search</strong>
                <span>Find products</span>
              </div>
              <div>
                <strong>Filter</strong>
                <span>Sort lists</span>
              </div>
              <div>
                <strong>Update</strong>
                <span>Revise pricing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="moduleGuideTip pricingGuideTip">
        <Plus size={18} />
        <p>
          Tip: keep products linked to their source modules whenever possible so recipes,
          package sizes, costs, orders, and inventory records stay connected across Farmers Hub.
        </p>
      </div>
    </div>
  );
}
