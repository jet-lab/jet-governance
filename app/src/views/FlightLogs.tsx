import { Divider, Tooltip, Button } from "antd";
import { useWallet } from "@solana/wallet-adapter-react";
import { InfoCircleFilled } from "@ant-design/icons";
import { useState } from "react";
import { FooterLinks } from "../components/FooterLinks";
import { RestakeModal } from "../components/modals/RestakeModal";
import { useProposalContext } from "../contexts/proposal";
import { useSortedUnbondingAccounts } from "../hooks/proposalHooks";
import { BN } from "@project-serum/anchor";
import { bnToNumber } from "@jet-lab/jet-engine";
import { fromLamports } from "../utils";
import { MintInfo } from "@solana/spl-token";

export const FlightLogView = () => {
  const [restakeModal, setRestakeModal] = useState(false);
  const {
    unbondingAccounts,
    stakeAccount,
    jetMint
  } = useProposalContext();
  const {
    unbonding,
    complete
  } = useSortedUnbondingAccounts(unbondingAccounts);
  const { connected } = useWallet();

  // Formatters for historical txns
  const formatDate = (time: BN) => {
    const date = new Date(bnToNumber(time))
    const padTo2Digits = (num: number) => {
      return num.toString().padStart(2, "0");
    };
    return [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join("-");
  };

  const toTokens = (lamports: BN, mint: MintInfo | undefined) => {
    return fromLamports(lamports, mint).toLocaleString(undefined, { maximumFractionDigits: 0 })
  }

  // Open explorer
  const explorerUrl = () =>
    window.open("https://explorer.solana.com", "_blank");

  return (
    <div className="view-container column-grid" id="flight-logs-view">
      <div className="neu-container" id="flight-log">
        <h1>Flight Logs</h1>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th className="center-text">Action</th>
              <th>Amount</th>
            </tr>
            <tr className="table-divider"></tr>
          </thead>

          {connected && (
            <tbody>
              {unbonding.map((row) => (
                <tr>
                  <td className="italics">{formatDate(row.unbondingAccount.unbondedAt)}</td>
                  <td className="italics">
                    Unbonding{" "}
                    <Tooltip
                      title="Unstaking transactions require a 29.5-day unbonding period. before withdrawal to your wallet is enabled. Status will show as 'unbonding' until this period completes."
                      mouseEnterDelay={0.1}
                    >
                      <InfoCircleFilled />
                    </Tooltip>
                    <RestakeModal
                      visible={restakeModal}
                      onClose={() => setRestakeModal(false)}
                      unbondingAccount={row}
                      stakeAccount={stakeAccount}
                      jetMint={jetMint}
                    />
                  </td>
                  <td className="italics">
                    <i className="italics">
                      Unstake complete on {formatDate(row.unbondingAccount.unbondedAt)}
                    </i>{" "}
                    <Button type="dashed"
                      onClick={() => setRestakeModal(true)}>
                      Restake
                    </Button>
                  </td>
                  <td className="italics">{toTokens(row.unbondingAccount.amount.tokens, jetMint)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={4}>
                  <Divider />
                </td>
              </tr>
              {complete.map((row) => (
                <tr>
                  <td>{formatDate(row.unbondingAccount.unbondedAt)}</td>
                  <td>Complete</td>
                  <td className="asset" onClick={explorerUrl}>
                    Unstaked
                  </td>
                  <td className="reserve-detail center-text">– {toTokens(row.unbondingAccount.amount.tokens, jetMint)}</td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
      <div className="spacer" />
      <FooterLinks />
    </div>
  );
};
