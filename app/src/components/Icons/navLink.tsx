import React from "react";
import { Link, useLocation } from "react-router-dom";

export const NavLink = (props: {
  icon: string;
  text: string;
  path: string;
  active: boolean;
}) => {
  
  const { icon, text, path, active } = props;

  return (
    <Link to={path} className={`flex-centered ${active ? "active" : ""} ${text}`}>
      <i className="text-gradient jet-icons"
        style={icon === '✔' || icon === '✈'
          ? {padding: "0 3px 3px 0;"} 
            : {padding: "0 0 3px 3px"} }>
        {icon}
      </i>
      {text ? (
        <p className="text-gradient bicyclette-bold">
          {text}
        </p>
      ) : null}
    </Link>
  );
};
