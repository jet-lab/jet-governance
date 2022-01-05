import { Button, Popover } from 'antd';
import React from 'react';

import { InfoCircleFilled } from '@ant-design/icons';

export const Info = (props: {
  text: React.ReactElement;
  style?: React.CSSProperties;
}) => {
  return (
    <Popover
      trigger="hover"
      content={<div style={{ width: 300 }}>{props.text}</div>}
    >
      <Button type="text" shape="circle">
        <InfoCircleFilled style={props.style} />
      </Button>
    </Popover>
  );
};
