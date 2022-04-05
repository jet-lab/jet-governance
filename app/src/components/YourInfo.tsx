import { InfoCircleFilled, MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { bnToNumber } from "@jet-lab/jet-engine";
import { Typography, Tooltip, Divider, Button, notification } from "antd";
import { StakeInput } from "./Input";
import { useEffect, useMemo, useState } from "react";
import { jetFaucet } from "../actions/jetFaucet";
import { useConnectionConfig } from "../contexts";
import { useProposalContext } from "../contexts/proposal";
import { useWithdrawableCount, useWithdrawVotesAbility } from "../hooks";
import {
  COUNCIL_FAUCET_DEVNET,
  COUNCIL_TOKEN_MINT,
  fromLamports,
  JET_FAUCET_DEVNET,
  JET_TOKEN_MINT,
  sharesToTokens,
  toTokens
} from "../utils";
import { StakeModal } from "./modals/StakeModal";
import { UnstakeModal } from "./modals/UnstakeModal";
import { WithdrawAllModal } from "./modals/WithdrawAllModal";
import { useWallet } from "@solana/wallet-adapter-react";
import { useHistory, useLocation } from "react-router";
import "./YourInfo.less";
import { StakedJetBalance } from "./Dashboard/StakedJetBalance";

export const YourInfo = () => {
  const [stakeModalVisible, setStakeModalVisible] = useState(false);
  const [unstakeModalVisible, setUnstakeModalVisible] = useState(false);
  const [withdrawAllModalVisible, setWithdrawAllModalVisible] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [inputAmount, setInputAmount] = useState<number | undefined>();
  const { connected } = useWallet();
  const { inDevelopment } = useConnectionConfig();
  const { claimsCount } = useProposalContext();
  const history = useHistory();
  const {
    refresh,
    walletFetched,
    unbondingTotal: { unbondingQueue, unbondingComplete },
    unbondingAccounts,
    stakeBalance: { stakedJet },
    jetAccount,
    jetMint,
    stakingYield,
    realm,
    tokenOwnerRecord,
    stakePool,
    programs
  } = useProposalContext();

  const withdrawVotesAbility = useWithdrawVotesAbility(tokenOwnerRecord);
  const rewards = useMemo(() => {
    return {
      apr: stakingYield ? (stakingYield.apr * 100).toFixed(0) : undefined,
      estDailyReward:
        stakingYield?.perDay !== undefined ? toTokens(stakingYield.perDay, jetMint) : undefined,
      estMonthlyReward:
        stakingYield?.perMonth !== undefined ? toTokens(stakingYield.perMonth, jetMint) : undefined,
      estYearlyReward:
        stakingYield?.perYear !== undefined ? toTokens(stakingYield.perYear, jetMint) : undefined
    };
  }, [stakingYield, jetMint]);

  const handleStake = () => {
    if (!jetMint || !inputAmount || !jetAccount) {
      return;
    }
    const balance = bnToNumber(jetAccount.info.amount) / 10 ** jetMint.decimals;
    const stakable = Math.min(inputAmount, balance);
    setInputAmount(stakable);
    if (stakable === 0) {
      return;
    }
    setStakeModalVisible(true);
  };

  const handleUnstake = () => {
    if (!jetMint || !inputAmount || !tokenOwnerRecord) {
      return;
    }
    const balance =
      bnToNumber(tokenOwnerRecord.account.governingTokenDepositAmount) / 10 ** jetMint.decimals;
    const stakable = Math.min(inputAmount, balance);
    setInputAmount(stakable);
    if (stakable === 0) {
      return;
    }
    setUnstakeModalVisible(true);
  };

  const handleWithdrawUnstaked = () => {
    setWithdrawAllModalVisible(true);
  };

  /**
   * Devnet only: airdrop JET tokens
   */
  const getJetAirdrop = async () => {
    try {
      if (programs) {
        await jetFaucet(programs.stake.provider, JET_FAUCET_DEVNET, JET_TOKEN_MINT, "Devnet JET");
      }
    } catch {
    } finally {
      refresh();
    }
  };

  /**
   * Devnet only: airdrop Council tokens
   */
  const getCouncilAirdrop = async () => {
    try {
      if (programs) {
        await jetFaucet(
          programs.stake.provider,
          COUNCIL_FAUCET_DEVNET,
          COUNCIL_TOKEN_MINT,
          "Devnet Council token"
        );
      }
    } catch {
    } finally {
      refresh();
    }
  };

  useEffect(() => {
    const openNotification = () => {
      if (claimsCount > 0) {
        notification.success({
          message: "Available Airdrop",
          description: "You have care package(s) waiting for you! Click here for info.",
          onClick: () => {
            history.push("/claims");
          },
          placement: "bottomLeft"
        });
      }
    };
    openNotification();
  }, [claimsCount, history]);

  const handleRewardsToggle = () => {
    document.getElementById("show-more-apr")?.classList.toggle("hidden");
    setShowRewards(!showRewards);
  };

  const isOwnPage = Boolean(useLocation().pathname.includes("your-info"));
  const { Title, Text } = Typography;
  const walletBalance = jetAccount ? toTokens(jetAccount.info.amount, jetMint) : 0;
  const preFillJetWithBalance = () => {
    setInputAmount(jetAccount ? fromLamports(jetAccount.info.amount, jetMint) : 0);
  };
  const preFillJetWithStaked = () => {
    setInputAmount(
      stakedJet ? fromLamports(sharesToTokens(stakedJet, stakePool).tokens, jetMint) : 0
    );
  };
  const canWithdraw = useWithdrawableCount(unbondingAccounts) > 0;

  return (
    <div className={`your-info ${isOwnPage ? "view" : ""}`}>
      <Typography>
        <Title className="title-info" level={2}>
          Your Info
        </Title>
        <div className="box-info">
          <Text>
            Staked JET{" "}
            <Tooltip
              title="Staking JET allows you to cast your vote in JetGovern."
              placement="topLeft"
              overlayClassName="no-arrow"
            >
              <InfoCircleFilled />
            </Tooltip>
          </Text>
          <StakedJetBalance
            stakedJet={toTokens(sharesToTokens(stakedJet, stakePool).tokens, jetMint)}
            onClick={preFillJetWithStaked}
          />
          <div className="wallet-overview flex justify-between column">
            <div className="flex justify-between">
              <Text className="staking-info current-staking-apr">
                {connected ? `${rewards.apr ?? "-"}% Staking APR ` : `Current Staking APR `}
                <Tooltip
                  title="The displayed APR depends upon many factors, including the total number of JET staked in the module and the amount of protocol revenue flowing to depositors."
                  overlayClassName="no-arrow"
                >
                  <InfoCircleFilled />
                </Tooltip>
              </Text>
              <Text>
                {connected ? (
                  showRewards ? (
                    <MinusOutlined style={{ marginRight: 0 }} onClick={handleRewardsToggle} />
                  ) : (
                    <PlusOutlined style={{ marginRight: 0 }} onClick={handleRewardsToggle} />
                  )
                ) : (
                  `${rewards.apr ?? "-"}%`
                )}
              </Text>
            </div>
            <div className={connected ? "hidden" : undefined} id="show-more-apr">
              <div className="flex justify-between cluster">
                <Text className="cluster">Est. Daily Reward</Text>
                <Text className="cluster">{rewards.estDailyReward}</Text>
              </div>
              <div className="flex justify-between cluster">
                <Text className="cluster">Est. Monthly Reward</Text>
                <Text className="cluster">{rewards.estMonthlyReward}</Text>
              </div>
            </div>
          </div>
          <Divider className="divider-info" />
          <div className="flex column">
            {connected && (
              <div
                className="flex justify-between info-legend-item info-legend-item-prefill"
                onClick={preFillJetWithBalance}
              >
                <Text>Wallet Balance</Text>
                <Text className="text-btn">{walletBalance}</Text>
              </div>
            )}
            {connected && (
              <>
                <div className="flex justify-between info-legend-item">
                  <Text>
                    Unbonding queue{" "}
                    <Tooltip
                      title="This is the amount of tokens you've unstaked that are currently in an unbonding period. For detailed information about the availability of your tokens, visit the Flight Logs page."
                      overlayClassName="no-arrow"
                    >
                      <InfoCircleFilled />
                    </Tooltip>
                  </Text>
                  <Text>{toTokens(bnToNumber(unbondingQueue), jetMint)}</Text>
                </div>
                <div className="flex justify-between info-legend-item">
                  <Text className="gradient-text bold">Available for Withdrawal</Text>
                  <Text className="gradient-text bold">
                    {toTokens(bnToNumber(unbondingComplete), jetMint)}
                  </Text>
                </div>
              </>
            )}
            <StakeInput
              type="number"
              token
              value={inputAmount === undefined ? "" : inputAmount}
              disabled={!connected}
              onChange={(value: number) => {
                if (isNaN(value) || value < 0) {
                  value = 0;
                } else {
                  setInputAmount(value);
                }
              }}
              submit={() => handleStake()}
            />
            <Button
              onClick={() => handleStake()}
              disabled={!connected || !inputAmount || !walletFetched}
              className="no-margin-horizontal"
            >
              Stake
            </Button>
            {stakeModalVisible && (
              <StakeModal
                onClose={() => setStakeModalVisible(false)}
                realm={realm}
                amount={inputAmount ?? 0}
              />
            )}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <Button
                onClick={() => handleUnstake()}
                disabled={!connected || !inputAmount || !walletFetched || !withdrawVotesAbility}
                className="no-margin-horizontal"
                style={{ flex: 1 }}
              >
                Unstake
              </Button>
              {tokenOwnerRecord && !withdrawVotesAbility && (
                <Tooltip
                  title="You cannot unstake JET until all your created proposals are finalised."
                  overlayClassName="no-arrow"
                  style={{ width: 10 }}
                >
                  <InfoCircleFilled style={{ marginLeft: "5px" }} />
                </Tooltip>
              )}
            </div>
            {unstakeModalVisible && (
              <UnstakeModal
                amount={inputAmount ?? 0}
                resetInput={() => setInputAmount(undefined)}
                onClose={() => setUnstakeModalVisible(false)}
              />
            )}
            {canWithdraw && (
              <Button
                className="full-width withdraw-btn"
                onClick={() => handleWithdrawUnstaked()}
                disabled={!connected}
              >
                Withdraw balance
              </Button>
            )}
            {withdrawAllModalVisible && (
              <WithdrawAllModal onClose={() => setWithdrawAllModalVisible(false)} />
            )}
          </div>
          {inDevelopment && (
            <div className="airdrops flex-centered">
              <i
                onClick={getJetAirdrop}
                className="clickable-icon gradient-text fas fa-parachute-box"
                title="Airdrop Jet"
              />
              <i
                onClick={getCouncilAirdrop}
                className="clickable-icon gradient-text fas fa-crown"
                title="Airdrop Council"
              />
            </div>
          )}
        </div>
      </Typography>
    </div>
  );
};
