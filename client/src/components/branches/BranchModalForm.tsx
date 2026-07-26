import React, { useState } from 'react';
import { ModalWrapper } from '../common/ModalWrapper';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface BranchModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

export const BranchModalForm: React.FC<BranchModalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(name);
      setName('');
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title="Yangi Filial Qo‘shish" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmitForm} className="space-y-4">
        <Input
          label="Filial Nomi *"
          placeholder="Masalan: Chilonzor Filiali"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="flex justify-end gap-3 pt-4">
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
