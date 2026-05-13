import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Download, Upload, Zap, GraduationCap, Info } from "lucide-react";
import * as XLSX from "xlsx";

const COLS = [
  { key: "TX1", label: "TX1", loai: "Kiểm tra 1", he_so: 1 },
  { key: "TX2", label: "TX2", loai: "Kiểm tra 2", he_so: 1 },
  { key: "TX3", label: "TX3", loai: "Kiểm tra 3", he_so: 1 },
  { key: "TX4", label: "TX4", loai: "Kiểm tra 4", he_so: 1 },
  { key: "GK",  label: "GK",  loai: "Giữa kỳ",    he_so: 2 },
  { key: "CK",  label: "CK",  loai: "Cuối kỳ",    he_so: 3 },
];

export function calcBaseScore(row) {
  const vals = COLS.map(c => ({ val: row[c.key], he_so: c.he_so }))
    .filter(x => x.val !== "" && x.val !== undefined && x.val !== null && !isNaN(parseFloat(x.val)));
  if (!vals.length) return null;
  const total = vals.reduce((s, x) => s + parseFloat(x.val) * x.he_so, 0);
  const weights = vals.reduce((s, x) => s + x.he_so, 0);
  return +(total / weights).toFixed(2);
}

export function calcHKScore(row) {
  return calcBaseScore(row);
}

function scoreColor(v) {
  if (v == null) return "text-muted-foreground";
  if (v >= 8.5) return "text-green-600 font-bold";
  if (v >= 7) return "text-blue-600 font-bold";
  if (v >= 5) return "text-yellow-600 font-bold";
  return "text-red-500 font-bold";
}

export default function DiemSo() {
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [rows, setRows] = useState({});    // `${subId}_${hk}` → { TX1..CK }
  const [gradeMap, setGradeMap] = useState({}); // `${subId}_${hk}_${colKey}` → grade record
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [quickInput, setQuickInput] = useState({});
  const [showQuick, setShowQuick] = useState(null);
  const [hkTab, setHkTab] = useState("HK1");
  const fileInputRef = useRef();

  const load = async () => {
    const [subs, grds] = await Promise.all([
      base44.entities.Subject.list(),
      base44.entities.Grade.list(),
    ]);
    setSubjects(subs);
    setGrades(grds);

    const newRows = {};
    const newMap = {};
    subs.forEach(sub => {
      ["HK1", "HK2"].forEach(hk => {
        const rowKey = `${sub.id}_${hk}`;
        const row = {};
        COLS.forEach(c => { row[c.key] = ""; });
        grds.filter(g => g.subject_id === sub.id && g.hoc_ky === hk).forEach(g => {
          const col = COLS.find(c => c.loai === g.loai_bai);
          if (col) {
            row[col.key] = g.diem !== undefined && g.diem !== null ? g.diem : "";
            newMap[`${sub.id}_${hk}_${col.key}`] = g;
          }
        });
        newRows[rowKey] = row;
      });
    });
    setRows(newRows);
    setGradeMap(newMap);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCellBlur = async (subId, hk, colKey, value) => {
    const sub = subjects.find(s => s.id === subId);
    const col = COLS.find(c => c.key === colKey);
    if (!col || !sub) return;

    const mapKey = `${subId}_${hk}_${colKey}`;
    const existing = gradeMap[mapKey];
    const diem = value !== "" ? parseFloat(value) : undefined;
    if (value !== "" && isNaN(diem)) return;

    setSaving(s => ({ ...s, [mapKey]: true }));
    if (existing) {
      await base44.entities.Grade.update(existing.id, {
        diem, da_co_ket_qua: diem !== undefined, he_so: col.he_so
      });
    } else if (diem !== undefined) {
      const created = await base44.entities.Grade.create({
        subject_id: subId, ten_mon: sub.ten_mon, loai_bai: col.loai,
        diem, he_so: col.he_so, hoc_ky: hk, da_co_ket_qua: true
      });
      setGradeMap(m => ({ ...m, [mapKey]: created }));
    }
    setSaving(s => ({ ...s, [mapKey]: false }));
  };

  const handleCellChange = (subId, hk, colKey, value) => {
    const rowKey = `${subId}_${hk}`;
    setRows(r => ({ ...r, [rowKey]: { ...r[rowKey], [colKey]: value } }));
  };

  const applyQuickInput = async (subId, hk) => {
    const qkey = `${subId}_${hk}`;
    const str = quickInput[qkey] || "";
    const parts = str.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
    const txKeys = ["TX1", "TX2", "TX3", "TX4"];
    const updates = {};
    parts.forEach((p, i) => { if (i < txKeys.length) updates[txKeys[i]] = p; });
    const rowKey = `${subId}_${hk}`;
    setRows(r => ({ ...r, [rowKey]: { ...r[rowKey], ...updates } }));
    for (const [k, v] of Object.entries(updates)) {
      await handleCellBlur(subId, hk, k, v);
    }
    setShowQuick(null);
    setQuickInput(q => ({ ...q, [qkey]: "" }));
  };

  const exportExcel = () => {
    const data = subjects.flatMap(sub =>
      ["HK1", "HK2"].map(hk => {
        const row = rows[`${sub.id}_${hk}`] || {};
        const score = calcHKScore(row, hk);
        return {
          "Tên môn": sub.ten_mon, "Học kỳ": hk,
          TX1: row.TX1 ?? "", TX2: row.TX2 ?? "", TX3: row.TX3 ?? "", TX4: row.TX4 ?? "",
          GK: row.GK ?? "", CK: row.CK ?? "",
          "Điểm tổng kết": score ?? "",
        };
      })
    );
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Điểm số");
    XLSX.writeFile(wb, "diem_so.xlsx");
  };

  const importExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws);
    for (const rowData of data) {
      const tenMon = rowData["Tên môn"] || rowData["ten_mon"];
      const hk = rowData["Học kỳ"] || rowData["hoc_ky"] || "HK1";
      if (!tenMon) continue;
      const sub = subjects.find(s => s.ten_mon?.toLowerCase().trim() === tenMon.toLowerCase().trim());
      if (!sub) continue;
      for (const col of COLS) {
        const val = rowData[col.key] ?? rowData[col.label];
        if (val !== undefined && val !== "") {
          const mapKey = `${sub.id}_${hk}_${col.key}`;
          const existing = gradeMap[mapKey];
          const diem = parseFloat(val);
          if (isNaN(diem)) continue;
          if (existing) {
            await base44.entities.Grade.update(existing.id, { diem, da_co_ket_qua: true, he_so: col.he_so });
          } else {
            await base44.entities.Grade.create({
              subject_id: sub.id, ten_mon: sub.ten_mon, loai_bai: col.loai,
              diem, he_so: col.he_so, hoc_ky: hk, da_co_ket_qua: true
            });
          }
        }
      }
    }
    await load();
    fileInputRef.current.value = "";
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nhập điểm</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Nhập điểm HK1 & HK2 • Tự động tính tổng kết • Xuất/Nhập Excel</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-secondary transition-colors">
            <Download className="w-4 h-4" /> Xuất Excel
          </button>
          <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-secondary transition-colors">
            <Upload className="w-4 h-4" /> Nhập Excel
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={importExcel} />
        </div>
      </div>

      {/* Formula info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          <strong>HK1 & HK2:</strong> S = (TX1+TX2+TX3+TX4 + GK×2 + CK×3) / Tổng hệ số &nbsp;|&nbsp;
          <strong>TB năm:</strong> (HK1 + HK2×2) / 3 &nbsp;|&nbsp;
          <strong>HSXS</strong> ≥ 9.0 &nbsp;|&nbsp; <strong>HSG</strong> ≥ 8.0
        </p>
      </div>

      {/* HK Tabs */}
      <div className="flex border border-border rounded-xl overflow-hidden w-fit">
        {["HK1", "HK2"].map(hk => (
          <button key={hk} onClick={() => setHkTab(hk)}
            className={`px-6 py-2 text-sm font-semibold transition-colors ${hkTab === hk ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary"}`}>
            {hk} {hk === "HK2" && <span className="text-[10px] ml-1 opacity-75">(×2)</span>}
          </button>
        ))}
      </div>

      {subjects.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Chưa có môn học. Hãy thêm môn học trong mục "Môn học" trước!</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="text-left px-4 py-3 font-semibold text-foreground min-w-[160px]">Môn học</th>
                  {COLS.map(c => (
                    <th key={c.key} className="text-center px-2 py-3 font-semibold text-foreground w-16">
                      <div>{c.label}</div>
                      <div className="text-[10px] font-normal text-muted-foreground">×{c.he_so}</div>
                    </th>
                  ))}
                  <th className="text-center px-3 py-3 font-semibold text-primary w-28">
                    Tổng kết {hkTab} {hkTab === "HK2" && <span className="text-[10px]">(×2)</span>}
                  </th>
                  <th className="text-center px-3 py-3 font-semibold text-green-700 w-24 text-xs">TB Năm</th>
                  <th className="text-center px-3 py-3 font-normal text-muted-foreground w-24 text-xs">Nhập nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subjects.map(sub => {
                  const rowKey = `${sub.id}_${hkTab}`;
                  const row = rows[rowKey] || {};
                  const hk1Row = rows[`${sub.id}_HK1`] || {};
                  const hk2Row = rows[`${sub.id}_HK2`] || {};
                  const hkScore = calcHKScore(row);
                  const hk1Score = calcHKScore(hk1Row);
                  const hk2Score = calcHKScore(hk2Row);
                  const tbNam = (hk1Score !== null && hk2Score !== null)
                    ? +((hk1Score + hk2Score * 2) / 3).toFixed(2)
                    : null;
                  const qkey = `${sub.id}_${hkTab}`;

                  return (
                    <tr key={sub.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-2">
                        <div className="font-medium text-foreground">{sub.ten_mon}</div>
                      </td>
                      {COLS.map(col => {
                        const mapKey = `${sub.id}_${hkTab}_${col.key}`;
                        const isSaving = saving[mapKey];
                        const val = row[col.key] ?? "";
                        const num = parseFloat(val);
                        return (
                          <td key={col.key} className="px-1 py-1 text-center">
                            <input
                              type="number" step="0.1" min="0" max="10"
                              value={val}
                              onChange={e => handleCellChange(sub.id, hkTab, col.key, e.target.value)}
                              onBlur={e => handleCellBlur(sub.id, hkTab, col.key, e.target.value)}
                              placeholder="—"
                              className={`w-14 text-center px-1 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors
                                ${isSaving ? "border-yellow-300 bg-yellow-50" : "border-input bg-background hover:border-ring"}
                                ${!isNaN(num) && val !== "" ? (num >= 8.5 ? "text-green-600" : num >= 7 ? "text-blue-600" : num >= 5 ? "text-yellow-600" : "text-red-500") : ""}`}
                            />
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center">
                        <span className={`text-base ${scoreColor(hkScore)}`}>{hkScore ?? "—"}</span>
                        {hkScore !== null && (
                          <div className="text-[10px] text-muted-foreground">
                            {hkScore >= 8.5 ? "Xuất sắc" : hkScore >= 7 ? "Khá" : hkScore >= 5 ? "Trung bình" : "Yếu"}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {tbNam !== null ? (
                          <>
                            <span className={`text-sm ${scoreColor(tbNam)}`}>{tbNam}</span>
                            <div className={`text-[10px] font-bold ${tbNam >= 9 ? "text-green-600" : tbNam >= 8 ? "text-blue-600" : "text-muted-foreground"}`}>
                              {tbNam >= 9 ? "HSXS" : tbNam >= 8 ? "HSG" : ""}
                            </div>
                          </>
                        ) : <span className="text-xs text-muted-foreground">Cần cả 2 HK</span>}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {showQuick === qkey ? (
                          <div className="flex gap-1 items-center">
                            <input
                              autoFocus type="text"
                              value={quickInput[qkey] || ""}
                              onChange={e => setQuickInput(q => ({ ...q, [qkey]: e.target.value }))}
                              onKeyDown={e => { if (e.key === "Enter") applyQuickInput(sub.id, hkTab); if (e.key === "Escape") setShowQuick(null); }}
                              placeholder="8,9,7,10"
                              className="w-20 px-2 py-1 rounded border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <button onClick={() => applyQuickInput(sub.id, hkTab)} className="text-xs bg-primary text-primary-foreground px-1.5 py-1 rounded">✓</button>
                          </div>
                        ) : (
                          <button onClick={() => setShowQuick(qkey)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground text-xs transition-colors mx-auto">
                            <Zap className="w-3 h-3" /> Nhanh
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
        <span>TX1–TX4: hệ số 1 &nbsp;|&nbsp; GK: hệ số 2 &nbsp;|&nbsp; CK: hệ số 3</span>
        <span className="font-medium text-foreground">💡 Nhập nhanh TX: "8,9,7.5,10" → phân bổ TX1–TX4</span>
      </div>
    </div>
  );
}