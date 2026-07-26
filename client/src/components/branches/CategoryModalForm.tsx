import React, { useState } from 'react';
import { ModalWrapper } from '../common/ModalWrapper';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface CategoryModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => Promise<void>;
}

export const CategoryModalForm: React.FC<CategoryModalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(name, description);
      setName('');
      setDescription('');
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title="Yangi Kategoriya Qo‘shish" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmitForm} className="space-y-4">
        <Input
          label="Kategoriya Nomi *"
          placeholder="Masalan: Reklama Xarajatlari"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Tavsif (Ixtiyoriy)"
          placeholder="Kategoriya tavsifi..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
