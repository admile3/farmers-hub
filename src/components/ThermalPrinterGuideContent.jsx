import {
  Bluetooth,
  FileImage,
  Gauge,
  Image,
  Layers3,
  Printer,
  SlidersHorizontal,
  Upload,
  Usb
} from "lucide-react";

export default function ThermalPrinterGuideContent() {
  return (
    <div className="moduleGuideContent thermalPrinterGuideContent">
      <section className="moduleGuideIntro">
        <p>
          Thermal Printer helps you batch upload PNG labels, set print quantities,
          arrange the print order, and print through either the browser print dialog
          or compatible direct thermal printer connections.
        </p>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 1</span>
          <h3>Upload your PNG labels.</h3>
          <p>
            Use Upload PNGs or drag labels into the drop zone. Each uploaded file
            becomes a printable label row with its own quantity.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Upload</p>
                <h4>PNG Label Batch</h4>
              </div>
              <Upload size={20} />
            </div>

            <div className="guideMiniGrid two">
              <div>
                <FileImage size={16} />
                <strong>Radish Label</strong>
                <span>Qty 6</span>
              </div>
              <div>
                <FileImage size={16} />
                <strong>Sunflower Label</strong>
                <span>Qty 4</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 2</span>
          <h3>Set quantities and order.</h3>
          <p>
            Adjust how many copies of each label you need, then drag rows or use
            the move buttons to set the print sequence.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Batch Order</p>
                <h4>Print Sequence</h4>
              </div>
              <Layers3 size={20} />
            </div>

            <div className="guideSavedRecipe">
              <strong>1. Microgreens Label</strong>
              <span>Quantity controls print copies.</span>
            </div>

            <div className="guideSavedRecipe">
              <strong>2. Spice Blend Label</strong>
              <span>Move labels up or down before printing.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 3</span>
          <h3>Choose a print mode.</h3>
          <p>
            Universal Print works through the browser print dialog and is the most
            compatible option. Direct Print is experimental and sends TSPL commands
            through WebUSB or Web Bluetooth.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniGrid two">
              <div>
                <Printer size={16} />
                <strong>Universal</strong>
                <span>Browser print dialog</span>
              </div>
              <div>
                <Usb size={16} />
                <strong>Direct</strong>
                <span>WebUSB or Bluetooth</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 4</span>
          <h3>Set label size and image fit.</h3>
          <p>
            Enter your label width, label height, DPI, and whether the PNG should
            fit inside the label or cover the full label area.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Settings</p>
                <h4>3 x 2 inch label</h4>
              </div>
              <Image size={20} />
            </div>

            <div className="guideMiniGrid three">
              <div>
                <span>Width</span>
                <strong>3 in</strong>
              </div>
              <div>
                <span>Height</span>
                <strong>2 in</strong>
              </div>
              <div>
                <span>DPI</span>
                <strong>203</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="moduleGuideSection">
        <div className="moduleGuideStepText">
          <span className="moduleGuideStepNumber">Step 5</span>
          <h3>Tune direct print settings.</h3>
          <p>
            In Direct Print mode, adjust speed, density, and black threshold for
            compatible TSPL printers. Slower speed and higher density can help tiny
            text or QR labels print more clearly.
          </p>
        </div>

        <div className="moduleGuidePreview">
          <div className="guideMiniPanel">
            <div className="guideMiniHeader">
              <div>
                <p className="eyebrow">Direct Print</p>
                <h4>TSPL Controls</h4>
              </div>
              <SlidersHorizontal size={20} />
            </div>

            <div className="guideMiniGrid three">
              <div>
                <Gauge size={16} />
                <span>Speed</span>
                <strong>2</strong>
              </div>
              <div>
                <Printer size={16} />
                <span>Density</span>
                <strong>10</strong>
              </div>
              <div>
                <Bluetooth size={16} />
                <span>Method</span>
                <strong>USB</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="moduleGuideTip">
        <Printer size={18} />
        <p>
          Tip: start with Universal Print first. Use Direct Print only when your
          browser and printer support WebUSB or Web Bluetooth TSPL printing.
        </p>
      </div>
    </div>
  );
}
