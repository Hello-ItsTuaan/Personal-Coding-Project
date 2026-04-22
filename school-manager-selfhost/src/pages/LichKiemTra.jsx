import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Clock, CheckCircle, AlertTriangle, Target, Flame, Download, ExternalLink, Pencil, MapPin } from "lucide-react";

function calcBaseScore(grds) {
  const tx = grds.filter(g => ["Kiểm tra 1","Kiểm tra 2","Kiểm tra 3","Kiểm tra 4"].includes(g.loai_bai) && g.da_co_ket_qua && g.diem != null);
  const gk = grds.find(g => g.loai_bai === "Giữa kỳ" && g.da_co_ket_qua && g.diem != null);
  const ck = grds.find(g => g.loai_bai === "Cuối kỳ" && g.da_co_ket_qua && g.diem != null);
  const txSum = tx.reduce((s, g) => s + g.diem, 0);
  const weights = tx.length + (gk ? 2 : 0) + (ck ? 3 : 0);
  if (!weights) return null;
  return +((txSum + (gk ? gk.diem * 2 : 0) + (ck ? ck.diem * 3 : 0)) / weights).toFixed(2);
}

// Build Google Calendar event link
function buildGCalLink(exam, subName) {
  const dateStr = exam.ngay_kiem_tra?.replace(/-/g, "");
  if (!dateStr) return null;
  const time = exam.gio_kiem_tra || "07:00";
  const [hh, mm] = time.split(":").map(Number);
  const startDT = `${dateStr}T${String(hh).padStart(2,"0")}${String(mm).padStart(2,"0")}00`;
  const endHH = hh + 1;
  const endDT = `${dateStr}T${String(endHH).padStart(2,"0")}${String(mm).padStart(2,"0")}00`;
  const title = encodeURIComponent(`${exam.loai_bai} - ${subName}`);
  const details = encodeURIComponent(`Môn: ${subName}\nLoại: ${exam.loai_bai}\nHệ số: ${exam.he_so}`);
  const location = encodeURIComponent(exam.dia_diem || "");
  return `https://calendar.google.com/calendar/r/eventedit?text=${title}&dates=${startDT}/${endDT}&details=${details}&location=${location}`;
}

// Build ICS content for all upcoming exams
function buildICS(exams, subjects) {
  const lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//DiemSo//VN"];
  exams.forEach(exam => {
    const sub = subjects.find(s => s.id === exam.subject_id);
    const subName = sub?.ten_mon || exam.ten_mon || "Kiểm tra";
    const dateStr = exam.ngay_kiem_tra?.replace(/-/g, "");
    if (!dateStr) return;
    const time = exam.gio_kiem_tra || "070000";
    const [hh, mm] = (exam.gio_kiem_tra || "07:00").split(":").map(Number);
    const startDT = `${dateStr}T${String(hh).padStart(2,"0")}${String(mm).padStart(2,"0")}00`;
    const endHH = hh + 1;
    const endDT = `${dateStr}T${String(endHH).padStart(2,"0")}${String(mm).padStart(2,"0")}00`;
    const uid = `${exam.id}@diemso`;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTART:${startDT}`);
    lines.push(`DTEND:${endDT}`);
    lines.push(`SUMMARY:${exam.loai_bai} - ${subName}`);
    lines.push(`DESCRIPTION:Môn: ${subName}\\nHệ số: ${exam.he_so}`);
    if (exam.dia_diem) lines.push(`LOCATION:${exam.dia_diem}`);
    lines.push("BEGIN:VALARM");
    lines.push("TRIGGER:-PT60M");
    lines.push("ACTION:DISPLAY");
    lines.push(`DESCRIPTION:Nhắc: ${exam.loai_bai} - ${subName} sau 1 tiếng`);
    lines.push("END:VALARM");
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export default function LichKiemTra() {
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () =>
    Promise.all([base44.entities.Subject.list(), base44.entities.Grade.list()])
      .then(([s, g]) => { setSubjects(s); setGrades(g); setLoading(false); });

  useEffect(() => { load(); }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allExams = grades.filter(g => g.ngay_kiem_tra).map(g => ({
    ...g,
    sub: subjects.find(s => s.id === g.subject_id),
    date: new Date(g.ngay_kiem_tra),
  })).sort((a, b) => a.date - b.date);

  const upcoming = allExams.filter(e => !e.da_co_ket_qua && e.date >= today);
  const past = allExams.filter(e => e.da_co_ket_qua || e.date < today).reverse();

  const focusList = subjects
    .filter(s => s.muc_tieu_diem)
    .map(sub => {
      const sg = grades.filter(g => g.subject_id === sub.id);
      const avg = calcBaseScore(sg);
      const gap = avg !== null ? +(sub.muc_tieu_diem - avg).toFixed(2) : null;
      let priority = "medium";
      if (gap === null) priority = "medium";
      else if (gap > 0) priority = "high";
      else if (gap >= -0.4) priority = "medium";
      else priority = "low";
      return { sub, avg, gap, priority };
    })
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]));

  const startEdit = (exam) => {
    setEditingId(exam.id);
    setEditForm({ gio_kiem_tra: exam.gio_kiem_tra || "", dia_diem: exam.dia_diem || "", ngay_kiem_tra: exam.ngay_kiem_tra || "" });
  };

  const saveEdit = async () => {
    setSaving(true);
    await base44.entities.Grade.update(editingId, editForm);
    setEditingId(null);
    setSaving(false);
    load();
  };

  const exportICS = () => {
    const content = buildICS(upcoming, subjects);
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "lich-kiem-tra.ics"; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lịch kiểm tra</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Theo dõi các bài kiểm tra sắp tới và đã qua</p>
        </div>
        {upcoming.length > 0 && (
          <button onClick={exportICS}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            <Download className="w-4 h-4" /> Xuất lịch (.ics)
          </button>
        )}
      </div>

      {/* Google Calendar info banner */}
      {upcoming.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <Calendar className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">📅 Đồng bộ với Google Calendar</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Bấm <strong>"Google Calendar"</strong> trên từng bài kiểm tra để thêm sự kiện trực tiếp, hoặc tải file <strong>.ics</strong> để nhập toàn bộ lịch vào Calendar / Outlook.
            </p>
          </div>
        </div>
      )}

      {/* Focus Priority Panel */}
      {focusList.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-1 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Ưu tiên tập trung
          </h2>
          <p className="text-xs text-muted-foreground mb-3">Dựa trên khoảng cách tới mục tiêu</p>
          <div className="space-y-2">
            {focusList.map(({ sub, avg, gap, priority }) => (
              <div key={sub.id} className={`flex items-center justify-between p-3 rounded-xl border ${
                priority === "high" ? "bg-red-50 border-red-200" :
                priority === "medium" ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200"
              }`}>
                <div className="flex items-center gap-2">
                  {priority === "high" && <Flame className="w-4 h-4 text-red-500 shrink-0" />}
                  {priority === "medium" && <Target className="w-4 h-4 text-yellow-500 shrink-0" />}
                  {priority === "low" && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                  <div>
                    <p className="text-sm font-semibold text-foreground">{sub.ten_mon}</p>
                    <p className="text-xs text-muted-foreground">TB: {avg ?? "—"} / Mục tiêu: {sub.muc_tieu_diem}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    priority === "high" ? "bg-red-100 text-red-700" :
                    priority === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                  }`}>
                    {priority === "high" ? "🔥 Cần tập trung" : priority === "medium" ? "⚡ Theo dõi" : "✅ Hạ ưu tiên"}
                  </span>
                  {gap !== null && (
                    <p className={`text-xs font-medium mt-0.5 ${gap > 0 ? "text-red-500" : "text-green-600"}`}>
                      {gap > 0 ? `Cần thêm +${gap}đ` : `Vượt ${Math.abs(gap)}đ`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Sắp tới ({upcoming.length})
          </h2>
          {upcoming.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Không có lịch kiểm tra sắp tới</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map(exam => {
                const daysLeft = Math.ceil((exam.date - today) / 86400000);
                const isUrgent = daysLeft <= 3;
                const subName = exam.sub?.ten_mon || exam.ten_mon || "Kiểm tra";
                const gcalLink = buildGCalLink(exam, subName);
                const isEditing = editingId === exam.id;
                return (
                  <div key={exam.id} className={`p-3 rounded-xl border ${isUrgent ? "bg-red-50 border-red-200" : "bg-accent border-accent"}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{subName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{exam.loai_bai} • Hệ số {exam.he_so}</p>
                        {exam.gio_kiem_tra && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />{exam.gio_kiem_tra}
                          </p>
                        )}
                        {exam.dia_diem && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />{exam.dia_diem}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${isUrgent ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                          {daysLeft === 0 ? "Hôm nay!" : `${daysLeft} ngày nữa`}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">{exam.date.toLocaleDateString("vi-VN")}</p>
                      </div>
                    </div>

                    {/* Inline edit form */}
                    {isEditing ? (
                      <div className="mt-3 space-y-2 border-t border-border pt-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Ngày thi</label>
                            <input type="date" value={editForm.ngay_kiem_tra}
                              onChange={e => setEditForm(f => ({ ...f, ngay_kiem_tra: e.target.value }))}
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Giờ thi</label>
                            <input type="time" value={editForm.gio_kiem_tra}
                              onChange={e => setEditForm(f => ({ ...f, gio_kiem_tra: e.target.value }))}
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Địa điểm / Phòng thi</label>
                          <input type="text" value={editForm.dia_diem} placeholder="VD: Phòng 101, Tòa A"
                            onChange={e => setEditForm(f => ({ ...f, dia_diem: e.target.value }))}
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditingId(null)} className="px-3 py-1 text-xs rounded-lg border border-border hover:bg-secondary">Hủy</button>
                          <button onClick={saveEdit} disabled={saving} className="px-3 py-1 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
                            {saving ? "Đang lưu..." : "Lưu"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <button onClick={() => startEdit(exam)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-white/60 border border-border px-2 py-1 rounded-lg transition-colors">
                          <Pencil className="w-3 h-3" /> Sửa giờ/địa điểm
                        </button>
                        {gcalLink && (
                          <a href={gcalLink} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                            <ExternalLink className="w-3 h-3" /> Google Calendar
                          </a>
                        )}
                      </div>
                    )}

                    {isUrgent && !isEditing && (
                      <div className="flex items-center gap-1 mt-2">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        <p className="text-xs text-red-500 font-medium">Cần chuẩn bị gấp!</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Past */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" /> Đã qua ({past.length})
          </h2>
          {past.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Chưa có bài kiểm tra nào đã qua</p>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {past.map(exam => (
                <div key={exam.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{exam.sub?.ten_mon || exam.ten_mon}</p>
                    <p className="text-xs text-muted-foreground">
                      {exam.loai_bai} • {exam.date.toLocaleDateString("vi-VN")}
                      {exam.gio_kiem_tra && ` • ${exam.gio_kiem_tra}`}
                    </p>
                  </div>
                  <div className="text-right">
                    {exam.da_co_ket_qua && exam.diem !== undefined && exam.diem !== null ? (
                      <span className={`text-sm font-bold ${exam.diem >= 8.5 ? "text-green-600" : exam.diem >= 5 ? "text-blue-600" : "text-red-500"}`}>{exam.diem}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Chưa có điểm</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}