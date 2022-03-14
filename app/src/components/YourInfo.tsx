import { InfoCircleFilled, PlusOutlined } from "@ant-design/icons";
import { bnToNumber } from "@jet-lab/jet-engine";
import { Tooltip, Divider, Button, Switch, notification } from "antd";
import { Input } from "../components/Input";
import { useMemo, useState } from "react";
import { ReactFitty } from "react-fitty";
import { jetFaucet } from "../actions/jetFaucet";
import { useConnectionConfig } from "../contexts";
import { useAirdrop } from "../contexts/airdrop";
import { useDarkTheme } from "../contexts/darkTheme";
import { useProposalContext } from "../contexts/proposal";
import { useWithdrawVotesAbility } from "../hooks/proposalHooks";
import {
  COUNCIL_FAUCET_DEVNET,
  COUNCIL_TOKEN_MINT,
  toTokens,
  JET_FAUCET_DEVNET,
  JET_REALM,
  JET_TOKEN_MINT,
  fromLamports
} from "../utils";
import { FooterLinks } from "./FooterLinks";
import { StakeModal } from "./modals/StakeModal";
import { UnstakeModal } from "./modals/UnstakeModal";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLocation } from "react-router";
import { withdrawAllUnbonded } from "../actions/withdrawUnbonded";
import { useRpcContext } from "../hooks";

export const YourInfo = () => {
  const [stakeModalVisible, setStakeModalVisible] = useState(false);
  const [unstakeModalVisible, setUnstakeModalVisible] = useState(false);
  const [inputAmount, setInputAmount] = useState<number | undefined>();
  const { vestedAirdrops } = useAirdrop();
  const { connected } = useWallet();
  const { darkTheme, toggleDarkTheme } = useDarkTheme();
  const { inDevelopment } = useConnectionConfig();

  const {
    refresh,

    unbondingTotal: { unbondingQueue, unbondingComplete },

    stakeAccount,
    stakePool,
    unbondingAccounts,
    stakeBalance: { stakedJet },

    jetAccount,
    jetMint,
    stakingYield,

    realm,
    tokenOwnerRecord,

    programs
  } = useProposalContext();
  const rpcContext = useRpcContext();

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
    if (!jetMint || !inputAmount || !jetAccount || inputAmount === 0) {
      console.error("Please input a staking amount");
      return;
    }
    const balance = bnToNumber(jetAccount.info.amount) / 10 ** jetMint.decimals;
    const stakable = Math.min(inputAmount, balance);

    setInputAmount(stakable);
    setStakeModalVisible(true);
  };

  const handleUnstake = () => {
    if (!jetMint || !inputAmount || !tokenOwnerRecord || inputAmount === 0) {
      console.error("Please input an unstaking amount");
      return;
    }
    const balance =
      bnToNumber(tokenOwnerRecord.account.governingTokenDepositAmount) / 10 ** jetMint.decimals;
    const stakable = Math.min(inputAmount, balance);

    setInputAmount(stakable);
    setUnstakeModalVisible(true);
  };

  const handleWithdrawUnstaked = () => {
    if (!unbondingAccounts || !stakeAccount || !stakePool) {
      return;
    }
    withdrawAllUnbonded(rpcContext, unbondingAccounts, stakeAccount, stakePool);
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

  const openNotification = () => {
    const vestedAirdropNotifications = vestedAirdrops();
    vestedAirdropNotifications.map(
      (airdrop: { name: string; amount: number; end: Date; claimed: boolean; vested: boolean }) =>
        notification.open({
          message: "Fully vested",
          description: `${airdrop.name} has fully vested and may now be unstaked! Click for info.`,
          onClick: () => {
            console.log("Go to Airdrop page");
          },
          placement: "bottomRight"
        })
    );
  };

  const showRewards = () => {
    document.getElementById("show-more-apr")?.classList.toggle("hidden");
  };

  const isOwnPage = Boolean(useLocation().pathname.includes("your-info"));

  return (
    <div id="your-info" className={isOwnPage ? "view-container" : ""}>
      <h2>Your Info</h2>

      <div className="neu-inset">
        <span>
          Votes{" "}
          <Tooltip
            title="For each JET token staked, you may cast 1 vote in JetGovern."
            placement="topLeft"
            overlayClassName="no-arrow"
          >
            <InfoCircleFilled />
          </Tooltip>
        </span>

        {/* todo: Rerender react-fitty
        with mutation observer
        when child changes */}
        <ReactFitty maxSize={100} className="text-gradient vote-balance">
          {connected ? toTokens(stakedJet, jetMint) : "-"}
        </ReactFitty>

        <div id="wallet-overview" className="flex justify-between column">
          <div className="flex justify-between" id="current-staking-apr">
            <span>
              {connected ? `${rewards.apr ?? "-"}% Staking APR` : `Current Staking APR `}
              <Tooltip
                title="The displayed APR depends upon many factors, including the total number of JET staked in the module and the amount of protocol revenue flowing to depositors."
                overlayClassName="no-arrow"
              >
                <InfoCircleFilled />
              </Tooltip>
            </span>
            <span>
              {connected ? (
                <PlusOutlined style={{ marginRight: 0 }} onClick={showRewards} />
              ) : (
                `${rewards.apr ?? "-"}%`
              )}
            </span>
          </div>
          <div className={connected ? "hidden" : undefined} id="show-more-apr">
            <div className="flex justify-between cluster">
              <span>Est. Daily Reward</span>
              <span>{rewards.estDailyReward}</span>
            </div>
            <div className="flex justify-between cluster">
              <span>Est. Monthly Reward</span>
              <span>{rewards.estMonthlyReward}</span>
            </div>
          </div>
        </div>

        <Divider />
        <div className="flex column">
          {connected && (
            <div className="flex justify-between cluster">
              <span>Wallet Balance</span>
              <span>{jetAccount ? toTokens(jetAccount.info.amount, jetMint) : 0}</span>
            </div>
          )}
          <div className="flex justify-between cluster">
            <span>Staked JET</span>
            <span>{toTokens(stakedJet, jetMint)}</span>
          </div>
          {connected && (
            <>
              <div className="flex justify-between cluster">
                <span>
                  Unbonding queue{" "}
                  <Tooltip
                    title="This is the amount of tokens you've unstaked that are currently in an unbonding period. For detailed information about the availability of your tokens, visit the Flight Logs page."
                    overlayClassName="no-arrow"
                  >
                    <InfoCircleFilled />
                  </Tooltip>
                </span>
                <span>{toTokens(unbondingQueue.toNumber(), jetMint)}</span>
              </div>
              <div className="flex justify-between cluster">
                <span className="text-gradient bold">Available for Withdrawal</span>
                <span className="text-gradient bold">
                  {toTokens(unbondingComplete.toNumber(), jetMint)}
                </span>
              </div>
            </>
          )}
          <Input
            type="number"
            token
            value={inputAmount === undefined ? "" : inputAmount}
            maxInput={undefined}
            disabled={!connected}
            onChange={(value: number) => setInputAmount(value)}
            submit={() => handleStake()}
          />
          <Button
            onClick={() => handleStake()}
            disabled={!connected || !inputAmount || !stakeAccount}
            className="no-margin-horizontal"
          >
            Stake
          </Button>
          <StakeModal
            visible={stakeModalVisible}
            onClose={() => setStakeModalVisible(false)}
            realm={realm}
            amount={inputAmount ?? 0}
          />
          <Button
            onClick={() => handleUnstake()}
            disabled={!connected || !withdrawVotesAbility || !inputAmount}
            className="no-margin-horizontal"
          >
            Unstake
            {withdrawVotesAbility ? null : (
              <Tooltip
                title="You cannot unstake JET until you have finalised all proposals that you created."
                overlayClassName="no-arrow"
              >
                <InfoCircleFilled style={{ marginLeft: "5px" }} />
              </Tooltip>
            )}
          </Button>
          <UnstakeModal
            visible={unstakeModalVisible}
            amount={inputAmount ?? 0}
            resetInput={() => setInputAmount(undefined)}
            onClose={() => setUnstakeModalVisible(false)}
          />
          <Button
            type="dashed"
            className="full-width"
            onClick={() => handleWithdrawUnstaked()}
            disabled={!connected}
          >
            Withdraw
          </Button>
        </div>
      </div>

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
