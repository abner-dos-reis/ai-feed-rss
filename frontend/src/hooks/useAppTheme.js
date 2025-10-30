import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';

export const useAppTheme = () => {
  const muiTheme = useMuiTheme();
  const { darkMode, toggleDarkMode } = useCustomTheme();

  return {
    theme: muiTheme,
    darkMode,
    toggleDarkMode,
    isDark: darkMode,
    isLight: !darkMode
  };
};