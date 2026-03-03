import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'flat-blue' | 'flat-red' | 'outline';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  fullWidth = false,
  className = '', 
  disabled,
  ...props 
}) => {
  
  const baseStyles = "relative flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed";
  
  const variants = {
    // Azul sólido (Data Business)
    'primary': "bg-[#1e4786] text-white shadow-lg shadow-blue-900/10 hover:bg-[#163564]",
    
    // Flat Azul: Fondo suave -> Fondo sólido al hover
    'flat-blue': "bg-blue-50 text-[#1e4786] border border-blue-100 hover:bg-[#1e4786] hover:text-white hover:border-[#1e4786] hover:shadow-md",
    
    // Flat Rojo: Fondo suave -> Fondo sólido al hover (Para cerrar sesión)
    'flat-red': "bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white hover:border-red-600",
    
    // Outline
    'outline': "border-2 border-gray-200 text-gray-600 bg-white hover:border-[#1e4786] hover:text-[#1e4786]"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="animate-spin" size={20} />}
      {children}
    </button>
  );
};