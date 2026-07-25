import React from 'react';

export const Skeleton = ({ className = "", ...props }) => (
  <div
    aria-hidden="true"
    className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg ${className}`}
    {...props}
  />
);

export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`} aria-hidden="true">
    {Array.from({ length: lines }, (_, index) => (
      <Skeleton
        key={index}
        className={`h-3 ${index === lines - 1 ? 'w-2/3' : 'w-full'}`}
      />
    ))}
  </div>
);

export const PageSkeleton = ({ variant = 'content', className = '' }) => {
  const layouts = {
    content: (
      <>
        <div className="space-y-2"><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-80" /></div>
        <SkeletonText lines={2} className="mt-6 max-w-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-32 rounded-2xl" />)}
        </div>
      </>
    ),
    table: (
      <>
        <div className="flex flex-col sm:flex-row justify-between gap-4"><div className="space-y-2"><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-72" /></div><Skeleton className="h-10 w-36" /></div>
        <Skeleton className="h-14 w-full rounded-2xl mt-6" />
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 mt-4">
          {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-14 w-full rounded-xl" />)}
        </div>
      </>
    ),
    calendar: (
      <>
        <div className="flex justify-between gap-4"><div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-72" /></div><Skeleton className="h-10 w-28" /></div>
        <Skeleton className="h-[min(65vh,560px)] w-full rounded-2xl mt-6" />
      </>
    ),
    detail: (
      <>
        <div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-xl" /><Skeleton className="h-8 w-64" /></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6"><Skeleton className="h-72 rounded-2xl" /><Skeleton className="h-72 lg:col-span-2 rounded-2xl" /></div>
      </>
    ),
    assistant: (
      <div className="flex h-full gap-4"><Skeleton className="hidden md:block w-72 rounded-none" /><div className="flex-1 space-y-5 p-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-24 w-3/4" /><Skeleton className="h-20 w-2/3 ml-auto" /><Skeleton className="h-24 w-3/4" /></div></div>
    ),
  };

  return <div role="status" aria-label="Loading" className={`space-y-6 animate-in fade-in duration-300 ${className}`}>{layouts[variant] || layouts.content}</div>;
};
