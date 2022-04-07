import React, { useState, useEffect, useCallback } from "react";
import logoMark from "../images/jet_logomark_gradient.png";
import "./Input.less";

export const StakeInput = ({
  value,
  placeholder,
  token,
  type,
  error,
  disabled,
  onChange,
  submit
}: {
  type: "text" | "number";
  value: string | number;
  placeholder?: string;
  token?: boolean;
  error?: string | null;
  disabled?: boolean;
  onChange: Function;
  submit: Function;
}) => {
  const [isActive, setIsActive] = useState(false);

  // Call submit fn on enter
  const enterKeySubmit = (e: any) => {
    if (e.code === "Enter" && !disabled) {
      submit();
    }
  };

  useEffect(() => {
    window.addEventListener("click", setActiveElement);
    return () => {
      window.removeEventListener("click", setActiveElement);
    };
  });

  const setActiveElement = useCallback(() => {
    if (document.activeElement === document.getElementById("input-element")) {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  }, [setIsActive]);

  return (
    <div className={`flex-centered ${disabled ? "disabled-input" : ""}`}>
      <div className={`flex-centered staking-input-layout ${token ? "token-input" : ""}`}>
        <input
          type={type}
          disabled={disabled}
          value={value as string | number | readonly string[] | undefined}
          placeholder={error ?? placeholder}
          className={`staking-input with-btn ${error ? "error" : ""}`}
          onChange={e => onChange(e.target.value)}
          onKeyPress={e => enterKeySubmit(e)}
          id="input-element"
        />
        {token && (
          <>
            <img
              className="staking-input-icon"
              src={logoMark}
              alt="Jet Token Icon"
              style={{ filter: isActive ? "none" : "grayscale(1)" }}
            />
            <span className={`legend-input token-abbrev ${isActive ? "gradient-text" : ""}`}>
              JET
            </span>
          </>
        )}
      </div>
    </div>
  );
};
