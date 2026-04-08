import { withThemeByDataAttribute } from '@storybook/addon-themes';
import '../src/index.css';

export const decorators = [
  withThemeByDataAttribute({
    themes: {
      light: 'light',
      dark: 'dark',
    },
    defaultTheme: 'light',
  }),
];
