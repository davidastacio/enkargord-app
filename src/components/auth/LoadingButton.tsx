"use client";

import { ChevronRight } from 'lucide-react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  text: string;
}

export default function LoadingButton({ isLoading, text, ...props }: LoadingButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading || props.disabled}
      className="w-full bg-[#d3121a] hover:bg-[#b00f14] disabled:opacity-75 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all shadow-md shadow-red-100 flex items-center justify-center gap-2 cursor-pointer"
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      ) : (
        <>
          <span>{text}</span>
          <ChevronRight size={16} />
        </>
      )}
    </button>
  );
}
