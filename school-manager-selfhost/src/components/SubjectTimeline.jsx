import SubjectTimelineCard from "./SubjectTimelineCard";

export default function SubjectTimeline({ subjects, grades }) {
  const activeSubs = subjects.filter(sub =>
    grades.some(g => g.subject_id === sub.id && g.da_co_ket_qua && g.diem != null)
  );

  if (activeSubs.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-foreground">📅 Timeline điểm từng môn (HK1 → HK2)</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {activeSubs.map(sub => (
          <SubjectTimelineCard key={sub.id} subject={sub} grades={grades} />
        ))}
      </div>
    </div>
  );
}
