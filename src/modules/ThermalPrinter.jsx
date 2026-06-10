import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Bluetooth,
  CircleHelp,
  FileImage,
  PlugZap,
  Printer,
  RotateCcw,
  Settings2,
  Trash2,
  Upload,
  Usb
} from "lucide-react";

import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import StatCard from "../components/StatCard.jsx";

const DEFAULT_LABEL_WIDTH = "3";
const DEFAULT_LABEL_HEIGHT = "2";
const DEFAULT_DPI = "203";

function makeId() {
  return `thermal-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sanitizeQuantity(value) {
  const number = parseInt(value, 10);
  if (Number.isNaN(number) || number < 1) return 1;
  return number;
}

function toPositiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : Number(fallback);
}

function textBytes(value) {
  return new TextEncoder().encode(value);
}

function concatBytes(parts) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });

  return output;
}

function readFileAsImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => resolve({ image, url });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read ${file.name}.`));
    };

    image.src = url;
  });
}

function imageDataToTsplBitmapBytes(imageData, threshold = 160, invert = false) {
  const { width, height, data } = imageData;
  const bytesPerRow = Math.ceil(width / 8);
  const bitmap = new Uint8Array(bytesPerRow * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = (y * width + x) * 4;
      const alpha = data[pixelIndex + 3];

      const red = data[pixelIndex];
      const green = data[pixelIndex + 1];
      const blue = data[pixelIndex + 2];
      const luminance = 0.299 * red + 0.587 * green + 0.114 * blue;

      let black = alpha > 20 && luminance < threshold;
      if (invert) black = !black;

      if (black) {
        const byteIndex = y * bytesPerRow + Math.floor(x / 8);
        const bitIndex = 7 - (x % 8);
        bitmap[byteIndex] |= 1 << bitIndex;
      }
    }
  }

  return { bitmap, bytesPerRow, height };
}

async function buildTsplJob({
  labels,
  labelWidth,
  labelHeight,
  dpi,
  speed,
  density,
  threshold,
  invert,
  fitMode
}) {
  const widthInches = toPositiveNumber(labelWidth, DEFAULT_LABEL_WIDTH);
  const heightInches = toPositiveNumber(labelHeight, DEFAULT_LABEL_HEIGHT);
  const dotsPerInch = toPositiveNumber(dpi, DEFAULT_DPI);
  const targetWidth = Math.round(widthInches * dotsPerInch);
  const targetHeight = Math.round(heightInches * dotsPerInch);

  const parts = [
    textBytes(`SIZE ${widthInches.toFixed(2)},${heightInches.toFixed(2)}\r\n`),
    textBytes("GAP 0.12,0\r\n"),
    textBytes("DIRECTION 1\r\n"),
    textBytes("REFERENCE 0,0\r\n"),
    textBytes(`SPEED ${speed}\r\n`),
    textBytes(`DENSITY ${density}\r\n`)
  ];

  for (const label of labels) {
    const { image } = await readFileAsImage(label.file);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, targetWidth, targetHeight);
    context.imageSmoothingEnabled = false;

    const scale =
      fitMode === "cover"
        ? Math.max(targetWidth / image.naturalWidth, targetHeight / image.naturalHeight)
        : Math.min(targetWidth / image.naturalWidth, targetHeight / image.naturalHeight);

    const drawWidth = Math.round(image.naturalWidth * scale);
    const drawHeight = Math.round(image.naturalHeight * scale);
    const drawX = Math.round((targetWidth - drawWidth) / 2);
    const drawY = Math.round((targetHeight - drawHeight) / 2);

    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

    const imageData = context.getImageData(0, 0, targetWidth, targetHeight);
    const { bitmap, bytesPerRow, height } = imageDataToTsplBitmapBytes(
      imageData,
      Number(threshold),
      invert
    );

    parts.push(textBytes("CLS\r\n"));
    parts.push(textBytes(`BITMAP 0,0,${bytesPerRow},${height},0,`));
    parts.push(bitmap);
    parts.push(textBytes("\r\n"));
    parts.push(textBytes(`PRINT ${label.quantity},1\r\n`));
  }

  return concatBytes(parts);
}

async function sendUsbJob({ device, jobBytes }) {
  if (!device) throw new Error("No USB printer connected.");

  if (!device.opened) {
    await device.open();
  }

  if (device.configuration === null) {
    await device.selectConfiguration(1);
  }

  const configuration = device.configuration;
  const candidates = [];

  configuration.interfaces.forEach((iface) => {
    iface.alternates.forEach((alternate) => {
      const endpoint = alternate.endpoints.find(
        (item) => item.direction === "out" && item.type === "bulk"
      );

      if (endpoint) {
        candidates.push({
          interfaceNumber: iface.interfaceNumber,
          alternateSetting: alternate.alternateSetting,
          endpointNumber: endpoint.endpointNumber
        });
      }
    });
  });

  const target = candidates[0];

  if (!target) {
    throw new Error("Could not find a USB bulk OUT endpoint for this printer.");
  }

  try {
    await device.claimInterface(target.interfaceNumber);
  } catch (error) {
    const message = String(error?.message || error || "");
    if (!message.toLowerCase().includes("busy")) throw error;
  }

  if (target.alternateSetting) {
    await device.selectAlternateInterface(
      target.interfaceNumber,
      target.alternateSetting
    );
  }

  const chunkSize = 16384;
  for (let index = 0; index < jobBytes.length; index += chunkSize) {
    const chunk = jobBytes.slice(index, index + chunkSize);
    await device.transferOut(target.endpointNumber, chunk);
  }
}

async function sendBluetoothJob({ characteristic, jobBytes }) {
  if (!characteristic) {
    throw new Error("No Bluetooth write characteristic connected.");
  }

  const chunkSize = 180;
  for (let index = 0; index < jobBytes.length; index += chunkSize) {
    const chunk = jobBytes.slice(index, index + chunkSize);
    await characteristic.writeValueWithoutResponse(chunk);
  }
}

function ThermalPrinterGuideContent() {
  return (
    <div className="moduleGuideContent">
      <section>
        <p className="eyebrow">Two print modes</p>
        <h3>Universal mode and direct mode</h3>
        <p>
          Universal Print uses the browser print dialog and should work for most
          people. Direct Print is experimental and sends TSPL commands through
          WebUSB or Web Bluetooth so compatible printers can use speed and density.
        </p>
      </section>

      <section>
        <h4>Direct mode requirements</h4>
        <p>
          Direct mode requires Chrome or Edge, HTTPS, user permission to connect
          to the printer, and a printer that accepts TSPL commands. Some Bluetooth
          printers use classic Bluetooth instead of BLE, which browsers cannot
          access.
        </p>
      </section>

      <section>
        <h4>Fine text tips</h4>
        <p>
          For tiny text or QR labels, try speed 1 or 2, density 10 to 12, and
          adjust the black threshold until the PNG prints crisp without filling in.
        </p>
      </section>
    </div>
  );
}

export default function ThermalPrinter() {
  const fileInputRef = useRef(null);

  const [labels, setLabels] = useState([]);
  const [draggedId, setDraggedId] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("success");
  const [showGuide, setShowGuide] = useState(false);

  const [printMode, setPrintMode] = useState("universal");
  const [directMethod, setDirectMethod] = useState("usb");
  const [usbDevice, setUsbDevice] = useState(null);
  const [bluetoothDevice, setBluetoothDevice] = useState(null);
  const [bluetoothCharacteristic, setBluetoothCharacteristic] = useState(null);
  const [printing, setPrinting] = useState(false);

  const [printSpeed, setPrintSpeed] = useState("2");
  const [printDensity, setPrintDensity] = useState("10");
  const [labelWidth, setLabelWidth] = useState(DEFAULT_LABEL_WIDTH);
  const [labelHeight, setLabelHeight] = useState(DEFAULT_LABEL_HEIGHT);
  const [dpi, setDpi] = useState(DEFAULT_DPI);
  const [threshold, setThreshold] = useState("160");
  const [invert, setInvert] = useState(false);
  const [fitMode, setFitMode] = useState("contain");
  const [dropActive, setDropActive] = useState(false);

  const totalLabels = useMemo(
    () => labels.reduce((sum, label) => sum + label.quantity, 0),
    [labels]
  );

  const webUsbSupported = typeof navigator !== "undefined" && "usb" in navigator;
  const webBluetoothSupported =
    typeof navigator !== "undefined" && "bluetooth" in navigator;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--thermal-label-width", `${labelWidth || DEFAULT_LABEL_WIDTH}in`);
    root.style.setProperty("--thermal-label-height", `${labelHeight || DEFAULT_LABEL_HEIGHT}in`);
  }, [labelWidth, labelHeight]);

  useEffect(() => {
    if (!statusMessage) return undefined;

    const timer = window.setTimeout(() => setStatusMessage(""), 3500);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    return () => {
      labels.forEach((label) => URL.revokeObjectURL(label.url));
    };
  }, [labels]);

  function showStatus(message, type = "success") {
    setStatusMessage(message);
    setStatusType(type);
  }

  function addFiles(fileList) {
    const pngFiles = Array.from(fileList || []).filter(
      (file) => file.type === "image/png" || file.name.toLowerCase().endsWith(".png")
    );

    if (!pngFiles.length) {
      showStatus("Upload PNG files only.", "error");
      return;
    }

    const newLabels = pngFiles.map((file) => ({
      id: makeId(),
      name: file.name,
      file,
      url: URL.createObjectURL(file),
      quantity: 1
    }));

    setLabels((current) => [...current, ...newLabels]);
    showStatus(`${newLabels.length} PNG ${newLabels.length === 1 ? "label" : "labels"} added.`);
  }

  function removeLabel(labelId) {
    setLabels((current) => {
      const target = current.find((label) => label.id === labelId);
      if (target) URL.revokeObjectURL(target.url);

      return current.filter((label) => label.id !== labelId);
    });
  }

  function updateQuantity(labelId, value) {
    const quantity = sanitizeQuantity(value);

    setLabels((current) =>
      current.map((label) =>
        label.id === labelId ? { ...label, quantity } : label
      )
    );
  }

  function moveLabel(labelId, direction) {
    setLabels((current) => {
      const index = current.findIndex((label) => label.id === labelId);
      if (index < 0) return current;

      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= current.length) return current;

      const updated = [...current];
      const [moved] = updated.splice(index, 1);
      updated.splice(nextIndex, 0, moved);

      return updated;
    });
  }

  function reorderLabels(sourceId, targetId) {
    if (!sourceId || !targetId || sourceId === targetId) return;

    setLabels((current) => {
      const sourceIndex = current.findIndex((label) => label.id === sourceId);
      const targetIndex = current.findIndex((label) => label.id === targetId);

      if (sourceIndex < 0 || targetIndex < 0) return current;

      const updated = [...current];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);

      return updated;
    });
  }

  function resetQuantities() {
    setLabels((current) => current.map((label) => ({ ...label, quantity: 1 })));
    showStatus("All quantities reset to 1.");
  }

  function clearAllLabels() {
    labels.forEach((label) => URL.revokeObjectURL(label.url));
    setLabels([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    showStatus("Label batch cleared.");
  }

  async function connectUsbPrinter() {
    if (!webUsbSupported) {
      showStatus("WebUSB is not supported in this browser. Try Chrome or Edge.", "error");
      return;
    }

    try {
      const device = await navigator.usb.requestDevice({ filters: [] });
      setUsbDevice(device);
      showStatus(`USB printer selected: ${device.productName || "USB device"}.`);
    } catch (error) {
      console.error(error);
      showStatus("USB printer connection was cancelled or blocked.", "error");
    }
  }

  async function connectBluetoothPrinter() {
    if (!webBluetoothSupported) {
      showStatus("Web Bluetooth is not supported in this browser. Try Chrome or Edge.", "error");
      return;
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          "0000ffe0-0000-1000-8000-00805f9b34fb",
          "0000ff00-0000-1000-8000-00805f9b34fb",
          "0000ae30-0000-1000-8000-00805f9b34fb"
        ]
      });

      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();

      let writableCharacteristic = null;

      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        writableCharacteristic = characteristics.find(
          (characteristic) =>
            characteristic.properties.writeWithoutResponse ||
            characteristic.properties.write
        );

        if (writableCharacteristic) break;
      }

      if (!writableCharacteristic) {
        throw new Error("No writable Bluetooth characteristic found.");
      }

      setBluetoothDevice(device);
      setBluetoothCharacteristic(writableCharacteristic);
      showStatus(`Bluetooth printer selected: ${device.name || "Bluetooth device"}.`);
    } catch (error) {
      console.error(error);
      showStatus(
        "Bluetooth connection failed. This printer may use classic Bluetooth, which browsers cannot access.",
        "error"
      );
    }
  }

  function handleUniversalPrint() {
    if (!labels.length) {
      showStatus("Upload at least one PNG before printing.", "error");
      return;
    }

    window.setTimeout(() => {
      window.print();
    }, 150);
  }

  async function handleDirectPrint() {
    if (!labels.length) {
      showStatus("Upload at least one PNG before printing.", "error");
      return;
    }

    if (directMethod === "usb" && !usbDevice) {
      showStatus("Connect a USB printer first.", "error");
      return;
    }

    if (directMethod === "bluetooth" && !bluetoothCharacteristic) {
      showStatus("Connect a Bluetooth printer first.", "error");
      return;
    }

    setPrinting(true);

    try {
      const jobBytes = await buildTsplJob({
        labels,
        labelWidth,
        labelHeight,
        dpi,
        speed: printSpeed,
        density: printDensity,
        threshold,
        invert,
        fitMode
      });

      if (directMethod === "usb") {
        await sendUsbJob({ device: usbDevice, jobBytes });
      } else {
        await sendBluetoothJob({
          characteristic: bluetoothCharacteristic,
          jobBytes
        });
      }

      showStatus(`Sent ${totalLabels} labels through ${directMethod === "usb" ? "WebUSB" : "Web Bluetooth"}.`);
    } catch (error) {
      console.error(error);
      showStatus(error.message || "Could not send direct print job.", "error");
    } finally {
      setPrinting(false);
    }
  }

  function handlePrint() {
    if (printMode === "universal") {
      handleUniversalPrint();
      return;
    }

    handleDirectPrint();
  }

  function handleDrop(event) {
    event.preventDefault();
    setDropActive(false);

    if (event.dataTransfer?.files?.length) {
      addFiles(event.dataTransfer.files);
    }
  }

  const connectedPrinterLabel =
    directMethod === "usb"
      ? usbDevice?.productName || usbDevice?.manufacturerName || "Not connected"
      : bluetoothDevice?.name || "Not connected";

  return (
    <div className="modulePage thermalPrinterModule">
      {statusMessage ? (
        <div className={`floatingStatus ${statusType}`}>
          <span>ⓘ</span>
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            ×
          </button>
        </div>
      ) : null}

      <section className="farmModuleHero thermalPrinterHero">
        <div className="farmModuleHeroText">
          <p className="eyebrow">Thermal Printer</p>
          <h2>Batch print PNG labels with universal and direct print modes.</h2>
          <p>
            Upload multiple PNG labels, set quantities, reorder the batch, then
            print through the browser or try direct TSPL printing with speed and
            density controls on compatible printers.
          </p>
        </div>

        <div className="farmModuleHeroActions">
          <button
            className="primaryButton compactPrimary farmHeroAction"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={18} />
            Upload PNGs
          </button>

          <button
            className="secondaryButton compactButton farmHeroAction"
            type="button"
            onClick={() => setShowGuide(true)}
          >
            <CircleHelp size={16} />
            Guide
          </button>
        </div>
      </section>

      <section className="hubStatGrid thermalPrinterStatGrid">
        <StatCard
          icon={Printer}
          label="Mode"
          value={printMode === "universal" ? "Universal" : "Direct"}
          sub={printMode === "universal" ? "browser print" : directMethod}
          accent="pricing"
        />
        <StatCard
          icon={FileImage}
          label="Uploaded"
          value={labels.length}
          sub="PNG files"
          accent="orders"
        />
        <StatCard
          icon={Printer}
          label="To Print"
          value={totalLabels}
          sub="total labels"
          accent="market"
        />
        <StatCard
          icon={Settings2}
          label="Speed / Density"
          value={printMode === "direct" ? `${printSpeed} / ${printDensity}` : "Driver"}
          sub={printMode === "direct" ? "TSPL controls" : "browser controlled"}
          accent="spice"
        />
      </section>

      <section className="toolGrid compactToolGrid">
        <button
          className="toolCard compactToolCard clickableToolCard"
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={22} />
          <h3>Upload Labels</h3>
          <p>Select or drag in one or more PNG files.</p>
        </button>

        <button
          className="toolCard compactToolCard clickableToolCard"
          type="button"
          onClick={resetQuantities}
          disabled={!labels.length}
        >
          <RotateCcw size={22} />
          <h3>Reset Quantities</h3>
          <p>Set every uploaded label quantity back to 1.</p>
        </button>

        <button
          className="toolCard compactToolCard clickableToolCard"
          type="button"
          onClick={handlePrint}
          disabled={!labels.length || printing}
        >
          <Printer size={22} />
          <h3>{printing ? "Printing..." : "Print Batch"}</h3>
          <p>Print the current labels in the order shown.</p>
        </button>
      </section>

      <section className="thermalModePanel workspacePanel compactPanel">
        <div className="workspaceHeader compactPanelHeader">
          <div>
            <p className="eyebrow">Print Mode</p>
            <h3>Choose how Farmers Hub should print</h3>
          </div>
        </div>

        <div className="thermalModeGrid">
          <button
            type="button"
            className={`thermalModeCard ${printMode === "universal" ? "selected" : ""}`}
            onClick={() => setPrintMode("universal")}
          >
            <Printer size={22} />
            <strong>Universal Print</strong>
            <span>Works for most users through the browser print dialog. Speed and density are handled by the printer driver.</span>
          </button>

          <button
            type="button"
            className={`thermalModeCard ${printMode === "direct" ? "selected" : ""}`}
            onClick={() => setPrintMode("direct")}
          >
            <PlugZap size={22} />
            <strong>Direct Print, Experimental</strong>
            <span>Sends TSPL commands with speed and density through WebUSB or Web Bluetooth when compatible.</span>
          </button>
        </div>
      </section>

      <input
        ref={fileInputRef}
        className="hiddenFileInput"
        type="file"
        accept=".png,image/png"
        multiple
        onChange={(event) => addFiles(event.target.files)}
      />

      <section className="thermalPrinterLayout">
        <div className="workspacePanel compactPanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Batch</p>
              <h3>Label Uploads</h3>
            </div>

            <div className="formActions compactActions">
              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={15} />
                Upload PNGs
              </button>

              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={clearAllLabels}
                disabled={!labels.length}
              >
                <Trash2 size={15} />
                Clear All
              </button>

              <button
                className="primaryButton compactPrimary"
                type="button"
                onClick={handlePrint}
                disabled={!labels.length || printing}
              >
                <Printer size={15} />
                {printing ? "Printing..." : "Print"}
              </button>
            </div>
          </div>

          <div
            className={`thermalDropzone ${dropActive ? "dragover" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDropActive(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDropActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDropActive(false);
            }}
            onDrop={handleDrop}
          >
            <Upload size={28} />
            <strong>Drop PNG labels here</strong>
            <span>or use the Upload PNGs button above.</span>
          </div>

          <div className="thermalLabelList">
            {labels.length ? (
              labels.map((label, index) => (
                <div
                  className="thermalLabelItem"
                  key={label.id}
                  draggable
                  onDragStart={() => setDraggedId(label.id)}
                  onDragEnd={() => setDraggedId("")}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    reorderLabels(draggedId, label.id);
                  }}
                >
                  <div className="thermalLabelThumb">
                    <img src={label.url} alt={label.name} />
                  </div>

                  <div className="thermalLabelMeta">
                    <strong>{label.name}</strong>
                    <span>Print sequence #{index + 1}</span>
                    <small>Drag this row, or use the up and down buttons.</small>
                  </div>

                  <div className="thermalLabelControls">
                    <div className="thermalMoveButtons">
                      <button
                        className="iconButton"
                        type="button"
                        onClick={() => moveLabel(label.id, "up")}
                        disabled={index === 0}
                        aria-label="Move label up"
                      >
                        <ArrowUp size={15} />
                      </button>

                      <button
                        className="iconButton"
                        type="button"
                        onClick={() => moveLabel(label.id, "down")}
                        disabled={index === labels.length - 1}
                        aria-label="Move label down"
                      >
                        <ArrowDown size={15} />
                      </button>
                    </div>

                    <label className="thermalQuantityField">
                      Qty
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={label.quantity}
                        onChange={(event) => updateQuantity(label.id, event.target.value)}
                        onWheel={(event) => event.currentTarget.blur()}
                      />
                    </label>

                    <button
                      className="iconButton danger"
                      type="button"
                      onClick={() => removeLabel(label.id)}
                      aria-label="Remove label"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="permitEmptyState">
                No PNG files uploaded yet. Upload the QR label PNGs you want to print.
              </div>
            )}
          </div>
        </div>

        <div className="workspacePanel compactPanel thermalSettingsPanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Printer</p>
              <h3>{printMode === "direct" ? "Direct Print Settings" : "Universal Print Settings"}</h3>
            </div>

            <Settings2 size={22} />
          </div>

          {printMode === "direct" ? (
            <div className="thermalDirectConnectPanel">
              <div className="thermalDirectMethodTabs">
                <button
                  className={directMethod === "usb" ? "active" : ""}
                  type="button"
                  onClick={() => setDirectMethod("usb")}
                >
                  <Usb size={15} />
                  WebUSB
                </button>
                <button
                  className={directMethod === "bluetooth" ? "active" : ""}
                  type="button"
                  onClick={() => setDirectMethod("bluetooth")}
                >
                  <Bluetooth size={15} />
                  Web Bluetooth
                </button>
              </div>

              <div className="placeholderBox compactPlaceholder thermalPrintNote">
                <strong>{connectedPrinterLabel}</strong>
                <span>
                  {directMethod === "usb"
                    ? webUsbSupported
                      ? "Connect a USB printer and approve browser access."
                      : "WebUSB is not supported in this browser."
                    : webBluetoothSupported
                      ? "Bluetooth must be BLE compatible. Classic Bluetooth printers may not appear."
                      : "Web Bluetooth is not supported in this browser."}
                </span>
              </div>

              <button
                className="secondaryButton compactButton fullButton"
                type="button"
                onClick={directMethod === "usb" ? connectUsbPrinter : connectBluetoothPrinter}
              >
                {directMethod === "usb" ? <Usb size={16} /> : <Bluetooth size={16} />}
                Connect {directMethod === "usb" ? "USB" : "Bluetooth"} Printer
              </button>
            </div>
          ) : (
            <div className="placeholderBox compactPlaceholder thermalPrintNote">
              <strong>Universal mode:</strong>
              <span>
                Uses the browser print dialog. It cannot force speed or density,
                but it is the most compatible option for all Farmers Hub users.
              </span>
            </div>
          )}

          <div className="formGrid compactFormGrid">
            <label>
              Label Width, inches
              <input
                type="number"
                min="0.5"
                step="0.1"
                value={labelWidth}
                onChange={(event) => setLabelWidth(event.target.value)}
              />
            </label>

            <label>
              Label Height, inches
              <input
                type="number"
                min="0.5"
                step="0.1"
                value={labelHeight}
                onChange={(event) => setLabelHeight(event.target.value)}
              />
            </label>

            <label>
              DPI
              <select value={dpi} onChange={(event) => setDpi(event.target.value)}>
                <option value="203">203 DPI</option>
                <option value="300">300 DPI</option>
              </select>
            </label>

            <label>
              Image Fit
              <select value={fitMode} onChange={(event) => setFitMode(event.target.value)}>
                <option value="contain">Contain entire PNG</option>
                <option value="cover">Fill label area</option>
              </select>
            </label>

            {printMode === "direct" ? (
              <>
                <label>
                  Speed
                  <select
                    value={printSpeed}
                    onChange={(event) => setPrintSpeed(event.target.value)}
                  >
                    <option value="1">1, slowest</option>
                    <option value="2">2, slow</option>
                    <option value="3">3, medium</option>
                    <option value="4">4, fast</option>
                    <option value="5">5, fastest</option>
                  </select>
                </label>

                <label>
                  Density
                  <select
                    value={printDensity}
                    onChange={(event) => setPrintDensity(event.target.value)}
                  >
                    <option value="6">6, lighter</option>
                    <option value="8">8, standard</option>
                    <option value="10">10, darker</option>
                    <option value="12">12, very dark</option>
                    <option value="15">15, maximum</option>
                  </select>
                </label>

                <label>
                  Black Threshold
                  <input
                    type="number"
                    min="1"
                    max="254"
                    step="1"
                    value={threshold}
                    onChange={(event) => setThreshold(event.target.value)}
                  />
                </label>

                <label className="toggleField thermalToggleField">
                  <span>Invert black / white</span>
                  <input
                    type="checkbox"
                    checked={invert}
                    onChange={(event) => setInvert(event.target.checked)}
                  />
                </label>
              </>
            ) : null}
          </div>

          <div className="placeholderBox compactPlaceholder thermalPrintNote">
            <strong>{printMode === "direct" ? "TSPL job settings:" : "Browser print settings:"}</strong>
            <span>
              {printMode === "direct"
                ? `SIZE ${labelWidth || DEFAULT_LABEL_WIDTH} x ${labelHeight || DEFAULT_LABEL_HEIGHT}, SPEED ${printSpeed}, DENSITY ${printDensity}, ${dpi} DPI.`
                : `Use ${labelWidth || DEFAULT_LABEL_WIDTH} x ${labelHeight || DEFAULT_LABEL_HEIGHT} inch paper, 100 percent scale, no margins, and landscape if your label is wider than tall.`}
            </span>
          </div>

          <button
            className="primaryButton compactPrimary fullButton"
            type="button"
            onClick={handlePrint}
            disabled={!labels.length || printing}
          >
            <Printer size={16} />
            {printing ? "Printing..." : `Print ${totalLabels || 0} Labels`}
          </button>
        </div>
      </section>

      <div className="thermalPrintRoot" aria-hidden="true">
        {labels.flatMap((label) =>
          Array.from({ length: label.quantity }, (_, index) => (
            <div className="thermalPrintPage" key={`${label.id}-${index}`}>
              <img
                src={label.url}
                alt=""
                className={fitMode === "cover" ? "cover" : "contain"}
              />
            </div>
          ))
        )}
      </div>

      <ModuleGuideModal
        isOpen={showGuide}
        moduleKey="thermalPrinter"
        title="Thermal Printer Guide"
        onClose={() => setShowGuide(false)}
      >
        <ThermalPrinterGuideContent />
      </ModuleGuideModal>
    </div>
  );
}
