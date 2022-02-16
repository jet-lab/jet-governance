import { InfoCircleFilled, PlusOutlined } from "@ant-design/icons";
import { bnToNumber } from "@jet-lab/jet-engine";
import { Tooltip, Divider, Button, Switch, Popover, notification } from "antd";
import { Input } from "../components/Input";
import { useState } from "react";
import { ReactFitty } from "react-fitty";
import { jetFaucet } from "../actions/jetFaucet";
import { useConnectionConfig, useMint } from "../contexts";
import { useAirdrop } from "../contexts/airdrop";
import { useDarkTheme } from "../contexts/darkTheme";
import { useProposalContext } from "../contexts/proposal";
import { useWithdrawVotesAbility } from "../hooks/proposalHooks";
import { COUNCIL_FAUCET_DEVNET, COUNCIL_TOKEN_MINT, fromLamports, JET_FAUCET_DEVNET, JET_REALM, JET_TOKEN_MINT } from "../utils";
import { FooterLinks } from "./FooterLinks";
import { StakeModal } from "./modals/StakeModal";
import { UnstakeModal } from "./modals/UnstakeModal";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLocation } from "react-router";

export const YourInfo = () => {
  const [stakeModalVisible, setStakeModalVisible] = useState(false);
  const [unstakeModalVisible, setUnstakeModalVisible] = useState(false);
  const [inputAmount, setInputAmount] = useState<number | undefined>();
  const { vestedAirdrops } = useAirdrop();
  const connected = useWallet();
  const { darkTheme, toggleDarkTheme } = useDarkTheme();
  const { env } = useConnectionConfig()

  const {
    stakeProgram,
    unbondingTotal,
    stakeBalance: {
      stakedJet,
      unstakedJet,
      unlockedVotes,
    },

    jetAccount,
    jetMint,

    governance,
    tokenOwnerRecord,
    walletVoteRecords,
  } = useProposalContext();

  const withdrawVotesAbility = useWithdrawVotesAbility(tokenOwnerRecord);
  /* eslint-enable @typescript-eslint/no-unused-vars */

  const totalDailyReward = 1000000
  const totalStake = 1500000
  const userDailyReward = totalDailyReward * (stakedJet ?? 0) / totalStake

  const mint = useMint(JET_TOKEN_MINT)

  const handleStake = () => {
    if (!jetMint || !inputAmount || !jetAccount) {
      return;
    }
    const balance = bnToNumber(jetAccount.info.amount) / 10 ** jetMint.decimals
    const stakable = Math.min(inputAmount, balance)

    setInputAmount(stakable);
    setStakeModalVisible(true)
  }

  const handleUnstake = () => {

    if (!jetMint || inputAmount === undefined || !tokenOwnerRecord) {
      return;
    }
    const balance = bnToNumber(tokenOwnerRecord.account.governingTokenDepositAmount) / 10 ** jetMint.decimals
    const stakable = Math.min(inputAmount, balance)

    setInputAmount(stakable);
    setUnstakeModalVisible(true)
  }

  // Devnet only: airdrop JET tokens
  const getJetAirdrop = async () => {
    try {
      if (stakeProgram) {
        await jetFaucet(stakeProgram?.provider, JET_FAUCET_DEVNET, JET_TOKEN_MINT, "Devnet JET");
      }
    } catch { }
  };
  // Devnet only: airdrop Council tokens
  const getCouncilAirdrop = async () => {
    try {
      if (stakeProgram) {
        await jetFaucet(stakeProgram?.provider, COUNCIL_FAUCET_DEVNET, COUNCIL_TOKEN_MINT, "Devnet Council token");
      }
    } catch { }
  };

  const openNotification = () => {
    const vestedAirdropNotifications = vestedAirdrops();
    vestedAirdropNotifications.map(
      (airdrop: {
        name: string;
        amount: number;
        end: Date;
        claimed: boolean;
        vested: boolean;
      }) =>
        notification.open({
          message: "Fully vested",
          description: `${airdrop.name} has fully vested and may now be unstaked! Click for info.`,
          onClick: () => {
            console.log("Go to Airdrop page");
          },
          placement: "bottomRight",
        })
    );
  };

  const showMoreApr = () => {
    document.getElementById("show-more-apr")?.classList.toggle("hidden")
  }

  const isOwnPage = Boolean(useLocation().pathname.includes("your-info"))

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

        <ReactFitty maxSize={100} className="text-gradient staked-balance">
          {connected ? new Intl.NumberFormat().format(unlockedVotes) : "-"}
        </ReactFitty>

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
                <PlusOutlined
                  style={{ marginRight: 0 }}
                  onClick={showMoreApr}
                />
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

        <Divider />
        <div className="flex column">
          {connected && (
            <div className="flex justify-between cluster">
              <span>Wallet Balance</span>
              <span>
                {new Intl.NumberFormat().format(
                  jetAccount ? fromLamports(jetAccount.info.amount, mint) : 0
                )}
              </span>
            </div>
          )}
          <div className="flex justify-between cluster">
            <span>Staked JET</span>
            <span>{new Intl.NumberFormat().format(stakedJet)}</span>
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
                <span>{new Intl.NumberFormat().format(unbondingTotal)}</span>
              </div>
              <div className="flex justify-between cluster">
                <span className="text-gradient bold">
                  Available for Withdrawal
                </span>
                <span className="text-gradient bold">
                  {new Intl.NumberFormat().format(unstakedJet)}
                </span>
              </div>
            </>
          )}
          <Input
            type="number"
            token
            value={inputAmount === undefined ? "" : inputAmount}
            maxInput={unlockedVotes ? unlockedVotes : undefined}
            disabled={!connected}
            onChange={(value: number) => setInputAmount(value)}
            submit={() => handleStake()}
          />
          <Button
            onClick={() => handleStake()}
            disabled={!connected}
            className="full-width"
          >
            Stake
          </Button>
          <StakeModal
            visible={stakeModalVisible}
            onClose={() => setStakeModalVisible(false)}
            realm={JET_REALM}
            amount={inputAmount ?? 0}
          />
          <Button
            onClick={() => handleUnstake()}
            disabled={!connected || !withdrawVotesAbility}
            className="full-width"
          >
            Unstake
          </Button>
          <UnstakeModal
            visible={unstakeModalVisible}
            amount={inputAmount ?? 0}
            resetInput={() => setInputAmount(undefined)}
            onClose={() => setUnstakeModalVisible(false)}
          />
          <Button type="dashed"
            className="full-width"
            disabled={!connected || !withdrawVotesAbility}
          >Withdraw</Button>
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
        <Button
          onClick={getJetAirdrop}
          style={{ display: env === "mainnet-beta" ? "none" : "" }}
        >
          GET JET
        </Button>
        <Button
          onClick={getCouncilAirdrop}
          style={{ display: env === "mainnet-beta" ? "none" : "" }}
        >
          GET COUNCIL TOKEN
        </Button>
      </div>

      <FooterLinks />
    </div>
  );
};
