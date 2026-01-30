import React, { createContext, useContext, ReactNode } from "react";

interface ThemeContextType {
  colors: Record<string, string>;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: {
    primary: "#D87B7B",
    secondary: "#69B5D3",
    // ... можно добавить
  },
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <ThemeContext.Provider
      value={{
        colors: {
          primary: "#D87B7B",
          secondary: "#69B5D3",
          success: "#507B5D",
          warning: "#FCD688",
          background: "#FFFFFF",
          text: "#0D0D0D",
        },
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
