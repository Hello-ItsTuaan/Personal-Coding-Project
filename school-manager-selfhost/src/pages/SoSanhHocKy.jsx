import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, TrendingDown, Minus, Table2, BarChart2, Zap, Info } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar
} from "recharts";

const HK_LIST = ["HK1", "HK2"];
const HK_LABELS = { HK1: "HK1", HK2: "HK2 (×2)" };
const HK_COLORS = { HK1: "hsl(234,89%,60%)", HK2: "hsl(142,71%,45%)", HK3: "hsl(38,92%,50%)" };

function calcBaseFromGrades(grds) {
  const tx = grds.filter(g => ["Kiểm tra 1","Kiểm tra 2","Kiểm tra 3","Kiểm tra 4"].includes(g.loai_bai) && g.da_co_ket_qua && g.diem != null);
  const gk = grds.find(g => g.loai_bai === "Giữa kỳ" && g.da_co_ket_qua && g.diem != null);
  const ck = grds.find(g => g.loai_bai === "Cuối kỳ" && g.da_co_ket_qua && g.diem != null);
  const txSum = tx.reduce((s, g) => s + g.diem, 0);
  const weights = tx.length + (gk ? 2 : 0) + (ck ? 3 : 0);
  if (!weights) return null;
  return +((txSum + (gk ? gk.diem * 2 : 0) + (ck ? ck.diem * 3 : 0)) / weights).toFixed(2);
}

function scoreColor(v) {
  if (v == null) return "text-muted-foreground";
  if (v >= 8.5) return "text-green-600 font-semibold";
  if (v >= 7) return "text-blue-600 font-semibold";
  if (v >= 5) return "text-yellow-600 font-semibold";
  return "text-red-500 font-semibold";
}

function rankLabel(v) {
  if (v == null) return "—";
  if (v >= 8.5) return "Giỏi";
  if (v >= 7) return "Khá";
  if (v >= 5) return "TB";
  return "Yếu";
}

// Spreadsheet manual-entry state per subject per HK
const COLS_SS = ["TX1","TX2","TX3","TX4","GK","CK"];
const COL_LOAI = { TX1:"Kiểm tra 1", TX2:"Kiểm tra 2", TX3:"Kiểm tra 3", TX4:"Kiểm tra 4", GK:"Giữa kỳ", CK:"Cuối kỳ" };
const COL_PESO = { TX1:1, TX2:1, TX3:1, TX4:1, GK:2, CK:3 };

function calcFromRow(row) {
  const vals = COLS_SS.map(k => ({ v: parseFloat(row[k]), w: COL_PESO[k] })).filter(x => !isNaN(x.v));
  if (!vals.length) return null;
  const total = vals.reduce((s, x) => s + x.v * x.w, 0);
  const weights = vals.reduce((s, x) => s + x.w, 0);
  return +(total / weights).toFixed(2);
}

export default function SoSanhHocKy() {
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("chart"); // chart | table
  // spreadsheet manual override: { subId_HK: { TX1,..,CK } }
  const [ssRows, setSsRows] = useState({});
  const [quickStr, setQuickStr] = useState({}); // key → string
  const [showQuick, setShowQuick] = useState(null);

  useEffect(() => {
    Promise.all([base44.entities.Subject.list(), base44.entities.Grade.list()]).then(([s, g]) => {
      setSubjects(s); setGrades(g); setLoading(false);
    });
  }, []);

  const getScore = (subId, hk) => {
    const key = `${subId}_${hk}`;
    const manualRow = ssRows[key];
    if (manualRow && Object.values(manualRow).some(v => v !== "")) {
      return calcFromRow(manualRow);
    }
    const grds = grades.filter(g => g.subject_id === subId && g.hoc_ky === hk);
    return calcBaseFromGrades(grds);
  };

  const getTBNam = (subId) => {
    const hk1 = getScore(subId, "HK1");
    const hk2 = getScore(subId, "HK2");
    if (hk1 == null || hk2 == null) return null;
    return +((hk1 + hk2 * 2) / 3).toFixed(2);
  };

  const handleCellChange = (subId, hk, col, val) => {
    const key = `${subId}_${hk}`;
    setSsRows(r => ({ ...r, [key]: { ...(r[key] || {}), [col]: val } }));
  };

  const applyQuick = (subId, hk) => {
    const qkey = `${subId}_${hk}`;
    const str = quickStr[qkey] || "";
    const parts = str.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
    const colOrder = ["TX1","TX2","TX3","TX4","GK","CK"];
    const updates = {};
    parts.forEach((p, i) => { if (i < colOrder.length) updates[colOrder[i]] = p; });
    setSsRows(r => ({ ...r, [qkey]: { ...(r[qkey] || {}), ...updates } }));
    setShowQuick(null);
    setQuickStr(q => ({ ...q, [qkey]: "" }));
  };

  // TX trend per subject: compare HK1 TX avg vs HK2 TX avg
  const trendData = subjects.map(sub => {
    const getTXAvg = (hk) => {
      const key = `${sub.id}_${hk}`;
      const manualRow = ssRows[key];
      const txKeys = ["TX1","TX2","TX3","TX4"];
      if (manualRow && txKeys.some(k => manualRow[k] !== "" && manualRow[k] !== undefined)) {
        const vals = txKeys.map(k => parseFloat(manualRow[k])).filter(v => !isNaN(v));
        return vals.length ? +(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2) : null;
      }
      const grds = grades.filter(g => g.subject_id === sub.id && g.hoc_ky === hk && g.da_co_ket_qua && g.diem != null
        && ["Kiểm tra 1","Kiểm tra 2","Kiểm tra 3","Kiểm tra 4"].includes(g.loai_bai));
      if (!grds.length) return null;
      return +(grds.reduce((s,g)=>s+g.diem,0)/grds.length).toFixed(2);
    };
    const hk1tx = getTXAvg("HK1");
    const hk2tx = getTXAvg("HK2");
    let pct = null;
    if (hk1tx !== null && hk2tx !== null && hk1tx > 0) {
      pct = +(((hk2tx - hk1tx) / hk1tx) * 100).toFixed(1);
    }
    return { sub, hk1tx, hk2tx, pct };
  }).filter(d => d.hk1tx !== null || d.hk2tx !== null);

  // Build data

  const lineData = HK_LIST.map(hk => {
    const scores = subjects.map(sub => getScore(sub.id, hk)).filter(v => v != null);
    return { name: HK_LABELS[hk] || hk, "GPA trung bình": scores.length ? +(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(2) : null };
  }).filter(d => d["GPA trung bình"] != null);

  const tbNamData = (() => {
    const scores = subjects.map(sub => getTBNam(sub.id)).filter(v => v != null);
    return scores.length ? +(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(2) : null;
  })();

  // Per-subject lines
  const subjectLineData = HK_LIST.map(hk => {
    const row = { name: HK_LABELS[hk] || hk };
    subjects.forEach(sub => {
      const s = getScore(sub.id, hk);
      if (s != null) row[sub.ten_mon.length > 14 ? sub.ten_mon.slice(0,14)+"…" : sub.ten_mon] = s;
    });
    return row;
  });
  const subjectKeys = subjects.map(s => s.ten_mon.length > 14 ? s.ten_mon.slice(0,14)+"…" : s.ten_mon);
  const subColors = ["hsl(234,89%,60%)","hsl(142,71%,45%)","hsl(38,92%,50%)","hsl(0,84%,60%)","hsl(262,80%,65%)","hsl(180,70%,45%)"];

  const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">So sánh học kỳ</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Theo dõi tiến bộ GPA qua từng học kỳ</p>
        </div>
        <div className="flex border border-border rounded-lg overflow-hidden">
          {[{k:"chart",label:"📈 Biểu đồ"},{k:"table",label:"📋 Bảng"}].map(({k,label}) => (
            <button key={k} onClick={() => setView(k)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view===k ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          <strong>HK2 = HK1 × 2</strong> &nbsp;|&nbsp; <strong>TB năm = (HK1 + HK2) / 3</strong> &nbsp;|&nbsp; <strong>HSXS</strong> TB ≥ 9 &nbsp;|&nbsp; <strong>HSG</strong> TB ≥ 8 &nbsp;|&nbsp; Nhập nhanh: <code>8,9,7.5,10,6,7</code> → TX1–TX4, GK, CK
        </p>
      </div>

      {/* TB Năm summary */}
      {tbNamData !== null && (
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
          <div className="text-center">
            <div className={`text-3xl font-bold ${tbNamData >= 9 ? "text-green-600" : tbNamData >= 8 ? "text-blue-600" : tbNamData >= 5 ? "text-yellow-600" : "text-red-500"}`}>{tbNamData}</div>
            <div className="text-xs text-muted-foreground">TB năm</div>
          </div>
          <div>
            <div className={`text-lg font-bold ${tbNamData >= 9 ? "text-green-600" : tbNamData >= 8 ? "text-blue-600" : "text-muted-foreground"}`}>
              {tbNamData >= 9 ? "🏆 Học sinh Xuất sắc (HSXS)" : tbNamData >= 8 ? "⭐ Học sinh Giỏi (HSG)" : tbNamData >= 6.5 ? "Học sinh Khá" : tbNamData >= 5 ? "Học sinh Trung bình" : "Cần cố gắng hơn"}
            </div>
            <div className="text-xs text-muted-foreground">TB tổng thể {subjects.length} môn cả năm học</div>
          </div>
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Chưa có môn học. Hãy thêm môn học trước!</p>
        </div>
      ) : (
        <>
          {view === "chart" && (
            <div className="space-y-4">
              {/* Overall GPA line */}
              {lineData.length >= 2 && (
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h2 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" /> GPA tổng thể theo học kỳ
                  </h2>
                  <p className="text-xs text-muted-foreground mb-4">Điểm trung bình tất cả môn qua các học kỳ</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={lineData} margin={{ top:5, right:10, left:-10, bottom:5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize:11, fill:"hsl(var(--muted-foreground))" }} />
                      <YAxis domain={[0,10]} tick={{ fontSize:11, fill:"hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Line dataKey="GPA trung bình" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r:6 }} activeDot={{ r:8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Per-subject lines */}
              {subjectLineData.some(d => subjectKeys.some(k => d[k] != null)) && (
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h2 className="font-semibold text-foreground mb-1">Tiến bộ từng môn qua các học kỳ</h2>
                  <p className="text-xs text-muted-foreground mb-4">Mỗi đường = một môn học</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={subjectLineData} margin={{ top:5, right:10, left:-10, bottom:5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize:11, fill:"hsl(var(--muted-foreground))" }} />
                      <YAxis domain={[0,10]} tick={{ fontSize:11, fill:"hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize:11 }} />
                      {subjectKeys.map((k, i) => (
                        <Line key={k} dataKey={k} stroke={subColors[i % subColors.length]} strokeWidth={2} dot={{ r:4 }} connectNulls />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Bar comparison per HK */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <h2 className="font-semibold text-foreground mb-1">So sánh điểm từng môn theo học kỳ</h2>
                <p className="text-xs text-muted-foreground mb-4">Biểu đồ cột nhóm — mỗi màu = một học kỳ</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={subjects.map(sub => {
                    const row = { name: sub.ten_mon.length > 12 ? sub.ten_mon.slice(0,12)+"…" : sub.ten_mon };
                    HK_LIST.forEach(hk => { const s = getScore(sub.id, hk); if (s != null) row[HK_LABELS[hk]] = s; });
                    const tb = getTBNam(sub.id);
                    if (tb != null) row["TB Năm"] = tb;
                    return row;
                  })} margin={{ top:5, right:10, left:-10, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize:11, fill:"hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[0,10]} tick={{ fontSize:11, fill:"hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    {HK_LIST.map(hk => <Bar key={hk} dataKey={HK_LABELS[hk]} fill={HK_COLORS[hk]} radius={[4,4,0,0]} />)}
                    <Bar dataKey="TB Năm" fill="hsl(262,80%,65%)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {view === "table" && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border">
                      <th className="text-left px-4 py-3 font-semibold min-w-[160px]">Môn học</th>
                      {HK_LIST.map(hk => (
                        <th key={hk} className="text-center px-3 py-3 font-semibold" style={{ color: HK_COLORS[hk] }}>{HK_LABELS[hk]}</th>
                      ))}
                      <th className="text-center px-3 py-3 font-semibold text-purple-600 text-xs">TB Năm</th>
                      <th className="text-center px-3 py-3 font-semibold text-muted-foreground text-xs">Xếp loại</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {subjects.map(sub => {
                      const scores = HK_LIST.map(hk => getScore(sub.id, hk));
                      const tbNam = getTBNam(sub.id);
                      return (
                        <tr key={sub.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{sub.ten_mon}</div>
                          </td>
                          {HK_LIST.map((hk, i) => (
                            <td key={hk} className="px-3 py-3 text-center">
                              <div className={`text-base ${scoreColor(scores[i])}`}>{scores[i] ?? "—"}</div>
                              <div className="text-[10px] text-muted-foreground">{rankLabel(scores[i])}</div>
                            </td>
                          ))}
                          <td className="px-3 py-3 text-center">
                            <div className={`text-base font-bold ${scoreColor(tbNam)}`}>{tbNam ?? "—"}</div>
                          </td>
                          <td className="px-3 py-3 text-center text-sm">
                            {tbNam == null ? "—" : tbNam >= 9
                              ? <span className="text-green-600 font-bold">HSXS</span>
                              : tbNam >= 8
                              ? <span className="text-blue-600 font-bold">HSG</span>
                              : tbNam >= 6.5
                              ? <span className="text-yellow-600">Khá</span>
                              : tbNam >= 5
                              ? <span className="text-muted-foreground">TB</span>
                              : <span className="text-red-500">Yếu</span>}
                          </td>
                        </tr>
                      );
                    })}
                    {/* GPA row */}
                    <tr className="bg-primary/5 font-semibold border-t-2 border-primary/20">
                      <td className="px-4 py-3 text-primary">TB tổng thể</td>
                      {HK_LIST.map(hk => {
                        const scores = subjects.map(sub => getScore(sub.id, hk)).filter(v => v != null);
                        const avg = scores.length ? +(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(2) : null;
                        return (
                          <td key={hk} className="px-3 py-3 text-center">
                            <div className={`text-base ${scoreColor(avg)}`}>{avg ?? "—"}</div>
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 text-center">
                        <div className={`text-base font-bold ${scoreColor(tbNamData)}`}>{tbNamData ?? "—"}</div>
                      </td>
                      <td className="px-3 py-3 text-center text-sm">
                        {tbNamData == null ? "—" : tbNamData >= 9 ? <span className="text-green-600 font-bold">HSXS</span> : tbNamData >= 8 ? <span className="text-blue-600 font-bold">HSG</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Trend analysis */}
          {trendData.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <h2 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Xu hướng điểm TX (HK1 → HK2)
              </h2>
              <p className="text-xs text-muted-foreground mb-4">So sánh điểm thường xuyên trung bình — đang đi lên hay đi xuống bao nhiêu %</p>
              <div className="space-y-3">
                {trendData.map(({ sub, hk1tx, hk2tx, pct }) => {
                  const up = pct !== null && pct > 0;
                  const down = pct !== null && pct < 0;
                  return (
                    <div key={sub.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground truncate">{sub.ten_mon}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {hk1tx !== null && <span className="text-xs text-muted-foreground">HK1: <strong>{hk1tx}</strong></span>}
                            {hk2tx !== null && <span className="text-xs text-muted-foreground">HK2: <strong>{hk2tx}</strong></span>}
                            {pct !== null ? (
                              <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                                up ? "bg-green-100 text-green-700" : down ? "bg-red-100 text-red-700" : "bg-secondary text-muted-foreground"
                              }`}>
                                {up ? <TrendingUp className="w-3 h-3" /> : down ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                {up ? "+" : ""}{pct}%
                              </span>
                            ) : hk1tx !== null && hk2tx === null ? (
                              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Chờ HK2</span>
                            ) : null}
                          </div>
                        </div>
                        {pct !== null && (
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${up ? "bg-green-500" : down ? "bg-red-400" : "bg-muted-foreground"}`}
                              style={{ width: `${Math.min(100, Math.abs(pct) * 2)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
}