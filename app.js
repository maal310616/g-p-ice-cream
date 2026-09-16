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

const money = value => `Sh ${Math.round(value).toLocaleString()}`;
const number = value => Number(value) || 0;

function renderInputs(name) {
  document.querySelector(`#${name}-inputs`).innerHTML = fields.map(([key,label]) => `<label>${label}<input type="number" step="any" min="0" data-plan="${name}" data-key="${key}" value="${plans[name][key]}"></label>`).join("");
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

function renderResults(name) {
  const p = plans[name], r = calculate(p);
  const allocationWarning = p.actualSales > p.requestedSales ? "Actual allocated sales are higher than requested." : p.actualSales < p.requestedSales ? "This tests lower allocated sales than requested." : "Allocated sales equal requested sales.";
  const cashRisk = r.cashBeforeMarket < 0 || r.closingCash < 0;
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
    <div class="status ${cashRisk ? "risk" : "good"}">${cashRisk ? "Cash warning: this plan goes negative. Reduce spending, borrow more, or plan lower production." : "Cash check: this plan stays positive."}<br>${allocationWarning}</div>`;
  return r;
}

function refresh() {
  const safe = renderResults("safe"), growth = renderResults("growth");
  const winner = safe.closingCash >= growth.closingCash ? "Safe winter" : "Growth winter";
  const chosen = winner === "Safe winter" ? safe : growth;
  document.querySelector("#recommendation-text").textContent = `${winner} is currently the recommended option because it gives the stronger closing-cash position (${money(chosen.closingCash)}). Change the yellow figures to test your own decision.`;
}

for (const name of Object.keys(plans)) renderInputs(name);
document.addEventListener("input", event => { if (!event.target.matches("input[data-plan]")) return; plans[event.target.dataset.plan][event.target.dataset.key] = number(event.target.value); refresh(); });
refresh();
