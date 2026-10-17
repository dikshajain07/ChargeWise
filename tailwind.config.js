const token = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        void: token('--cw-bg'),
        surface: token('--cw-surface'),
        'surface-2': token('--cw-surface-2'),
        line: token('--cw-line'),
        ink: token('--cw-ink'),
        muted: token('--cw-muted'),
        accent: token('--cw-accent'),
        go: token('--cw-go'),
        warn: token('--cw-warn'),
        danger: token('--cw-danger'),
        xp: token('--cw-xp'),
        'on-accent': token('--cw-on-accent'),
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        pixel: ['"Press Start 2P"', 'monospace'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
};
