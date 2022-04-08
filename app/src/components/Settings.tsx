import { Select } from "antd";
import { useConnectionConfig, ENDPOINTS } from "../contexts";

export const Settings = () => {
  const { endpoint, setEndpoint } = useConnectionConfig();

  return (
    <>
      <div style={{ display: "grid" }}>
        <Select onChange={setEndpoint} value={endpoint} style={{ marginBottom: 20 }}>
          {ENDPOINTS.map(({ name, endpoint }) => (
            <Select.Option value={endpoint} key={endpoint}>
              {name}
            </Select.Option>
          ))}
        </Select>
      </div>
    </>
  );
};
