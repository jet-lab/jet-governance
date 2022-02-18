import { InfoCircleFilled, PlusOutlined } from "@ant-design/icons";
import { useWallet } from "@solana/wallet-adapter-react";
import { Tooltip } from "antd";
import { useProposalContext } from "../../contexts/proposal";

export const StakingRewards = () => {
  const { connected } = useWallet();
  const {
    proposalFilter,
    setProposalFilter,

    proposalsByGovernance,
    filteredProposalsByGovernance,

    stakeProgram,
    stakePool,
    stakeAccount,
    unbondingTotal,
    stakeBalance: { stakedJet, unstakedJet, unlockedVotes },

    jetAccount,
    jetMint,

    governance,
    tokenOwnerRecord,
    walletVoteRecords,
  } = useProposalContext();

  const totalDailyReward = 1000000;
  const totalStake = 1500000;
  const userDailyReward = (totalDailyReward * (stakedJet ?? 0)) / totalStake;

  const showMoreApr = () => {
    document.getElementById("show-more-apr")?.classList.toggle("hidden");
  };

  return (
    <div id="wallet-overview" className="flex justify-between column">
      <div className="flex justify-between" id="current-staking-apr">
        <span>
          {connected
            ? `${((365 * userDailyReward) / totalStake).toFixed(
                0
              )}% Staking APR`
            : `Current Staking APR `}
          <Tooltip
            title="The displayed APR depends upon many factors, including the total number of JET staked in the module and the amount of protocol revenue flowing to depositors."
            overlayClassName="no-arrow"
          >
            <InfoCircleFilled />
          </Tooltip>
        </span>
        <span>
          {connected ? (
            <PlusOutlined style={{ marginRight: 0 }} onClick={showMoreApr} />
          ) : (
            `${((365 * userDailyReward) / totalStake).toFixed(0)}%`
          )}
        </span>
      </div>
      <div className={connected ? "hidden" : undefined} id="show-more-apr">
        <div className="flex justify-between cluster">
          <span>Est. Daily Reward</span>
          <span>{userDailyReward}</span>
        </div>
        <div className="flex justify-between cluster">
          <span>Est. Monthly Reward</span>
          <span>{userDailyReward * 30}</span>
        </div>
      </div>
    </div>
  );
};
