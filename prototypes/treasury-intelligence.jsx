import { useState, useEffect, useMemo, useRef } from "react";
import * as recharts from "recharts";
const { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine, Cell, ComposedChart, Line } = recharts;

// ═══════════════════════════════════════════════════════════════════════
// REAL CARDANO TREASURY DATA MODEL
// Sources: Koios, CExplorer, Cardano Docs monetary policy, Intersect
// ═══════════════════════════════════════════════════════════════════════

const SNAPSHOT = "2026-02-09";
const ADA_PRICE_USD = 0.28;

// Core protocol parameters
const MAX_SUPPLY = 45_000_000_000;
const CIRCULATING_SUPPLY = 36_100_000_000;
const RESERVE = MAX_SUPPLY - CIRCULATING_SUPPLY; // ~8.9B
const RHO = 0.003; // 0.3% of reserve per epoch
const TAU = 0.20;  // 20% of reward pot → treasury
const EPOCH_DAYS = 5;
const CURRENT_EPOCH = 610;
const TX_FEES_PER_EPOCH = 150_000; // ~150K ADA in tx fees per epoch (conservative)

// Treasury state
const TREASURY_BALANCE = 1_800_000_000; // ~1.8B ADA
const TREASURY_INCOME_PER_EPOCH = 5_000_000; // ~5M ADA/epoch
const TREASURY_INCOME_PER_YEAR = 365_000_000; // ~365M ADA/year (declining)

// Net Change Limits
const NCL_2025 = { amount: 350_000_000, start_epoch: 532, end_epoch: 612, label: "2025 NCL (extended)" };
const NCL_2026_PROPOSED = { amount: 300_000_000, start_epoch: 613, end_epoch: 713, label: "2026 NCL (proposed)" };

// Known spending / proposed
const BUDGET_2025 = { amount: 275_269_340, label: "2025 Budget (39 proposals)", status: "ratified" };
const DEFI_LIQUIDITY = { amount: 50_000_000, label: "DeFi Liquidity Budget", status: "ratified" };
const PENTAD_INFRA = { amount: 70_000_000, label: "Pentad Infrastructure", status: "proposed" };
const DEFI_WITHDRAWAL_1 = { amount: 500_000, label: "DeFi Liquidity Withdrawal 1", status: "active" };

// All known/proposed treasury outflows
const SPENDING_ITEMS = [
  { label: "2025 Budget (Intersect, 39 proposals)", amount: 275_269_340, status: "ratified", mechanism: "BudgetAction", flags: 0, url: "" },
  { label: "DeFi Liquidity Budget", amount: 50_000_000, status: "ratified", mechanism: "BudgetAction", flags: 0, url: "" },
  { label: "Pentad Infrastructure (IOG+EMURGO+CF+Midnight+Intersect)", amount: 70_000_000, status: "proposed", mechanism: "TreasuryWithdrawal", flags: 0, url: "" },
  { label: "DeFi Liquidity — Withdrawal 1", amount: 500_000, status: "active", mechanism: "TreasuryWithdrawal", flags: 1, url: "https://gov.tools/governance_actions/4b10e5793208cb8f228756e02113227c91602248eac4d992681a0ee760b6c4e2#0" },
  { label: "Tempo.Vote — Mobile Governance", amount: 150_000, status: "ratified", mechanism: "TreasuryWithdrawal", flags: 1, url: "" },
  { label: "PRAGMA — Amaru Node Dev", amount: 8_500_000, status: "ratified", mechanism: "TreasuryWithdrawal", flags: 0, url: "" },
];

const TOTAL_PROPOSED_SPENDING = SPENDING_ITEMS.reduce((s, i) => s + i.amount, 0);

// ═══════════════════════════════════════════════════════════════════════
// PROJECTION MODEL — "Your checking account, but for a blockchain"
// ═══════════════════════════════════════════════════════════════════════

function projectTreasury(years, spendPerYear) {
  const points = [];
  let balance = TREASURY_BALANCE;
  let reserve = RESERVE;
  const epochsPerYear = 365 / EPOCH_DAYS;
  for (let y = 0; y <= years; y++) {
    const yearLabel = 2026 + y;
    // Income for this year: sum of epoch-level treasury contributions
    let yearIncome = 0;
    for (let e = 0; e < epochsPerYear; e++) {
      const expansion = reserve * RHO;
      const pot = expansion + TX_FEES_PER_EPOCH;
      const toTreasury = pot * TAU;
      yearIncome += toTreasury;
      reserve -= expansion;
    }
    const yearSpend = y === 0 ? spendPerYear * 0.3 : spendPerYear; // ramp in first year
    balance = balance + yearIncome - yearSpend;
    points.push({
      year: yearLabel,
      balance: Math.round(balance),
      income: Math.round(yearIncome),
      spending: Math.round(yearSpend),
      net: Math.round(yearIncome - yearSpend),
      reserve: Math.round(reserve)
    });
  }
  return points;
}

// ═══════════════════════════════════════════════════════════════════════
// FONT & STYLE INJECTION
// ═══════════════════════════════════════════════════════════════════════

function useStyles() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
      @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      @keyframes countUp { from{opacity:0} to{opacity:1} }
      * { box-sizing:border-box; margin:0; padding:0; }
      body { background:#06080e; margin:0; }
      ::-webkit-scrollbar { width:5px; height:5px; }
      ::-webkit-scrollbar-track { background:#0a0e18; }
      ::-webkit-scrollbar-thumb { background:#1e2a45; border-radius:3px; }
      input[type="range"] { -webkit-appearance:none; background:transparent; width:100%; }
      input[type="range"]::-webkit-slider-track { height:4px; background:#1e2a45; border-radius:2px; }
      input[type="range"]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:#00d4ff; cursor:pointer; margin-top:-7px; border:2px solid #06080e; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(link); document.head.removeChild(style); };
  }, []);
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function TreasuryHub() {
  useStyles();
  const [tab, setTab] = useState("account");
  const [spendScenario, setSpendScenario] = useState(300); // M ADA per year
  const [showUsd, setShowUsd] = useState(false);

  const fmt = (n, decimals = 0) => {
    if (n == null) return "—";
    const val = showUsd ? n * ADA_PRICE_USD : n;
    const prefix = showUsd ? "$" : "";
    const suffix = showUsd ? "" : " ₳";
    if (Math.abs(val) >= 1e9) return `${prefix}${(val / 1e9).toFixed(1)}B${suffix}`;
    if (Math.abs(val) >= 1e6) return `${prefix}${(val / 1e6).toFixed(decimals)}M${suffix}`;
    if (Math.abs(val) >= 1e3) return `${prefix}${(val / 1e3).toFixed(0)}K${suffix}`;
    return `${prefix}${val.toLocaleString()}${suffix}`;
  };

  // Projection data
  const projection = useMemo(() => projectTreasury(10, spendScenario * 1e6), [spendScenario]);
  const projChart = projection.map(p => ({
    year: p.year,
    Balance: showUsd ? Math.round(p.balance * ADA_PRICE_USD) : p.balance,
    Income: showUsd ? Math.round(p.income * ADA_PRICE_USD) : p.income,
    Spending: showUsd ? Math.round(p.spending * ADA_PRICE_USD) : p.spending,
  }));

  // When does balance go negative?
  const depletionYear = projection.find(p => p.balance <= 0)?.year || null;

  // Spending bar data
  const spendBars = SPENDING_ITEMS
    .sort((a, b) => b.amount - a.amount)
    .map(s => ({
      name: s.label.length > 28 ? s.label.slice(0, 26) + "…" : s.label,
      amount: showUsd ? Math.round(s.amount * ADA_PRICE_USD) : s.amount,
      status: s.status,
      fill: s.status === "active" ? "#00d4ff" : s.status === "ratified" ? "#4caf50" : "#ffa726"
    }));

  // Income vs spend per-year comparison
  const annualCompare = [
    { label: "Annual Income", value: showUsd ? Math.round(TREASURY_INCOME_PER_YEAR * ADA_PRICE_USD) : TREASURY_INCOME_PER_YEAR, fill: "#4caf50" },
    { label: "NCL (Spend Limit)", value: showUsd ? Math.round(NCL_2026_PROPOSED.amount * ADA_PRICE_USD) : NCL_2026_PROPOSED.amount, fill: "#ffa726" },
    { label: "Proposed Spend", value: showUsd ? Math.round(TOTAL_PROPOSED_SPENDING * ADA_PRICE_USD) : TOTAL_PROPOSED_SPENDING, fill: TOTAL_PROPOSED_SPENDING > TREASURY_INCOME_PER_YEAR ? "#ff5252" : "#00d4ff" },
  ];

  // Epoch income waterfall
  const epochWaterfall = (() => {
    const expansion = RESERVE * RHO;
    const pot = expansion + TX_FEES_PER_EPOCH;
    const toTreasury = pot * TAU;
    const toStakers = pot * (1 - TAU);
    return [
      { step: "Reserve Expansion", value: showUsd ? Math.round(expansion * ADA_PRICE_USD) : Math.round(expansion), fill: "#1e88e5" },
      { step: "Transaction Fees", value: showUsd ? Math.round(TX_FEES_PER_EPOCH * ADA_PRICE_USD) : TX_FEES_PER_EPOCH, fill: "#26a69a" },
      { step: "→ To Treasury (20%)", value: showUsd ? Math.round(toTreasury * ADA_PRICE_USD) : Math.round(toTreasury), fill: "#4caf50" },
      { step: "→ To Stakers (80%)", value: showUsd ? Math.round(toStakers * ADA_PRICE_USD) : Math.round(toStakers), fill: "#7e57c2" },
    ];
  })();

  const TABS = [
    { id: "account", label: "Your Treasury", icon: "🏦" },
    { id: "income", label: "How Money Comes In", icon: "📥" },
    { id: "spending", label: "Where Money Goes", icon: "📤" },
    { id: "forecast", label: "Can We Afford It?", icon: "📈" },
    { id: "limits", label: "Guardrails", icon: "🛡️" },
  ];

  return (
    <div style={S.root}>
      {/* Header */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={S.logoOrb} />
            <div>
              <div style={S.logoMark}>BEACN</div>
              <h1 style={S.heroTitle}>Treasury Intelligence</h1>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setShowUsd(!showUsd)} style={S.toggleBtn}>
              {showUsd ? "💵 USD" : "₳ ADA"}
            </button>
            <span style={S.snapshotBadge}>Snapshot {SNAPSHOT}</span>
          </div>
        </div>
        {/* Analogy banner */}
        <div style={S.analogyBanner}>
          <span style={{ fontSize: 20 }}>💡</span>
          <span>Think of the Cardano Treasury like a <strong>community checking account</strong>. It has a balance, gets regular deposits, and people vote on how to spend it. This dashboard shows: how much is in the account, what's coming in, what's going out, and whether the math adds up.</span>
        </div>
      </header>

      {/* Nav */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ ...S.navBtn, ...(tab === t.id ? S.navActive : {}) }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main style={S.main}>
        {tab === "account" && <AccountTab fmt={fmt} showUsd={showUsd} projection={projection} />}
        {tab === "income" && <IncomeTab fmt={fmt} showUsd={showUsd} epochWaterfall={epochWaterfall} />}
        {tab === "spending" && <SpendingTab fmt={fmt} showUsd={showUsd} spendBars={spendBars} />}
        {tab === "forecast" && <ForecastTab fmt={fmt} showUsd={showUsd} projection={projection} projChart={projChart} spendScenario={spendScenario} setSpendScenario={setSpendScenario} depletionYear={depletionYear} />}
        {tab === "limits" && <GuardrailsTab fmt={fmt} showUsd={showUsd} annualCompare={annualCompare} />}
      </main>

      <footer style={S.footer}>
        BEACN Treasury Intelligence · Snapshot {SNAPSHOT} · Not voting advice · ADA price used: ${ADA_PRICE_USD} ·{" "}
        <a href="https://github.com/BEACNpool/Governance" target="_blank" rel="noopener" style={{ color: "#00d4ff" }}>Open Source (MIT)</a>
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB: YOUR TREASURY (the "bank account" overview)
// ═══════════════════════════════════════════════════════════════════════

function AccountTab({ fmt, showUsd, projection }) {
  const netPerYear = TREASURY_INCOME_PER_YEAR - TOTAL_PROPOSED_SPENDING;
  const spendRatio = ((TOTAL_PROPOSED_SPENDING / TREASURY_INCOME_PER_YEAR) * 100).toFixed(0);
  const yearsOfRunway = TOTAL_PROPOSED_SPENDING > 0 ? (TREASURY_BALANCE / TOTAL_PROPOSED_SPENDING).toFixed(1) : "∞";
  const nclHeadroom = NCL_2026_PROPOSED.amount - TOTAL_PROPOSED_SPENDING;

  return (
    <div>
      {/* Big balance hero */}
      <div style={S.balanceHero}>
        <div style={S.balanceLabel}>Treasury Balance</div>
        <div style={S.balanceValue}>{fmt(TREASURY_BALANCE)}</div>
        <div style={S.balanceSub}>
          {showUsd ? `${(TREASURY_BALANCE).toLocaleString()} ADA` : `≈ $${(TREASURY_BALANCE * ADA_PRICE_USD / 1e6).toFixed(0)}M USD`}
          {" · "}as of epoch ~{CURRENT_EPOCH}
        </div>
      </div>

      {/* The 4 numbers every voter needs */}
      <div style={{ ...S.card, borderLeft: "3px solid #00d4ff", marginBottom: 14 }}>
        <h3 style={{ ...S.cardTitle, color: "#00d4ff", marginBottom: 8 }}>The 4 Numbers Every Voter Needs</h3>
        <p style={{ color: "#8899b0", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          Before voting on any proposal, check these numbers. If spending outpaces income, the treasury shrinks — and there's no bailout.
        </p>
      </div>

      <div style={S.statsGrid}>
        <StatBox icon="🏦" label="What We Have" value={fmt(TREASURY_BALANCE)} sub="Current treasury balance" color="#00d4ff" />
        <StatBox icon="📥" label="What We Earn (per year)" value={fmt(TREASURY_INCOME_PER_YEAR)} sub={`~${fmt(TREASURY_INCOME_PER_EPOCH)} every 5 days · declining`} color="#4caf50" />
        <StatBox icon="📤" label="What's Proposed to Spend" value={fmt(TOTAL_PROPOSED_SPENDING)} sub={`${SPENDING_ITEMS.length} proposals indexed`} color={TOTAL_PROPOSED_SPENDING > TREASURY_INCOME_PER_YEAR ? "#ff5252" : "#ffa726"} />
        <StatBox icon="🛡️" label="Spending Cap (NCL)" value={fmt(NCL_2026_PROPOSED.amount)} sub={nclHeadroom >= 0 ? `${fmt(nclHeadroom)} headroom left` : "Over the limit!"} color={nclHeadroom >= 0 ? "#26a69a" : "#ff5252"} />
      </div>

      {/* The verdict bar */}
      <div style={{ ...S.card, padding: "20px 24px", marginBottom: 14, background: parseInt(spendRatio) > 100 ? "#1a0808" : parseInt(spendRatio) > 80 ? "#1a1508" : "#081a0a", border: `1px solid ${parseInt(spendRatio) > 100 ? "#3a1515" : parseInt(spendRatio) > 80 ? "#3a2a10" : "#153a15"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#e0e6ed" }}>
            {parseInt(spendRatio) > 100 ? "🔴" : parseInt(spendRatio) > 80 ? "🟡" : "🟢"} Spend-to-Income Ratio
          </span>
          <span style={{ fontSize: 28, fontWeight: 800, fontFamily: "'DM Mono'", color: parseInt(spendRatio) > 100 ? "#ff5252" : parseInt(spendRatio) > 80 ? "#ffa726" : "#4caf50" }}>
            {spendRatio}%
          </span>
        </div>
        <div style={{ height: 14, background: "#111a2e", borderRadius: 7, overflow: "hidden", marginBottom: 10 }}>
          <div style={{
            width: `${Math.min(100, parseInt(spendRatio))}%`,
            height: "100%",
            borderRadius: 7,
            background: parseInt(spendRatio) > 100 ? "linear-gradient(90deg, #ff5252, #ff8a80)" : parseInt(spendRatio) > 80 ? "linear-gradient(90deg, #ffa726, #ffcc80)" : "linear-gradient(90deg, #4caf50, #81c784)",
            transition: "width 0.6s ease"
          }} />
        </div>
        <div style={{ fontSize: 13, color: "#8899b0", lineHeight: 1.6 }}>
          {parseInt(spendRatio) > 100 
            ? "Proposed spending exceeds what the treasury earns per year. This is like spending $110 when you only make $100. The balance will shrink."
            : parseInt(spendRatio) > 80 
            ? "Proposed spending is over 80% of annual income. There's little room for new proposals without tipping into deficit."
            : "Spending is within the treasury's annual income. There's room for the treasury to stay healthy — but remember, income declines each year."}
        </div>
      </div>

      {/* Personal finance analogy */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>🏠 Your finances vs. the treasury</h3>
        <p style={{ color: "#667", fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
          Every ADA holder is a stakeholder. Here's how the treasury works in terms you already understand:
        </p>
        <div style={S.analogyGrid}>
          <AnalogyRow
            personal="Your savings"
            treasury={`${fmt(TREASURY_BALANCE)} in the account`}
            icon="🏦"
          />
          <AnalogyRow
            personal="Your annual income"
            treasury={`~${fmt(TREASURY_INCOME_PER_YEAR)}/year (${fmt(TREASURY_INCOME_PER_EPOCH)} every 5 days)`}
            icon="💰"
          />
          <AnalogyRow
            personal="Total bills on the table"
            treasury={`${fmt(TOTAL_PROPOSED_SPENDING)} in proposals`}
            icon="🧾"
          />
          <AnalogyRow
            personal="Your spending limit"
            treasury={`NCL caps withdrawals at ${fmt(NCL_2026_PROPOSED.amount)}`}
            icon="💳"
          />
          <AnalogyRow
            personal="How long your money lasts"
            treasury={`~${yearsOfRunway} years at this spend rate (if income held steady)`}
            icon="⏳"
          />
          <AnalogyRow
            personal="The catch"
            treasury="Your income shrinks every year — the reserve it comes from is running out"
            icon="📉"
          />
        </div>
      </div>

      <div style={{ ...S.card, borderLeft: "3px solid #ffa726" }}>
        <div style={{ fontSize: 13, color: "#c0c8d8", lineHeight: 1.7 }}>
          <strong style={{ color: "#ffa726" }}>⚠️ Why this matters for every vote:</strong> Every "Yes" on a treasury withdrawal is a check written against this account. The treasury earns ~{fmt(TREASURY_INCOME_PER_YEAR)} per year right now — but that number drops every year as the reserve depletes. If we approve more than we earn, the balance shrinks. There's no central bank to print more ADA. The max supply is 45B, period.
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB: HOW MONEY COMES IN
// ═══════════════════════════════════════════════════════════════════════

function IncomeTab({ fmt, showUsd, epochWaterfall }) {
  return (
    <div>
      <div style={S.card}>
        <h3 style={S.cardTitle}>📥 Where Treasury Income Comes From</h3>
        <p style={{ color: "#8899b0", fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
          Every 5 days (one epoch), the protocol creates new ADA from the reserve and collects transaction fees. 
          These go into a "reward pot." <strong>20% goes to the treasury</strong>, the other 80% goes to stakers and pool operators.
        </p>

        {/* Flow diagram */}
        <div style={S.flowDiagram}>
          <FlowStep label="ADA Reserve" value={fmt(RESERVE)} sub={`${((RESERVE/MAX_SUPPLY)*100).toFixed(1)}% of max supply`} color="#1e88e5" />
          <div style={S.flowArrow}>→ 0.3% per epoch →</div>
          <FlowStep label="Reward Pot" value={fmt(RESERVE * RHO + TX_FEES_PER_EPOCH)} sub="expansion + tx fees" color="#26a69a" />
          <div style={S.flowArrow}>→ split →</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <FlowStep label="Treasury (20%)" value={fmt((RESERVE * RHO + TX_FEES_PER_EPOCH) * TAU)} sub="per epoch" color="#4caf50" />
            <FlowStep label="Stakers (80%)" value={fmt((RESERVE * RHO + TX_FEES_PER_EPOCH) * (1 - TAU))} sub="per epoch" color="#7e57c2" />
          </div>
        </div>
      </div>

      <div style={S.card}>
        <h3 style={S.cardTitle}>Per-Epoch Breakdown (every 5 days)</h3>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={epochWaterfall} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#111a2e" />
              <XAxis type="number" tickFormatter={v => fmt(v)} tick={{ fill: "#667", fontSize: 11 }} />
              <YAxis type="category" dataKey="step" width={160} tick={{ fill: "#8899b0", fontSize: 11 }} />
              <Tooltip formatter={v => fmt(v)} contentStyle={S.tooltipStyle} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {epochWaterfall.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={S.statsGrid}>
        <StatBox icon="⏰" label="Per Epoch (~5 days)" value={fmt(TREASURY_INCOME_PER_EPOCH)} sub="Deposited automatically by the protocol" color="#4caf50" />
        <StatBox icon="📆" label="Per Year (~73 epochs)" value={fmt(TREASURY_INCOME_PER_YEAR)} sub="Total annual income (declining each year)" color="#4caf50" />
        <StatBox icon="🛡️" label="Per NCL Period" value={fmt(TREASURY_INCOME_PER_YEAR)} sub={`The NCL spending cap is ${fmt(NCL_2026_PROPOSED.amount)}`} color="#26a69a" />
        <StatBox icon="📉" label="Income Trend" value="Declining" sub="Reserve shrinks → deposits get smaller over time" color="#ffa726" />
      </div>

      <div style={{ ...S.card, borderLeft: "3px solid #1e88e5" }}>
        <div style={{ fontSize: 13, color: "#c0c8d8", lineHeight: 1.7 }}>
          <strong style={{ color: "#1e88e5" }}>🔑 Key parameters:</strong>{" "}
          <code style={S.code}>ρ = 0.3%</code> (how much reserve is drawn per epoch) and{" "}
          <code style={S.code}>τ = 20%</code> (treasury's share of the pot). 
          There's a live governance proposal to reduce τ to 10% — which would halve treasury income. 
          That's why understanding these numbers matters before voting.
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB: WHERE MONEY GOES
// ═══════════════════════════════════════════════════════════════════════

function SpendingTab({ fmt, showUsd, spendBars }) {
  return (
    <div>
      <div style={S.card}>
        <h3 style={S.cardTitle}>📤 All Known/Proposed Treasury Spending</h3>
        <div style={{ height: Math.max(280, spendBars.length * 50) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={spendBars} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#111a2e" />
              <XAxis type="number" tickFormatter={v => fmt(v)} tick={{ fill: "#667", fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={220} tick={{ fill: "#8899b0", fontSize: 11 }} />
              <Tooltip formatter={v => fmt(v)} contentStyle={S.tooltipStyle} />
              <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                {spendBars.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          <LegendDot color="#00d4ff" label="Active (voting now)" />
          <LegendDot color="#4caf50" label="Ratified (approved)" />
          <LegendDot color="#ffa726" label="Proposed (pending)" />
        </div>
      </div>

      {/* Spending table */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>Spending Ledger</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Item</th>
                <th style={{ ...S.th, textAlign: "right" }}>Amount</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Mechanism</th>
                <th style={S.th}>Flags</th>
              </tr>
            </thead>
            <tbody>
              {SPENDING_ITEMS.sort((a, b) => b.amount - a.amount).map((s, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #111a2e" }}>
                  <td style={S.td}>
                    {s.url ? <a href={s.url} target="_blank" rel="noopener" style={{ color: "#00d4ff", textDecoration: "none" }}>{s.label}</a> : s.label}
                  </td>
                  <td style={{ ...S.td, textAlign: "right", fontFamily: "'DM Mono'", fontWeight: 500, color: "#e0e6ed" }}>{fmt(s.amount)}</td>
                  <td style={S.td}>
                    <span style={{ ...S.badge, background: s.status === "active" ? "#002a3d" : s.status === "ratified" ? "#0a2a15" : "#2a1a05", color: s.status === "active" ? "#00d4ff" : s.status === "ratified" ? "#4caf50" : "#ffa726" }}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ ...S.td, fontSize: 11, color: "#667" }}>{s.mechanism}</td>
                  <td style={S.td}>
                    {s.flags > 0
                      ? <span style={{ ...S.badge, background: "#2a1015", color: "#ff5252" }}>🚩 {s.flags}</span>
                      : <span style={{ color: "#4caf50", fontSize: 11 }}>✓</span>}
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: "2px solid #1e2a45" }}>
                <td style={{ ...S.td, fontWeight: 700, color: "#e0e6ed" }}>TOTAL</td>
                <td style={{ ...S.td, textAlign: "right", fontFamily: "'DM Mono'", fontWeight: 700, color: "#00d4ff", fontSize: 15 }}>{fmt(TOTAL_PROPOSED_SPENDING)}</td>
                <td colSpan={3} style={S.td}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...S.card, borderLeft: `3px solid ${TOTAL_PROPOSED_SPENDING > TREASURY_INCOME_PER_YEAR ? "#ff5252" : "#4caf50"}` }}>
        <div style={{ fontSize: 13, color: "#c0c8d8", lineHeight: 1.7 }}>
          {TOTAL_PROPOSED_SPENDING > TREASURY_INCOME_PER_YEAR ? (
            <><strong style={{ color: "#ff5252" }}>🔴 Spending exceeds annual income.</strong> Total proposed: {fmt(TOTAL_PROPOSED_SPENDING)} vs annual income: {fmt(TREASURY_INCOME_PER_YEAR)}. This is like spending $11/week when you earn $10/week. The balance will shrink.</>
          ) : (
            <><strong style={{ color: "#4caf50" }}>🟢 Spending is within annual income.</strong> Total proposed: {fmt(TOTAL_PROPOSED_SPENDING)} vs annual income: {fmt(TREASURY_INCOME_PER_YEAR)}. Headroom: {fmt(TREASURY_INCOME_PER_YEAR - TOTAL_PROPOSED_SPENDING)}. But remember — income declines each year.</>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB: CAN WE AFFORD IT? (projection)
// ═══════════════════════════════════════════════════════════════════════

function ForecastTab({ fmt, showUsd, projection, projChart, spendScenario, setSpendScenario, depletionYear }) {
  return (
    <div>
      <div style={S.card}>
        <h3 style={S.cardTitle}>📈 Treasury Projection: Balance Over Time</h3>
        <p style={{ color: "#8899b0", fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
          Drag the slider to model different annual spending levels. Watch how the balance responds — and when (if ever) the treasury runs out.
        </p>

        {/* Scenario slider */}
        <div style={{ marginBottom: 20, padding: "16px 20px", background: "#0a0f1a", borderRadius: 10, border: "1px solid #151d30" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "#667", fontFamily: "'DM Mono'" }}>Annual Spending Scenario</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#00d4ff", fontFamily: "'DM Mono'" }}>{fmt(spendScenario * 1e6)}/yr</span>
          </div>
          <input
            type="range"
            min={50}
            max={600}
            step={10}
            value={spendScenario}
            onChange={e => setSpendScenario(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#445", fontFamily: "'DM Mono'", marginTop: 4 }}>
            <span>50M/yr (minimal)</span>
            <span>300M/yr (NCL)</span>
            <span>600M/yr (aggressive)</span>
          </div>
        </div>

        {/* Verdict */}
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 8, background: depletionYear ? "#1a0a0a" : "#0a1a0a", border: `1px solid ${depletionYear ? "#3a1515" : "#153a15"}` }}>
          {depletionYear ? (
            <span style={{ color: "#ff5252", fontSize: 14, fontWeight: 600 }}>
              ⚠️ At {fmt(spendScenario * 1e6)}/year, the treasury runs dry by <strong>{depletionYear}</strong>. Not sustainable.
            </span>
          ) : (
            <span style={{ color: "#4caf50", fontSize: 14, fontWeight: 600 }}>
              ✅ At {fmt(spendScenario * 1e6)}/year, the treasury stays positive through 2036.
            </span>
          )}
        </div>

        {/* Chart */}
        <div style={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={projChart} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#111a2e" />
              <XAxis dataKey="year" tick={{ fill: "#667", fontSize: 11 }} />
              <YAxis tickFormatter={v => fmt(v)} tick={{ fill: "#667", fontSize: 11 }} />
              <Tooltip formatter={v => fmt(v)} contentStyle={S.tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#8899b0" }} />
              <Area type="monotone" dataKey="Balance" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.08} strokeWidth={2.5} />
              <Line type="monotone" dataKey="Income" stroke="#4caf50" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="Spending" stroke="#ff5252" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              <ReferenceLine y={0} stroke="#ff5252" strokeDasharray="3 3" label={{ value: "Empty", fill: "#ff5252", fontSize: 10 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Year-by-year table */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>Year-by-Year Breakdown</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Year</th>
                <th style={{ ...S.th, textAlign: "right" }}>Income</th>
                <th style={{ ...S.th, textAlign: "right" }}>Spending</th>
                <th style={{ ...S.th, textAlign: "right" }}>Net</th>
                <th style={{ ...S.th, textAlign: "right" }}>Balance</th>
                <th style={S.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {projection.map((p, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #111a2e", opacity: p.balance < 0 ? 0.4 : 1 }}>
                  <td style={{ ...S.td, fontWeight: 600, color: "#e0e6ed" }}>{p.year}</td>
                  <td style={{ ...S.td, textAlign: "right", color: "#4caf50", fontFamily: "'DM Mono'" }}>{fmt(p.income)}</td>
                  <td style={{ ...S.td, textAlign: "right", color: "#ff5252", fontFamily: "'DM Mono'" }}>{fmt(p.spending)}</td>
                  <td style={{ ...S.td, textAlign: "right", color: p.net >= 0 ? "#4caf50" : "#ff5252", fontFamily: "'DM Mono'", fontWeight: 600 }}>{p.net >= 0 ? "+" : ""}{fmt(p.net)}</td>
                  <td style={{ ...S.td, textAlign: "right", color: p.balance > 0 ? "#e0e6ed" : "#ff5252", fontFamily: "'DM Mono'", fontWeight: 700 }}>{fmt(p.balance)}</td>
                  <td style={S.td}>
                    {p.balance <= 0 ? <span style={{ color: "#ff5252" }}>💀 Depleted</span>
                     : p.net < 0 ? <span style={{ color: "#ffa726" }}>⚠️ Deficit</span>
                     : <span style={{ color: "#4caf50" }}>✅ Healthy</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB: GUARDRAILS
// ═══════════════════════════════════════════════════════════════════════

function GuardrailsTab({ fmt, showUsd, annualCompare }) {
  const nclUsed = TOTAL_PROPOSED_SPENDING;
  const nclRemaining = NCL_2026_PROPOSED.amount - nclUsed;
  const nclPct = ((nclUsed / NCL_2026_PROPOSED.amount) * 100).toFixed(0);

  return (
    <div>
      <div style={S.card}>
        <h3 style={S.cardTitle}>🛡️ Net Change Limit (NCL) — The Spending Cap</h3>
        <p style={{ color: "#8899b0", fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
          The NCL is like a <strong>credit card limit</strong> — it's the maximum total ADA that can be withdrawn from the treasury during a set period. DReps vote to set it. Even if the balance is higher, withdrawals can't exceed this cap.
        </p>

        {/* NCL gauge */}
        <div style={{ padding: "20px 24px", background: "#0a0f1a", borderRadius: 10, border: "1px solid #151d30", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "#667", fontFamily: "'DM Mono'" }}>NCL Utilization (Proposed 2026)</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: parseInt(nclPct) > 90 ? "#ff5252" : "#00d4ff", fontFamily: "'DM Mono'" }}>{nclPct}% used</span>
          </div>
          <div style={{ height: 24, background: "#111a2e", borderRadius: 12, overflow: "hidden", position: "relative" }}>
            <div style={{
              width: `${Math.min(100, parseInt(nclPct))}%`,
              height: "100%",
              background: parseInt(nclPct) > 90 ? "linear-gradient(90deg, #ff5252, #ff8a80)" : parseInt(nclPct) > 70 ? "linear-gradient(90deg, #ffa726, #ffcc80)" : "linear-gradient(90deg, #00d4ff, #40e0d0)",
              borderRadius: 12,
              transition: "width 0.6s ease"
            }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,.5)", fontFamily: "'DM Mono'" }}>
              {fmt(nclUsed)} of {fmt(NCL_2026_PROPOSED.amount)}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#556", fontFamily: "'DM Mono'" }}>
            <span>Remaining: {fmt(nclRemaining)}</span>
            <span>Period: Epochs {NCL_2026_PROPOSED.start_epoch}–{NCL_2026_PROPOSED.end_epoch}</span>
          </div>
        </div>
      </div>

      {/* Income vs Limit vs Spend comparison */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>The Three Numbers That Matter</h3>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={annualCompare} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#111a2e" />
              <XAxis dataKey="label" tick={{ fill: "#8899b0", fontSize: 11 }} />
              <YAxis tickFormatter={v => fmt(v)} tick={{ fill: "#667", fontSize: 11 }} />
              <Tooltip formatter={v => fmt(v)} contentStyle={S.tooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {annualCompare.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: "#8899b0", lineHeight: 1.7 }}>
          <strong>Annual Income</strong> = what the treasury earns per year from protocol rewards.{" "}
          <strong>NCL</strong> = the max anyone can vote to withdraw.{" "}
          <strong>Proposed Spend</strong> = what's actually queued up. All three need to balance.
        </div>
      </div>

      {/* Constitution references */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>Constitutional Guardrails</h3>
        <div style={{ display: "grid", gap: 10 }}>
          <GuardrailRow id="TREASURY-02a" text="Treasury withdrawals must not exceed the active Net Change Limit." status="enforced" />
          <GuardrailRow id="TREASURY-04a" text="Treasury withdrawal roadmaps must follow the constitution's budget process." status="enforced" />
          <GuardrailRow id="Art. IV §3" text="A Net Change Limit must be agreed upon by DReps before any treasury withdrawal." status="enforced" />
          <GuardrailRow id="τ = 20%" text="Treasury receives 20% of the reward pot. A proposal to change this to 10% has been submitted (expired)." status="active param" />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

function StatBox({ icon, label, value, sub, color }) {
  return (
    <div style={{ ...S.card, borderTop: `3px solid ${color}`, flex: "1 1 220px", minWidth: 220 }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 11, color: "#667", textTransform: "uppercase", letterSpacing: 1, fontFamily: "'DM Mono'", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "'DM Mono'", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#556", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function AnalogyRow({ personal, treasury, icon }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr", gap: 12, padding: "10px 0", borderBottom: "1px solid #111a2e", alignItems: "center" }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 13, color: "#8899b0" }}>{personal}</span>
      <span style={{ fontSize: 13, color: "#e0e6ed", fontWeight: 500 }}>{treasury}</span>
    </div>
  );
}

function FlowStep({ label, value, sub, color }) {
  return (
    <div style={{ padding: "14px 18px", background: `${color}11`, border: `1px solid ${color}33`, borderRadius: 10, minWidth: 140, textAlign: "center" }}>
      <div style={{ fontSize: 11, color: "#8899b0", marginBottom: 4, fontFamily: "'DM Mono'" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "'DM Mono'" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "#556", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
      <span style={{ fontSize: 11, color: "#8899b0" }}>{label}</span>
    </div>
  );
}

function GuardrailRow({ id, text, status }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "10px 14px", background: "#0a0f1a", borderRadius: 8, alignItems: "flex-start" }}>
      <code style={{ fontSize: 11, color: "#00d4ff", fontFamily: "'DM Mono'", whiteSpace: "nowrap", minWidth: 110 }}>{id}</code>
      <span style={{ fontSize: 12, color: "#c0c8d8", lineHeight: 1.5, flex: 1 }}>{text}</span>
      <span style={{ ...S.badge, background: status === "enforced" ? "#0a2a15" : "#0d2a3d", color: status === "enforced" ? "#4caf50" : "#00d4ff", fontSize: 10, whiteSpace: "nowrap" }}>{status}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════

const S = {
  root: { background: "#06080e", minHeight: "100vh", fontFamily: "'Instrument Sans', -apple-system, sans-serif", color: "#e0e6ed" },
  header: { background: "linear-gradient(180deg, #0a0f1a 0%, #06080e 100%)", borderBottom: "1px solid #111a2e", padding: "0 20px" },
  headerInner: { maxWidth: 1100, margin: "0 auto", padding: "16px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 },
  logoOrb: { width: 32, height: 32, borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #00d4ff, #0055aa 70%, #002244)", boxShadow: "0 0 16px rgba(0,212,255,.25)" },
  logoMark: { fontSize: 11, fontWeight: 700, color: "#00d4ff", letterSpacing: 3, fontFamily: "'DM Mono'" },
  heroTitle: { fontSize: 17, fontWeight: 700, color: "#e0e6ed", margin: 0, letterSpacing: .3 },
  toggleBtn: { padding: "5px 14px", borderRadius: 8, border: "1px solid #1e2a45", background: "#0a0f1a", color: "#00d4ff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Mono'" },
  snapshotBadge: { fontSize: 10, color: "#556", fontFamily: "'DM Mono'", padding: "4px 10px", borderRadius: 6, border: "1px solid #151d30" },
  analogyBanner: { maxWidth: 1100, margin: "0 auto", padding: "12px 16px", background: "#0d1525", borderRadius: 10, border: "1px solid #151d30", display: "flex", gap: 12, alignItems: "flex-start", fontSize: 13, color: "#8899b0", lineHeight: 1.6, marginBottom: 12 },
  nav: { background: "#080c16", borderBottom: "1px solid #111a2e", padding: "0 20px", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)" },
  navInner: { maxWidth: 1100, margin: "0 auto", display: "flex", gap: 2, overflowX: "auto", padding: "6px 0" },
  navBtn: { padding: "8px 14px", borderRadius: 8, border: "none", background: "transparent", color: "#667", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", transition: "all .2s", fontFamily: "'Instrument Sans', sans-serif" },
  navActive: { background: "#00d4ff12", color: "#00d4ff" },
  main: { maxWidth: 1100, margin: "0 auto", padding: "20px 20px 60px" },
  card: { background: "#0d1220", borderRadius: 10, padding: "18px 20px", border: "1px solid #111a2e", marginBottom: 12 },
  cardTitle: { margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#8899b0", textTransform: "uppercase", letterSpacing: 1, fontFamily: "'DM Mono'" },
  statsGrid: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 },
  analogyGrid: { borderTop: "1px solid #111a2e" },
  balanceHero: { textAlign: "center", padding: "32px 20px", background: "linear-gradient(135deg, #0a1525, #0d1a2e)", borderRadius: 14, border: "1px solid #151d30", marginBottom: 16 },
  balanceLabel: { fontSize: 12, color: "#667", textTransform: "uppercase", letterSpacing: 2, fontFamily: "'DM Mono'", marginBottom: 8 },
  balanceValue: { fontSize: 44, fontWeight: 800, color: "#00d4ff", fontFamily: "'DM Mono'", lineHeight: 1 },
  balanceSub: { fontSize: 12, color: "#556", marginTop: 10, fontFamily: "'DM Mono'" },
  flowDiagram: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center", padding: "16px 0" },
  flowArrow: { fontSize: 12, color: "#445", fontFamily: "'DM Mono'", whiteSpace: "nowrap" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "8px 10px", borderBottom: "2px solid #151d30", color: "#445", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontFamily: "'DM Mono'" },
  td: { padding: "10px 10px", color: "#8899b0", fontSize: 12 },
  badge: { padding: "2px 10px", borderRadius: 10, fontSize: 10, fontWeight: 600, display: "inline-block", fontFamily: "'DM Mono'" },
  code: { padding: "2px 6px", background: "#111a2e", borderRadius: 4, fontSize: 12, color: "#00d4ff", fontFamily: "'DM Mono'" },
  tooltipStyle: { background: "#0d1525", border: "1px solid #1e2a45", borderRadius: 8, color: "#e0e6ed", fontSize: 12 },
  footer: { borderTop: "1px solid #111a2e", padding: "14px 20px", textAlign: "center", fontSize: 10, color: "#334", fontFamily: "'DM Mono'" },
};
