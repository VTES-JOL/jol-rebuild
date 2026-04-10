import {withThemeByClassName} from '@storybook/addon-themes';
import '../src/index.css';

export const decorators = [
  withThemeByClassName({
    themes: {
      light: '',
      dark: 'dark',
    },
    defaultTheme: 'light',
  }),
];
