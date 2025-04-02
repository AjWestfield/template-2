import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  ...props
}) => {
  const baseClasses = 'font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500',
    secondary: 'bg-gray-700 text-white hover:bg-gray-600 disabled:bg-gray-400',
  };
  
  const allClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  
  return (
    <button 
      type={type} 
      className={allClasses} 
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}; 