import React, { useState, useEffect } from 'react';
import { Employee, Role } from '../../types';
import { ModalWrapper } from '../common/ModalWrapper';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';

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
  const { user } = useAuth();
  const isSuperAdmin = user?.roleCode === 'SUPER_ADMIN';

  // Filter roles: non-superadmin cannot see or select SUPER_ADMIN role
  const availableRoles = isSuperAdmin
    ? roles
    : roles.filter((r) => r.code !== 'SUPER_ADMIN');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingEmployee) {
      setFirstName(editingEmployee.firstName);
      setLastName(editingEmployee.lastName);
      setUsername(editingEmployee.username || editingEmployee.phone || '');
      setPassword('');
      setRoleId(editingEmployee.roleId || editingEmployee.role?.id || '');
      setIsActive(editingEmployee.isActive);
    } else {
      setFirstName('');
      setLastName('');
      setUsername('');
      setPassword('');
      setIsActive(true);
      if (availableRoles.length > 0) setRoleId(availableRoles[0].id);
    }
  }, [editingEmployee, isOpen, roles]);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        firstName,
        lastName,
        username: username.trim(),
        phone: username.trim(),
        password: password || undefined,
        roleId,
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
            label="Login (Username) *"
            placeholder="alivaliyev"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            label={`Parol ${editingEmployee ? '(O‘zgarmasa bo‘sh)' : '*'}`}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!editingEmployee}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wide">
            Rol / Lavozim *
          </label>
          <select
            className="w-full bg-[#0d0d0f] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            required
          >
            {availableRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.displayName}
              </option>
            ))}
          </select>
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
