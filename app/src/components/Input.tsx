import React from "react";

export const Input = (props: {
  type: 'text' | 'number';
  value: string | number;
  placeholder?: string;
  token?: boolean;
  maxInput?: number | null;
  error?: string | null;
  disabled?: boolean;
  onChange: Function;
  submit: Function;
}) => {
  // Call submit fn on enter
  const enterKeySubmit = (e: any) => {
    if (e.code === 'Enter' && !props.disabled) {
      props.submit();
    }
  };

  return (
    <div className={`flex-centered ${props.disabled ? 'disabled-input' : ''}`}>
      <div className={`flex-centered ${props.token ? 'token-input' : ''}`}>
        <input type={props.type}
          disabled={props.disabled}
          value={props.value as string | number | readonly string[] | undefined}
          placeholder={props.error ?? props.placeholder}
          className={`with-btn ${props.error ? 'error' : ''}`}
          onChange={(e) => props.onChange(e.target.value)}
          onKeyPress={(e) => enterKeySubmit(e)}
        />
        {props.token && (
          <>
            <img src="img/jet/jet_logomark_gradient.png"
              alt="Jet Token Icon"
              style={{filter: 'grayscale(1)'}}
            />
            <span className="token-abbrev">
              JET
            </span>
          </>
        )}
      </div>
    </div>
  );
};