import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";

// ─── SHARED CONSTANTS & HELPERS ──────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const fmt = (n: number) => isNaN(n) ? "$0" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtD = (n: number) => isNaN(n) ? "$0.00" : n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (part: number, whole: number) => (whole === 0 ? "0" : ((part / whole) * 100).toFixed(1));

const defaultIncomeEntry = () => ({ grossProduction: "", adjustments: "", labFees: "", taxRate: "28", notes: "" });

const calcRow = (entry: Record<string, string>) => {
  const gross = parseFloat(entry.grossProduction) || 0;
  const payRate = parseFloat(entry.adjustments) || 0;
  const adjRate = 100 - payRate;
  const adj = (gross * adjRate) / 100;
  const lab = parseFloat(entry.labFees) || 0;
  const taxRate = parseFloat(entry.taxRate) || 0;
  const netProduction = gross - adj;
  const taxableIncome = netProduction - lab;
  const estimatedTax = (taxableIncome * taxRate) / 100;
  const trueIncome = taxableIncome - estimatedTax;
  return { gross, adj, adjRate, payRate, lab, netProduction, taxableIncome, estimatedTax, trueIncome, taxRate };
};

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Playfair+Display:wght@700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #e8e4de; } ::-webkit-scrollbar-thumb { background: #c8a96e; }
  .card { background: #ffffff; border: 1px solid #e2ddd6; border-radius: 2px; }
  .accent { color: #c8a96e; }
  .metric-card { background: #ffffff; border: 1px solid #e2ddd6; border-radius: 2px; padding: 18px; position: relative; overflow: hidden; transition: border-color 0.2s; }
  .metric-card:hover { border-color: #c8a96e44; }
  .metric-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #c8a96e44, transparent); }
  input, select { background: #f5f1eb; border: 1px solid #d0cac2; color: #1c1916; font-family: 'DM Mono', monospace; font-size: 13px; padding: 10px 12px; border-radius: 2px; width: 100%; transition: border-color 0.2s; outline: none; }
  input:focus, select:focus { border-color: #c8a96e; }
  input::placeholder { color: #aaa; }
  select option { background: #ffffff; }
  .btn { background: transparent; border: 1px solid #d0cac2; color: #888; font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; padding: 8px 16px; border-radius: 2px; cursor: pointer; transition: all 0.2s; }
  .btn:hover { border-color: #c8a96e; color: #c8a96e; }
  .btn.active { background: #c8a96e; border-color: #c8a96e; color: #1c1916; font-weight: 500; }
  .btn-sm { background: transparent; border: 1px solid #d0cac2; color: #888; font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; padding: 5px 10px; border-radius: 2px; cursor: pointer; transition: all 0.2s; }
  .btn-sm:hover { border-color: #c8a96e55; color: #c8a96e; }
  .btn-sm.active { background: #c8a96e; border-color: #c8a96e; color: #1c1916; }
  .month-pill { background: transparent; border: 1px solid #d0cac2; color: #888; font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; padding: 6px 10px; border-radius: 2px; cursor: pointer; transition: all 0.15s; position: relative; }
  .month-pill:hover { border-color: #c8a96e55; color: #c8a96e; }
  .month-pill.active { background: #c8a96e15; border-color: #c8a96e; color: #c8a96e; }
  .month-pill.has-data::after { content: ''; position: absolute; top: 4px; right: 4px; width: 4px; height: 4px; border-radius: 50%; background: #6ecfa8; }
  .label { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: #888; margin-bottom: 6px; }
  .sublabel { font-size: 10px; color: #999; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: #999; padding: 8px 12px; text-align: right; border-bottom: 1px solid #e2ddd6; }
  th:first-child { text-align: left; }
  td { padding: 10px 12px; text-align: right; border-bottom: 1px solid #eeeae4; font-size: 12px; color: #888; }
  td:first-child { text-align: left; color: #1c1916; }
  tr:hover td { background: #faf8f5; }
  tr.total-row td { border-top: 1px solid #c8a96e33; color: #1c1916; font-weight: 500; }
  .progress-track { background: #e8e3dc; border-radius: 2px; height: 6px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 2px; transition: width 0.5s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .fade-in { animation: fadeIn 0.3s ease forwards; }
  .section-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  .section-sub { font-size: 10px; color: #999; letter-spacing: 0.06em; margin-bottom: 24px; }
  .input-group { margin-bottom: 16px; }
  .input-hint { font-size: 9px; color: #aaa; margin-top: 4px; }
  .nav-tab { background: transparent; border: none; border-bottom: 2px solid transparent; color: #999; font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 16px 18px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
  .nav-tab:hover { color: #777; }
  .nav-tab.active { color: #c8a96e; border-bottom-color: #c8a96e; }
`;

// ─── BROWSER STORAGE SHIM ─────────────────────────────────────────────────────
const storage = {
  get: (key: string) => Promise.resolve({ value: localStorage.getItem(key) }),
  set: (key: string, value: string) => { localStorage.setItem(key, value); return Promise.resolve(); },
};

// ─── SHARED TOOLTIP ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#ffffff", border:"1px solid #d0cac2", borderRadius:2, padding:"12px 16px", fontFamily:"'DM Mono',monospace", minWidth:160 }}>
      <div style={{ fontSize:10, color:"#c8a96e", letterSpacing:"0.1em", marginBottom:8, textTransform:"uppercase" }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display:"flex", justifyContent:"space-between", gap:20, fontSize:11, marginBottom:3 }}>
          <span style={{ color:"#888", textTransform:"uppercase", letterSpacing:"0.08em" }}>{p.name}</span>
          <span style={{ color:p.color||"#1c1916" }}>{typeof p.value === "number" ? fmt(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. INCOME TRACKER
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardChart({ data }: { data: Record<number, Record<string, string>> }) {
  const [chartType, setChartType] = useState("stacked");
  const chartData = MONTHS.map((month, i) => {
    const c = calcRow(data[i] || defaultIncomeEntry());
    return { month, "Take-Home": Math.max(0, c.trueIncome), "Est. Taxes": c.estimatedTax, "Lab Fees": c.lab, "Write-offs": c.adj, "Gross": c.gross, hasData: c.gross > 0 };
  });
  const hasAnyData = chartData.some(d => d.hasData);
  return (
    <div className="card" style={{ padding:"20px 24px", marginBottom:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <div style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"#888" }}>Monthly Overview</div>
          <div style={{ fontSize:9, color:"#aaa", marginTop:2 }}>Income composition by month</div>
        </div>
        <div style={{ display:"flex", gap:5 }}>
          {[["stacked","Stacked"],["line","Trend"],["grouped","Grouped"]].map(([v,l]) => (
            <button key={v} className={`btn-sm ${chartType===v?"active":""}`} onClick={() => setChartType(v)}>{l}</button>
          ))}
        </div>
      </div>
      {!hasAnyData ? (
        <div style={{ height:180, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8 }}>
          <div style={{ fontSize:11, color:"#ccc", letterSpacing:"0.1em", textTransform:"uppercase" }}>No data yet</div>
          <div style={{ fontSize:9, color:"#ddd" }}>Enter monthly figures to see your chart</div>
        </div>
      ) : (<>
        <div style={{ display:"flex", gap:14, marginBottom:10, flexWrap:"wrap" }}>
          {chartType === "line"
            ? [["Take-Home","#6ecfa8"],["Gross","#c8a96e"]].map(([n,c]) => <div key={n} style={{ display:"flex",alignItems:"center",gap:6 }}><div style={{ width:16,height:2,background:c,borderRadius:1 }}/><span style={{ fontSize:9,color:"#999",textTransform:"uppercase",letterSpacing:"0.08em" }}>{n}</span></div>)
            : [["Take-Home","#6ecfa8"],["Est. Taxes","#e09b3e"],["Lab Fees","#e06b6b"],["Write-offs","#d4cfc8"]].map(([n,c]) => <div key={n} style={{ display:"flex",alignItems:"center",gap:6 }}><div style={{ width:10,height:10,background:c,borderRadius:1 }}/><span style={{ fontSize:9,color:"#999",textTransform:"uppercase",letterSpacing:"0.08em" }}>{n}</span></div>)
          }
        </div>
        <ResponsiveContainer width="100%" height={180}>
          {chartType === "line" ? (
            <LineChart data={chartData} margin={{ top:4,right:4,bottom:0,left:0 }}>
              <XAxis dataKey="month" tick={{ fill:"#999",fontSize:9,fontFamily:"'DM Mono',monospace" }} axisLine={{ stroke:"#e2ddd6" }} tickLine={false}/>
              <YAxis tickFormatter={(v: number) =>`$${(v/1000).toFixed(0)}k`} tick={{ fill:"#aaa",fontSize:9,fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false} width={40}/>
              <Tooltip content={<ChartTooltip />} cursor={{ stroke:"#d0cac2",strokeWidth:1 }}/>
              <Line type="monotone" dataKey="Gross" stroke="#c8a96e" strokeWidth={1.5} dot={{ fill:"#c8a96e",r:3,strokeWidth:0 }} activeDot={{ r:5,strokeWidth:0 }}/>
              <Line type="monotone" dataKey="Take-Home" stroke="#6ecfa8" strokeWidth={2} dot={{ fill:"#6ecfa8",r:3,strokeWidth:0 }} activeDot={{ r:5,strokeWidth:0 }}/>
            </LineChart>
          ) : (
            <BarChart data={chartData} barGap={2} margin={{ top:4,right:4,bottom:0,left:0 }}>
              <XAxis dataKey="month" tick={{ fill:"#999",fontSize:9,fontFamily:"'DM Mono',monospace" }} axisLine={{ stroke:"#e2ddd6" }} tickLine={false}/>
              <YAxis tickFormatter={(v: number) =>`$${(v/1000).toFixed(0)}k`} tick={{ fill:"#aaa",fontSize:9,fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false} width={40}/>
              <Tooltip content={<ChartTooltip />} cursor={{ fill:"#00000005" }}/>
              {chartType === "stacked" ? (<>
                <Bar dataKey="Take-Home" stackId="a" fill="#6ecfa8"/>
                <Bar dataKey="Est. Taxes" stackId="a" fill="#e09b3e"/>
                <Bar dataKey="Lab Fees" stackId="a" fill="#e06b6b"/>
                <Bar dataKey="Write-offs" stackId="a" fill="#d4cfc8" radius={[2,2,0,0]}/>
              </>) : (<>
                <Bar dataKey="Gross" fill="#c8a96e22" stroke="#c8a96e44" strokeWidth={1} radius={[2,2,0,0]}/>
                <Bar dataKey="Take-Home" fill="#6ecfa833" stroke="#6ecfa8" strokeWidth={1} radius={[2,2,0,0]}/>
              </>)}
            </BarChart>
          )}
        </ResponsiveContainer>
      </>)}
    </div>
  );
}

function IncomeTracker({ data, setData, activeYear }: { data: Record<number, Record<string, string>>, setData: (d: any) => void, activeYear: number }) {
  const [view, setView] = useState("dashboard");
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth());

  const save = useCallback(async (newData: any) => {
    setData(newData);
    try { await storage.set(`ait:${activeYear}`, JSON.stringify(newData)); } catch {}
  }, [activeYear, setData]);

  const updateField = (month: number, field: string, value: string) => {
    save({ ...data, [month]: { ...(data[month] || defaultIncomeEntry()), [field]: value } });
  };

  const entry = data[activeMonth] || defaultIncomeEntry();
  const calc = calcRow(entry);

  const annual = MONTHS.reduce((acc, _, i) => {
    const c = calcRow(data[i] || defaultIncomeEntry());
    acc.gross += c.gross; acc.adj += c.adj; acc.lab += c.lab;
    acc.netProduction += c.netProduction; acc.estimatedTax += c.estimatedTax; acc.trueIncome += c.trueIncome;
    return acc;
  }, { gross:0, adj:0, lab:0, netProduction:0, estimatedTax:0, trueIncome:0 });

  const completedMonths = MONTHS.filter((_,i) => data[i] && parseFloat(data[i].grossProduction) > 0).length;

  return (
    <div className="fade-in">
      <div style={{ display:"flex", gap:6, marginBottom:24 }}>
        {[["dashboard","Dashboard"],["entry","Monthly Entry"],["annual","Annual Report"]].map(([v,l]) => (
          <button key={v} className={`btn ${view===v?"active":""}`} onClick={() => setView(v)}>{l}</button>
        ))}
      </div>

      {view === "dashboard" && (<>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:20 }}>
          {[
            { label:"Gross Production", value:fmt(annual.gross), color:"#1c1916" },
            { label:"Write-offs", value:fmt(annual.adj), color:"#e06b6b" },
            { label:"Lab Fees", value:fmt(annual.lab), color:"#e06b6b" },
            { label:"Est. Taxes", value:fmt(annual.estimatedTax), color:"#e09b3e" },
            { label:"True Take-Home", value:fmt(annual.trueIncome), color:annual.trueIncome>=0?"#6ecfa8":"#e06b6b" },
          ].map((m,i) => (
            <div key={i} className="metric-card">
              <div className="label">{m.label}</div>
              <div style={{ fontSize:17, fontWeight:500, color:m.color }}>{m.value}</div>
              <div className="sublabel">{activeYear} YTD</div>
            </div>
          ))}
        </div>
        <DashboardChart data={data}/>
        <div className="card" style={{ padding:"16px 22px", marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div className="label" style={{ margin:0 }}>Year Progress — {completedMonths} of 12 months entered</div>
            <div style={{ fontSize:11, color:"#c8a96e" }}>{((completedMonths/12)*100).toFixed(0)}%</div>
          </div>
          <div className="progress-track"><div className="progress-fill" style={{ width:`${(completedMonths/12)*100}%`, background:"linear-gradient(90deg,#c8a96e,#e0c48e)" }}/></div>
        </div>
        <div className="card">
          <div style={{ padding:"13px 20px", borderBottom:"1px solid #e2ddd6" }}>
            <span style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"#888" }}>Monthly Breakdown — {activeYear}</span>
          </div>
          <table>
            <thead><tr><th>Month</th><th>Gross</th><th>Write-off</th><th>Net Prod.</th><th>Lab Fees</th><th>Est. Tax</th><th>Take-Home</th></tr></thead>
            <tbody>
              {MONTHS.map((m,i) => {
                const c = calcRow(data[i] || defaultIncomeEntry());
                const has = c.gross > 0;
                return (
                  <tr key={i} style={{ cursor:"pointer" }} onClick={() => { setActiveMonth(i); setView("entry"); }}>
                    <td style={{ color:has?"#1c1916":"#bbb" }}>{m}</td>
                    <td style={{ color:has?"#1c1916":"#bbb" }}>{has?fmt(c.gross):"—"}</td>
                    <td style={{ color:has?"#e06b6b":"#bbb" }}>{has?`${fmt(c.adj)} (${c.adjRate}%)`:"—"}</td>
                    <td style={{ color:has?"#888":"#bbb" }}>{has?fmt(c.netProduction):"—"}</td>
                    <td style={{ color:has?"#e06b6b":"#bbb" }}>{has?fmt(c.lab):"—"}</td>
                    <td style={{ color:has?"#e09b3e":"#bbb" }}>{has?fmt(c.estimatedTax):"—"}</td>
                    <td style={{ color:!has?"#bbb":c.trueIncome>=0?"#6ecfa8":"#e06b6b", fontWeight:has?500:400 }}>{has?fmt(c.trueIncome):"—"}</td>
                  </tr>
                );
              })}
              <tr className="total-row">
                <td>TOTAL</td><td>{fmt(annual.gross)}</td>
                <td style={{ color:"#e06b6b" }}>{fmt(annual.adj)}</td>
                <td>{fmt(annual.netProduction)}</td>
                <td style={{ color:"#e06b6b" }}>{fmt(annual.lab)}</td>
                <td style={{ color:"#e09b3e" }}>{fmt(annual.estimatedTax)}</td>
                <td style={{ color:annual.trueIncome>=0?"#6ecfa8":"#e06b6b" }}>{fmt(annual.trueIncome)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </>)}

      {view === "entry" && (<>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:24 }}>
          {MONTHS.map((m,i) => {
            const has = data[i] && parseFloat(data[i].grossProduction) > 0;
            return <button key={i} className={`month-pill ${activeMonth===i?"active":""} ${has?"has-data":""}`} onClick={() => setActiveMonth(i)}>{m}</button>;
          })}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <div className="card" style={{ padding:26 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, marginBottom:4 }}>{MONTHS[activeMonth]} <span className="accent">{activeYear}</span></div>
            <div style={{ fontSize:10, color:"#999", marginBottom:22 }}>Enter your monthly figures below</div>
            {[
              { field:"grossProduction", label:"Gross Production ($)", placeholder:"0", hint:"Total billed before any deductions" },
              { field:"adjustments", label:"Pay Rate (%)", placeholder:"33", hint:"% of production you're paid — write-off is the remainder" },
              { field:"labFees", label:"Lab Fees ($)", placeholder:"0", hint:"Crown, denture, and other lab costs" },
              { field:"taxRate", label:"Estimated Tax Rate (%)", placeholder:"28", hint:"Federal + state marginal rate (applied after lab fees)" },
            ].map(({ field,label,placeholder,hint }) => (
              <div key={field} className="input-group">
                <div className="label">{label}</div>
                <input type="number" placeholder={placeholder} value={entry[field as keyof typeof entry]} onChange={e => updateField(activeMonth, field, e.target.value)}/>
                <div className="input-hint">{hint}</div>
              </div>
            ))}
            <div className="input-group">
              <div className="label">Notes</div>
              <input type="text" placeholder="Optional notes..." value={entry.notes||""} onChange={e => updateField(activeMonth,"notes",e.target.value)}/>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { label:"Gross Production", value:calc.gross, color:"#1c1916", border:"#1c191611" },
              { label:`− Write-off (${calc.adjRate}%)`, value:-calc.adj, color:"#e06b6b", border:"#e06b6b22" },
              { label:"= Net Production", value:calc.netProduction, color:"#1c1916", border:"#c8a96e22" },
              { label:"− Lab Fees", value:-calc.lab, color:"#e06b6b", border:"#e06b6b22" },
              { label:"= Taxable Income", value:calc.taxableIncome, color:"#1c1916", border:"#c8a96e22" },
              { label:`− Est. Taxes (${calc.taxRate}%)`, value:-calc.estimatedTax, color:"#e09b3e", border:"#e09b3e22" },
            ].map((row,i) => (
              <div key={i} className="metric-card" style={{ borderColor:row.border, padding:"13px 16px" }}>
                <div className="label" style={{ margin:0, marginBottom:3 }}>{row.label}</div>
                <div style={{ fontSize:17, fontWeight:500, color:row.color }}>{fmt(Math.abs(row.value))}</div>
              </div>
            ))}
            <div style={{ background:calc.trueIncome>=0?"#6ecfa815":"#e06b6b15", border:`1px solid ${calc.trueIncome>=0?"#6ecfa8":"#e06b6b"}`, borderRadius:2, padding:"20px 18px" }}>
              <div style={{ fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase", color:"#888", marginBottom:6 }}>= True Take-Home</div>
              <div style={{ fontSize:32, fontFamily:"'Playfair Display',serif", fontWeight:900, color:calc.trueIncome>=0?"#6ecfa8":"#e06b6b" }}>{fmt(calc.trueIncome)}</div>
              <div style={{ fontSize:10, color:"#999", marginTop:6 }}>{calc.gross>0?`${pct(calc.trueIncome,calc.gross)}% of gross production`:"Enter gross production to calculate"}</div>
            </div>
            {calc.gross > 0 && (
              <div className="card" style={{ padding:"13px 16px" }}>
                <div className="label" style={{ marginBottom:7 }}>Production Breakdown</div>
                <div style={{ display:"flex", height:6, borderRadius:1, overflow:"hidden", gap:1 }}>
                  {[{val:calc.trueIncome,color:"#6ecfa8"},{val:calc.estimatedTax,color:"#e09b3e"},{val:calc.lab,color:"#e06b6b"},{val:calc.adj,color:"#d4cfc8"}].filter(x=>x.val>0).map((s,i) => (
                    <div key={i} style={{ flex:s.val, background:s.color }}/>
                  ))}
                </div>
                <div style={{ display:"flex", gap:12, marginTop:8, flexWrap:"wrap" }}>
                  {[["Take-Home",calc.trueIncome,"#6ecfa8"],["Tax",calc.estimatedTax,"#e09b3e"],["Lab",calc.lab,"#e06b6b"],["Write-off",calc.adj,"#888"]].map(([l,v,c],i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:c as string }}/>
                      <span style={{ fontSize:9, color:"#999" }}>{l}: <span style={{ color:c as string }}>{pct(v as number,calc.gross)}%</span></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </>)}

      {view === "annual" && (<>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:20 }}>
          <div className="metric-card"><div className="label">Gross Production</div><div style={{ fontSize:24, fontFamily:"'Playfair Display',serif", fontWeight:700 }}>{fmt(annual.gross)}</div></div>
          <div className="metric-card"><div className="label">Net Production</div><div style={{ fontSize:24, fontFamily:"'Playfair Display',serif", fontWeight:700 }}>{fmt(annual.netProduction)}</div><div className="sublabel">after {fmt(annual.adj)} in write-offs</div></div>
          <div className="metric-card" style={{ border:"1px solid #6ecfa833" }}><div className="label">True Take-Home</div><div style={{ fontSize:24, fontFamily:"'Playfair Display',serif", fontWeight:700, color:annual.trueIncome>=0?"#6ecfa8":"#e06b6b" }}>{fmt(annual.trueIncome)}</div><div className="sublabel">{pct(annual.trueIncome,annual.gross)}% of gross</div></div>
        </div>
        <div className="card" style={{ padding:22 }}>
          <div className="label" style={{ marginBottom:18 }}>Income Waterfall — {activeYear}</div>
          {[
            { label:"Gross Production", value:annual.gross, pos:true },
            { label:"Less: Write-offs", value:annual.adj, pos:false },
            { label:"= Net Production", value:annual.netProduction, pos:true, sub:true },
            { label:"Less: Lab Fees", value:annual.lab, pos:false },
            { label:"= Taxable Income", value:annual.netProduction-annual.lab, pos:true, sub:true },
            { label:"Less: Estimated Taxes", value:annual.estimatedTax, pos:false },
            { label:"= True Take-Home", value:annual.trueIncome, pos:annual.trueIncome>=0, sub:true, final:true },
          ].map((row,i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:row.final?"none":"1px solid #eeeae4", borderTop:(row.sub&&i>0)?"1px solid #d0cac2":"none", marginTop:(row.sub&&i>0)?4:0 }}>
              <div style={{ fontSize:row.final?14:12, color:row.sub?"#1c1916":"#888", fontWeight:row.final?500:400, paddingLeft:row.sub?0:14 }}>{row.label}</div>
              <div style={{ fontSize:row.final?18:14, fontWeight:row.final?500:400, color:row.final?(annual.trueIncome>=0?"#6ecfa8":"#e06b6b"):row.pos?"#1c1916":"#e06b6b" }}>
                {row.pos?"":" − "}{fmt(Math.abs(row.value))}
              </div>
            </div>
          ))}
        </div>
      </>)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ROI CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════════
const ROI_TYPES: Record<string, any> = {
  ce:        { label:"CE Course",         icon:"🎓", color:"#c8a96e" },
  equipment: { label:"Equipment Upgrade", icon:"⚙️", color:"#6ecfa8" },
};

const CE_FIELDS = [
  { key:"cost",           label:"Total Course Cost ($)",           hint:"Tuition, travel, hotel, meals" },
  { key:"casesPerMonth",  label:"Est. Cases/Month from New Skill", hint:"How often you'll use this per month" },
  { key:"revenuePerCase", label:"Revenue per Case ($)",            hint:"Average fee for this procedure" },
  { key:"payRate",        label:"Your Pay Rate (%)",               hint:"% of production you keep" },
];
const calcCEItem = (f: Record<string,string>) => {
  const cost=parseFloat(f.cost)||0, cases=parseFloat(f.casesPerMonth)||0;
  const rev=parseFloat(f.revenuePerCase)||0, pay=parseFloat(f.payRate)||33;
  return { cost, monthlyIncome: cases*rev*(pay/100) };
};
const defaultCEItem = () => ({ id: Date.now(), name: "", fields: {} as Record<string,string> });

function CECourses() {
  const [items, setItems] = useState([defaultCEItem()]);
  const [expanded, setExpanded] = useState<number>(items[0].id);
  const color = "#c8a96e";
  const addItem = () => { const item=defaultCEItem(); setItems(p=>[...p,item]); setExpanded(item.id); };
  const removeItem = (id: number) => setItems(p=>p.filter(i=>i.id!==id));
  const updateItem = (id: number, patch: any) => setItems(p=>p.map(i=>i.id===id?{...i,...patch}:i));
  const updateField = (id: number, key: string, val: string) => setItems(p=>p.map(i=>i.id===id?{...i,fields:{...i.fields,[key]:val}}:i));
  const calcs = items.map(item=>({...calcCEItem(item.fields),item}));
  const totalCost=calcs.reduce((s,c)=>s+c.cost,0);
  const totalMonthly=calcs.reduce((s,c)=>s+c.monthlyIncome,0);
  const totalAnnual=totalMonthly*12;
  const totalBreakEven=totalMonthly>0?Math.ceil(totalCost/totalMonthly):null;
  const totalRoi=totalCost>0?((totalAnnual-totalCost)/totalCost)*100:0;
  const projData=Array.from({length:24},(_,i)=>({month:`M${i+1}`,"Net Return":totalMonthly*(i+1)-totalCost}));
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {items.map((item,idx) => {
          const isOpen=expanded===item.id, c=calcCEItem(item.fields), hasData=c.cost>0||c.monthlyIncome>0;
          return (
            <div key={item.id} className="card" style={{ overflow:"hidden" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", cursor:"pointer", borderBottom:isOpen?"1px solid #e2ddd6":"none" }} onClick={()=>setExpanded(isOpen?-1:item.id)}>
                <span style={{ fontSize:14 }}>🎓</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, color:item.name?"#1c1916":"#999" }}>{item.name||`Course ${idx+1}`}</div>
                  {hasData&&<div style={{ fontSize:9, color:"#888", marginTop:2 }}>{fmt(c.cost)} cost · {fmt(c.monthlyIncome)}/mo return</div>}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {items.length>1&&<button onClick={e=>{e.stopPropagation();removeItem(item.id);}} style={{ background:"none", border:"1px solid #d0cac2", color:"#888", fontFamily:"'DM Mono',monospace", fontSize:9, padding:"3px 8px", borderRadius:2, cursor:"pointer" }}>✕</button>}
                  <span style={{ color:"#999", fontSize:11 }}>{isOpen?"▲":"▼"}</span>
                </div>
              </div>
              {isOpen&&(
                <div style={{ padding:"16px 18px" }}>
                  <div className="input-group" style={{ marginBottom:12 }}>
                    <div className="label">Course Name</div>
                    <input type="text" placeholder="e.g. Implant Placement, Invisalign Cert" value={item.name} onChange={e=>updateItem(item.id,{name:e.target.value})}/>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    {CE_FIELDS.map(f=>(
                      <div key={f.key} className="input-group" style={{ marginBottom:8 }}>
                        <div className="label">{f.label}</div>
                        <input type="number" placeholder="0" value={item.fields[f.key]||""} onChange={e=>updateField(item.id,f.key,e.target.value)}/>
                        {f.hint&&<div className="input-hint">{f.hint}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <button onClick={addItem} style={{ background:"transparent", border:"1px dashed #d0cac2", color:"#888", fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", padding:"12px", borderRadius:2, cursor:"pointer" }}
          onMouseEnter={e=>{(e.target as HTMLElement).style.borderColor=color;(e.target as HTMLElement).style.color=color;}}
          onMouseLeave={e=>{(e.target as HTMLElement).style.borderColor="#d0cac2";(e.target as HTMLElement).style.color="#888";}}>
          + Add Course
        </button>
        {items.length>1&&(
          <div className="card" style={{ padding:"14px 16px" }}>
            <div className="label" style={{ marginBottom:10 }}>Per-Course Breakdown</div>
            {calcs.map(({cost,monthlyIncome,item},i)=>(
              <div key={item.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:i<calcs.length-1?"1px solid #e8e4de":"none", fontSize:11 }}>
                <span style={{ color:"#888" }}>🎓 {item.name||`Course ${i+1}`}</span>
                <div style={{ textAlign:"right" }}><span style={{ color:"#999", marginRight:12 }}>{fmt(cost)}</span><span style={{ color }}>{fmt(monthlyIncome)}/mo</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[{label:"Total Investment",value:fmt(totalCost),color:"#1c1916"},{label:"Monthly Return",value:fmt(totalMonthly),color},{label:"Annual Return",value:fmt(totalAnnual),color},{label:"ROI Year 1",value:`${totalRoi.toFixed(1)}%`,color:totalRoi>0?"#6ecfa8":"#e06b6b"}].map((m,i)=>(
            <div key={i} className="metric-card" style={{ padding:"15px 16px" }}>
              <div className="label">{m.label}</div>
              <div style={{ fontSize:18, fontWeight:500, color:m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
        <div style={{ background:`${color}12`, border:`1px solid ${color}`, borderRadius:2, padding:"18px 20px" }}>
          <div className="label" style={{ marginBottom:6 }}>Combined Break-Even Point</div>
          {totalCost===0?<div style={{ fontSize:13, color:"#999" }}>Enter course costs to calculate</div>
            :totalBreakEven?<><div style={{ fontSize:26, fontFamily:"'Playfair Display',serif", fontWeight:900, color }}>{totalBreakEven} months</div><div style={{ fontSize:10, color:"#888", marginTop:4 }}>{totalBreakEven<=6?"🟢 Excellent — breaks even under 6 months":totalBreakEven<=12?"🟡 Good — breaks even within the year":totalBreakEven<=24?"🟠 Moderate — 1–2 year payback":"🔴 Long payback — evaluate carefully"}</div></>
            :<div style={{ fontSize:13, color:"#e06b6b" }}>No positive return — review inputs</div>}
        </div>
        {totalMonthly>0&&totalCost>0&&(
          <div className="card" style={{ padding:"16px 18px" }}>
            <div className="label" style={{ marginBottom:10 }}>24-Month Cumulative Net Return</div>
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={projData} margin={{ top:4,right:4,bottom:0,left:0 }}>
                <defs><linearGradient id="ceGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.3}/><stop offset="95%" stopColor={color} stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="month" tick={{ fill:"#aaa",fontSize:8,fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false} interval={3}/>
                <YAxis tickFormatter={(v:number)=>`$${(v/1000).toFixed(0)}k`} tick={{ fill:"#aaa",fontSize:8,fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false} width={36}/>
                <Tooltip content={<ChartTooltip/>} cursor={{ stroke:"#d0cac2",strokeWidth:1 }}/>
                <Area type="monotone" dataKey="Net Return" stroke={color} strokeWidth={2} fill="url(#ceGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ fontSize:9, color:"#aaa", marginTop:4 }}>Cumulative income minus course costs. Positive = paid back.</div>
          </div>
        )}
      </div>
    </div>
  );
}

const EQUIP_FIELDS = [
  { key:"cost",           label:"Equipment Cost ($)",         hint:"Full purchase price or total lease cost" },
  { key:"monthlySavings", label:"Monthly Savings ($)",        hint:"Lab, material, or impression cost reductions" },
  { key:"extraCases",     label:"Extra Cases/Month",          hint:"Additional cases enabled by this equipment" },
  { key:"revenuePerCase", label:"Revenue per Extra Case ($)", hint:"Average fee for those additional cases" },
  { key:"payRate",        label:"Your Pay Rate (%)",          hint:"% of production you keep" },
];
const calcEquipItem = (f: Record<string,string>) => {
  const cost=parseFloat(f.cost)||0, savings=parseFloat(f.monthlySavings)||0;
  const cases=parseFloat(f.extraCases)||0, rev=parseFloat(f.revenuePerCase)||0, pay=parseFloat(f.payRate)||33;
  return { cost, monthlyIncome: savings+cases*rev*(pay/100) };
};
const defaultEquipItem = () => ({ id: Date.now(), name: "", fields: {} as Record<string,string> });

function EquipmentUpgrade() {
  const [items, setItems] = useState([defaultEquipItem()]);
  const [expanded, setExpanded] = useState<number>(items[0].id);
  const color = "#6ecfa8";
  const addItem = () => { const item=defaultEquipItem(); setItems(p=>[...p,item]); setExpanded(item.id); };
  const removeItem = (id: number) => setItems(p=>p.filter(i=>i.id!==id));
  const updateItem = (id: number, patch: any) => setItems(p=>p.map(i=>i.id===id?{...i,...patch}:i));
  const updateField = (id: number, key: string, val: string) => setItems(p=>p.map(i=>i.id===id?{...i,fields:{...i.fields,[key]:val}}:i));
  const calcs = items.map(item=>({...calcEquipItem(item.fields),item}));
  const totalCost=calcs.reduce((s,c)=>s+c.cost,0);
  const totalMonthly=calcs.reduce((s,c)=>s+c.monthlyIncome,0);
  const totalAnnual=totalMonthly*12;
  const totalBreakEven=totalMonthly>0?Math.ceil(totalCost/totalMonthly):null;
  const totalRoi=totalCost>0?((totalAnnual-totalCost)/totalCost)*100:0;
  const projData=Array.from({length:24},(_,i)=>({month:`M${i+1}`,"Net Return":totalMonthly*(i+1)-totalCost}));
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {items.map((item,idx) => {
          const isOpen=expanded===item.id, c=calcEquipItem(item.fields), hasData=c.cost>0||c.monthlyIncome>0;
          return (
            <div key={item.id} className="card" style={{ overflow:"hidden" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", cursor:"pointer", borderBottom:isOpen?"1px solid #e2ddd6":"none" }} onClick={()=>setExpanded(isOpen?-1:item.id)}>
                <span style={{ fontSize:14 }}>⚙️</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, color:item.name?"#1c1916":"#999" }}>{item.name||`Item ${idx+1}`}</div>
                  {hasData&&<div style={{ fontSize:9, color:"#888", marginTop:2 }}>{fmt(c.cost)} cost · {fmt(c.monthlyIncome)}/mo return</div>}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {items.length>1&&<button onClick={e=>{e.stopPropagation();removeItem(item.id);}} style={{ background:"none", border:"1px solid #d0cac2", color:"#888", fontFamily:"'DM Mono',monospace", fontSize:9, padding:"3px 8px", borderRadius:2, cursor:"pointer" }}>✕</button>}
                  <span style={{ color:"#999", fontSize:11 }}>{isOpen?"▲":"▼"}</span>
                </div>
              </div>
              {isOpen&&(
                <div style={{ padding:"16px 18px" }}>
                  <div className="input-group" style={{ marginBottom:12 }}>
                    <div className="label">Item Name</div>
                    <input type="text" placeholder="e.g. iTero Scanner, Formlabs Printer" value={item.name} onChange={e=>updateItem(item.id,{name:e.target.value})}/>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    {EQUIP_FIELDS.map(f=>(
                      <div key={f.key} className="input-group" style={{ marginBottom:8 }}>
                        <div className="label">{f.label}</div>
                        <input type="number" placeholder="0" value={item.fields[f.key]||""} onChange={e=>updateField(item.id,f.key,e.target.value)}/>
                        {f.hint&&<div className="input-hint">{f.hint}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <button onClick={addItem} style={{ background:"transparent", border:"1px dashed #d0cac2", color:"#888", fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", padding:"12px", borderRadius:2, cursor:"pointer" }}
          onMouseEnter={e=>{(e.target as HTMLElement).style.borderColor=color;(e.target as HTMLElement).style.color=color;}}
          onMouseLeave={e=>{(e.target as HTMLElement).style.borderColor="#d0cac2";(e.target as HTMLElement).style.color="#888";}}>
          + Add Equipment
        </button>
        {items.length>1&&(
          <div className="card" style={{ padding:"14px 16px" }}>
            <div className="label" style={{ marginBottom:10 }}>Per-Item Breakdown</div>
            {calcs.map(({cost,monthlyIncome,item},i)=>(
              <div key={item.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:i<calcs.length-1?"1px solid #e8e4de":"none", fontSize:11 }}>
                <span style={{ color:"#888" }}>⚙️ {item.name||`Item ${i+1}`}</span>
                <div style={{ textAlign:"right" }}><span style={{ color:"#999", marginRight:12 }}>{fmt(cost)}</span><span style={{ color }}>{fmt(monthlyIncome)}/mo</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[{label:"Total Investment",value:fmt(totalCost),color:"#1c1916"},{label:"Monthly Return",value:fmt(totalMonthly),color},{label:"Annual Return",value:fmt(totalAnnual),color},{label:"ROI Year 1",value:`${totalRoi.toFixed(1)}%`,color:totalRoi>0?"#6ecfa8":"#e06b6b"}].map((m,i)=>(
            <div key={i} className="metric-card" style={{ padding:"15px 16px" }}>
              <div className="label">{m.label}</div>
              <div style={{ fontSize:18, fontWeight:500, color:m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
        <div style={{ background:`${color}12`, border:`1px solid ${color}`, borderRadius:2, padding:"18px 20px" }}>
          <div className="label" style={{ marginBottom:6 }}>Combined Break-Even Point</div>
          {totalCost===0?<div style={{ fontSize:13, color:"#999" }}>Enter equipment costs to calculate</div>
            :totalBreakEven?<><div style={{ fontSize:26, fontFamily:"'Playfair Display',serif", fontWeight:900, color }}>{totalBreakEven} months</div><div style={{ fontSize:10, color:"#888", marginTop:4 }}>{totalBreakEven<=6?"🟢 Excellent — breaks even under 6 months":totalBreakEven<=12?"🟡 Good — breaks even within the year":totalBreakEven<=24?"🟠 Moderate — 1–2 year payback":"🔴 Long payback — evaluate carefully"}</div></>
            :<div style={{ fontSize:13, color:"#e06b6b" }}>No positive return — review inputs</div>}
        </div>
        {totalMonthly>0&&totalCost>0&&(
          <div className="card" style={{ padding:"16px 18px" }}>
            <div className="label" style={{ marginBottom:10 }}>24-Month Cumulative Net Return</div>
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={projData} margin={{ top:4,right:4,bottom:0,left:0 }}>
                <defs><linearGradient id="equipGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.3}/><stop offset="95%" stopColor={color} stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="month" tick={{ fill:"#aaa",fontSize:8,fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false} interval={3}/>
                <YAxis tickFormatter={(v:number)=>`$${(v/1000).toFixed(0)}k`} tick={{ fill:"#aaa",fontSize:8,fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false} width={36}/>
                <Tooltip content={<ChartTooltip/>} cursor={{ stroke:"#d0cac2",strokeWidth:1 }}/>
                <Area type="monotone" dataKey="Net Return" stroke={color} strokeWidth={2} fill="url(#equipGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ fontSize:9, color:"#aaa", marginTop:4 }}>Cumulative return across all equipment minus total investment.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ROICalculator() {
  const [type, setType] = useState("ce");
  return (
    <div className="fade-in">
      <div className="section-title">ROI Calculator</div>
      <div className="section-sub">Model your return on dental investments — courses and technology</div>
      <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
        {Object.entries(ROI_TYPES).map(([k,v]) => (
          <button key={k} onClick={()=>setType(k)} style={{ display:"flex", alignItems:"center", gap:8, background:type===k?`${v.color}15`:"transparent", border:`1px solid ${type===k?v.color:"#d0cac2"}`, color:type===k?v.color:"#888", fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:"0.08em", textTransform:"uppercase", padding:"10px 16px", borderRadius:2, cursor:"pointer", transition:"all 0.2s" }}>
            <span>{v.icon}</span>{v.label}
          </button>
        ))}
      </div>
      {type==="ce"?<CECourses/>:<EquipmentUpgrade/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. CONTRACT ANALYZER
// ═══════════════════════════════════════════════════════════════════════════════
function ContractAnalyzer() {
  const [form, setForm] = useState({ payType:"percentage", payRate:"", flatSalary:"", daysPerWeek:"4", weeksOff:"2", patientsPerDay:"15", avgFeePerPatient:"450", labPassThrough:"yes", malpracticeComp:"yes", healthBenefit:"no", nonCompeteMiles:"", nonCompeteYears:"", terminationDays:"30", taxRate:"28", labRate:"8" });
  const set = (k: string, v: string) => setForm((p: any)=>({...p,[k]:v}));
  const pay=parseFloat(form.payRate)||0, workWeeks=52-(parseInt(form.weeksOff)||2);
  const workDays=(parseInt(form.daysPerWeek)||4)*workWeeks;
  const dailyGross=(parseFloat(form.patientsPerDay)||0)*(parseFloat(form.avgFeePerPatient)||0);
  const grossAnnual=dailyGross*workDays;
  const incomeAnnual=form.payType==="percentage"?grossAnnual*(pay/100):parseFloat(form.flatSalary)||0;
  const labDeduct=form.labPassThrough==="yes"?grossAnnual*(parseFloat(form.labRate)||8)/100:0;
  const taxable=incomeAnnual-labDeduct, taxes=taxable*(parseFloat(form.taxRate)||28)/100;
  const takeHome=taxable-taxes, hourly=takeHome/(workDays*8);
  const ncMiles=parseFloat(form.nonCompeteMiles)||0, ncYears=parseFloat(form.nonCompeteYears)||0, termDays=parseFloat(form.terminationDays)||0;
  const flags = [
    { label:"Non-compete radius", value:form.nonCompeteMiles?`${form.nonCompeteMiles} mi`:"Not set", ok:!form.nonCompeteMiles||ncMiles<=5, warn:ncMiles>10, note:ncMiles>10?"⚠️ >10 miles is aggressive — negotiate down":"✓ Reasonable radius" },
    { label:"Non-compete duration", value:form.nonCompeteYears?`${form.nonCompeteYears} yrs`:"Not set", ok:!form.nonCompeteYears||ncYears<=1, warn:ncYears>2, note:ncYears>2?"⚠️ >2 years may be unenforceable":"✓ Acceptable term" },
    { label:"Termination notice", value:form.terminationDays?`${form.terminationDays} days`:"Not set", ok:termDays>=60, warn:termDays<30, note:termDays<30?"⚠️ <30 days leaves you vulnerable":termDays>=60?"✓ Good protection":"🟡 Aim for 60+ days" },
    { label:"Lab fee pass-through", value:form.labPassThrough==="yes"?"Yes — deducted":"No — practice pays", ok:form.labPassThrough==="no", warn:form.labPassThrough==="yes", note:form.labPassThrough==="yes"?"⚠️ Reduces your effective pay rate":"✓ Practice covers lab costs" },
    { label:"Malpractice coverage", value:form.malpracticeComp==="yes"?"Practice pays":"You pay", ok:form.malpracticeComp==="yes", warn:form.malpracticeComp==="no", note:form.malpracticeComp==="no"?"⚠️ Out-of-pocket malpractice is costly":"✓ Practice covers malpractice" },
    { label:"Health benefits", value:form.healthBenefit==="yes"?"Included":"Not included", ok:form.healthBenefit==="yes", warn:false, note:form.healthBenefit==="yes"?"✓ Benefits included":"🟡 Budget ~$400–700/mo for coverage" },
  ];
  const score=flags.filter(f=>f.ok).length, scoreColor=score>=5?"#6ecfa8":score>=3?"#e09b3e":"#e06b6b";
  return (
    <div className="fade-in">
      <div className="section-title">Contract Analyzer</div>
      <div className="section-sub">Evaluate your associate agreement and model true compensation</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div className="card" style={{ padding:22 }}>
            <div style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"#c8a96e", marginBottom:14 }}>Compensation Structure</div>
            <div className="input-group">
              <div className="label">Pay Type</div>
              <div style={{ display:"flex", gap:8 }}>
                {[["percentage","% of Production"],["salary","Flat Salary"]].map(([v,l])=>(
                  <button key={v} className={`btn-sm ${form.payType===v?"active":""}`} onClick={()=>set("payType",v)}>{l}</button>
                ))}
              </div>
            </div>
            {form.payType==="percentage"
              ?<div className="input-group"><div className="label">Pay Rate (%)</div><input type="number" placeholder="33" value={form.payRate} onChange={e=>set("payRate",e.target.value)}/></div>
              :<div className="input-group"><div className="label">Annual Salary ($)</div><input type="number" placeholder="180000" value={form.flatSalary} onChange={e=>set("flatSalary",e.target.value)}/></div>}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{k:"daysPerWeek",label:"Days/Week",ph:"4"},{k:"weeksOff",label:"Weeks Off/Yr",ph:"2"},{k:"patientsPerDay",label:"Patients/Day",ph:"15"},{k:"avgFeePerPatient",label:"Avg Fee/Patient ($)",ph:"450"},{k:"taxRate",label:"Your Tax Rate (%)",ph:"28"},{k:"labRate",label:"Lab % of Gross",ph:"8"}].map(({k,label,ph})=>(
                <div key={k} className="input-group" style={{ marginBottom:10 }}>
                  <div className="label">{label}</div>
                  <input type="number" placeholder={ph} value={form[k as keyof typeof form]} onChange={e=>set(k,e.target.value)}/>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding:22 }}>
            <div style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"#c8a96e", marginBottom:14 }}>Contract Terms</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div className="input-group"><div className="label">Non-compete (miles)</div><input type="number" placeholder="5" value={form.nonCompeteMiles} onChange={e=>set("nonCompeteMiles",e.target.value)}/></div>
              <div className="input-group"><div className="label">Non-compete (years)</div><input type="number" placeholder="1" value={form.nonCompeteYears} onChange={e=>set("nonCompeteYears",e.target.value)}/></div>
              <div className="input-group"><div className="label">Termination Notice (days)</div><input type="number" placeholder="30" value={form.terminationDays} onChange={e=>set("terminationDays",e.target.value)}/></div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
              {[{key:"labPassThrough",label:"Lab Pass-through",opts:[["yes","Yes"],["no","No"]]},{key:"malpracticeComp",label:"Malpractice Paid By",opts:[["yes","Practice"],["no","You"]]},{key:"healthBenefit",label:"Health Benefits",opts:[["yes","Yes"],["no","No"]]}].map(({key,label,opts})=>(
                <div key={key}><div className="label">{label}</div><div style={{ display:"flex", gap:5 }}>{opts.map(([v,l])=><button key={v} className={`btn-sm ${form[key as keyof typeof form]===v?"active":""}`} onClick={()=>set(key,v)}>{l}</button>)}</div></div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ background:`${scoreColor}12`, border:`1px solid ${scoreColor}`, borderRadius:2, padding:"18px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div className="label" style={{ marginBottom:4 }}>Contract Score</div>
              <div style={{ fontSize:26, fontFamily:"'Playfair Display',serif", fontWeight:900, color:scoreColor }}>{score} / 6</div>
              <div style={{ fontSize:10, color:"#888", marginTop:4 }}>{score>=5?"Strong — favorable terms overall":score>=3?"Moderate — a few points to negotiate":"Weak — significant terms to address"}</div>
            </div>
            <div style={{ fontSize:36 }}>{score>=5?"✅":score>=3?"⚠️":"🚨"}</div>
          </div>
          <div className="card" style={{ padding:18 }}>
            <div className="label" style={{ marginBottom:10 }}>Estimated Annual Compensation</div>
            {[["Gross Production",grossAnnual,"#1c1916"],[form.payType==="percentage"?"Your Contracted Share":"Flat Salary",incomeAnnual,"#c8a96e"],["Less: Lab (pass-through)",-labDeduct,"#e06b6b"],["Less: Est. Taxes",-taxes,"#e09b3e"],["True Take-Home",takeHome,takeHome>0?"#6ecfa8":"#e06b6b"]].map(([l,v,c],i)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:i<4?"1px solid #eeeae4":"none", fontSize:12 }}>
                <span style={{ color:"#888" }}>{l as string}</span>
                <span style={{ color:c as string, fontWeight:i===4?500:400 }}>{(v as number)<0?" − ":""}{fmt(Math.abs(v as number))}</span>
              </div>
            ))}
            <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid #e2ddd6", display:"flex", justifyContent:"space-between", fontSize:11, color:"#999" }}>
              <span>Effective hourly (take-home basis)</span>
              <span style={{ color:"#c8a96e" }}>{fmtD(hourly)}/hr</span>
            </div>
          </div>
          <div className="card" style={{ padding:18 }}>
            <div className="label" style={{ marginBottom:12 }}>Term-by-Term Analysis</div>
            {flags.map((f,i)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"9px 0", borderBottom:i<flags.length-1?"1px solid #eeeae4":"none", gap:12 }}>
                <div>
                  <div style={{ fontSize:11, color:"#888", marginBottom:2 }}>{f.label}</div>
                  <div style={{ fontSize:10, color:f.warn?"#e06b6b":f.ok?"#6ecfa8":"#e09b3e" }}>{f.note}</div>
                </div>
                <div style={{ fontSize:10, color:"#999", whiteSpace:"nowrap", textAlign:"right" }}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. FINANCIAL GOALS
// ═══════════════════════════════════════════════════════════════════════════════
function FinancialGoals({ incomeData, activeYear }: { incomeData: Record<number, Record<string, string>>, activeYear: number }) {
  const [goals, setGoals] = useState({ annualIncome:"", monthlyExpenses:"", studentLoan:"", retirementPct:"", emergencyMonths:"3", savingsGoal:"" });
  const [saved, setSaved] = useState(false);
  const set = (k: string, v: string) => setGoals((p: any)=>({...p,[k]:v}));
  useEffect(() => {
    (async()=>{ try { const r=await storage.get("ait:goals"); if(r?.value) setGoals(JSON.parse(r.value)); } catch{} })();
  }, []);
  const saveGoals = async () => { try { await storage.set("ait:goals",JSON.stringify(goals)); setSaved(true); setTimeout(()=>setSaved(false),2000); } catch{} };
  const annual=MONTHS.reduce((acc,_,i)=>acc+calcRow(incomeData[i]||defaultIncomeEntry()).trueIncome,0);
  const targetIncome=parseFloat(goals.annualIncome)||0;
  const progress=targetIncome>0?Math.min((annual/targetIncome)*100,100):0;
  const monthlyExpenses=parseFloat(goals.monthlyExpenses)||0;
  const monthlySurplus=(annual/12)-monthlyExpenses;
  const loanAnnual=parseFloat(goals.studentLoan)||0;
  const retireContrib=targetIncome*(parseFloat(goals.retirementPct)||0)/100;
  const emergencyFund=monthlyExpenses*(parseFloat(goals.emergencyMonths)||3);
  const savingsGoal=parseFloat(goals.savingsGoal)||0;
  const goalChartData=MONTHS.map((month,i)=>({ month, Target:targetIncome/12, Actual:Math.max(0,calcRow(incomeData[i]||defaultIncomeEntry()).trueIncome) }));
  const milestones=[
    { label:"Emergency Fund", target:emergencyFund, color:"#6ecfa8", note:`${goals.emergencyMonths||3}mo expenses` },
    { label:"Annual Income Goal", target:targetIncome, color:"#c8a96e", note:"Take-home target" },
    { label:"Annual Loan Payments", target:loanAnnual, color:"#e09b3e", note:"Student debt" },
    { label:"Savings Goal", target:savingsGoal, color:"#e06b6b", note:"Custom target" },
  ].filter(m=>m.target>0);
  return (
    <div className="fade-in">
      <div className="section-title">Financial Goals</div>
      <div className="section-sub">Set income targets, track milestones, and model your financial trajectory</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div className="card" style={{ padding:22 }}>
            <div style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"#c8a96e", marginBottom:14 }}>Goals & Targets</div>
            {[{k:"annualIncome",label:"Annual Income Target ($)",ph:"150000",hint:"Your take-home goal for the year"},{k:"monthlyExpenses",label:"Monthly Living Expenses ($)",ph:"5000",hint:"Rent, food, transport, etc."},{k:"savingsGoal",label:"Savings Goal ($)",ph:"20000",hint:"What you want to save this year"},{k:"retirementPct",label:"Retirement Contribution (%)",ph:"10",hint:"% of income to 401k/IRA"}].map(({k,label,ph,hint})=>(
              <div key={k} className="input-group">
                <div className="label">{label}</div>
                <input type="number" placeholder={ph} value={goals[k as keyof typeof goals]} onChange={e=>set(k,e.target.value)}/>
                <div className="input-hint">{hint}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding:22 }}>
            <div style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"#c8a96e", marginBottom:14 }}>Debt & Safety Net</div>
            <div className="input-group"><div className="label">Annual Student Loan Payments ($)</div><input type="number" placeholder="25000" value={goals.studentLoan} onChange={e=>set("studentLoan",e.target.value)}/></div>
            <div className="input-group">
              <div className="label">Emergency Fund Target</div>
              <div style={{ display:"flex", gap:6 }}>{["3","6","9","12"].map(v=><button key={v} className={`btn-sm ${goals.emergencyMonths===v?"active":""}`} onClick={()=>set("emergencyMonths",v)}>{v}mo</button>)}</div>
            </div>
            <button className="btn" style={{ marginTop:8, width:"100%", color:"#c8a96e", borderColor:"#c8a96e" }} onClick={saveGoals}>{saved?"✓ Saved!":"Save Goals"}</button>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ background:"#c8a96e12", border:"1px solid #c8a96e", borderRadius:2, padding:"20px" }}>
            <div className="label" style={{ marginBottom:6 }}>Income Goal Progress — {activeYear}</div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10 }}>
              <div style={{ fontSize:24, fontFamily:"'Playfair Display',serif", fontWeight:700, color:"#c8a96e" }}>{fmt(annual)}</div>
              <div style={{ fontSize:11, color:"#888" }}>of {fmt(targetIncome)}</div>
            </div>
            <div className="progress-track" style={{ height:8, marginBottom:6 }}><div className="progress-fill" style={{ width:`${progress}%`, background:"linear-gradient(90deg,#c8a96e,#e0c48e)" }}/></div>
            <div style={{ fontSize:10, color:"#888" }}>{progress.toFixed(1)}% complete · {fmt(Math.max(targetIncome-annual,0))} remaining</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[{label:"Monthly Take-Home",value:fmt(annual/12),color:"#6ecfa8"},{label:"Monthly Surplus",value:fmt(monthlySurplus),color:monthlySurplus>=0?"#6ecfa8":"#e06b6b"},{label:"Retirement / Year",value:fmt(retireContrib),color:"#c8a96e"},{label:"Emergency Target",value:fmt(emergencyFund),color:"#e09b3e"}].map((m,i)=>(
              <div key={i} className="metric-card" style={{ padding:"13px 16px" }}>
                <div className="label">{m.label}</div>
                <div style={{ fontSize:17, fontWeight:500, color:m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
          {milestones.length>0&&(
            <div className="card" style={{ padding:18 }}>
              <div className="label" style={{ marginBottom:14 }}>Milestone Tracker</div>
              {milestones.map((m,i)=>{ const prog=m.target>0?Math.min((annual/m.target)*100,100):0; return (
                <div key={i} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:11, color:"#888" }}>{m.label}</span>
                    <span style={{ fontSize:10, color:m.color }}>{prog.toFixed(0)}%</span>
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{ width:`${prog}%`, background:m.color }}/></div>
                  <div style={{ fontSize:9, color:"#aaa", marginTop:3 }}>{m.note} · {fmt(m.target)}</div>
                </div>
              );})}
            </div>
          )}
          {targetIncome>0&&(
            <div className="card" style={{ padding:18 }}>
              <div className="label" style={{ marginBottom:10 }}>Actual vs. Monthly Target</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={goalChartData} barGap={3} margin={{ top:4,right:4,bottom:0,left:0 }}>
                  <XAxis dataKey="month" tick={{ fill:"#999",fontSize:9,fontFamily:"'DM Mono',monospace" }} axisLine={{ stroke:"#e2ddd6" }} tickLine={false}/>
                  <YAxis tickFormatter={(v:number)=>`$${(v/1000).toFixed(0)}k`} tick={{ fill:"#aaa",fontSize:9,fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false} width={36}/>
                  <Tooltip content={<ChartTooltip/>} cursor={{ fill:"#00000005" }}/>
                  <Bar dataKey="Target" fill="#c8a96e22" stroke="#c8a96e55" strokeWidth={1} radius={[2,2,0,0]}/>
                  <Bar dataKey="Actual" fill="#6ecfa833" stroke="#6ecfa8" strokeWidth={1} radius={[2,2,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. PRODUCTION ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════
function ProductionAnalytics({ incomeData }: { incomeData: Record<number, Record<string, string>> }) {
  const [form, setForm] = useState({ patientsPerDay:"15", daysPerWeek:"4", weeksOff:"2", avgFeePerPatient:"450", noShowRate:"10", recallRate:"75", acceptanceRate:"65", payRate:"33" });
  const set = (k: string, v: string) => setForm((p: any)=>({...p,[k]:v}));
  const ppd=parseFloat(form.patientsPerDay)||0, dpw=parseFloat(form.daysPerWeek)||0;
  const workDays=dpw*(52-(parseFloat(form.weeksOff)||0));
  const avgFee=parseFloat(form.avgFeePerPatient)||0, noShow=parseFloat(form.noShowRate)||0, payRate=parseFloat(form.payRate)||33;
  const rawAnnual=ppd*avgFee*workDays, effAnnual=rawAnnual*(1-noShow/100);
  const annualIncome=effAnnual*(payRate/100), lostToNoShows=(rawAnnual-effAnnual)*(payRate/100);
  const dailyGross=ppd*avgFee*(1-noShow/100);
  const scenarios=[
    { label:"+1 Patient/Day", gain:((ppd+1)*avgFee*workDays*(1-noShow/100)*(payRate/100))-annualIncome, desc:"One more slot per day" },
    { label:"+$50 Avg Fee", gain:(ppd*(avgFee+50)*workDays*(1-noShow/100)*(payRate/100))-annualIncome, desc:"Higher-value procedures" },
    { label:"−5% No-Shows", gain:(ppd*avgFee*workDays*(1-(noShow-5)/100)*(payRate/100))-annualIncome, desc:"Better confirmation system" },
    { label:"+Day/Week", gain:((dpw+1)*(52-(parseFloat(form.weeksOff)||0))*ppd*avgFee*(1-noShow/100)*(payRate/100))-annualIncome, desc:"Add one clinical day" },
  ];
  const chartData=MONTHS.map((m,i)=>{ const c=calcRow(incomeData[i]||defaultIncomeEntry()); return { month:m, "Gross Production":c.gross, "Take-Home":c.trueIncome }; });
  const hasActualData=chartData.some(d=>d["Gross Production"]>0);
  return (
    <div className="fade-in">
      <div className="section-title">Production Analytics</div>
      <div className="section-sub">Model production metrics and identify your highest-leverage growth opportunities</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        <div className="card" style={{ padding:22 }}>
          <div style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"#c8a96e", marginBottom:14 }}>Practice Metrics</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[{k:"patientsPerDay",label:"Patients/Day",ph:"15"},{k:"daysPerWeek",label:"Days/Week",ph:"4"},{k:"weeksOff",label:"Weeks Off/Year",ph:"2"},{k:"avgFeePerPatient",label:"Avg Fee/Patient ($)",ph:"450"},{k:"noShowRate",label:"No-Show Rate (%)",ph:"10"},{k:"recallRate",label:"Recall Rate (%)",ph:"75"},{k:"acceptanceRate",label:"Case Accept Rate (%)",ph:"65"},{k:"payRate",label:"Your Pay Rate (%)",ph:"33"}].map(({k,label,ph})=>(
              <div key={k} className="input-group" style={{ marginBottom:10 }}>
                <div className="label">{label}</div>
                <input type="number" placeholder={ph} value={form[k as keyof typeof form]} onChange={e=>set(k,e.target.value)}/>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[{label:"Daily Gross (effective)",value:fmt(dailyGross),color:"#1c1916",sub:"after no-shows"},{label:"Annual Gross",value:fmt(effAnnual),color:"#c8a96e",sub:"effective"},{label:"Annual Take-Home",value:fmt(annualIncome),color:"#6ecfa8",sub:`at ${payRate}% pay rate`},{label:"Lost to No-Shows",value:fmt(lostToNoShows),color:"#e09b3e",sub:"per year"}].map((m,i)=>(
              <div key={i} className="metric-card" style={{ padding:"14px 16px" }}>
                <div className="label">{m.label}</div>
                <div style={{ fontSize:17, fontWeight:500, color:m.color }}>{m.value}</div>
                <div className="sublabel">{m.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ background:"#e09b3e12", border:"1px solid #e09b3e44", borderRadius:2, padding:"14px 16px" }}>
            <div style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"#e09b3e", marginBottom:6 }}>No-Show Impact</div>
            <div style={{ fontSize:11, color:"#888", lineHeight:1.7 }}>
              At <span style={{ color:"#e09b3e" }}>{noShow}% no-show rate</span>, you lose approximately <span style={{ color:"#e06b6b" }}>{fmt(lostToNoShows)}/year</span> in take-home income. Reducing to 5% would recover <span style={{ color:"#6ecfa8" }}>{fmt(Math.max(0,ppd*avgFee*workDays*(noShow-5)/100*(payRate/100)))}</span>.
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[{label:"Recall Rate",value:`${form.recallRate||0}%`,color:"#c8a96e",sub:"patient retention"},{label:"Accept Rate",value:`${form.acceptanceRate||0}%`,color:"#6ecfa8",sub:"treatment plans"}].map((m,i)=>(
              <div key={i} className="metric-card" style={{ padding:"14px 16px" }}>
                <div className="label">{m.label}</div>
                <div style={{ fontSize:20, fontWeight:500, color:m.color }}>{m.value}</div>
                <div className="sublabel">{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card" style={{ padding:20, marginBottom:20 }}>
        <div className="label" style={{ marginBottom:14 }}>Growth Scenario Analysis — Annual Take-Home Impact</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
          {scenarios.map((s,i)=>(
            <div key={i} style={{ background:"#f5f1eb", border:"1px solid #e2ddd6", borderRadius:2, padding:"16px 14px", position:"relative", overflow:"hidden" }}>
              <div style={{ fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase", color:"#888", marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:15, fontWeight:500, color:"#6ecfa8", marginBottom:3 }}>{fmt(annualIncome+s.gain)}</div>
              <div style={{ fontSize:11, color:"#e09b3e", fontWeight:500 }}>+{fmt(s.gain)}/yr</div>
              <div style={{ fontSize:9, color:"#aaa", marginTop:6 }}>{s.desc}</div>
              <div style={{ position:"absolute", top:0, right:0, width:2, bottom:0, background:"linear-gradient(180deg,#6ecfa8,transparent)" }}/>
            </div>
          ))}
        </div>
      </div>
      {hasActualData&&(
        <div className="card" style={{ padding:20 }}>
          <div className="label" style={{ marginBottom:12 }}>Actual Production vs Take-Home (from Income Tracker)</div>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={chartData} margin={{ top:4,right:4,bottom:0,left:0 }}>
              <defs>
                <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#c8a96e" stopOpacity={0.2}/><stop offset="95%" stopColor="#c8a96e" stopOpacity={0}/></linearGradient>
                <linearGradient id="takeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6ecfa8" stopOpacity={0.2}/><stop offset="95%" stopColor="#6ecfa8" stopOpacity={0}/></linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill:"#999",fontSize:9,fontFamily:"'DM Mono',monospace" }} axisLine={{ stroke:"#e2ddd6" }} tickLine={false}/>
              <YAxis tickFormatter={(v:number)=>`$${(v/1000).toFixed(0)}k`} tick={{ fill:"#aaa",fontSize:9,fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false} width={40}/>
              <Tooltip content={<ChartTooltip/>} cursor={{ stroke:"#d0cac2",strokeWidth:1 }}/>
              <Area type="monotone" dataKey="Gross Production" stroke="#c8a96e" strokeWidth={1.5} fill="url(#grossGrad)"/>
              <Area type="monotone" dataKey="Take-Home" stroke="#6ecfa8" strokeWidth={2} fill="url(#takeGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", gap:16, marginTop:10 }}>
            {[["Gross Production","#c8a96e"],["Take-Home","#6ecfa8"]].map(([n,c])=>(
              <div key={n} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:16, height:2, background:c, borderRadius:1 }}/>
                <span style={{ fontSize:9, color:"#999", textTransform:"uppercase", letterSpacing:"0.08em" }}>{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const year = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState("income");
  const [activeYear, setActiveYear] = useState(year);
  const [incomeData, setIncomeData] = useState<Record<number, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { const r=await storage.get(`ait:${activeYear}`); setIncomeData(r?.value?JSON.parse(r.value):{}); }
      catch { setIncomeData({}); }
      setLoading(false);
    })();
  }, [activeYear]);

  const TABS = [
    { id:"income",    label:"Income Tracker",      icon:"💰" },
    { id:"roi",       label:"ROI Calculator",       icon:"📈" },
    { id:"contract",  label:"Contract Analyzer",    icon:"📋" },
    { id:"goals",     label:"Financial Goals",      icon:"🎯" },
    { id:"analytics", label:"Production Analytics", icon:"📊" },
  ];

  return (
    <div style={{ fontFamily:"'DM Mono',monospace", minHeight:"100vh", background:"#f5f1eb", color:"#1c1916" }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ borderBottom:"1px solid #e8e3dc", display:"flex", alignItems:"stretch", justifyContent:"space-between", background:"#f5f1eb", position:"sticky", top:0, zIndex:100, backdropFilter:"blur(8px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"0 24px", borderRight:"1px solid #e8e3dc", minWidth:220 }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:900, letterSpacing:"-0.02em" }}>Associate <span className="accent">Financial</span> Suite</div>
            <div style={{ fontSize:8, color:"#aaa", letterSpacing:"0.12em", textTransform:"uppercase", marginTop:2 }}>For Associate Dentists</div>
          </div>
        </div>
        <div style={{ display:"flex", flex:1, overflowX:"auto" }}>
          {TABS.map(t=>(
            <button key={t.id} className={`nav-tab ${activeTab===t.id?"active":""}`} onClick={()=>setActiveTab(t.id)}>
              <span style={{ marginRight:6 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:5, alignItems:"center", padding:"0 20px", borderLeft:"1px solid #e8e3dc" }}>
          {[year-1,year,year+1].map(y=>(
            <button key={y} className={`btn-sm ${activeYear===y?"active":""}`} onClick={()=>setActiveYear(y)}>{y}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:"28px 32px", maxWidth:1280, margin:"0 auto" }}>
        {loading?(
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh", color:"#aaa", fontSize:11, letterSpacing:"0.1em" }}>LOADING...</div>
        ):(<>
          {activeTab==="income"    && <IncomeTracker data={incomeData} setData={setIncomeData} activeYear={activeYear}/>}
          {activeTab==="roi"       && <ROICalculator/>}
          {activeTab==="contract"  && <ContractAnalyzer/>}
          {activeTab==="goals"     && <FinancialGoals incomeData={incomeData} activeYear={activeYear}/>}
          {activeTab==="analytics" && <ProductionAnalytics incomeData={incomeData}/>}
        </>)}
      </div>
      <div style={{ padding:"14px 32px", borderTop:"1px solid #e8e4de", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:9, color:"#d0cac2", letterSpacing:"0.1em", textTransform:"uppercase" }}>Associate Financial Suite — Data saved locally to your browser</span>
        <span style={{ fontSize:9, color:"#d0cac2" }}>For informational purposes only. Consult a licensed financial or legal professional.</span>
      </div>
    </div>
  );
}
