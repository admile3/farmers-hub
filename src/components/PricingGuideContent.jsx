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

        <div className="moduleGuidePreview pricingGuidePreview">
          <div className="workspacePanel compactPanel pricingGuidePanel">
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Directory</p>
                <h3>Product Directory</h3>
              </div>
              <div className="formActions compactActions pricingGuideActions">
                <button className="secondaryButton compactButton" type="button">Refresh</button>
                <button className="secondaryButton compactButton" type="button"><Package size={15} />Load Sample</button>
                <button className="primaryButton compactPrimary" type="button"><Plus size={15} />New Product</button>
              </div>
            </div>

            <div className="customersFilterPanel pricingGuideFilters">
              <div className="searchBox compactSearch customersSearchBox">
                <Search size={17} />
                <span>Search products, variants, SKU, category...</span>
              </div>
              <label>
                Category
                <select value="All categories" readOnly>
                  <option>All categories</option>
                </select>
              </label>
              <label>
                Status
                <select value="All statuses" readOnly>
                  <option>All statuses</option>
                </select>
              </label>
            </div>

            <div className="batchTable compactBatchTable pricingComparisonTable pricingGuideTable">
              <div className="pricingComparisonHeader">
                <span>Product</span>
                <span>Category</span>
                <span>Retail</span>
                <span>Wholesale</span>
                <span>Cost</span>
                <span>Margin</span>
                <span className="pricingVariantActionsHeader">
                  <span>Variant</span>
                  <span>Actions</span>
                </span>
              </div>
              <div className="pricingComparisonRow pricingDirectoryCompactRow">
                <span className="pricingProductCell">
                  <button className="savedItemLink" type="button">Garlic Miso Seasoning</button>
                  <small>Generated • GM-001 • 3 size variants</small>
                </span>
                <span>Spices</span>
                <span className="pricingMetric">$12.00</span>
                <span className="pricingMetric">$7.50</span>
                <span className="pricingMetric">$2.10</span>
                <span className="pricingMetric pricingPositive">82.5%<small>$9.90 / unit</small></span>
                <span className="pricingVariantActionsCell">
                  <span className="pricingDirectoryVariantCell">
                    <select className="pricingDirectoryVariantSelect" value="1 oz Pouch" readOnly>
                      <option>1 oz Pouch</option>
                    </select>
                  </span>
                  <span className="pricingDirectoryActions">••</span>
                </span>
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

        <div className="moduleGuidePreview pricingGuidePreview">
          <div className="workspacePanel compactPanel pricingGuidePanel">
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Product</p>
                <h3>Product Details</h3>
              </div>
              <div className="formActions compactActions">
                <button className="primaryButton compactPrimary" type="button"><Save size={15} />Save Product</button>
              </div>
            </div>
            <div className="formGrid compactFormGrid pricingGuideFormGrid">
              <label>Product Name<input value="Garlic Miso Seasoning" readOnly /></label>
              <label>SKU<input value="GM-001" readOnly /></label>
              <label>Variant<select value="1 oz Pouch" readOnly><option>1 oz Pouch</option></select></label>
              <label>Category<select value="Spices" readOnly><option>Spices</option></select></label>
              <label>Status<select value="Active" readOnly><option>Active</option></select></label>
              <label>Unit Label<input value="1 oz Pouch" readOnly /></label>
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

        <div className="moduleGuidePreview pricingGuidePreview">
          <div className="workspacePanel compactPanel pricingGuidePanel">
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Selected</p>
                <h3>Garlic Miso Seasoning</h3>
                <p className="importExportText">1 oz Pouch</p>
              </div>
            </div>
            <div className="formGrid compactFormGrid pricingGuideFormGrid">
              <label>
                Select Variant
                <select value="1 oz Pouch" readOnly>
                  <option>0.2 oz Pouch</option>
                  <option>1 oz Pouch</option>
                  <option>1 lb Bulk Bag</option>
                </select>
              </label>
              <label>Unit Label<input value="1 oz Pouch" readOnly /></label>
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

        <div className="moduleGuidePreview pricingGuidePreview">
          <div className="workspacePanel compactPanel pricingGuidePanel">
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Pricing</p>
                <h3>Pricing Analysis</h3>
              </div>
            </div>
            <div className="formGrid compactFormGrid pricingGuideFormGrid">
              <label>Batch Ingredient / Material Cost<div className="moneyInputWrap"><span className="moneyPrefix">$</span><input value="32.00" readOnly /></div></label>
              <label>Units Produced Per Batch<input value="24" readOnly /></label>
              <label>Packaging Cost / Unit<div className="moneyInputWrap"><span className="moneyPrefix">$</span><input value="0.35" readOnly /></div></label>
              <label>Labor Hours Per Batch<input value="1.5" readOnly /></label>
              <label>Labor Rate / Hour<div className="moneyInputWrap"><span className="moneyPrefix">$</span><input value="18.00" readOnly /></div></label>
              <label>Overhead / Fees Per Batch<div className="moneyInputWrap"><span className="moneyPrefix">$</span><input value="6.00" readOnly /></div></label>
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
          <StatCard icon={DollarSign} label="Retail" value="$12.00" sub="per 1 oz Pouch" accent="pricing" />
          <StatCard icon={DollarSign} label="Wholesale" value="$7.50" sub="per 1 oz Pouch" accent="sourdough" />
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

        <div className="moduleGuidePreview pricingGuidePreview">
          <div className="workspacePanel compactPanel pricingGuidePanel">
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Directory</p>
                <h3>Product Directory</h3>
              </div>
              <div className="formActions compactActions">
                <button className="primaryButton compactPrimary" type="button"><Save size={15} />Save Product</button>
              </div>
            </div>
            <div className="customersFilterPanel pricingGuideFilters">
              <div className="searchBox compactSearch customersSearchBox">
                <Search size={17} />
                <span>Search products...</span>
              </div>
              <label>Category<select value="All categories" readOnly><option>All categories</option></select></label>
              <label>Status<select value="Active" readOnly><option>Active</option></select></label>
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
