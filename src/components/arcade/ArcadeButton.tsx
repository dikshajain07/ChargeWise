import React, { forwardRef } from 'react';
import { buttonClasses, type ButtonSize, type ButtonVariant } from '../../utils/buttonStyles';

interface ArcadeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const ArcadeButton = forwardRef<HTMLButtonElement, ArcadeButtonProps>(function ArcadeButton(
{ variant = 'primary', size = 'md', className = '', type = 'button', ...rest },
ref)
{
  return <button ref={ref} type={type} className={buttonClasses(variant, size, className)} {...rest} />;
});