import { Divider, Progress, Collapse, Timeline } from "antd";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAirdrop } from "../contexts/airdrop";
import { Available } from "../components/airdrop/Available";

interface Airdrop {
  name: string;
  amount: number;
  end: Date;
  claimed: boolean;
  vested: boolean;
}

export const AirdropView = () => {
  const { connected } = useWallet();
  const { airdrops, claimedAirdrops, vestingAirdrops, totalAirdropped } =
    useAirdrop();

  const vesting: Airdrop[] = vestingAirdrops();
  const claimed: Airdrop[] = claimedAirdrops();

  const { Panel } = Collapse;

  const vestingProgress = () => {
    const vesting = vestingAirdrops();

    // Get the date at which vesting will end
    // This will likely be a backend number in the future
    const addDays = (date: Date, days: number) => {
      var result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    }

    const getRemainingPercentage = (start: Date, end: Date) => {
      const difference = Math.abs(new Date().valueOf() - start.valueOf());
      const range = end.valueOf() - start.valueOf()
      return (difference / range) * 100
    }

    let allVestingPercentages = [0]

    for (let i = 0; i < vesting.length; i++) {
      const vestingEnd = addDays(vesting[i].claimDate, vesting[i].vestingPeriod)
      allVestingPercentages.push(getRemainingPercentage(vesting[i].claimDate, vestingEnd))

    }

    return allVestingPercentages.reduce((x, y) => x + y);
  }

  const vestingProgressBar = vestingProgress()

  return (
    <div className="view-container content-body" id="airdrop">
      <div className="panel" style={{ width: "50%" }}>
        <h2>Airdrop</h2>
        <div className="neu-container" style={{ maxWidth: "750px" }}>
          <h1>Here's how your airdrop works.</h1>
          <p>
            Airdrop claims deposit a fixed amount of Jet tokens into your
            governance account. These tokens are locked for a 30-day vesting
            period, during which time you may vote with your tokens. As tokens
            are vested, they can remain staked to accrue rewards or you can
            choose to unstake them.
          </p>

          <Divider />

          <h1>Available</h1>
          {connected &&
            airdrops?.map((airdrop) => (
              <Available
                name={airdrop.name}
                amount={airdrop.amount}
                end={airdrop.end}
                claimed={airdrop.claimed}
                announced={airdrop.announced}
              />
            ))}
        </div>
      </div>

      <div className="panel" style={{ width: "50%" }}>
        <h2>Your info</h2>
        <div className="header">
          <div className="neu-container">
            <h1>Vesting progress</h1>
            {vesting.length === 0
              ? "All of your rewards are fully vested. Stake away!"
              : `Currently vesting: ${vesting.map(
                  (airdrop) => `${airdrop.name}, `
                )}`}
            <Progress
              percent={vestingProgressBar}
              showInfo={false}
            />
            <Divider />
            <Collapse accordion>
              {claimed.map((airdrop, key) => (
                <Panel header={airdrop.name} key={key}>
                  <Timeline>
                    <Timeline.Item>Airdrop claimed</Timeline.Item>
                    <Timeline.Item>Vesting begins</Timeline.Item>
                    <Timeline.Item
                      className={!airdrop.vested ? "incomplete" : ""}
                    >
                      Vesting period complete
                    </Timeline.Item>
                  </Timeline>
                </Panel>
              ))}
            </Collapse>
            Total: {new Intl.NumberFormat().format(totalAirdropped())}
          </div>
        </div>
      </div>
    </div>
  );
};
