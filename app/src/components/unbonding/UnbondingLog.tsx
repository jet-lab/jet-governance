import { InfoCircleFilled } from "@ant-design/icons";
import { bnToNumber, UnbondingAccount } from "@jet-lab/jet-engine";
import { Button, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { useBlockExplorer } from "../../contexts/blockExplorer";
import { useProposalContext } from "../../contexts/proposal";
import {
  dateFromUnixTimestamp,
  sharesToTokensUnbonded,
  getRemainingTime,
  toTokens
} from "../../utils";
import { RestakeModal } from "../modals/RestakeModal";
import { WithdrawModal } from "../modals/WithdrawModal";
import { useCurrentTime } from "../../hooks";
import { ONE_DAY } from "../../constants";

export const UnbondingLog = ({ unbondingAccount }: { unbondingAccount: UnbondingAccount }) => {
  const { jetMint, stakePool } = useProposalContext();

  const [restakeModalVisible, setRestakeModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [isUnbonded, setIsUnbonded] = useState(false);
  const { getAccountExplorerUrl } = useBlockExplorer();

  useEffect(() => {
    const unbondedState = UnbondingAccount.isUnbonded(unbondingAccount);
    return setIsUnbonded(unbondedState);
  }, [setIsUnbonded, unbondingAccount]);

  const currentTime = useCurrentTime();
  const oneDayCountdown =
    !isUnbonded &&
    bnToNumber(unbondingAccount.unbondingAccount.unbondedAt) * 1000 - currentTime < ONE_DAY;

  const getUnbondingAccountExplorerUrl = () => {
    unbondingAccount &&
      window.open(
        getAccountExplorerUrl(unbondingAccount.address.toBase58()),
        "_blank",
        "noreferrer"
      );
  };

  return (
    <tr>
      <td className="italics" onClick={getUnbondingAccountExplorerUrl}>
        {!!stakePool &&
          dateFromUnixTimestamp(
            unbondingAccount?.unbondingAccount.unbondedAt.sub(stakePool.stakePool.unbondPeriod)
          )}
      </td>
      <td className="italics tooltip" onClick={getUnbondingAccountExplorerUrl}>
        {isUnbonded ? "Unbonded" : "Unbonding"}
        {!isUnbonded && (
          <Tooltip
            title="Unstaking transactions require a 29.5-day unbonding period. before withdrawal to your wallet is enabled. Status will show as 'unbonding' until this period completes."
            mouseEnterDelay={0.1}
          >
            <InfoCircleFilled />
          </Tooltip>
        )}
      </td>

      <td className="action italics">
        <i onClick={getUnbondingAccountExplorerUrl}>
          {oneDayCountdown
            ? `Unstake complete in ${getRemainingTime(
                currentTime,
                bnToNumber(unbondingAccount.unbondingAccount.unbondedAt) * 1000
              )}`
            : `Unstake complete on 
            ${dateFromUnixTimestamp(unbondingAccount.unbondingAccount.unbondedAt)}`}
        </i>{" "}
        <Button
          size="small"
          type={isUnbonded ? undefined : "dashed"}
          className={isUnbonded ? "withdraw-btn" : "restake-btn"}
          onClick={() =>
            isUnbonded ? setWithdrawModalVisible(true) : setRestakeModalVisible(true)
          }
        >
          {isUnbonded ? "Withdraw" : "Restake"}
        </Button>
        {restakeModalVisible && (
          <RestakeModal
            onClose={() => setRestakeModalVisible(false)}
            unbondingAccount={unbondingAccount}
          />
        )}
        {withdrawModalVisible && (
          <WithdrawModal
            onClose={() => setWithdrawModalVisible(false)}
            unbondingAccount={unbondingAccount}
          />
        )}
      </td>
      <td
        className="italics"
        onClick={() =>
          unbondingAccount &&
          window.open(
            getAccountExplorerUrl(unbondingAccount.address.toBase58()),
            "_blank",
            "noreferrer"
          )
        }
      >
        {toTokens(sharesToTokensUnbonded(unbondingAccount?.shares, stakePool).tokens, jetMint)}
      </td>
      <td onClick={getUnbondingAccountExplorerUrl}>
        <i className="fas fa-external-link-alt"></i>
      </td>
    </tr>
  );
};
