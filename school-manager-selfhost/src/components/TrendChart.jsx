import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, Zap, ArrowUp, ArrowDown } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from "recharts";

const COLORS = [
  "hsl(234,89%,60%)", "hsl(142,71%,45%)", "hsl(0,84%,60%)",
  "hsl(38,92%,50%)", "hsl(262,80%,65%)", "hsl(180,70%,45%)",
  "hsl(330,80%,55%)", "hsl(60,70%,40%)"
];

const TX_LABELS = ["TX1", "TX2", "TX3", "TX4"];
const TX_TYPES = ["Kiểm tra 1", "Kiểm tra 2", "Kiểm tra 3", "Kiểm tra 4"];

function linReg(points) {
  const n = points.length;
  if (n < 2) return null;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  const num = points.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
  const den = points.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  if (!den) return null;
  const slope = num / den;
  const intercept = my - slope * mx;
  return { slope, predict: (x) => Math.min(10, Math.max(0, +(slope * x + intercept).toFixed(2))) };
}

export default function TrendChart({ subjects, grades, hk = "HK1" }) {
  const { chartData, subjectMeta } = useMemo(() => {
    const subjectMeta = [];
    const allPoints = {};

    subjects.forEach(sub => {
      const sg = grades.filter(g => g.subject_id === sub.id && g.hoc_ky === hk && g.da_co_ket_qua && g.diem != null);
      const pts = TX_TYPES.map((t, i) => {
        const g = sg.find(x => x.loai_bai === t);
        return g ? { x: i + 1, y: g.diem } : null;
      }).filter(Boolean);
      allPoints[sub.id] = pts;

      const reg = linReg(pts);
      const first = pts[0];
      const last = pts[pts.length - 1];
      let trend = "stable", pct = null;
      if (reg && pts.length >= 2) {
        pct = first && first.y > 0 ? +(((last.y - first.y) / first.y) * 100).toFixed(1) : null;
        trend = reg.slope > 0.1 ? "up" : reg.slope < -0.1 ? "down" : "stable";
      }
      const forecast = reg ? reg.predict(5) : null;
      subjectMeta.push({ sub, trend, pct, forecast, reg, pts });
    });

    const chartData = TX_LABELS.map((label, xi) => {
      const row = { name: label };
      subjects.forEach(sub => {
        const pt = allPoints[sub.id]?.find(p => p.x === xi + 1);
        if (pt) row[sub.ten_mon] = pt.y;
      });
      return row;
    });

    // Add forecast point
    const forecastRow = { name: "Dự báo ▸" };
    let hasForecast = false;
    subjectMeta.forEach(({ sub, forecast }) => {
      if (forecast !== null) { forecastRow[sub.ten_mon] = forecast; hasForecast = true; }
    });
    if (hasForecast) chartData.push(forecastRow);

    return { chartData, subjectMeta };
  }, [subjects, grades, hk]);

  const hasData = subjectMeta.some(m => m.pts.length > 0);
  if (!hasData) return null;

  const tooltipStyle = {
    background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12
  };

  const upSubjects = subjectMeta.filter(m => m.trend === "up" && m.pts.length >= 2);
  const downSubjects = subjectMeta.filter(m => m.trend === "down" && m.pts.length >= 2);
  const stableSubjects = subjectMeta.filter(m => m.trend === "stable" && m.pts.length >= 2);

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-5">
      {/* Header */}
      <div>
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Xu hướng điểm thường xuyên — {hk}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">Biểu đồ đường TX1→TX4 theo từng môn + dự báo thông minh</p>
      </div>

      {/* Summary badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`rounded-xl border p-3 ${upSubjects.length ? "bg-green-50 border-green-200" : "bg-secondary border-border"}`}>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs font-bold text-green-700">Tăng trưởng ({upSubjects.length})</span>
          </div>
          {upSubjects.length === 0
            ? <p className="text-xs text-muted-foreground">Chưa có môn nào</p>
            : upSubjects.map(({ sub, pct }) => (
              <div key={sub.id} className="flex items-center justify-between py-0.5">
                <span className="text-xs text-foreground truncate">{sub.ten_mon}</span>
                {pct !== null && <span className="text-xs font-bold text-green-600 shrink-0 ml-1">+{pct}%</span>}
              </div>
            ))}
        </div>

        <div className={`rounded-xl border p-3 ${downSubjects.length ? "bg-red-50 border-red-200" : "bg-secondary border-border"}`}>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold text-red-700">Cần cải thiện ({downSubjects.length})</span>
          </div>
          {downSubjects.length === 0
            ? <p className="text-xs text-muted-foreground">Không có môn nào</p>
            : downSubjects.map(({ sub, pct }) => (
              <div key={sub.id} className="flex items-center justify-between py-0.5">
                <span className="text-xs text-foreground truncate">{sub.ten_mon}</span>
                {pct !== null && <span className="text-xs font-bold text-red-500 shrink-0 ml-1">{pct}%</span>}
              </div>
            ))}
        </div>

        <div className="rounded-xl border bg-secondary border-border p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Minus className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground">Ổn định ({stableSubjects.length})</span>
          </div>
          {stableSubjects.length === 0
            ? <p className="text-xs text-muted-foreground">Chưa có môn nào</p>
            : stableSubjects.map(({ sub }) => (
              <div key={sub.id} className="py-0.5">
                <span className="text-xs text-foreground truncate">{sub.ten_mon}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Line chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine x="Dự báo ▸" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
          {subjects.map((sub, i) =>
            subjectMeta.find(m => m.sub.id === sub.id)?.pts.length > 0 ? (
              <Line
                key={sub.id}
                dataKey={sub.ten_mon}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2.5}
                dot={{ r: 5, strokeWidth: 2 }}
                activeDot={{ r: 7 }}
                connectNulls
              />
            ) : null
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Per-subject detail badges */}
      <div className="flex flex-wrap gap-2">
        {subjectMeta.filter(m => m.pts.length >= 2).map(({ sub, trend, pct, forecast }, i) => (
          <div key={sub.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${
            trend === "up" ? "bg-green-50 border-green-200 text-green-800" :
            trend === "down" ? "bg-red-50 border-red-200 text-red-800" :
            "bg-secondary border-border text-muted-foreground"
          }`}>
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[subjects.findIndex(s=>s.id===sub.id) % COLORS.length] }} />
            <span>{sub.ten_mon}</span>
            <span className="font-bold">
              {trend === "up" ? `↑ Tăng trưởng${pct !== null ? ` +${pct}%` : ""}` :
               trend === "down" ? `↓ Cần cải thiện${pct !== null ? ` ${pct}%` : ""}` :
               "→ Ổn định"}
            </span>
            {forecast !== null && (
              <span className="text-muted-foreground border-l border-current/20 pl-2">
                Dự báo: <strong className={forecast >= 8 ? "text-green-600" : forecast >= 5 ? "text-yellow-600" : "text-red-500"}>{forecast}</strong>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}