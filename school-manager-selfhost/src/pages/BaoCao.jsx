import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart2, TrendingUp, AlertTriangle, CheckCircle, ThumbsUp, ThumbsDown, Download } from "lucide-react";
import SubjectTimeline from "@/components/SubjectTimeline.jsx";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

function calcWeightedAvg(grades) {
  const withScore = grades.filter(g => g.da_co_ket_qua && g.diem !== undefined && g.diem !== null);
  if (!withScore.length) return null;
  const tw = withScore.reduce((s, g) => s + (g.he_so || 1), 0);
  const ts = withScore.reduce((s, g) => s + g.diem * (g.he_so || 1), 0);
  return tw ? +(ts / tw).toFixed(2) : null;
}

function calcHK1FromGrades(grds) {
  const tx = grds.filter(g => ["Kiểm tra 1","Kiểm tra 2","Kiểm tra 3","Kiểm tra 4"].includes(g.loai_bai) && g.da_co_ket_qua && g.diem != null);
  const gk = grds.find(g => g.loai_bai === "Giữa kỳ" && g.da_co_ket_qua && g.diem != null);
  const ck = grds.find(g => g.loai_bai === "Cuối kỳ" && g.da_co_ket_qua && g.diem != null);
  const txSum = tx.reduce((s, g) => s + g.diem, 0);
  const weights = tx.length + (gk ? 2 : 0) + (ck ? 3 : 0);
  if (!weights) return null;
  return +((txSum + (gk ? gk.diem * 2 : 0) + (ck ? ck.diem * 3 : 0)) / weights).toFixed(2);
}

const COLORS = ["hsl(234,89%,60%)", "hsl(262,80%,65%)", "hsl(142,71%,45%)", "hsl(38,92%,50%)", "hsl(0,84%,60%)", "hsl(180,70%,45%)"];

export default function BaoCao() {
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("bar");
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef();

  const exportPDF = async () => {
    setExporting(true);
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");
    const el = reportRef.current;
    const canvas = await html2canvas(el, { scale: 1.5, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgH = (canvas.height * pageW) / canvas.width;
    let y = 0;
    while (y < imgH) {
      if (y > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, -y, pageW, imgH);
      y += pageH;
    }
    pdf.save("bang-diem-bao-cao.pdf");
    setExporting(false);
  };

  useEffect(() => {
    Promise.all([base44.entities.Subject.list(), base44.entities.Grade.list()]).then(([s, g]) => {
      setSubjects(s); setGrades(g); setLoading(false);
    });
  }, []);

  // Data by subject
  const subjectData = subjects.map(sub => {
    const sg = grades.filter(g => g.subject_id === sub.id);
    const avg = calcWeightedAvg(sg);
    const hk1 = calcHK1FromGrades(sg);
    // Component breakdown
    const txGrades = sg.filter(g => ["Kiểm tra 1","Kiểm tra 2","Kiểm tra 3","Kiểm tra 4"].includes(g.loai_bai) && g.da_co_ket_qua && g.diem != null);
    const txAvg = txGrades.length ? +(txGrades.reduce((s,g)=>s+g.diem,0)/txGrades.length).toFixed(2) : null;
    const gkGrade = sg.find(g => g.loai_bai === "Giữa kỳ" && g.da_co_ket_qua && g.diem != null);
    const ckGrade = sg.find(g => g.loai_bai === "Cuối kỳ" && g.da_co_ket_qua && g.diem != null);
    return {
      name: sub.ten_mon.length > 12 ? sub.ten_mon.slice(0, 12) + "…" : sub.ten_mon,
      tenFull: sub.ten_mon, diem: hk1 ?? avg, muc_tieu: sub.muc_tieu_diem || null, hk: sub.hoc_ky,
      txAvg, gkDiem: gkGrade?.diem ?? null, ckDiem: ckGrade?.diem ?? null,
    };
  });

  const withData = subjectData.filter(d => d.diem !== null);

  // By semester
  const hkGroups = {};
  subjectData.forEach(d => {
    if (!hkGroups[d.hk]) hkGroups[d.hk] = [];
    if (d.diem !== null) hkGroups[d.hk].push(d.diem);
  });
  const semesterData = Object.entries(hkGroups).map(([hk, avgs]) => ({
    name: hk,
    "TB học kỳ": avgs.length ? +(avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(2) : null,
  })).filter(d => d["TB học kỳ"] !== null);

  // Grade distribution
  const dist = [
    { name: "Giỏi (≥8.5)", count: withData.filter(d => d.diem >= 8.5).length, fill: "hsl(142,71%,45%)" },
    { name: "Khá (7–8.4)", count: withData.filter(d => d.diem >= 7 && d.diem < 8.5).length, fill: "hsl(234,89%,60%)" },
    { name: "TB (5–6.9)", count: withData.filter(d => d.diem >= 5 && d.diem < 7).length, fill: "hsl(38,92%,50%)" },
    { name: "Yếu (<5)", count: withData.filter(d => d.diem < 5).length, fill: "hsl(0,84%,60%)" },
  ];

  // Grade breakdown per subject (for line/bar per exam type)
  const examTypes = ["Kiểm tra 1", "Kiểm tra 2", "Giữa kỳ", "Cuối kỳ"];
  const examBreakdown = subjects.slice(0, 6).map(sub => {
    const row = { name: sub.ten_mon.length > 10 ? sub.ten_mon.slice(0, 10) + "…" : sub.ten_mon };
    examTypes.forEach(et => {
      const g = grades.find(g => g.subject_id === sub.id && g.loai_bai === et && g.da_co_ket_qua && g.diem !== undefined);
      row[et] = g ? g.diem : undefined;
    });
    return row;
  }).filter(r => examTypes.some(et => r[et] !== undefined));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Báo cáo & Biểu đồ</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Trực quan hóa xu hướng học tập của bạn</p>
        </div>
        <button onClick={exportPDF} disabled={exporting || withData.length === 0}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
          <Download className="w-4 h-4" />
          {exporting ? "Đang xuất..." : "Tải xuống báo cáo (PDF)"}
        </button>
      </div>

      <div ref={reportRef}>
      {withData.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-16 text-center">
          <BarChart2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Chưa có đủ dữ liệu điểm để hiển thị biểu đồ.</p>
        </div>
      ) : (
        <>
          {/* Chart type toggle */}
          <div className="flex gap-2">
            {["bar", "line"].map(t => (
              <button key={t} onClick={() => setChartType(t)} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${chartType === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {t === "bar" ? "📊 Cột" : "📈 Đường"}
              </button>
            ))}
          </div>

          {/* Main chart: avg by subject */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h2 className="font-semibold text-foreground mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Điểm TB theo môn học
            </h2>
            <p className="text-xs text-muted-foreground mb-4">So sánh điểm trung bình có hệ số với mục tiêu đặt ra</p>
            <ResponsiveContainer width="100%" height={280}>
              {chartType === "bar" ? (
                <BarChart data={withData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n, p) => [v, n === "diem" ? p.payload.tenFull : "Mục tiêu"]} />
                  <Legend formatter={v => v === "diem" ? "Điểm TB" : "Mục tiêu"} />
                  <Bar dataKey="diem" name="diem" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="muc_tieu" name="muc_tieu" fill="hsl(38,92%,50%)" radius={[6, 6, 0, 0]} opacity={0.7} />
                </BarChart>
              ) : (
                <LineChart data={withData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend formatter={v => v === "diem" ? "Điểm TB" : "Mục tiêu"} />
                  <Line dataKey="diem" name="diem" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 5 }} />
                  <Line dataKey="muc_tieu" name="muc_tieu" stroke="hsl(38,92%,50%)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Semester avg */}
            {semesterData.length > 1 && (
              <div className="bg-card rounded-2xl border border-border p-5">
                <h2 className="font-semibold text-foreground mb-4">TB theo học kỳ</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={semesterData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="TB học kỳ" fill="hsl(262,80%,65%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Grade distribution */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h2 className="font-semibold text-foreground mb-4">Phân bổ xếp loại</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dist} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={80} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name="Số môn" radius={[0, 6, 6, 0]}>
                    {dist.map((entry, i) => (
                      <rect key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Exam breakdown */}
          {examBreakdown.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <h2 className="font-semibold text-foreground mb-1">Chi tiết điểm từng loại bài kiểm tra</h2>
              <p className="text-xs text-muted-foreground mb-4">So sánh điểm KT thường xuyên, giữa kỳ, cuối kỳ theo từng môn</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={examBreakdown} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {examTypes.map((et, i) => (
                    <Bar key={et} dataKey={et} fill={COLORS[i]} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Radar chart */}
          {withData.length >= 3 && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <h2 className="font-semibold text-foreground mb-4">Biểu đồ radar - Điểm mạnh yếu</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={withData.slice(0, 8)}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <Radar dataKey="diem" name="Điểm TB" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Strength / Weakness breakdown */}
          {withData.some(d => d.txAvg !== null || d.gkDiem !== null || d.ckDiem !== null) && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <h2 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" /> Phân tích điểm mạnh / điểm yếu từng môn
              </h2>
              <p className="text-xs text-muted-foreground mb-4">So sánh TX (thường xuyên) – GK (giữa kỳ) – CK (cuối kỳ)</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={withData.filter(d => d.txAvg !== null || d.gkDiem !== null || d.ckDiem !== null)} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [v ?? "N/A", n]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="txAvg" name="TB Thường xuyên" fill="hsl(142,71%,45%)" radius={[4,4,0,0]} />
                  <Bar dataKey="gkDiem" name="Giữa kỳ" fill="hsl(234,89%,60%)" radius={[4,4,0,0]} />
                  <Bar dataKey="ckDiem" name="Cuối kỳ" fill="hsl(0,84%,60%)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Text summary: strong/weak */}
          {withData.length > 0 && (() => {
            const strong = withData.filter(d => d.diem >= 8.5).map(d => d.tenFull);
            const weak = withData.filter(d => d.diem < 5).map(d => d.tenFull);
            if (!strong.length && !weak.length) return null;
            return (
              <div className="grid md:grid-cols-2 gap-4">
                {strong.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ThumbsUp className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-800 text-sm">Điểm mạnh (≥8.5)</span>
                    </div>
                    <ul className="space-y-1">{strong.map(n => <li key={n} className="text-sm text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" />{n}</li>)}</ul>
                  </div>
                )}
                {weak.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ThumbsDown className="w-4 h-4 text-red-500" />
                      <span className="font-semibold text-red-800 text-sm">Cần cải thiện (&lt;5)</span>
                    </div>
                    <ul className="space-y-1">{weak.map(n => <li key={n} className="text-sm text-red-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{n}</li>)}</ul>
                  </div>
                )}
              </div>
            );
          })()}
          {/* Timeline Chart */}
          <SubjectTimeline subjects={subjects} grades={grades} />
        </>
      )}
      </div>
    </div>
  );
}
