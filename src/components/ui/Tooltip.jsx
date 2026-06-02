import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

export const Tooltip = ({ children, title }) => {
  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md animate-in fade-in zoom-in-95"
            sideOffset={5}
          >
            {title}
            <TooltipPrimitive.Arrow className="fill-slate-900" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};
