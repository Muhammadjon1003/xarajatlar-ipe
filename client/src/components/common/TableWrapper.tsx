import React from 'react';

interface TableWrapperProps {
  headers: string[];
  children: React.ReactNode;
}

export const TableWrapper: React.FC<TableWrapperProps> = ({ headers, children }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-zinc-800 bg-[#141417]">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#1a1a1e] text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-5 py-3.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">{children}</tbody>
      </table>
    </div>
  );
};
