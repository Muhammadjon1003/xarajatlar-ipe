import React, { useState, useEffect } from 'react';
import { ModalWrapper } from '../common/ModalWrapper';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { formatUZS, getMonthName } from '../../utils/format';
import { Plus, Trash2, BookOpen, Calculator } from 'lucide-react';
import api from '../../api/client';

interface TeacherGroupItem {
  id?: string;
  groupName: string;
  studentCount: number | '';
  archiveCount: number | '';
  groupSalary: number | '';
}

interface TeacherSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
  month: number;
  year: number;
  salaryRecordId: string;
  onSuccess: () => void;
}

export const TeacherSalaryModal: React.FC<TeacherSalaryModalProps> = ({
  isOpen,
  onClose,
  teacherId,
  teacherName,
  month,
  year,
  salaryRecordId,
  onSuccess,
}) => {
  const [groups, setGroups] = useState<TeacherGroupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isOpen && teacherId) {
      fetchExistingGroups();
    }
  }, [isOpen, teacherId, month, year]);

  const fetchExistingGroups = async () => {
    setFetching(true);
    try {
      const res = await api.get('/teacher-groups', {
        params: { teacherId, month, year },
      });
      if (res.data && res.data.length > 0) {
        setGroups(
          res.data.map((g: any) => ({
            id: g.id,
            groupName: g.groupName,
            studentCount: g.studentCount,
            archiveCount: g.archiveCount,
            groupSalary: g.groupSalary,
          }))
        );
      } else {
        // Initial empty group row
        setGroups([{ groupName: '', studentCount: '', archiveCount: '', groupSalary: '' }]);
      }
    } catch (err) {
      console.error(err);
      setGroups([{ groupName: '', studentCount: '', archiveCount: '', groupSalary: '' }]);
    } finally {
      setFetching(false);
    }
  };

  const handleAddGroup = () => {
    setGroups([...groups, { groupName: '', studentCount: '', archiveCount: '', groupSalary: '' }]);
  };

  const handleRemoveGroup = (index: number) => {
    setGroups(groups.filter((_, i) => i !== index));
  };

  const handleGroupChange = (index: number, field: keyof TeacherGroupItem, value: any) => {
    const updated = [...groups];
    updated[index] = { ...updated[index], [field]: value };
    setGroups(updated);
  };

  const totalSalary = groups.reduce((sum, g) => sum + Number(g.groupSalary || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (groups.length === 0) {
      alert('Kamida bitta guruh kiritilishi shart');
      return;
    }

    setLoading(true);
    try {
      await api.post('/teacher-groups', {
        teacherId,
        salaryRecordId,
        month,
        year,
        groups: groups.map((g) => ({
          groupName: g.groupName || 'Guruh',
          studentCount: Number(g.studentCount || 0),
          archiveCount: Number(g.archiveCount || 0),
          groupSalary: Number(g.groupSalary || 0),
        })),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Saqlashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper
      title={`O‘qituvchi Guruhlari — ${teacherName}`}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-[#0d0d0f] border border-zinc-800 rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <BookOpen size={16} className="text-orange-400" />
            <span>Davr: {getMonthName(month)} {year}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Jami Hisoblangan</span>
            <span className="text-base font-extrabold text-orange-400">{formatUZS(totalSalary)}</span>
          </div>
        </div>

        {fetching ? (
          <div className="py-8 text-center text-xs font-semibold text-zinc-500">
            Guruhlar yuklanmoqda...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
              {groups.map((group, index) => (
                <div
                  key={index}
                  className="bg-[#0d0d0f] border border-zinc-800/80 rounded-xl p-3.5 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-400">
                      Guruh #{index + 1}
                    </span>
                    {groups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveGroup(index)}
                        className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                        title="O‘chirish"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Guruh Nomi *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Masalan: Front-end 12"
                        className="w-full bg-[#141417] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                        value={group.groupName}
                        onChange={(e) => handleGroupChange(index, 'groupName', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        O‘quvchilar Soni
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="15"
                        className="w-full bg-[#141417] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                        value={group.studentCount}
                        onChange={(e) => handleGroupChange(index, 'studentCount', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Arxivlar Soni
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="2"
                        className="w-full bg-[#141417] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                        value={group.archiveCount}
                        onChange={(e) => handleGroupChange(index, 'archiveCount', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-amber-400 mb-1">
                        Guruh Maoshi (UZS) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="1500000"
                        className="w-full bg-[#141417] border border-amber-500/30 rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                        value={group.groupSalary}
                        onChange={(e) => handleGroupChange(index, 'groupSalary', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddGroup}
                icon={<Plus size={14} />}
                className="text-xs py-1.5"
              >
                Yangi Guruh Qo‘shish
              </Button>

              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={onClose} className="text-xs">
                  Bekor Qilish
                </Button>
                <Button type="submit" variant="primary" disabled={loading} className="text-xs">
                  {loading ? 'Saqlanmoqda...' : 'Guruhlar Maoshini Saqlash'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </ModalWrapper>
  );
};
