import React from 'react';
import { ChevronRight } from 'lucide-react';

export const Breadcrumb = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-xs font-bold text-slate-500">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && <ChevronRight size={14} className="mx-2 text-slate-300" />}
            {item.current ? (
              <span className="text-slate-900 dark:text-white" aria-current="page">{item.label}</span>
            ) : (
              <a href={item.href} className="hover:text-amber-600 transition-colors">{item.label}</a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
