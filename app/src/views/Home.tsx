import React, { useState } from "react"
import { useProposalContext } from "../contexts/proposal"
import { ProposalCard } from "../components/ProposalCard"
import { Button, Divider, notification, Tooltip, Switch } from "antd"
import { useDarkTheme } from "../contexts/darkTheme"
import {
  useStakeAccount,
  useStakeProgram,
  useStakedBalance,
  useStakePool,
  useUnbondingAccountsByStakeAccount,
} from "../hooks/useStaking"
import { Input } from "../components/Input"
import { StakeModal } from "../components/modals/StakeModal"
import { UnstakeModal } from "../components/modals/UnstakeModal"
import { InfoCircleFilled } from "@ant-design/icons"
import { useAirdrop } from "../contexts/airdrop"
import { useRpcContext } from "../hooks/useRpcContext"
import { jetFaucet } from "../actions/jetFaucet"
import { useGovernance, useProposalsByGovernance } from "../hooks/apiHooks"
import { JET_GOVERNANCE } from "../utils"
import { useProposalFilters } from "../hooks/proposalHooks"
import { ReactFitty } from "react-fitty"
import { FooterLinks } from "../components/FooterLinks"

export const HomeView = () => {
  const [showStakeModal, setShowStakeModal] = useState(false)
  const [showUnstakeModal, setShowUnstakeModal] = useState(false)

  const { showing, setShowing } = useProposalContext()
  const [inputAmount, setInputAmount] = useState<number | undefined>()
  const { vestedAirdrops } = useAirdrop()
  const rpcContext = useRpcContext()
  const connected = rpcContext.wallet.connected
  const { darkTheme, toggleDarkTheme } = useDarkTheme()

  // ----- Proposals -----
  const proposals = useProposalsByGovernance(JET_GOVERNANCE)
  const filteredProposals = useProposalFilters(proposals)

  // ----- Staking -----
  const stakeProgram = useStakeProgram()
  const stakePool = useStakePool(stakeProgram)
  const stakeAccount = useStakeAccount(stakeProgram, stakePool)
  const unbondingAccounts = useUnbondingAccountsByStakeAccount(
    stakeProgram,
    stakeAccount
  )
  const { stakedJet, unstakedJet, unbondingJet, unlockedVotes } =
    useStakedBalance(stakeAccount, stakePool)

  let governance = useGovernance(JET_GOVERNANCE)

  const totalDailyReward = 1000000
  const totalStake = 1500000
  const userDailyReward = (totalDailyReward * (stakedJet ?? 0)) / totalStake

  // Devnet only: airdrop JET tokens
  const getAirdrop = async () => {
    try {
      await jetFaucet(rpcContext)
    } catch {}
  }

  const openNotification = () => {
    const vestedAirdropNotifications = vestedAirdrops()
    vestedAirdropNotifications.map(
      (airdrop: {
        name: string
        amount: number
        end: Date
        claimed: boolean
        vested: boolean
      }) =>
        notification.open({
          message: "Fully vested",
          description: `${airdrop.name} has fully vested and may now be unstaked! Click for info.`,
          onClick: () => {
            console.log("Go to Airdrop page")
          },
          placement: "bottomRight",
        })
    )
  }

  return (
    <div className="view-container content-body column-grid" id="home">
      <div id="your-info">
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
                Current Staking APR{" "}
                <Tooltip
                  title="The displayed APR depends upon many factors, including the total number of JET staked in the module and the amount of protocol revenue flowing to depositors."
                  overlayClassName="no-arrow"
                >
                  <InfoCircleFilled />
                </Tooltip>
              </span>
              <span>{((365 * userDailyReward) / totalStake).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between cluster">
              <span>Est. Daily Reward</span>
              <span>{userDailyReward}</span>
            </div>
            <div className="flex justify-between cluster">
              <span>Est. Monthly Reward</span>
              <span>{userDailyReward * 30}</span>
            </div>
          </div>
          <Divider />
          <div className="flex column">
            <div className="flex justify-between cluster">
              <span>Staked JET</span>
              <span>{new Intl.NumberFormat().format(stakedJet)}</span>
            </div>
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
              <span>{new Intl.NumberFormat().format(unbondingJet)}</span>
            </div>
            <div className="flex justify-between cluster">
              <span>Available for Withdrawal</span>
              <span>{new Intl.NumberFormat().format(unstakedJet)}</span>
            </div>
            <Input
              type="number"
              token
              value={inputAmount == undefined ? "" : inputAmount}
              maxInput={unlockedVotes ? unlockedVotes : undefined}
              disabled={!connected}
              onChange={(value: number) => setInputAmount(value)}
              submit={() => null}
            />
            <Button
              onClick={() => setShowStakeModal(true)}
              disabled={!connected && true}
              className="full-width"
            >
              Stake
            </Button>
            <StakeModal
              showModal={showStakeModal}
              onClose={() => setShowStakeModal(false)}
              amount={inputAmount ?? 0}
            />
            <Button
              onClick={() => setShowUnstakeModal(true)}
              disabled={!connected && true}
              className="full-width"
            >
              Unstake
            </Button>
            <UnstakeModal
              showModal={showUnstakeModal}
              amount={inputAmount ?? 0}
              setInputAmount={setInputAmount}
              onClose={() => setShowUnstakeModal(false)}
            />
            <Button
              onClick={() => null}
              disabled={!connected && true}
              className="full-width"
              type="dashed"
            >
              Withdraw
            </Button>
          </div>
        </div>

        <FooterLinks />
        
        <Switch
          onChange={() => toggleDarkTheme()}
          checked={darkTheme}
          checkedChildren="dark"
          unCheckedChildren="light"
        />
        <Button onClick={getAirdrop}>GET JET</Button>
      </div>

      <div id="show-proposals">
        <div className="flex justify-between header">
          <h2>Proposals</h2>
          <div className="filter-status">
            <span onClick={() => setShowing("active")}>Active</span>
            <span onClick={() => setShowing("inactive")}>Inactive</span>
            <span onClick={() => setShowing("passed")}>Passed</span>
            <span onClick={() => setShowing("rejected")}>Rejected</span>
            <span onClick={() => setShowing("all")}>All</span>
          </div>
        </div>

        <div id="proposal-cards">
          {filteredProposals.map(
            (proposal) =>
              governance && (
                <ProposalCard
                  proposal={proposal}
                  governance={governance}
                  key={proposal.pubkey.toBase58()}
                />
              )
          )}
        </div>
      </div>
    </div>
  )
}
