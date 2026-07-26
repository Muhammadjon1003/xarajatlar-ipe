import React from 'react';
import { Search } from 'lucide-react';
import { Branch, ExpenseCategory } from '../../types';

interface ExpenseFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  selectedBranch: string;
  setSelectedBranch: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  branches: Branch[];
  categories: ExpenseCategory[];
}

export const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({
  search,
  setSearch,
  selectedBranch,
  setSelectedBranch,
  selectedCategory,
  setSelectedCategory,
  branches,
  categories,
}) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap gap-4 items-center">
      <div className="relative flex-1 min-w-[240px]">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          className="w-full bg-[#0d0d0f] border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          placeholder="Xarajat nomi bo‘yicha qidiruv..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <select
        className="bg-[#0d0d0f] border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-orange-500"
        value={selectedBranch}
        onChange={(e) => setSelectedBranch(e.target.value)}
      >
        <option value="">Barcha Filiallar</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      <select
        className="bg-[#0d0d0f] border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-orange-500"
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        <option value="">Barcha Kategoriyalar</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
};
