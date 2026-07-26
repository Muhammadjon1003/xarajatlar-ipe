import React from 'react';

interface TableWrapperProps {
  headers: string[];
  children: React.ReactNode;
}

export const TableWrapper: React.FC<TableWrapperProps> = ({ headers, children }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-5 py-3.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">{children}</tbody>
      </table>
    </div>
  );
};
