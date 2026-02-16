import React from "react";

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M50 0C50 0 20 10 20 50C20 90 50 100 50 100C50 100 80 90 80 50C80 10 50 0 50 0Z"
      fill="white"
      fillOpacity="0.2"
    />
    <path
      d="M50 10C50 10 30 20 30 50C30 80 50 90 50 90C50 90 70 80 70 50C70 20 50 10 50 10Z"
      fill="white"
    />
  </svg>
);
