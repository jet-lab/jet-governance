import React, { useState, useEffect, useCallback } from "react";

export const Input = ({
  value,
  placeholder,
  token,
  type,
  maxInput,
  error,
  disabled,
  onChange,
  submit
}: {
  type: "text" | "number";
  value: string | number;
  placeholder?: string;
  token?: boolean;
  maxInput?: number | null;
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
      <div className={`flex-centered ${token ? "token-input" : ""}`} id="staking-input">
        <input
          type={type}
          disabled={disabled}
          value={value as string | number | readonly string[] | undefined}
          placeholder={error ?? placeholder}
          className={`with-btn ${error ? "error" : ""}`}
          onChange={e => onChange(e.target.value)}
          onKeyPress={e => enterKeySubmit(e)}
          id="input-element"
        />
        {token && (
          <>
            <img
              src="img/jet/jet_logomark_gradient.png"
              alt="Jet Token Icon"
              style={{ filter: isActive ? "none" : "grayscale(1)" }}
            />
            <span className={`token-abbrev ${isActive ? "text-gradient" : ""}`}>JET</span>
          </>
        )}
      </div>
    </div>
  );
};
