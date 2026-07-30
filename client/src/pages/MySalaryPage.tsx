import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { formatUZS, getMonthName } from '../utils/format';
import { BookOpen, UserCheck, DollarSign, Clock, Users, ShieldCheck, Tag } from 'lucide-react';

export const MySalaryPage: React.FC = () => {
  const { user } = useAuth();
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const [loading, setLoading] = useState(true);

  // Teacher groups state
  const [teacherGroups, setTeacherGroups] = useState<any[]>([]);

  // Administrator aktiv state
  const [adminAktiv, setAdminAktiv] = useState<any | null>(null);

  // General salary state
  const [salaryRecord, setSalaryRecord] = useState<any | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchMySalaryDetails();
    }
  }, [user?.id, month, year]);

  const fetchMySalaryDetails = async () => {
    setLoading(true);
    try {
      if (user?.roleCode === 'TEACHER') {
        const res = await api.get('/teacher-groups', {
          params: { teacherId: user.id, month, year },
        });
        setTeacherGroups(res.data || []);
      } else if (user?.roleCode === 'ADMINISTRATOR') {
        const res = await api.get('/admin-aktiv', {
          params: { administratorId: user.id, month, year },
        });
        setAdminAktiv(res.data || null);
      }

      // Fetch overall salary record
      const salRes = await api.get('/salaries', {
        params: { month, year, employeeId: user?.id },
      });
      if (Array.isArray(salRes.data) && salRes.data.length > 0) {
        const mySal = salRes.data.find((s: any) => s.employeeId === user?.id);
        setSalaryRecord(mySal || null);
      } else {
        setSalaryRecord(null);
      }
    } catch (err) {
      console.error('Error fetching my salary details:', err);
    } finally {
      setLoading(false);
    }
  };

  const isTeacher = user?.roleCode === 'TEACHER';
  const isAdmin = user?.roleCode === 'ADMINISTRATOR';

  // Teacher Calculations
  const teacherTotalStudents = teacherGroups.reduce((sum, g) => sum + Number(g.studentCount || 0), 0);
  const teacherTotalArchives = teacherGroups.reduce((sum, g) => sum + Number(g.archiveCount || 0), 0);
  const teacherTotalSalary = teacherGroups.reduce((sum, g) => sum + Number(g.groupSalary || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Mening Oyligim"
        subtitle={`${user?.firstName} ${user?.lastName} — ${user?.roleDisplayName} shaxsiy hisob-kitoblari`}
      />

      {/* Month & Year Filter Bar */}
      <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Oy</label>
            <select
              className="bg-[#0d0d0f] border border-zinc-800 rounded-xl px-3.5 py-2 text-sm font-bold text-zinc-100 focus:outline-none focus:border-orange-500"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {getMonthName(m)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Yil</label>
            <select
              className="bg-[#0d0d0f] border border-zinc-800 rounded-xl px-3.5 py-2 text-sm font-bold text-zinc-100 focus:outline-none focus:border-orange-500"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            {getMonthName(month)} {year} — Jami Hisoblangan Maosh
          </span>
          <h2 className="text-2xl font-extrabold text-orange-400">
            {formatUZS(
              isTeacher
                ? teacherTotalSalary
                : isAdmin
                ? adminAktiv?.totalSalary || 0
                : salaryRecord?.finalPayout || salaryRecord?.baseSalary || 0
            )}
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-zinc-500 font-semibold text-sm">
          Ma’lumotlar yuklanmoqda...
        </div>
      ) : (
        <>
          {/* TEACHER VIEW */}
          {isTeacher && (
            <div className="space-y-6">
              {/* Teacher Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 space-y-1">
                  <span className="text-xs font-bold text-orange-400 uppercase">Jami Maosh</span>
                  <p className="text-2xl font-extrabold text-white">{formatUZS(teacherTotalSalary)}</p>
                  <p className="text-[11px] text-zinc-400">{teacherGroups.length} ta guruh summasi</p>
                </div>

                <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 space-y-1">
                  <span className="text-xs font-bold text-emerald-400 uppercase">Guruhlar Soni</span>
                  <p className="text-2xl font-extrabold text-white">{teacherGroups.length} ta</p>
                  <p className="text-[11px] text-zinc-400">Faol ta’lim guruhlari</p>
                </div>

                <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 space-y-1">
                  <span className="text-xs font-bold text-blue-400 uppercase">O‘quvchilar Soni</span>
                  <p className="text-2xl font-extrabold text-white">{teacherTotalStudents} ta</p>
                  <p className="text-[11px] text-zinc-400">Barcha guruhdagi aktiv talabalar</p>
                </div>

                <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 space-y-1">
                  <span className="text-xs font-bold text-amber-400 uppercase">Arxiv O‘quvchilar</span>
                  <p className="text-2xl font-extrabold text-amber-400">{teacherTotalArchives} ta</p>
                  <p className="text-[11px] text-zinc-400">Mavjud arxivlar soni</p>
                </div>
              </div>

              {/* Teacher Groups Table */}
              <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen size={18} className="text-orange-400" />
                  Mening Guruhlarim ({getMonthName(month)} {year})
                </h3>

                {teacherGroups.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500 text-xs font-semibold">
                    Ushbu oy uchun guruh ma’lumotlari kiritilmagan
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teacherGroups.map((g, idx) => (
                      <div
                        key={g.id || idx}
                        className="bg-[#0d0d0f] border border-zinc-800 rounded-xl p-4 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-orange-500/10 text-orange-400 font-extrabold text-xs flex items-center justify-center border border-orange-500/20">
                              #{idx + 1}
                            </span>
                            <h4 className="text-sm font-bold text-white">{g.groupName}</h4>
                          </div>

                          <span className="text-base font-extrabold text-orange-400">
                            {formatUZS(g.groupSalary)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-400 pt-1">
                          <span>
                            O‘quvchilar: <strong className="text-white">{g.studentCount || 0} ta</strong>
                          </span>
                          <span>
                            Arxiv: <strong className="text-amber-400">{g.archiveCount || 0} ta</strong>
                          </span>
                        </div>

                        {/* Archive Student Names Badges */}
                        {Array.isArray(g.archiveStudentNames) && g.archiveStudentNames.length > 0 && (
                          <div className="pt-2 border-t border-zinc-800/60">
                            <span className="text-[11px] text-zinc-500 block mb-1 font-semibold">
                              Arxiv O‘quvchilar Ismlari:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {g.archiveStudentNames.map((name: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-semibold"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ADMINISTRATOR VIEW */}
          {isAdmin && (
            <div className="space-y-6">
              {/* Admin Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 space-y-1">
                  <span className="text-xs font-bold text-orange-400 uppercase">Jami Maosh</span>
                  <p className="text-2xl font-extrabold text-white">
                    {formatUZS(adminAktiv?.totalSalary || 0)}
                  </p>
                  <p className="text-[11px] text-zinc-400">Baza + Aktiv ustamalari</p>
                </div>

                <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 space-y-1">
                  <span className="text-xs font-bold text-amber-400 uppercase">Baza Maoshi</span>
                  <p className="text-2xl font-extrabold text-white">
                    {formatUZS(adminAktiv?.baseSalary || 0)}
                  </p>
                  <p className="text-[11px] text-zinc-400">Standart administrator oyligi</p>
                </div>

                <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 space-y-1">
                  <span className="text-xs font-bold text-emerald-400 uppercase">Aktiv O‘quvchilar</span>
                  <p className="text-2xl font-extrabold text-emerald-400">
                    {adminAktiv?.aktivCount || 0} ta
                  </p>
                  <p className="text-[11px] text-zinc-400">Jalb qilingan talabalar soni</p>
                </div>

                <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 space-y-1">
                  <span className="text-xs font-bold text-blue-400 uppercase">Bir Aktiv Narxi</span>
                  <p className="text-2xl font-extrabold text-white">
                    {formatUZS(adminAktiv?.aktivPrice || 0)}
                  </p>
                  <p className="text-[11px] text-zinc-400">Har bir aktiv uchun to‘lov</p>
                </div>
              </div>

              {/* Formula & Calculation Breakdown Card */}
              <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck size={18} className="text-emerald-400" />
                  Administrator Oyligi Hisob-kitob Formulasi
                </h3>

                <div className="bg-[#0d0d0f] border border-zinc-800 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
                    <span className="text-zinc-400">Baza Oylik:</span>
                    <strong className="text-white">{formatUZS(adminAktiv?.baseSalary || 0)}</strong>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
                    <span className="text-zinc-400">
                      Aktivlar Ustamasi ({adminAktiv?.aktivCount || 0} ta × {formatUZS(adminAktiv?.aktivPrice || 0)}):
                    </span>
                    <strong className="text-emerald-400">
                      +{formatUZS((adminAktiv?.aktivCount || 0) * (adminAktiv?.aktivPrice || 0))}
                    </strong>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="font-extrabold text-orange-400">Jami Oylik Maosh:</span>
                    <strong className="text-lg font-extrabold text-orange-400">
                      {formatUZS(adminAktiv?.totalSalary || 0)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GENERAL EMPLOYEE VIEW */}
          {!isTeacher && !isAdmin && (
            <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign size={18} className="text-orange-400" />
                Oylik Maosh Tafsilotlari ({getMonthName(month)} {year})
              </h3>

              <div className="bg-[#0d0d0f] border border-zinc-800 rounded-xl p-5 space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                  <span className="text-zinc-400">Asosiy Baza Maoshi:</span>
                  <strong className="text-white">{formatUZS(salaryRecord?.baseSalary || user?.defaultBaseSalary || 0)}</strong>
                </div>
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                  <span className="text-zinc-400">Zamena Qilgan Ustamalari:</span>
                  <strong className="text-emerald-400">+{formatUZS(salaryRecord?.totalAdditions || 0)}</strong>
                </div>
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                  <span className="text-zinc-400">Zamena Qildirgan Ushlanmalari:</span>
                  <strong className="text-rose-400">-{formatUZS(salaryRecord?.totalShiftDeductions || 0)}</strong>
                </div>
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                  <span className="text-zinc-400">Ushlab Qolingan Avanslar:</span>
                  <strong className="text-amber-400">-{formatUZS(salaryRecord?.totalAdvanceDeductions || 0)}</strong>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-extrabold text-orange-400 text-base">Sof Qo‘lga Tegadigan Maosh:</span>
                  <strong className="text-xl font-extrabold text-orange-400">
                    {formatUZS(salaryRecord?.finalPayout || 0)}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
