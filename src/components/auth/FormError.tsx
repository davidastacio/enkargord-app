"use client";

import { AlertTriangle } from 'lucide-react';

interface FormErrorProps {
  message?: string | null;
}

export default function FormError({ message }: FormErrorProps) {
  if (!message) return null;

  return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-start gap-2.5 text-xs font-semibold animate-shake">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
