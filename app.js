import { computeModel } from "./src/model.js";
import { scenarios } from "./src/scenarios.js";

const inputDefinitions = [
  { group: "Molecular junction", key: "h0MeV", label: "Contact coupling", unit: "meV", min: 0, max: 100, step: 1 },
  { group: "Molecular junction", key: "r0Nm", label: "Reference distance", unit: "nm", min: 0.1, max: 2, step: 0.01 },
  { group: "Molecular junction", key: "rNm", label: "Donor–acceptor distance", unit: "nm", min: 0.1, max: 3, step: 0.01 },
  { group: "Molecular junction", key: "betaRatePerAngstrom", label: "Rate-decay coefficient", unit: "Å⁻¹", min: 0, max: 2, step: 0.01 },
  { group: "Molecular junction", key: "deltaEv", label: "Electronic site-energy gap", unit: "eV", min: -0.5, max: 0.5, step: 0.005 },
  { group: "Thermal environment", key: "temperatureK", label: "Temperature", unit: "K", min: 250, max: 350, step: 1 },
  { group: "Thermal environment", key: "gamma1PerPs", label: "Energy relaxation Γ₁", unit: "ps⁻¹", min: 0, max: 30, step: 0.1 },
  { group: "Thermal environment", key: "gammaPhiPerPs", label: "Pure dephasing γφ", unit: "ps⁻¹", min: 0, max: 50, step: 0.1 },
  { group: "Marcus energetics", key: "deltaG0Ev", label: "Standard driving force", unit: "eV", min: -1, max: 0.5, step: 0.01 },
  { group: "Marcus energetics", key: "overpotentialV", label: "Local overpotential", unit: "V", min: -0.5, max: 0.5, step: 0.01 },
  { group: "Marcus energetics", key: "lambdaEv", label: "Reorganisation energy", unit: "eV", min: 0.01, max: 1.5, step: 0.01 },
  { group: "Electronic reservoir", key: "conductanceNs", label: "Conductance", unit: "nS", min: 0, max: 20, step: 0.001 },
  { group: "Electronic reservoir", key: "quantumCapacitanceAf", label: "Quantum capacitance", unit: "aF", min: 0.1, max: 2000, step: 0.1 },
];

const byId = (id) => document.getElementById(id);
const scenarioSelect = byId("scenario-select");
const inputsRoot = byId("input-groups");
const inputElements = new Map();
let currentScenarioKey = "qbetNanogap";
let lastResult;

const formatScientific = (value, digits = 2) => {
  if (!Number.isFinite(value)) return value === Infinity ? "∞" : "—";
  if (value === 0) return "0";
  if (Math.abs(value) >= 1e4 || Math.abs(value) < 1e-3) return value.toExponential(digits);
  return value.toPrecision(digits + 1);
};

function createInputs() {
  for (const [key, scenario] of Object.entries(scenarios)) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = scenario.name;
    scenarioSelect.append(option);
  }

  for (const groupName of [...new Set(inputDefinitions.map((item) => item.group))]) {
    const section = document.createElement("section");
    section.className = "input-group";
    section.innerHTML = `<h3>${groupName}</h3>`;
    for (const definition of inputDefinitions.filter((item) => item.group === groupName)) {
      const wrapper = document.createElement("div");
      wrapper.className = "input-row";
      const label = document.createElement("label");
      label.htmlFor = `${definition.key}-range`;
      label.innerHTML = `<span>${definition.label}<br><small>${definition.key}</small></span>`;
      const numeric = document.createElement("input");
      numeric.type = "number";
      numeric.id = `${definition.key}-number`;
      numeric.min = definition.min;
      numeric.max = definition.max;
      numeric.step = definition.step;
      numeric.setAttribute("aria-label", `${definition.label} in ${definition.unit}`);
      label.append(numeric);
      const range = document.createElement("input");
      range.type = "range";
      range.id = `${definition.key}-range`;
      range.min = definition.min;
      range.max = definition.max;
      range.step = definition.step;
      range.setAttribute("aria-label", `${definition.label} slider in ${definition.unit}`);
      const unit = document.createElement("small");
      unit.textContent = definition.unit;
      unit.style.display = "block";
      unit.style.textAlign = "right";
      unit.style.color = "#71869d";
      wrapper.append(label, range, unit);
      section.append(wrapper);
      inputElements.set(definition.key, { numeric, range });

      const sync = (source, target) => {
        target.value = source.value;
        update();
      };
      range.addEventListener("input", () => sync(range, numeric));
      numeric.addEventListener("change", () => sync(numeric, range));
    }
    inputsRoot.append(section);
  }
}

function loadScenario(key) {
  currentScenarioKey = key;
  const scenario = scenarios[key];
  scenarioSelect.value = key;
  byId("scenario-description").textContent = scenario.description;
  for (const [parameter, value] of Object.entries(scenario.parameters)) {
    const elements = inputElements.get(parameter);
    if (elements) {
      elements.numeric.value = value;
      elements.range.value = value;
    }
  }
  update();
}

function parametersFromInputs() {
  return Object.fromEntries([...inputElements].map(([key, elements]) => [key, Number(elements.numeric.value)]));
}

function update() {
  try {
    lastResult = computeModel(parametersFromInputs());
    document.body.dataset.error = "false";
    renderMetrics(lastResult);
    renderChart(lastResult);
    renderRates(lastResult);
    renderDiagnostics(lastResult);
  } catch (error) {
    document.body.dataset.error = "true";
    console.error(error);
  }
}

function renderMetrics(result) {
  byId("metric-coupling").textContent = `${result.coupling.couplingMeV.toFixed(1)} meV`;
  byId("metric-marcus").textContent = `${formatScientific(result.marcus.ratePerSecond)} s⁻¹`;
  byId("metric-zeta").textContent = `${formatScientific(result.decoherence.zeta)} ζ`;
  byId("metric-reservoir").textContent = `${formatScientific(result.reservoir.gcqPerSecond)} s⁻¹`;
  byId("stat-period").textContent = `${formatScientific(result.twoState.periodPs, 3)} ps`;
  byId("stat-t2").textContent = `${formatScientific(result.decoherence.t2Ps, 3)} ps`;
  byId("stat-equilibrium").textContent = result.twoState.equilibriumAcceptor.toFixed(3);
}

function renderDiagnostics(result) {
  byId("diag-zeta").textContent = formatScientific(result.decoherence.zeta, 3);
  byId("diag-mixing").textContent = result.twoState.mixing.toFixed(3);
  byId("diag-activation").textContent = formatScientific(result.marcus.activationNumber, 3);
}

function renderRates(result) {
  const root = byId("rate-bars");
  const rows = [
    ["Marcus benchmark", result.marcus.ratePerSecond, "marcus"],
    ["Reservoir G/Cq", result.reservoir.gcqPerSecond, "gcq"],
    ["Conductance-quantum scale", result.reservoir.quantumRatePerSecond, "quantum"],
  ];
  const logs = rows.map(([, value]) => Math.log10(Math.max(value, 1e-300)));
  const min = Math.min(...logs, 0);
  const max = Math.max(...logs, 1);
  root.replaceChildren();
  rows.forEach(([label, value, className], index) => {
    const width = 5 + 95 * ((logs[index] - min) / (max - min || 1));
    const row = document.createElement("div");
    row.className = "rate-row";
    row.innerHTML = `<div class="rate-label"><span>${label}</span><code>${formatScientific(value)} s⁻¹</code></div><div class="bar-track"><div class="bar ${className}" style="width:${width}%"></div></div>`;
    root.append(row);
  });
}

function renderChart(result) {
  const canvas = byId("population-chart");
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  const context = canvas.getContext("2d");
  context.scale(ratio, ratio);
  const width = rect.width;
  const height = rect.height;
  const margin = { left: 56, right: 18, top: 18, bottom: 42 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const points = result.dynamics.points;
  const maxTime = points.at(-1).timePs;
  const x = (time) => margin.left + (time / maxTime) * plotWidth;
  const y = (population) => margin.top + (1 - population) * plotHeight;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "rgba(4, 15, 27, .5)";
  context.fillRect(margin.left, margin.top, plotWidth, plotHeight);
  context.strokeStyle = "#1b3450";
  context.fillStyle = "#71869d";
  context.lineWidth = 1;
  context.font = "11px ui-monospace, monospace";
  for (let i = 0; i <= 4; i += 1) {
    const population = i / 4;
    const py = y(population);
    context.beginPath(); context.moveTo(margin.left, py); context.lineTo(width - margin.right, py); context.stroke();
    context.fillText(population.toFixed(2), 15, py + 4);
    const time = (maxTime * i) / 4;
    const px = x(time);
    context.beginPath(); context.moveTo(px, margin.top); context.lineTo(px, height - margin.bottom); context.stroke();
    context.fillText(time.toFixed(maxTime < 1 ? 2 : 1), px - 10, height - 17);
  }

  const line = (field, colour, dash = []) => {
    context.save();
    context.strokeStyle = colour;
    context.lineWidth = 2;
    context.setLineDash(dash);
    context.beginPath();
    points.forEach((point, index) => {
      const px = x(point.timePs);
      const py = y(point[field]);
      if (index === 0) context.moveTo(px, py); else context.lineTo(px, py);
    });
    context.stroke();
    context.restore();
  };
  line("unitary", "#d96adb", [6, 6]);
  context.save();
  context.strokeStyle = "#73859a";
  context.setLineDash([3, 6]);
  context.beginPath();
  context.moveTo(margin.left, y(result.twoState.equilibriumAcceptor));
  context.lineTo(width - margin.right, y(result.twoState.equilibriumAcceptor));
  context.stroke();
  context.restore();
  line("acceptorPlot", "#55e3f2");
  context.fillStyle = "#91a4ba";
  context.fillText("time / ps", margin.left + plotWidth / 2 - 28, height - 2);
  context.save();
  context.translate(12, margin.top + plotHeight / 2 + 35);
  context.rotate(-Math.PI / 2);
  context.fillText("P(acceptor)", 0, 0);
  context.restore();
}

function exportResult() {
  const payload = {
    software: "BioNano ET Regime Lab",
    version: "0.2.2",
    exportedAt: new Date().toISOString(),
    scenario: scenarios[currentScenarioKey].name,
    warning: "Illustrative reduced-order output; not a mechanism assignment or experimental prediction.",
    parameters: lastResult.parameters,
    outputs: {
      coupling: lastResult.coupling,
      twoState: lastResult.twoState,
      decoherence: lastResult.decoherence,
      marcus: lastResult.marcus,
      reservoir: lastResult.reservoir,
    },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `bionano-et-${currentScenarioKey}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

createInputs();
scenarioSelect.addEventListener("change", () => loadScenario(scenarioSelect.value));
byId("reset-button").addEventListener("click", () => loadScenario(currentScenarioKey));
byId("export-button").addEventListener("click", exportResult);
window.addEventListener("resize", () => lastResult && renderChart(lastResult));
loadScenario(currentScenarioKey);
