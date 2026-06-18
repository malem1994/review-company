import React from 'react';
import { cn } from '@/lib/utils';

const avatarSizes = {
  md: 'h-14 w-14 text-xl',
  lg: 'h-20 w-20 text-2xl',
};

interface CompanyAvatarProps {
  name: string;
  logo?: string | null;
  size?: keyof typeof avatarSizes;
  className?: string;
}

function getCompanyInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export const CompanyAvatar: React.FC<CompanyAvatarProps> = ({
  name,
  logo,
  size = 'md',
  className,
}) => {
  const [imageFailed, setImageFailed] = React.useState(false);
  const shouldShowImage = !!logo && !imageFailed;

  React.useEffect(() => {
    setImageFailed(false);
  }, [logo]);

  return (
    <div
      className={cn(
        'flex flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted text-muted-foreground',
        avatarSizes[size],
        className
      )}
      aria-hidden={shouldShowImage ? undefined : true}
    >
      {shouldShowImage ? (
        <img
          src={logo}
          alt={`${name} logo`}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="font-semibold">{getCompanyInitial(name)}</span>
      )}
    </div>
  );
};
