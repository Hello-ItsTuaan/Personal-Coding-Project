import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { BookOpen, TrendingUp, Target, AlertTriangle, Calendar, Plus, Award } from "lucide-react";
import Onboarding from "@/components/Onboarding.jsx";
import TrendChart from "@/components/TrendChart.jsx";
import SubjectTimeline from "@/components/SubjectTimeline.jsx";
import { useGoalReminders } from "@/hooks/useGoalReminders";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

function gradeColor(diem) {
  if (!diem && diem !== 0) return "text-muted-foreground";
  if (diem >= 8.5) return "text-green-600";
  if (diem >= 7) return "text-blue-600";
  if (diem >= 5) return "text-yellow-500";
  return "text-red-500";
}

function gradeBg(diem) {
  if (!diem && diem !== 0) return "bg-secondary";
  if (diem >= 8.5) return "bg-green-50 border-green-200";
  if (diem >= 7) return "bg-blue-50 border-blue-200";
  if (diem >= 5) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

function gradeLabel(diem) {
  if (!diem && diem !== 0) return "—";
  if (diem >= 8.5) return "Giỏi";
  if (diem >= 7) return "Khá";
  if (diem >= 5) return "TB";
  return "Yếu";
}

function calcBaseScore(grds) {
  const tx = grds.filter(g => ["Kiểm tra 1","Kiểm tra 2","Kiểm tra 3","Kiểm tra 4"].includes(g.loai_bai) && g.da_co_ket_qua && g.diem != null);
  const gk = grds.find(g => g.loai_bai === "Giữa kỳ" && g.da_co_ket_qua && g.diem != null);
  const ck = grds.find(g => g.loai_bai === "Cuối kỳ" && g.da_co_ket_qua && g.diem != null);
  const txSum = tx.reduce((s, g) => s + g.diem, 0);
  const weights = tx.length + (gk ? 2 : 0) + (ck ? 3 : 0);
  if (!weights) return null;
  return +((txSum + (gk ? gk.diem * 2 : 0) + (ck ? ck.diem * 3 : 0)) / weights).toFixed(2);
}

function calcSubjectScore(allGrades, subId) {
  const hk1 = calcBaseScore(allGrades.filter(g => g.subject_id === subId && g.hoc_ky === "HK1"));
  const hk2 = calcBaseScore(allGrades.filter(g => g.subject_id === subId && g.hoc_ky === "HK2"));
  if (hk1 !== null && hk2 !== null) return +((hk1 + hk2 * 2) / 3).toFixed(2);
  if (hk1 !== null) return hk1;
  if (hk2 !== null) return hk2;
  return null;
}

function calcHKScore(allGrades, subId, hk) {
  return calcBaseScore(allGrades.filter(g => g.subject_id === subId && g.hoc_ky === hk));
}

export default function Dashboard() {
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Subject.list(),
      base44.entities.Grade.list(),
      base44.entities.Goal.list(),
      base44.auth.me(),
    ]).then(([s, g, go, me]) => {
      setSubjects(s);
      setGrades(g);
      setGoals(go);
      setCurrentUser(me);
      if (!me?.da_onboard) setShowOnboarding(true);
      setLoading(false);
    });
  }, []);

  // Build chart data by subject
  const chartData = subjects.map(sub => {
    const avg = calcSubjectScore(grades, sub.id);
    return { ten: sub.ten_mon.length > 10 ? sub.ten_mon.slice(0, 10) + "…" : sub.ten_mon, tenFull: sub.ten_mon, diem: avg };
  }).filter(d => d.diem !== null);

  // TB năm tổng thể
  const allAvgsNam = subjects.map(sub => calcSubjectScore(grades, sub.id)).filter(Boolean);
  const tbNamTongThe = allAvgsNam.length ? +(allAvgsNam.reduce((a,b)=>a+b,0)/allAvgsNam.length).toFixed(2) : null;

  // Cảnh báo: môn dưới mục tiêu
  const warnings = subjects
    .filter(sub => sub.muc_tieu_diem)
    .map(sub => {
      const score = calcSubjectScore(grades, sub.id);
      const hk1 = calcHKScore(grades, sub.id, "HK1");
      const hk2 = calcHKScore(grades, sub.id, "HK2");
      if (score === null) return null;
      if (score >= sub.muc_tieu_diem) return null;
      // tìm loại bài yếu nhất
      const subGrades = grades.filter(g => g.subject_id === sub.id && g.da_co_ket_qua && g.diem != null);
      const lowestGrade = subGrades.sort((a,b) => a.diem - b.diem)[0];
      return { sub, score, target: sub.muc_tieu_diem, hk1, hk2, lowestGrade };
    })
    .filter(Boolean);

  // Stats
  const totalSubjects = subjects.length;
  const needEffort = subjects.filter(s => s.can_co_gang).length;
  const overallAvg = tbNamTongThe;

  // Upcoming exams
  const today = new Date(); today.setHours(0,0,0,0);
  const in7 = new Date(today); in7.setDate(in7.getDate() + 7);
  const upcomingAll = grades
    .filter(g => !g.da_co_ket_qua && g.ngay_kiem_tra)
    .map(g => ({ ...g, _date: new Date(g.ngay_kiem_tra) }))
    .filter(g => g._date >= today)
    .sort((a, b) => a._date - b._date);
  const urgent = upcomingAll.filter(g => g._date <= in7);
  const upcoming = upcomingAll.slice(0, 3);

  // Subject goal progress
  const subjectGoals = subjects
    .filter(sub => sub.muc_tieu_diem)
    .map(sub => {
      const score = calcSubjectScore(grades, sub.id);
      const pct = score !== null ? Math.min(100, Math.round((score / sub.muc_tieu_diem) * 100)) : 0;
      return { sub, score, pct, achieved: score !== null && score >= sub.muc_tieu_diem };
    });

  useGoalReminders(subjects, grades);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const displayName = currentUser?.ten_hoc_sinh || currentUser?.full_name || "";

  return (
    <div className="space-y-6">
      {showOnboarding && (
        <Onboarding onComplete={(data) => {
          setCurrentUser(u => ({ ...u, ...data, da_onboard: true }));
          setShowOnboarding(false);
        }} />
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {displayName ? `Xin chào, ${displayName}! 👋` : "Tổng quan"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {currentUser?.truong ? `${currentUser.lop || ""} • ${currentUser.truong}` : "Theo dõi kết quả học tập của bạn"}
          </p>
        </div>
        <Link to="/mon-hoc" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Thêm môn
        </Link>
      </div>

      {/* Nhắc nhở thi sắp tới (7 ngày) */}
      {urgent.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-yellow-600" />
            <span className="font-semibold text-yellow-800 text-sm">⏰ {urgent.length} bài kiểm tra trong 7 ngày tới!</span>
          </div>
          <div className="space-y-1.5">
            {urgent.map(exam => {
              const sub = subjects.find(s => s.id === exam.subject_id);
              const daysLeft = Math.ceil((exam._date - today) / 86400000);
              return (
                <div key={exam.id} className="flex items-center justify-between bg-white border border-yellow-100 rounded-xl px-3 py-2">
                  <div>
                    <span className="text-sm font-medium text-foreground">{sub?.ten_mon || exam.ten_mon}</span>
                    <span className="text-xs text-muted-foreground ml-2">{exam.loai_bai} • Hệ số {exam.he_so}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${daysLeft === 0 ? "bg-red-100 text-red-600" : daysLeft <= 3 ? "bg-orange-100 text-orange-600" : "bg-yellow-100 text-yellow-700"}`}>
                    {daysLeft === 0 ? "Hôm nay!" : `${daysLeft} ngày`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cảnh báo điểm dưới mục tiêu */}
      {warnings.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="font-semibold text-orange-800 text-sm">{warnings.length} môn dưới mục tiêu</span>
          </div>
          {warnings.map(({ sub, score, target, hk1, hk2, lowestGrade }) => (
            <div key={sub.id} className="bg-white border border-orange-100 rounded-xl p-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-foreground text-sm">{sub.ten_mon}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Hiện tại: <span className="text-red-500 font-semibold">{score}</span> &nbsp;|&nbsp; Mục tiêu: <span className="text-green-600 font-semibold">{target}</span>
                  {hk1 != null && <> &nbsp;|&nbsp; HK1: {hk1}</>}
                  {hk2 != null && <> &nbsp;|&nbsp; HK2: {hk2}</>}
                </p>
                {lowestGrade && (
                  <p className="text-xs text-orange-600 mt-1">⚠️ Cần cải thiện: <strong>{lowestGrade.loai_bai}</strong> ({lowestGrade.diem} điểm)</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Cần +{(target - score).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Tổng môn học" value={totalSubjects} color="blue" />
        <StatCard icon={Award} label="TB năm học" value={overallAvg !== null ? overallAvg : "—"} color={overallAvg >= 9 ? "green" : overallAvg >= 8 ? "blue" : overallAvg >= 5 ? "yellow" : "red"} />
        <StatCard icon={AlertTriangle} label="Cần cố gắng" value={needEffort} color="orange" />
        <StatCard icon={Target} label="Mục tiêu" value={goals.length} color="purple" />
      </div>

      {/* Subject goal progress bars */}
      {subjectGoals.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Tiến trình đạt mục tiêu từng môn
          </h2>
          <div className="space-y-3">
            {subjectGoals.map(({ sub, score, pct, achieved }) => (
              <div key={sub.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-foreground">{sub.ten_mon}</span>
                  <span className="text-xs text-muted-foreground">
                    {score ?? "—"} / {sub.muc_tieu_diem}
                    {achieved && <span className="ml-1 text-green-600 font-bold">✓ Đạt</span>}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${achieved ? "bg-green-500" : pct >= 80 ? "bg-blue-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-400"}`}
                    style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 text-right">{pct}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend Chart */}
      {subjects.length > 0 && grades.length > 0 && (
        <TrendChart subjects={subjects} grades={grades} hk="HK1" />
      )}

      {/* Timeline chart */}
      {subjects.length > 0 && grades.length > 0 && (
        <SubjectTimeline subjects={subjects} grades={grades} />
      )}

      {/* Bar Chart */}
      {chartData.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Điểm trung bình theo môn học
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="ten" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v, n, p) => [v, p.payload.tenFull]}
              />
              <Bar dataKey="diem" name="Điểm TB" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Subject cards */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" /> Kết quả môn học
          </h2>
          {subjects.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">Chưa có môn học nào. <Link to="/mon-hoc" className="text-primary underline">Thêm môn học</Link></p>
          ) : (
            <div className="space-y-2">
              {subjects.map(sub => {
                const avg = calcSubjectScore(grades, sub.id);
                return (
                  <div key={sub.id} className={`flex items-center justify-between p-3 rounded-xl border ${gradeBg(avg)}`}>
                    <div>
                      <p className="text-sm font-medium text-foreground">{sub.ten_mon}</p>
                      <p className="text-xs text-muted-foreground">{sub.nam_hoc || ""}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${gradeColor(avg)}`}>{avg ?? "—"}</p>
                      <p className={`text-xs font-medium ${gradeColor(avg)}`}>{avg !== null ? gradeLabel(avg) : "Chưa có"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming exams */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Kiểm tra sắp tới
          </h2>
          {upcoming.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">Không có lịch kiểm tra sắp tới</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map(exam => {
                const sub = subjects.find(s => s.id === exam.subject_id);
                const daysLeft = exam.ngay_kiem_tra
                  ? Math.ceil((new Date(exam.ngay_kiem_tra) - new Date()) / 86400000)
                  : null;
                return (
                  <div key={exam.id} className="flex items-center justify-between p-3 bg-accent rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-foreground">{sub?.ten_mon || exam.ten_mon}</p>
                      <p className="text-xs text-muted-foreground">{exam.loai_bai} • Hệ số {exam.he_so}</p>
                    </div>
                    {daysLeft !== null && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${daysLeft <= 3 ? "bg-red-100 text-red-600" : daysLeft <= 7 ? "bg-yellow-100 text-yellow-600" : "bg-green-100 text-green-600"}`}>
                        {daysLeft <= 0 ? "Hôm nay!" : `${daysLeft} ngày`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-card rounded-2xl border border-border p-4 card-hover">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
