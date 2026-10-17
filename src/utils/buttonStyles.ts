export type ButtonVariant = 'start' | 'primary' | 'go' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
'inline-flex items-center justify-center gap-2 whitespace-nowrap select-none font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

const VARIANTS: Record<ButtonVariant, string> = {
  start: 'arcade-start font-pixel uppercase tracking-wider',
  primary: 'arcade-key arcade-key-accent',
  go: 'arcade-key arcade-key-go',
  ghost: 'arcade-ghost',
  danger: 'arcade-danger'
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-md',
  md: 'h-10 px-4 text-sm rounded-md',
  lg: 'h-12 px-6 text-sm rounded-md'
};

const START_SIZES: Record<ButtonSize, string> = {
  sm: 'h-11 px-5 text-[10px] rounded-lg',
  md: 'h-14 px-7 text-xs rounded-lg',
  lg: 'h-16 px-9 text-sm rounded-xl'
};

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra = ''): string {
  const s = variant === 'start' ? START_SIZES[size] : SIZES[size];
  return [BASE, VARIANTS[variant], s, extra].filter(Boolean).join(' ');
}