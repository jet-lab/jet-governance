import "./Input.less";
import { useState, useEffect, useCallback } from "react";
import logoMark from "../images/jet_logomark_gradient.png";

export const StakeInput = ({
  type,
  value,
  placeholder,
  token,
  error,
  disabled,
  onChange,
  onBlur,
  submit
}: {
  type: "text" | "number";
  value: string | number;
  placeholder?: string;
  token?: boolean;
  error?: string | null;
  disabled?: boolean;
  onChange: (value: string) => void;
  onBlur: (value: string) => void;
  submit: () => void;
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
          value={value}
          placeholder={error ?? placeholder}
          disabled={disabled}
          className={`staking-input with-btn ${error ? "error" : ""}`}
          onChange={e => onChange(e.target.value)}
          onKeyPress={enterKeySubmit}
          onBlur={e => onBlur(e.target.value)}
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
