interface GenialLogoProps {
  className?: string;
  color?: string;
}

export default function GenialLogo({ className = "", color = "#1B5E20" }: GenialLogoProps) {
  return (
    <svg 
      className={className}
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <text 
        x="12" 
        y="16" 
        textAnchor="middle" 
        fontFamily="serif" 
        fontSize="14" 
        fontStyle="italic"
        fill={color}
      >
        Genial
      </text>
    </svg>
  );
}
