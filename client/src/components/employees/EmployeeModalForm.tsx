import React, { useState, useEffect } from 'react';
import { Employee, Role } from '../../types';
import { ModalWrapper } from '../common/ModalWrapper';
import { Input } from '../common/Input';
import { CurrencyInput } from '../common/CurrencyInput';
import { Button } from '../common/Button';

interface EmployeeModalFormProps {
  isOpen: boolean;
  editingEmployee: Employee | null;
  roles: Role[];
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
}

export const EmployeeModalForm: React.FC<EmployeeModalFormProps> = ({
  isOpen,
  editingEmployee,
  roles,
  onClose,
  onSubmit,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [defaultBaseSalary, setDefaultBaseSalary] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingEmployee) {
      setFirstName(editingEmployee.firstName);
      setLastName(editingEmployee.lastName);
      setPhone(editingEmployee.phone || '');
      setPassword('');
      setRoleId(editingEmployee.roleId || editingEmployee.role?.id || '');
      setDefaultBaseSalary(
        editingEmployee.defaultBaseSalary ? editingEmployee.defaultBaseSalary.toString() : ''
      );
      setIsActive(editingEmployee.isActive);
    } else {
      setFirstName('');
      setLastName('');
      setPhone('');
      setPassword('');
      setDefaultBaseSalary(''); // Default null (empty) when adding new employee
      setIsActive(true);
      if (roles.length > 0) setRoleId(roles[0].id);
    }
  }, [editingEmployee, isOpen, roles]);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        firstName,
        lastName,
        phone: phone || null,
        password: password || undefined,
        roleId,
        defaultBaseSalary: defaultBaseSalary ? Number(defaultBaseSalary) : null, // Null if unassigned
        isActive,
      });
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper
      title={editingEmployee ? 'Xodim Ma’lumotlarini Tahrirlash' : 'Yangi Xodim Qo‘shish'}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmitForm} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Ism *"
            placeholder="Ali"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            label="Familiya *"
            placeholder="Valiyev"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Telefon Raqam"
            placeholder="+998901234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label={`Parol ${editingEmployee ? '(O‘zgarmasa bo‘sh)' : ''}`}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wide">
              Rol *
            </label>
            <select
              className="w-full bg-[#0d0d0f] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              required
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.displayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <CurrencyInput
              label="Baza Oyligi (Ixtiyoriy)"
              value={defaultBaseSalary}
              onChange={(val) => setDefaultBaseSalary(val)}
              placeholder="Kiritilmagan (Null)"
            />
            <span className="block text-[11px] text-zinc-500 mt-1">
              (Oylik vedomostda kiritilganda avtomatik yangilanadi)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-orange-500 focus:ring-orange-500"
          />
          <label htmlFor="isActive" className="text-xs font-medium text-zinc-300">
            Xodim faollik holati (Active)
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Bekor Qilish
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
};
