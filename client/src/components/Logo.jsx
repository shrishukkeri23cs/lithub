import React from 'react';
import darkLogo from '../assets/images/LitHub Dark.png';
import lightLogo from '../assets/images/LitHub Light.png';

const Logo = ({ isDarkMode, className = "h-10 md:h-12" }) => {
  return (
    <img 
      src={isDarkMode ? darkLogo : lightLogo} 
      alt="LitHub Logo" 
      className={`${className} transition-opacity duration-300 object-contain`} 
    />
  );
};

export default Logo;
