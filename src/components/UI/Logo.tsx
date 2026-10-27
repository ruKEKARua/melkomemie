import logoCinema from '../../assets/logo-cinema.png';
import logoCinema2x from '../../assets/logo-cinema@2x.png';

interface LogoProps {
  className?: string;
  size?: number;
  alt?: string;
}

export const Logo = ({
  className = 'h-16 sm:h-20 md:h-[84px] lg:h-[88px] w-auto',
  size,
  alt = 'Мелкомемье Киноклуб',
}: LogoProps) => {
  return (
    <img
      src={logoCinema}
      srcSet={`${logoCinema} 1x, ${logoCinema2x} 2x`}
      alt={alt}
      width={size}
      height={size}
      className={`object-contain select-none transition-transform duration-200 ${className}`}
      draggable={false}
    />
  );
};

export default Logo;
