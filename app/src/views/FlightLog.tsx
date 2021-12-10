import React, { useState } from "react";
import { useProposal } from "../contexts/proposal";
import { Button, Divider, Progress, Collapse, Timeline } from "antd";
import { useWallet } from "@solana/wallet-adapter-react";
import { shortenAddress, formatTokenAmount } from "../utils/utils";
import { useUser } from "../hooks/useClient";
// import { user, proposals } from "../hooks/jet-client/useClient";

export const FlightLogView = () => {
  const { connected, publicKey } = useWallet();

  const { Panel } = Collapse;

  const inputCheck = (value: number) => {
    if (value && value < 0) {
      value = 0;
    }
  };

  return (
    <div className="view-container" id="claim">
      <div className="panel">
        <h3>Transaction history</h3>
        <div className="neu-container">
          Date, status
        </div>
      </div>

      
    </div>
  );
};
