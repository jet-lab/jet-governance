import React from "react";
import { InputNumber } from 'antd';

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

  const { value, placeholder, token, type, maxInput, error, disabled, onChange, submit } = props;

    // Call submit fn on enter
    const enterKeySubmit = (e: any) => {
      if (e.code === 'Enter' && !props.disabled) {
        props.submit();
      }
    };

  return (
    <div className={`flex-centered ${disabled ? 'disabled-input' : ''}`}>
      <div className={`flex-centered ${token ? 'token-input' : ''}`} id="staking-input">
        <input type={type}
          disabled={disabled}
          value={value as string | number | readonly string[] | undefined}
          placeholder={error ?? placeholder}
          className={`with-btn ${error ? 'error' : ''}`}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={(e) => enterKeySubmit(e)}
        />
        {token && (
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