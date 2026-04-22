import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Lightbulb, TrendingDown, Target, BookOpen, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import SubjectTimelineCard from "@/components/SubjectTimelineCard";

function calcBaseScore(grades) {
  const tx = grades.filter(g =>
    ["Kiểm tra 1","Kiểm tra 2","Kiểm tra 3","Kiểm tra 4"].includes(g.loai_bai) &&
    g.da_co_ket_qua && g.diem != null
  );
  const gk = grades.find(g => g.loai_bai === "Giữa kỳ" && g.da_co_ket_qua && g.diem != null);
  const ck = grades.find(g => g.loai_bai === "Cuối kỳ" && g.da_co_ket_qua && g.diem != null);
  const txSum = tx.reduce((s, g) => s + g.diem, 0);
  const weights = tx.length + (gk ? 2 : 0) + (ck ? 3 : 0);
  if (!weights) return null;
  return +((txSum + (gk ? gk.diem * 2 : 0) + (ck ? ck.diem * 3 : 0)) / weights).toFixed(2);
}

function detectTrend(subGrades) {
  const txTypes = ["Kiểm tra 1","Kiểm tra 2","Kiểm tra 3","Kiểm tra 4"];
  const pts = txTypes.map((t, i) => {
    const g = subGrades.find(x => x.loai_bai === t && x.da_co_ket_qua && x.diem != null);
    return g ? { x: i, y: g.diem } : null;
  }).filter(Boolean);
  if (pts.length < 2) return "stable";
  const first = pts[0].y, last = pts[pts.length - 1].y;
  const diff = last - first;
  return diff < -0.5 ? "down" : diff > 0.5 ? "up" : "stable";
}

export default function LoTrinh() {
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState({}); // subId -> { topics, exercises, loading }

  useEffect(() => {
    Promise.all([base44.entities.Subject.list(), base44.entities.Grade.list()])
      .then(([s, g]) => { setSubjects(s); setGrades(g); setLoading(false); });
  }, []);

  const prioritySubjects = subjects.map(sub => {
    const sg = grades.filter(g => g.subject_id === sub.id);
    const avg = calcBaseScore(sg);
    const trend = detectTrend(sg);
    const belowTarget = sub.muc_tieu_diem && avg !== null && avg < sub.muc_tieu_diem;
    const gap = belowTarget ? +(sub.muc_tieu_diem - avg).toFixed(2) : 0;
    const priority = (trend === "down" && belowTarget) ? "critical"
      : (trend === "down" || belowTarget) ? "high"
      : trend === "up" ? "good" : "normal";
    return { sub, avg, trend, belowTarget, gap, priority, sg };
  }).filter(d => d.priority !== "normal" || d.avg !== null)
    .sort((a, b) => {
      const order = { critical: 0, high: 1, good: 3, normal: 2 };
      return order[a.priority] - order[b.priority];
    });

  const generateSuggestion = async (sub, avg, gap, trend) => {
    setSuggestions(s => ({ ...s, [sub.id]: { loading: true } }));
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Bạn là gia sư học sinh phổ thông/đại học Việt Nam. Môn học: "${sub.ten_mon}". Điểm hiện tại: ${avg ?? "chưa có"}. Mục tiêu điểm: ${sub.muc_tieu_diem ?? "chưa đặt"}. Xu hướng: ${trend === "down" ? "đang giảm" : trend === "up" ? "đang tăng" : "ổn định"}. Cần cải thiện thêm: ${gap} điểm.
      
Hãy gợi ý cụ thể:
1. 4-6 chủ đề (Topics) học sinh nên tập trung ôn lại trong tuần tới
2. 3-5 dạng bài tập cần luyện tập thêm
3. 1-2 lời khuyên ngắn gọn để cải thiện điểm số

Trả lời ngắn gọn, thực tế, phù hợp học sinh Việt Nam.`,
      response_json_schema: {
        type: "object",
        properties: {
          topics: { type: "array", items: { type: "string" } },
          exercises: { type: "array", items: { type: "string" } },
          tips: { type: "array", items: { type: "string" } },
        }
      }
    });
    setSuggestions(s => ({ ...s, [sub.id]: { ...result, loading: false } }));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const criticalOrHigh = prioritySubjects.filter(d => d.priority === "critical" || d.priority === "high");
  const goodSubjects = prioritySubjects.filter(d => d.priority === "good");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-yellow-500" /> Lộ trình gợi ý
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Phân tích điểm số → gợi ý chủ đề & bài tập ưu tiên cho tuần tới
        </p>
      </div>

      {subjects.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Chưa có dữ liệu môn học và điểm số.</p>
        </div>
      )}

      {/* Timeline từng môn */}
      {subjects.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Timeline điểm từng môn
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {subjects.map(sub => (
              <SubjectTimelineCard key={sub.id} subject={sub} grades={grades} />
            ))}
          </div>
        </div>
      )}

      {/* Lộ trình ưu tiên */}
      {criticalOrHigh.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-500" /> Môn cần ưu tiên cải thiện
          </h2>
          {criticalOrHigh.map(({ sub, avg, gap, trend, priority }) => {
            const sug = suggestions[sub.id];
            return (
              <div key={sub.id} className={`rounded-2xl border p-5 space-y-4 ${priority === "critical" ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{sub.ten_mon}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${priority === "critical" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                        {priority === "critical" ? "🔥 Khẩn cấp" : "⚡ Cần chú ý"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Điểm TB: <strong>{avg ?? "—"}</strong>
                      {sub.muc_tieu_diem && <> · Mục tiêu: <strong>{sub.muc_tieu_diem}</strong> · Cần thêm: <strong className="text-red-600">+{gap}</strong></>}
                      · Xu hướng: <strong>{trend === "down" ? "📉 Giảm" : "➡️ Ổn định"}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => generateSuggestion(sub, avg, gap, trend)}
                    disabled={sug?.loading}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {sug?.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
                    {sug && !sug.loading ? <><RefreshCw className="w-3 h-3" /> Làm mới</> : "Gợi ý AI"}
                  </button>
                </div>

                {sug && !sug.loading && (
                  <div className="grid md:grid-cols-3 gap-3">
                    {/* Topics */}
                    <div className="bg-white/70 rounded-xl p-3 border border-white">
                      <p className="text-xs font-bold text-foreground mb-2">📚 Chủ đề cần ôn</p>
                      <ul className="space-y-1.5">
                        {(sug.topics || []).map((t, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                            <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* Exercises */}
                    <div className="bg-white/70 rounded-xl p-3 border border-white">
                      <p className="text-xs font-bold text-foreground mb-2">✏️ Dạng bài tập</p>
                      <ul className="space-y-1.5">
                        {(sug.exercises || []).map((e, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                            {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* Tips */}
                    <div className="bg-white/70 rounded-xl p-3 border border-white">
                      <p className="text-xs font-bold text-foreground mb-2">💡 Lời khuyên</p>
                      <ul className="space-y-2">
                        {(sug.tips || []).map((tip, i) => (
                          <li key={i} className="text-xs text-foreground bg-yellow-50 border border-yellow-100 rounded-lg p-2">{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Môn đang tốt */}
      {goodSubjects.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" /> Môn đang tiến bộ tốt
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {goodSubjects.map(({ sub, avg }) => (
              <div key={sub.id} className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">{sub.ten_mon}</p>
                  <p className="text-xs text-muted-foreground">TB: <strong className="text-green-600">{avg}</strong>{sub.muc_tieu_diem && <> · Mục tiêu: {sub.muc_tieu_diem}</>}</p>
                </div>
                <span className="text-lg">📈</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
