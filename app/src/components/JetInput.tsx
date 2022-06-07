import { Input } from "antd";
import { ReactComponent as ArrowIcon } from "../images/arrow_icon.svg";

export function JetInput(props: {
  type: "text" | "number";
  value: string | number | null;
  placeholder?: string;
  error?: string | null;
  onClick?: () => unknown;
  onChange: (value: any) => unknown;
  submit: () => unknown;
}): JSX.Element {
  return (
    <div className={`jet-input flex-centered`}>
      <div className={`flex-centered`}>
        <Input
          type={props.type}
          value={props.value || ""}
          placeholder={props.error || props.placeholder}
          className={props.error ? "error" : ""}
          onClick={() => (props.onClick ? props.onClick() : null)}
          onChange={e => props.onChange(e.target.value)}
          onPressEnter={() => props.submit()}
        />
      </div>
      <div
        className={`input-btn flex-centered`}
        onClick={() => {
          props.submit();
        }}
      >
        {" "}
        <ArrowIcon width={30} />
      </div>
    </div>
  );
}
