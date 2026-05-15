import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Onboarding({ onComplete }) {
  const [studentName, setStudentName] = useState("");
  const [schoolYear, setSchoolYear] = useState("");

  const submit = (e) => {
    e?.preventDefault?.();
    onComplete?.({
      ten_hoc_sinh: studentName.trim() || undefined,
      nam_hoc: schoolYear.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-lg">
        <h2 className="text-lg font-semibold text-foreground">Thiết lập nhanh</h2>
        <p className="mt-1 text-sm text-muted-foreground">Nhập vài thông tin để bắt đầu quản lý môn/điểm.</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground">Tên học sinh (tuỳ chọn)</label>
            <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="VD: Minh" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground">Năm học (tuỳ chọn)</label>
            <Input value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)} placeholder="VD: 2025-2026" />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => onComplete?.({})}>
            Bỏ qua
          </Button>
          <Button type="submit">Bắt đầu</Button>
        </div>
      </form>
    </div>
  );
}
