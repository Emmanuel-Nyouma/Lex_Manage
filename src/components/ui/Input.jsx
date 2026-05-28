import React, { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = forwardRef(({ 
  label, 
  error, 
  icon: Icon, 
  className = '', 
  type,
  id,
  ...props 
}, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors">
            <Icon size={18} aria-hidden="true" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          aria-invalid={!!error}
          aria-errormessage={errorId}
          className={`
            w-full bg-white dark:bg-slate-900 border rounded-lg py-2.5 text-sm transition-all outline-none
            ${Icon ? 'pl-10' : 'pl-4'}
            ${isPassword ? 'pr-10' : 'pr-4'}
            ${error 
              ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' 
              : 'border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
            }
            dark:text-white placeholder:text-slate-400
            ${className}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide" : "Show"}
          >
            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
