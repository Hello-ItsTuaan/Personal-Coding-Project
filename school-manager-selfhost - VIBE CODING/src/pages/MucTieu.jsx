import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Target, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";

const emptyForm = { ten_muc_tieu: "", mo_ta: "", loai_muc_tieu: "TB môn học", gia_tri_muc_tieu: "", so_mon_ap_dung: "", hoc_ky: "HK1", nam_hoc: "" };

function calcWeightedAvg(grades) {
  const withScore = grades.filter(g => g.da_co_ket_qua && g.diem !== undefined && g.diem !== null);
  if (!withScore.length) return null;
  const tw = withScore.reduce((s, g) => s + (g.he_so || 1), 0);
  const ts = withScore.reduce((s, g) => s + g.diem * (g.he_so || 1), 0);
  return tw ? +(ts / tw).toFixed(2) : null;
}

export default function MucTieu() {
  const [goals, setGoals] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => Promise.all([base44.entities.Goal.list(), base44.entities.Subject.list(), base44.entities.Grade.list()]).then(([g, s, gr]) => { setGoals(g); setSubjects(s); setGrades(gr); setLoading(false); });
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = { ...form, gia_tri_muc_tieu: +form.gia_tri_muc_tieu, so_mon_ap_dung: form.so_mon_ap_dung ? +form.so_mon_ap_dung : undefined };
    await base44.entities.Goal.create(data);
    setForm(emptyForm); setShowForm(false); setSaving(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Xóa mục tiêu này?")) return;
    await base44.entities.Goal.delete(id);
    load();
  };

  // Evaluate goal achievement
  const evaluateGoal = (goal) => {
    const subAvgs = subjects.map(sub => {
      const sg = grades.filter(g => g.subject_id === sub.id);
      return { avg: calcWeightedAvg(sg), hoc_ky: sub.hoc_ky };
    });

    if (goal.loai_muc_tieu === "TB cả năm") {
      const all = subAvgs.map(a => a.avg).filter(a => a !== null);
      if (!all.length) return { current: null, achieved: false };
      const avg = +(all.reduce((a, b) => a + b, 0) / all.length).toFixed(2);
      return { current: avg, achieved: avg >= goal.gia_tri_muc_tieu };
    }
    if (goal.loai_muc_tieu === "TB học kỳ") {
      const hk = subAvgs.filter(a => !goal.hoc_ky || a.hoc_ky === goal.hoc_ky).map(a => a.avg).filter(a => a !== null);
      if (!hk.length) return { current: null, achieved: false };
      const avg = +(hk.reduce((a, b) => a + b, 0) / hk.length).toFixed(2);
      return { current: avg, achieved: avg >= goal.gia_tri_muc_tieu };
    }
    if (goal.loai_muc_tieu === "Số môn đạt") {
      const count = subAvgs.filter(a => a.avg !== null && a.avg >= goal.gia_tri_muc_tieu).length;
      const target = goal.so_mon_ap_dung || subjects.length;
      return { current: `${count}/${subjects.length}`, achieved: count >= target };
    }
    return { current: null, achieved: false };
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mục tiêu học tập</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Đặt và theo dõi mục tiêu điểm số</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Thêm mục tiêu
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">Thêm mục tiêu mới</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tên mục tiêu *</label>
              <input required value={form.ten_muc_tieu} onChange={e => setForm(f => ({ ...f, ten_muc_tieu: e.target.value }))} placeholder='VD: TB 6 môn > 9 là đạt xuất sắc' className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Loại mục tiêu</label>
              <select value={form.loai_muc_tieu} onChange={e => setForm(f => ({ ...f, loai_muc_tieu: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="TB môn học">TB môn học</option>
                <option value="TB học kỳ">TB học kỳ</option>
                <option value="TB cả năm">TB cả năm</option>
                <option value="Số môn đạt">Số môn đạt điểm X trở lên</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {form.loai_muc_tieu === "Số môn đạt" ? "Điểm cần đạt tối thiểu" : "Điểm mục tiêu"} *
              </label>
              <input type="number" step="0.1" min="0" max="10" required value={form.gia_tri_muc_tieu} onChange={e => setForm(f => ({ ...f, gia_tri_muc_tieu: e.target.value }))} placeholder="VD: 8.5" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            {form.loai_muc_tieu === "Số môn đạt" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Số môn cần đạt</label>
                <input type="number" min="1" value={form.so_mon_ap_dung} onChange={e => setForm(f => ({ ...f, so_mon_ap_dung: e.target.value }))} placeholder={`Tổng: ${subjects.length} môn`} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Học kỳ áp dụng</label>
              <select value={form.hoc_ky} onChange={e => setForm(f => ({ ...f, hoc_ky: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="HK1">Học kỳ 1</option>
                <option value="HK2">Học kỳ 2</option>
                <option value="HK3">Học kỳ 3</option>
                <option value="">Cả năm</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Mô tả</label>
              <input value={form.mo_ta} onChange={e => setForm(f => ({ ...f, mo_ta: e.target.value }))} placeholder="Mô tả thêm về mục tiêu..." className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors">Hủy</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">{saving ? "Đang lưu..." : "Thêm mục tiêu"}</button>
            </div>
          </form>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Chưa có mục tiêu nào. Hãy đặt mục tiêu học tập!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {goals.map(goal => {
            const { current, achieved } = evaluateGoal(goal);
            return (
              <div key={goal.id} className={`bg-card rounded-2xl border p-4 card-hover ${achieved ? "border-green-200" : "border-border"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {achieved ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                      <h3 className="font-semibold text-foreground text-sm">{goal.ten_muc_tieu}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{goal.loai_muc_tieu}</span>
                      <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">Mục tiêu: {goal.gia_tri_muc_tieu}</span>
                      {goal.hoc_ky && <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{goal.hoc_ky}</span>}
                    </div>
                    {current !== null && (
                      <p className={`text-sm font-bold mt-2 ${achieved ? "text-green-600" : "text-muted-foreground"}`}>
                        Hiện tại: {current} {achieved ? "✅ Đạt!" : ""}
                      </p>
                    )}
                    {goal.mo_ta && <p className="text-xs text-muted-foreground mt-1">{goal.mo_ta}</p>}
                  </div>
                  <button onClick={() => handleDelete(goal.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors ml-2"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}