"use client";

import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function PasswordField({ label, error, ...props }: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1.5 w-full">
      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
        {label}
      </label>
      <div className="relative">
        <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type={showPassword ? "text" : "password"} 
          {...props}
          className={`w-full pl-11 pr-11 py-3 bg-white border ${
            error ? 'border-red-500' : 'border-[#E7E7EC]'
          } rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition-colors"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <span className="text-[10px] font-bold text-red-500 block pl-1">{error}</span>}
    </div>
  );
}
