import React from 'react';
import { Building2, ArrowRight } from 'lucide-react';

interface CompanyCardProps {
  title: string;
  subtitle: string; // RUC
  badge: string;    // Rol
  onClick: () => void;
}

export const Card: React.FC<CompanyCardProps> = ({ title, subtitle, badge, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group relative w-full bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-[#22c4a1] transition-all duration-300 text-left overflow-hidden"
    >
      {/* Fondo sutil turquesa al hacer hover */}
      <div className="absolute inset-0 bg-[#f0fdfa] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-center justify-between z-10 w-full">
        <div className="flex items-start gap-4">
          {/* Icono: Pasa de Azul suave a Turquesa sólido */}
          <div className="p-3.5 rounded-xl bg-blue-50 text-[#1e4786] group-hover:bg-[#22c4a1] group-hover:text-white transition-colors duration-300 shadow-sm">
            <Building2 size={28} />
          </div>
          
          <div>
            <h3 className="font-bold text-gray-800 text-lg group-hover:text-[#1e4786] transition-colors leading-tight">
              {title}
            </h3>
            <p className="text-sm text-gray-400 font-mono mt-1 group-hover:text-gray-600">
              RUC: {subtitle}
            </p>
            <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-[11px] font-bold uppercase tracking-wider border border-gray-200 group-hover:bg-white group-hover:border-[#22c4a1] transition-colors">
               {badge}
            </div>
          </div>
        </div>
        
        {/* Flecha animada */}
        <ArrowRight className="text-gray-300 group-hover:text-[#22c4a1] transform group-hover:translate-x-1 transition-all duration-300" size={24} />
      </div>
    </button>
  );
};