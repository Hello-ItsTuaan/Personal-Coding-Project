import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";

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

/**
 * Fires toast notifications for subjects below their target score.
 * Call once when subjects + grades are loaded.
 */
export function useGoalReminders(subjects, grades) {
  const { toast } = useToast();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    if (!subjects?.length || !grades) return;

    const belowTarget = subjects.filter(sub => {
      if (!sub.muc_tieu_diem) return false;
      const sg = grades.filter(g => g.subject_id === sub.id);
      const avg = calcBaseScore(sg);
      return avg !== null && avg < sub.muc_tieu_diem;
    }).map(sub => {
      const sg = grades.filter(g => g.subject_id === sub.id);
      const avg = calcBaseScore(sg);
      return { sub, avg, gap: +(sub.muc_tieu_diem - avg).toFixed(2) };
    });

    if (!belowTarget.length) return;
    firedRef.current = true;

    // Group toast: one summary + individual toasts for critical (gap > 1)
    toast({
      title: `⚠️ ${belowTarget.length} môn chưa đạt mục tiêu`,
      description: belowTarget.map(({ sub, avg }) =>
        `${sub.ten_mon}: ${avg} / ${sub.muc_tieu_diem}`
      ).join(" • "),
      duration: 6000,
    });

    belowTarget.filter(({ gap }) => gap > 1).forEach(({ sub, avg, gap }) => {
      setTimeout(() => {
        toast({
          title: `🔥 Cần cố gắng: ${sub.ten_mon}`,
          description: `Điểm hiện tại ${avg} — cần thêm ${gap} điểm để đạt mục tiêu ${sub.muc_tieu_diem}`,
          variant: "destructive",
          duration: 7000,
        });
      }, 800);
    });
  }, [subjects, grades]);
}

export { calcBaseScore };