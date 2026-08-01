import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-6">
      <div className="w-16 h-16 rounded-2xl bg-seal-50 dark:bg-white/5 text-seal-500 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-display text-lg font-bold text-ink dark:text-ink-light mb-1">{title}</h3>
      <p className="text-ink/60 dark:text-ink-light/60 max-w-xs mb-5">{message}</p>
      {action}
    </div>
  );
}
