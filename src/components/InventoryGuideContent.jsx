import {
  AlertCircle,
  CalendarClock,
  DollarSign,
  Filter,
  PackageCheck,
  Plus,
  Search,
  TrendingDown
} from "lucide-react";

export default function InventoryGuideContent() {
  return (
    <div className="moduleGuideContent inventoryGuideContent">
      <section className="moduleGuideIntro">
        <p>
          Inventory helps you track products, ingredients, packaging, supplies,
          storage locations, reorder points, best-by dates, and estimated stock value.
        </p>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 1</span>
          <h3>Add an inventory item.</h3>
          <p>
            Create inventory from an existing product or manually add a new inventory-only item.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Add Inventory</p>
                <h4>Choose how to add stock</h4>
              </div>
              <Plus size={20} />
            </div>

            <div className="guideMiniGrid two">
              <div>
                <strong>Existing Product</strong>
                <span>Pull details from your product directory.</span>
              </div>
              <div>
                <strong>New Product</strong>
                <span>Create an inventory-only item manually.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 2</span>
          <h3>Enter stock details.</h3>
          <p>
            Add quantity, unit, par level, reorder point, storage location, cost,
            prices, and best-by date.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Item Details</p>
                <h4>Inventory Record</h4>
              </div>
              <PackageCheck size={20} />
            </div>

            <div className="guideMiniGrid three">
              <div><span>Qty</span><strong>24 each</strong></div>
              <div><span>Reorder</span><strong>8 each</strong></div>
              <div><span>Location</span><strong>Market Bins</strong></div>
              <div><span>Cost</span><strong>$2.10</strong></div>
              <div><span>Wholesale</span><strong>$7.50</strong></div>
              <div><span>Retail</span><strong>$12.00</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 3</span>
          <h3>Watch the status cards.</h3>
          <p>
            Monitor active items, low stock, expiring soon, inventory value,
            wholesale value, and retail value.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniGrid two inventoryGuideStatPreview">
              <div><PackageCheck size={16} /><span>Active Items</span><strong>42</strong></div>
              <div><TrendingDown size={16} /><span>Low Stock</span><strong>5</strong></div>
              <div><CalendarClock size={16} /><span>Expiring Soon</span><strong>3</strong></div>
              <div><DollarSign size={16} /><span>Value</span><strong>$684</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 4</span>
          <h3>Review attention lists.</h3>
          <p>
            Quickly see what needs restocking, rotating, selling, or removing.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Needs Attention</p>
                <h4>Low or Out of Stock</h4>
              </div>
              <AlertCircle size={20} />
            </div>

            <div className="guideSavedRecipe inventoryGuideAlertRow">
              <strong>1 oz Garlic Miso Pouch</strong>
              <span>6 each, reorder at 10 each</span>
            </div>
            <div className="guideSavedRecipe inventoryGuideAlertRow warning">
              <strong>Fresh Microgreens Mix</strong>
              <span>Best by tomorrow, also low stock</span>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 5</span>
          <h3>Search and filter inventory.</h3>
          <p>
            Use search plus category, status, and location filters to find records quickly.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Directory</p>
                <h4>Inventory Items</h4>
              </div>
              <Filter size={20} />
            </div>

            <div className="guideSearchMock inventoryGuideSearchMock">
              <Search size={14} />
              <span>Search inventory...</span>
            </div>

            <div className="guideMiniGrid three">
              <div><span>Category</span><strong>Spices</strong></div>
              <div><span>Status</span><strong>Low Stock</strong></div>
              <div><span>Location</span><strong>Dry Storage</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 6</span>
          <h3>Adjust quantities quickly.</h3>
          <p>
            Use +1 and -1 for simple stock changes, or open the item to edit full details.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniGrid two">
              <div><strong>Basil Salt</strong><span>18 each</span></div>
              <div><strong>Quick Adjust</strong><span>-1 / +1</span></div>
            </div>
          </div>
        </div>
      </section>

      <div className="moduleGuideTip">
        <PackageCheck size={18} />
        <p>
          Tip: keep reorder points and storage locations updated so Inventory acts as a working restock list.
        </p>
      </div>
    </div>
  );
}
