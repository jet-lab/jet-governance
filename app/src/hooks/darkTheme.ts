import { useEffect, useState } from "react";

// Dark theme hook
export const useDarkTheme = () => {
  const [darkTheme, setDarkTheme] = useState(localStorage.getItem('jetDarkTheme') === 'true');
  useEffect(() => {
    localStorage.setItem('jetDarkTheme', JSON.stringify(darkTheme));
    for (let sheet of document.styleSheets) {
      for (let rule of sheet.rules) {
        if (rule.cssText.includes('jet-dark-theme')) {
          sheet.disabled = !darkTheme;
        }
      }
    }
  }, [darkTheme]);
  
  return { 
    darkTheme: darkTheme, 
    toggleDarkTheme: () => {
      setDarkTheme(!darkTheme);
    }
  };
};