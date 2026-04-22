import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, AlertTriangle, BookOpen, Star, TrendingDown } from "lucide-react";
import { useGoalReminders, calcBaseScore } from "../hooks/useGoalReminders";

const emptyForm = { ten_mon: "", ma_mon: "", so_tin_chi: "", nam_hoc: "", can_co_gang: false, muc_tieu_diem: "", ghi_chu: "" };

export default function MonHoc() {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [grades, setGrades] = useState([]);
  const load = () => Promise.all([
    base44.entities.Subject.list(),
    base44.entities.Grade.list(),
  ]).then(([s, g]) => { setSubjects(s); setGrades(g); setLoading(false); });
  useEffect(() => { load(); }, []);

  useGoalReminders(subjects, grades);

  const getSubjectAvg = (subId) => calcBaseScore(grades.filter(g => g.subject_id === subId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = { ...form, so_tin_chi: form.so_tin_chi ? +form.so_tin_chi : undefined, muc_tieu_diem: form.muc_tieu_diem ? +form.muc_tieu_diem : undefined, hoc_ky: undefined };
    if (editId) await base44.entities.Subject.update(editId, data);
    else await base44.entities.Subject.create(data);
    setForm(emptyForm); setEditId(null); setShowForm(false); setSaving(false);
    load();
  };

  const handleEdit = (sub) => {
    setForm({ ten_mon: sub.ten_mon || "", ma_mon: sub.ma_mon || "", so_tin_chi: sub.so_tin_chi || "", nam_hoc: sub.nam_hoc || "", can_co_gang: sub.can_co_gang || false, muc_tieu_diem: sub.muc_tieu_diem || "", ghi_chu: sub.ghi_chu || "" });
    setEditId(sub.id); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Xóa môn học này? Tất cả điểm liên quan sẽ bị mất.")) return;
    await base44.entities.Subject.delete(id);
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Môn học</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Quản lý danh sách môn học của bạn</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Thêm môn
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">{editId ? "Sửa môn học" : "Thêm môn học mới"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tên môn học *</label>
              <input required value={form.ten_mon} onChange={e => setForm(f => ({ ...f, ten_mon: e.target.value }))} placeholder="VD: Toán cao cấp" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Mã môn</label>
              <input value={form.ma_mon} onChange={e => setForm(f => ({ ...f, ma_mon: e.target.value }))} placeholder="VD: MATH101" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Năm học</label>
              <input value={form.nam_hoc} onChange={e => setForm(f => ({ ...f, nam_hoc: e.target.value }))} placeholder="VD: 2025-2026" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Số tín chỉ</label>
              <input type="number" min="1" max="10" value={form.so_tin_chi} onChange={e => setForm(f => ({ ...f, so_tin_chi: e.target.value }))} placeholder="VD: 3" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Mục tiêu điểm</label>
              <input type="number" step="0.1" min="0" max="10" value={form.muc_tieu_diem} onChange={e => setForm(f => ({ ...f, muc_tieu_diem: e.target.value }))} placeholder="VD: 8.5" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Ghi chú</label>
              <input value={form.ghi_chu} onChange={e => setForm(f => ({ ...f, ghi_chu: e.target.value }))} placeholder="Ghi chú thêm..." className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.can_co_gang} onChange={e => setForm(f => ({ ...f, can_co_gang: e.target.checked }))} className="w-4 h-4 accent-primary rounded" />
                <span className="text-sm text-foreground">⚡ Môn cần cố gắng thêm</span>
              </label>
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors">Hủy</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? "Đang lưu..." : editId ? "Cập nhật" : "Thêm môn"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Below-target summary banner */}
      {(() => {
        const below = subjects.filter(s => s.muc_tieu_diem && getSubjectAvg(s.id) !== null && getSubjectAvg(s.id) < s.muc_tieu_diem);
        if (!below.length) return null;
        return (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-orange-800 text-sm">{below.length} môn đang thấp hơn mục tiêu</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {below.map(s => {
                const avg = getSubjectAvg(s.id);
                return (
                  <span key={s.id} className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-medium">
                    {s.ten_mon}: {avg} / {s.muc_tieu_diem}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* List */}
      {subjects.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Chưa có môn học nào. Hãy thêm môn học đầu tiên!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {subjects.map(sub => {
            const avg = getSubjectAvg(sub.id);
            const belowTarget = sub.muc_tieu_diem && avg !== null && avg < sub.muc_tieu_diem;
            return (
              <div key={sub.id} className={`rounded-2xl border p-4 card-hover transition-colors ${
                belowTarget ? "bg-orange-50 border-orange-300" : "bg-card border-border"
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{sub.ten_mon}</h3>
                      {sub.can_co_gang && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Cần cố gắng</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {sub.nam_hoc && <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{sub.nam_hoc}</span>}
                      {sub.so_tin_chi && <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{sub.so_tin_chi} tín chỉ</span>}
                      {sub.muc_tieu_diem && (
                        <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          belowTarget ? "bg-orange-100 text-orange-700" : "bg-accent text-primary"
                        }`}>
                          <Star className="w-3 h-3" />
                          Mục tiêu: {sub.muc_tieu_diem}
                          {avg !== null && <span className="ml-1 font-bold">({avg} hiện tại)</span>}
                        </span>
                      )}
                    </div>
                    {sub.ghi_chu && <p className="text-xs text-muted-foreground mt-1.5">{sub.ghi_chu}</p>}
                    {belowTarget && (
                      <p className="text-xs text-orange-600 font-medium mt-1.5 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        Cần thêm +{+(sub.muc_tieu_diem - avg).toFixed(2)} điểm để đạt mục tiêu
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={() => handleEdit(sub)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(sub.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}