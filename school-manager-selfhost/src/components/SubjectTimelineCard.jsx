import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const SEQUENCE = [
  { hk: "HK1", loai: "Kiểm tra 1",  label: "HK1·TX1" },
  { hk: "HK1", loai: "Kiểm tra 2",  label: "HK1·TX2" },
  { hk: "HK1", loai: "Kiểm tra 3",  label: "HK1·TX3" },
  { hk: "HK1", loai: "Kiểm tra 4",  label: "HK1·TX4" },
  { hk: "HK1", loai: "Giữa kỳ",     label: "HK1·GK"  },
  { hk: "HK1", loai: "Cuối kỳ",     label: "HK1·CK"  },
  { hk: "HK2", loai: "Kiểm tra 1",  label: "HK2·TX1" },
  { hk: "HK2", loai: "Kiểm tra 2",  label: "HK2·TX2" },
  { hk: "HK2", loai: "Kiểm tra 3",  label: "HK2·TX3" },
  { hk: "HK2", loai: "Kiểm tra 4",  label: "HK2·TX4" },
  { hk: "HK2", loai: "Giữa kỳ",     label: "HK2·GK"  },
  { hk: "HK2", loai: "Cuối kỳ",     label: "HK2·CK"  },
];

function linReg(pts) {
  const n = pts.length;
  if (n < 2) return null;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  const num = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
  const den = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  if (!den) return null;
  return num / den; // slope
}

export default function SubjectTimelineCard({ subject, grades }) {
  const subGrades = grades.filter(g => g.subject_id === subject.id);

  const chartData = SEQUENCE.map(seq => {
    const g = subGrades.find(g =>
      g.hoc_ky === seq.hk && g.loai_bai === seq.loai && g.da_co_ket_qua && g.diem != null
    );
    return { name: seq.label, diem: g ? g.diem : null, _hk: seq.hk };
  });

  // Trim trailing nulls
  let lastIdx = -1;
  chartData.forEach((r, i) => { if (r.diem != null) lastIdx = i; });
  if (lastIdx < 0) return null;
  const trimmed = chartData.slice(0, lastIdx + 1);

  // Trend
  const pts = trimmed.filter(r => r.diem != null).map((r, i) => ({ x: i, y: r.diem }));
  const slope = linReg(pts);
  const trend = slope === null ? "stable" : slope > 0.08 ? "up" : slope < -0.08 ? "down" : "stable";
  const avg = pts.length ? +(pts.reduce((s, p) => s + p.y, 0) / pts.length).toFixed(2) : null;

  const trendColor = trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-muted-foreground";
  const cardBorder = trend === "down" ? "border-red-200 bg-red-50/30" : trend === "up" ? "border-green-200 bg-green-50/30" : "border-border bg-card";

  const tooltipStyle = {
    background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12
  };

  return (
    <div className={`rounded-2xl border p-4 ${cardBorder}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-foreground text-sm">{subject.ten_mon}</h3>
          {subject.muc_tieu_diem && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Mục tiêu: <strong>{subject.muc_tieu_diem}</strong>
              {avg !== null && (
                <span className={avg >= subject.muc_tieu_diem ? " text-green-600 ml-1" : " text-orange-600 ml-1"}>
                  (TB: {avg})
                </span>
              )}
            </p>
          )}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${trendColor}`}>
          {trend === "up" && <><TrendingUp className="w-3.5 h-3.5" />Tăng</>}
          {trend === "down" && <><TrendingDown className="w-3.5 h-3.5" />Giảm</>}
          {trend === "stable" && <><Minus className="w-3.5 h-3.5" />Ổn định</>}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={trimmed} margin={{ top: 4, right: 8, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            angle={-40}
            textAnchor="end"
            interval={0}
          />
          <YAxis domain={[0, 10]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip contentStyle={tooltipStyle} />
          {subject.muc_tieu_diem && (
            <ReferenceLine
              y={subject.muc_tieu_diem}
              stroke="hsl(38,92%,50%)"
              strokeDasharray="5 3"
              label={{ value: "Mục tiêu", position: "right", fontSize: 9, fill: "hsl(38,92%,50%)" }}
            />
          )}
          <ReferenceLine x="HK2·TX1" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 3" />
          <Line
            dataKey="diem"
            name="Điểm"
            stroke={trend === "down" ? "hsl(0,84%,60%)" : trend === "up" ? "hsl(142,71%,45%)" : "hsl(234,89%,60%)"}
            strokeWidth={2.5}
            dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--card))" }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
