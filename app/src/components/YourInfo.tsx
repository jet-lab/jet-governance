import { InfoCircleFilled, PlusOutlined } from "@ant-design/icons";
import { bnToNumber } from "@jet-lab/jet-engine";
import { Typography, Tooltip, Divider, Button, Switch, notification } from "antd";
import { Input } from "../components/Input";
import { useEffect, useMemo, useState } from "react";
import { jetFaucet } from "../actions/jetFaucet";
import { useConnectionConfig } from "../contexts";
import { useDarkTheme } from "../contexts/darkTheme";
import { useProposalContext } from "../contexts/proposal";
import { useGoverningTokenDepositAmount, useWithdrawVotesAbility } from "../hooks";
import {
  COUNCIL_FAUCET_DEVNET,
  COUNCIL_TOKEN_MINT,
  toTokens,
  JET_FAUCET_DEVNET,
  JET_TOKEN_MINT
} from "../utils";
import { FooterLinks } from "./FooterLinks";
import { StakeModal } from "./modals/StakeModal";
import { UnstakeModal } from "./modals/UnstakeModal";
import { WithdrawAllModal } from "./modals/WithdrawAllModal";
import { useWallet } from "@solana/wallet-adapter-react";
import { useHistory, useLocation } from "react-router";
import "./YourInfo.less";

export const YourInfo = () => {
  const [stakeModalVisible, setStakeModalVisible] = useState(false);
  const [unstakeModalVisible, setUnstakeModalVisible] = useState(false);
  const [withdrawAllModalVisible, setWithdrawAllModalVisible] = useState(false);
  const [inputAmount, setInputAmount] = useState<number | undefined>();
  const { connected } = useWallet();
  const { darkTheme, toggleDarkTheme } = useDarkTheme();
  const { inDevelopment } = useConnectionConfig();
  const { claimsCount } = useProposalContext();
  const history = useHistory();

  const {
    refresh,
    walletFetched,

    unbondingTotal: { unbondingQueue, unbondingComplete },
    stakeBalance: { stakedJet },

    jetAccount,
    jetMint,
    stakingYield,

    realm,
    tokenOwnerRecord,

    programs
  } = useProposalContext();

  const votes = useGoverningTokenDepositAmount();
  const withdrawVotesAbility = useWithdrawVotesAbility(tokenOwnerRecord);
  /* eslint-enable @typescript-eslint/no-unused-vars */

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
    if (!jetMint || !inputAmount || !jetAccount || !inputAmount) {
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
    if (!jetMint || !inputAmount || !tokenOwnerRecord || !inputAmount) {
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

  // Devnet only: airdrop JET tokens
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
  // Devnet only: airdrop Council tokens
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

  const showRewards = () => {
    document.getElementById("show-more-apr")?.classList.toggle("hidden");
  };

  const isOwnPage = Boolean(useLocation().pathname.includes("your-info"));
  const { Paragraph, Title, Text } = Typography;
  return (
    <div className={`your-info ${isOwnPage ? "view-container" : ""}`}>
      <Typography>
        <Title className="title-info" level={2}>
          Your Info
        </Title>
        <div className="box-info">
          <Text>
            Votes{" "}
            <Tooltip
              title="For each JET token staked, you may cast 1 vote in JetGovern."
              placement="topLeft"
              overlayClassName="no-arrow"
            >
              <InfoCircleFilled />
            </Tooltip>
          </Text>
          <Paragraph className="text-gradient vote-balance">{votes}</Paragraph>
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
                  <PlusOutlined style={{ marginRight: 0 }} onClick={showRewards} />
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
              <div className="flex justify-between info-legend-item">
                <Text>Wallet Balance</Text>
                <Text>{jetAccount ? toTokens(jetAccount.info.amount, jetMint) : 0}</Text>
              </div>
            )}
            <div className="flex justify-between info-legend-item">
              <Text>Staked JET</Text>
              <Text>{toTokens(stakedJet, jetMint)}</Text>
            </div>
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
                  <Text>{toTokens(unbondingQueue.toNumber(), jetMint)}</Text>
                </div>
                <div className="flex justify-between info-legend-item">
                  <Text className="text-gradient bold">Available for Withdrawal</Text>
                  <Text className="text-gradient bold">
                    {toTokens(unbondingComplete.toNumber(), jetMint)}
                  </Text>
                </div>
              </>
            )}
            <Input
              type="number"
              token
              value={inputAmount === undefined ? "" : inputAmount}
              disabled={!connected}
              onChange={(value: number) => setInputAmount(value)}
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
            <Button
              type="dashed"
              className="full-width"
              onClick={() => handleWithdrawUnstaked()}
              disabled={!connected}
            >
              Withdraw all
            </Button>
            {withdrawAllModalVisible && (
              <WithdrawAllModal onClose={() => setWithdrawAllModalVisible(false)} />
            )}
          </div>
        </div>
      </Typography>
      <div>
        <Switch
          onChange={() => toggleDarkTheme()}
          checked={darkTheme}
          checkedChildren="dark"
          unCheckedChildren="light"
        />
        <br />
        {inDevelopment && <Button onClick={getJetAirdrop}>GET JET</Button>}
        {inDevelopment && <Button onClick={getCouncilAirdrop}>GET COUNCIL TOKEN</Button>}
      </div>

      <FooterLinks />
    </div>
  );
};
