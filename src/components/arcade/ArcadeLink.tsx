import React from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { buttonClasses, type ButtonSize, type ButtonVariant } from '../../utils/buttonStyles';

interface ArcadeLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function ArcadeLink({ variant = 'primary', size = 'md', className = '', ...rest }: ArcadeLinkProps) {
  return <Link className={buttonClasses(variant, size, className as string)} {...rest} />;
}