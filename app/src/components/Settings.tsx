import React from "react";
import { Select } from "antd";
import { ENDPOINTS, useConnectionConfig } from "@oyster/common";

export const Settings = () => {
  const { endpoint, setEndpoint } = useConnectionConfig();

  return (
    <>
      <div style={{ display: "grid" }}>
        <Select
          onSelect={setEndpoint}
          value={endpoint}
          style={{ marginBottom: 20 }}
        >
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
