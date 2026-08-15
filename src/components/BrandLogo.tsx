import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = "w-8 h-8", size = 32 }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 32 32" 
      width={size} 
      height={size} 
      fill="none"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="#000000" />
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="7.25" stroke="#3f3f46" strokeWidth="1.5" />
      
      {/* Outer concentric radar scanner ring */}
      <circle cx="16" cy="16" r="10" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="2.5 2" opacity="0.45" />
      
      {/* Core solid precision ring */}
      <circle cx="16" cy="16" r="6" stroke="#ffffff" strokeWidth="1.8" />
      
      {/* Directional crosshair alignment markers */}
      <line x1="16" y1="3.5" x2="16" y2="7" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="25" x2="16" y2="28.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3.5" y1="16" x2="7" y2="16" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="25" y1="16" x2="28.5" y2="16" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Center spatial beacon */}
      <circle cx="16" cy="16" r="2.25" fill="#ffffff" />
      
      {/* Active green change indicator dot */}
      <circle cx="21.5" cy="10.5" r="1.75" fill="#10b981" />
    </svg>
  );
};
