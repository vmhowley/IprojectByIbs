import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
