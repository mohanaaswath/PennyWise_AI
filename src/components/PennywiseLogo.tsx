import pennywiseLogo from '@/assets/pennywise-logo.png';

interface PennywiseLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
  xl: 'h-16 w-16',
};

export const PennywiseLogo = ({ className = '', size = 'md' }: PennywiseLogoProps) => {
  return (
    <img 
      src={pennywiseLogo} 
      alt="Pennywise AI" 
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};
