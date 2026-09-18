const fields = [
  ["openingCash", "Opening cash (Sh)"], ["production", "Planned production (ice creams)"],
  ["requestedSales", "Sales requested (ice creams)"], ["actualSales", "Actual allocated sales (ice creams)"],
  ["price", "Price per ice cream (Sh)"], ["milkTons", "Milk purchased (tons)"],
  ["milkPrice", "Milk price per ton (Sh)"], ["market", "Market investment (Sh)"],
  ["rent", "Premises rent (Sh)"], ["maintenance", "Machine maintenance (Sh)"],
  ["depreciation", "Machine depreciation (Sh)"], ["transportPerUnit", "Transport per ice cream (Sh)"],
  ["salary", "Fixed salaries (Sh)"], ["loan", "New borrowing received (Sh)"],
  ["interest", "Loan interest (Sh)"], ["machinePurchase", "Machine purchase (Sh)"],
  ["taxLoss", "Unused tax losses brought forward (Sh)"]
];

const plans = {
  safe: { openingCash:73546, production:45000, requestedSales:45000, actualSales:36000, price:2, milkTons:2.25, milkPrice:20000, market:3000, rent:17000, maintenance:1800, depreciation:4375, transportPerUnit:.10, salary:10000, loan:0, interest:0, machinePurchase:0, taxLoss:0 },
  growth: { openingCash:73546, production:75000, requestedSales:75000, actualSales:55000, price:2, milkTons:3.75, milkPrice:20000, market:7000, rent:17000, maintenance:3600, depreciation:8750, transportPerUnit:.10, salary:10000, loan:30000, interest:1500, machinePurchase:35000, taxLoss:0 }
};

const seasonNames = ["Y1 Winter", "Y1 Spring", "Y1 Summer", "Y1 Autumn"];
const winterExample = { openingCash:100000, production:50000, requestedSales:50000, actualSales:50000, price:2, milkTons:2.5, milkPrice:20000, market:5000, rent:17000, maintenance:1800, depreciation:4375, transportPerUnit:.10, salary:10000, loan:0, interest:0, machinePurchase:35000, taxLoss:0 };
const blankSeason = { ...winterExample, actualSales:0, production:0, requestedSales:0, milkTons:0, market:0, rent:0, maintenance:0, depreciation:0, salary:0, machinePurchase:0, openingCash:0 };
let seasonData = {};
try { seasonData = JSON.parse(localStorage.getItem("iceCreamYear1")) || { "Y1 Winter": winterExample }; } catch { seasonData = { "Y1 Winter": winterExample }; }

const money = value => `Sh ${Math.round(value).toLocaleString()}`;
const number = value => Number(value) || 0;

function renderInputs(name) {
  document.querySelector(`#${name}-inputs`).innerHTML = fields.map(([key,label]) => `<label>${label}<input type="number" step="any" min="0" data-plan="${name}" data-key="${key}" value="${plans[name][key]}"></label>`).join("");
}

function renderSeasonInputs() {
  const season = document.querySelector("#season-select").value;
  const values = seasonData[season] || { ...blankSeason, openingCash: season === "Y1 Winter" ? 100000 : 0 };
  document.querySelector("#season-inputs").innerHTML = fields.map(([key,label]) => `<label>${label}<input type="number" step="any" min="0" data-year-key="${key}" value="${values[key] ?? 0}"></label>`).join("");
}

function saveSeason() {
  const season = document.querySelector("#season-select").value;
  const saved = {};
  document.querySelectorAll("input[data-year-key]").forEach(input => { saved[input.dataset.yearKey] = number(input.value); });
  seasonData[season] = saved;
  localStorage.setItem("iceCreamYear1", JSON.stringify(seasonData));
  document.querySelector("#save-message").textContent = `${season} saved.`;
  renderYearSummary();
}

function clearSeason() {
  const season = document.querySelector("#season-select").value;
  delete seasonData[season];
  localStorage.setItem("iceCreamYear1", JSON.stringify(seasonData));
  document.querySelector("#save-message").textContent = `${season} cleared.`;
  renderSeasonInputs();
  renderYearSummary();
}

function renderYearSummary() {
  const savedSeasons = seasonNames.filter(name => seasonData[name]);
  const results = savedSeasons.map(name => calculate(seasonData[name]));
  const profit = results.reduce((sum, result) => sum + result.netProfit, 0);
  const finalCash = results.length ? results[results.length - 1].closingCash : 0;
  const latest = savedSeasons.length ? savedSeasons[savedSeasons.length - 1] : "None";
  document.querySelector("#year-summary").innerHTML = `<div><span>Seasons saved</span><strong>${savedSeasons.length} of 4</strong></div><div><span>Year 1 profit so far</span><strong>${money(profit)}</strong></div><div><span>Latest saved season</span><strong>${latest}</strong></div><div><span>Latest closing cash</span><strong>${money(finalCash)}</strong></div>`;
}

function calculate(plan) {
  const p = plan;
  const revenue = Math.round(p.actualSales * p.price);
  const milk = Math.round(p.milkTons * p.milkPrice);
  const transport = Math.round(p.actualSales * p.transportPerUnit);
  const grossProfit = revenue - milk - p.maintenance - p.depreciation;
  const bonus = Math.round(Math.max(grossProfit, 0) * .05);
  const profitBeforeTax = grossProfit - transport - p.market - bonus - p.salary - p.rent - p.interest;
  const taxableProfit = Math.max(0, profitBeforeTax - p.taxLoss);
  const tax = Math.round(taxableProfit * .10);
  const netProfit = profitBeforeTax - tax;
  const cashBeforeMarket = p.openingCash + p.loan - p.machinePurchase - milk - p.market;
  const closingCash = p.openingCash + p.loan + revenue - p.machinePurchase - milk - p.market - p.rent - p.maintenance - transport - p.salary - bonus - p.interest - tax;
  return { revenue, milk, transport, grossProfit, bonus, profitBeforeTax, tax, netProfit, cashBeforeMarket, closingCash, spoilage:Math.max(0, p.production-p.actualSales) };
}

function advice(plan, result) {
  const notes = [];
  if (result.cashBeforeMarket < 0) notes.push("High risk: cash becomes negative before market sales arrive.");
  if (result.closingCash < 0) notes.push("High risk: you finish the season with negative cash.");
  if (plan.production > 0 && result.spoilage / plan.production > .20) notes.push("Risk: more than 20% of planned production is unsold. Consider producing less.");
  if (plan.actualSales < plan.requestedSales) notes.push("Risk: this assumes fewer allocated sales than requested. Check whether the plan still feels safe.");
  if (plan.loan > 0) notes.push(`Borrowing adds Sh ${Math.round(plan.interest).toLocaleString()} interest this season.`);
  if (result.netProfit < 0) notes.push("Warning: this plan makes a loss. Reduce costs, raise sales, or change the plan.");
  if (!notes.length) notes.push("Looks safer: cash stays positive and production is close to sales.");
  return notes;
}

function renderResults(name) {
  const p = plans[name], r = calculate(p);
  const allocationWarning = p.actualSales > p.requestedSales ? "Actual allocated sales are higher than requested." : p.actualSales < p.requestedSales ? "This tests lower allocated sales than requested." : "Allocated sales equal requested sales.";
  const cashRisk = r.cashBeforeMarket < 0 || r.closingCash < 0;
  const notes = advice(p, r);
  document.querySelector(`#${name}-results`).innerHTML = `<h3>Projected result</h3>
    <div class="result-row"><span>Revenue</span><strong>${money(r.revenue)}</strong></div>
    <div class="result-row"><span>Milk cost</span><strong>−${money(r.milk)}</strong></div>
    <div class="result-row"><span>Transport</span><strong>−${money(r.transport)}</strong></div>
    <div class="result-row"><span>Market spending</span><strong>−${money(p.market)}</strong></div>
    <div class="result-row"><span>Depreciation</span><strong>−${money(p.depreciation)}</strong></div>
    <div class="result-row"><span>Interest</span><strong>−${money(p.interest)}</strong></div>
    <div class="result-row"><span>Net profit</span><strong>${money(r.netProfit)}</strong></div>
    <div class="result-row"><span>Cash before market</span><strong>${money(r.cashBeforeMarket)}</strong></div>
    <div class="result-row"><span>Closing cash</span><strong>${money(r.closingCash)}</strong></div>
    <div class="result-row"><span>Unsold production</span><strong>${r.spoilage.toLocaleString()}</strong></div>
    <div class="status ${cashRisk ? "risk" : "good"}">${cashRisk ? "Cash warning: this plan goes negative. Reduce spending, borrow more, or plan lower production." : "Cash check: this plan stays positive."}<br>${allocationWarning}</div>
    <div class="advice"><h3>What to watch</h3>${notes.map(note => `<p>• ${note}</p>`).join("")}</div>`;
  return r;
}

function refresh() {
  const safe = renderResults("safe"), growth = renderResults("growth");
  const safeRisk = advice(plans.safe, safe).filter(note => !note.startsWith("Looks safer")).length;
  const growthRisk = advice(plans.growth, growth).filter(note => !note.startsWith("Looks safer")).length;
  const winner = safeRisk <= growthRisk ? "Safe winter" : "Growth winter";
  const chosen = winner === "Safe winter" ? safe : growth;
  const other = winner === "Safe winter" ? growth : safe;
  document.querySelector("#recommendation-text").textContent = `${winner} is currently safer. It has ${winner === "Safe winter" ? safeRisk : growthRisk} risk warning(s), compared with ${winner === "Safe winter" ? growthRisk : safeRisk} for the other plan. Its closing cash is ${money(chosen.closingCash)}. The other plan ends with ${money(other.closingCash)}. Change the yellow figures to test your own decision.`;
}

for (const name of Object.keys(plans)) renderInputs(name);
document.addEventListener("input", event => { if (!event.target.matches("input[data-plan]")) return; plans[event.target.dataset.plan][event.target.dataset.key] = number(event.target.value); refresh(); });
document.querySelector("#season-select").addEventListener("change", () => { document.querySelector("#save-message").textContent = ""; renderSeasonInputs(); });
document.addEventListener("input", event => {
  if (!event.target.matches("input[data-year-key]")) return;
  saveSeason();
});
document.querySelector("#clear-season").addEventListener("click", clearSeason);
renderSeasonInputs();
renderYearSummary();
refresh();
