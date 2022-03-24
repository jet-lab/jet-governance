import React from "react";
import { Typography } from "antd";
import { shortenAddress } from "../../utils/utils";
import { Connection, PublicKey } from "@solana/web3.js";
import { useBlockExplorer } from "../../contexts/blockExplorer";

export const ExplorerLink = (props: {
  address: string | PublicKey;
  type: "account" | "transaction";
  code?: boolean;
  style?: React.CSSProperties;
  length?: number;
  short?: boolean;
  connection?: Connection;
}) => {
  const { getAccountExplorerUrl } = useBlockExplorer();
  const { code, short } = props;
  const address = typeof props.address === "string" ? props.address : props.address?.toBase58();

  if (!address) {
    return null;
  }

  const displayAddress =
    short || props.length ? shortenAddress(address, props.length ?? 9) : address;

  return (
    <a
      href={getAccountExplorerUrl(address)}
      // eslint-disable-next-line react/jsx-no-target-blank
      target="_blank"
      rel="noreferrer"
      title={address}
      style={props.style}
    >
      {code ? (
        <Typography.Text style={props.style} code>
          {displayAddress}
        </Typography.Text>
      ) : (
        displayAddress
      )}
    </a>
  );
};
