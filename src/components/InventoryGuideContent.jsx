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
import StatCard from "./StatCard.jsx";

export default function InventoryGuideContent() {
  return (
    <div className="moduleGuideContent inventoryGuideContent">
      <section className="moduleGuideIntro">
        <p>
          Inventory helps you track products, ingredients, packaging, supplies, storage locations,
          reorder points, best-by dates, and estimated stock value.
        </p>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 1</span>
          <h3>Add an inventory item.</h3>
          <p>
            Create inventory from an existing product or manually add a new inventory-only item.
            Use existing products when you want inventory tied back to product details from elsewhere in Farmers Hub.
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

            <div className="inventoryGuideModeGrid">
              <div className="inventoryGuideModeCard selected">
                <strong>Existing Product</strong>
                <span>Pull product details from your product directory.</span>
              </div>
              <div className="inventoryGuideModeCard">
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
            Add quantity on hand, unit, par level, reorder point, storage location, cost,
            wholesale price, retail price, and best-by date.
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
              <div>
                <span>Qty On Hand</span>
                <strong>24 each</strong>
              </div>
              <div>
                <span>Reorder Point</span>
                <strong>8 each</strong>
              </div>
              <div>
                <span>Location</span>
                <strong>Market Bins</strong>
              </div>
              <div>
                <span>Cost</span>
                <strong>$2.10</strong>
              </div>
              <div>
                <span>Wholesale</span>
                <strong>$7.50</strong>
              </div>
              <div>
                <span>Retail</span>
                <strong>$12.00</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 3</span>
          <h3>Watch the status cards.</h3>
          <p>
            Use the dashboard cards to monitor active items, low stock, expiring soon,
            inventory value, wholesale value, and retail value.
          </p>
        </div>

        <div className="moduleGuidePreview moduleGuideStatPreview inventoryGuideStatPreview">
          <StatCard icon={PackageCheck} label="Active Items" value="42" sub="tracked inventory" accent="inventory" />
          <StatCard icon={TrendingDown} label="Low Stock" value="5" sub="at reorder point" accent="spice" />
          <StatCard icon={CalendarClock} label="Expiring Soon" value="3" sub="within 14 days" accent="sourdough" />
          <StatCard icon={DollarSign} label="Inventory Value" value="$684" sub="estimated cost" accent="pricing" />
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 4</span>
          <h3>Review attention lists.</h3>
          <p>
            Check Low or Out of Stock and Expiring Soon to quickly see what needs
            restocking, rotating, selling, or removing.
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
              <span>6 each • Reorder at 10 each</span>
            </div>
            <div className="guideSavedRecipe inventoryGuideAlertRow warning">
              <strong>Fresh Microgreens Mix</strong>
              <span>Best by tomorrow • Also low stock</span>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 5</span>
          <h3>Search and filter inventory.</h3>
          <p>
            Use search plus category, status, and location filters to quickly find products,
            ingredients, packaging, supplies, or archived items.
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
              <div>
                <span>Category</span>
                <strong>Spices</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>Low Stock</strong>
              </div>
              <div>
                <span>Location</span>
                <strong>Dry Storage</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 6</span>
          <h3>Adjust quantities quickly.</h3>
          <p>
            Use the +1 and -1 buttons for simple stock adjustments, or open the item
            to edit full details.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideRecipeRows inventoryGuideRows">
              <div className="guideRecipeHeader">
                <span>Item</span>
                <span>Qty</span>
              </div>
              <div>
                <strong>Basil Salt</strong>
                <span>18 each</span>
              </div>
            </div>

            <div className="inventoryGuideAdjustButtons">
              <button type="button">-1</button>
              <button type="button">+1</button>
            </div>
          </div>
        </div>
      </section>

      <div className="moduleGuideTip">
        <PackageCheck size={18} />
        <p>
          Tip: keep reorder points and storage locations updated so Inventory acts as a working restock list, not just a static item directory.
        </p>
      </div>
    </div>
  );
}
