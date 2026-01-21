'use client';

import { type ButtonHTMLAttributes, type ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'icon';
  size?: 'small' | 'medium';
}

/**
 * Button component with variants matching existing CSS classes
 *
 * Uses existing .btn, .btn-primary, .btn-secondary, .btn-small, .btn-icon classes
 * from main.css for visual parity during migration.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClass = 'btn';
  const variantClass = variant === 'icon' ? 'btn-icon' : `btn-${variant}`;
  const sizeClass = size === 'small' ? 'btn-small' : '';

  const classes = [baseClass, variantClass, sizeClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

export default Button;
