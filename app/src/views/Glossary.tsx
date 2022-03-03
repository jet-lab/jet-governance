export const GlossaryView = () => {
  return (
    <div className="view-container content-body column-grid">
      <div className="neu-container centered">
        <h2>Stake</h2>
        <p>
          When you “stake” your JET tokens, you will be able to vote on active proposals in the time
          frame allotted. Additionally, staked JET earns a portion of the protocol revenue
          proportionate to all staked JET tokens. Staked JET also are the primary insurance fund for
          a protocol-wide event such as bad debt—in this event, the first backstop is staked JET.
        </p>

        <h2>Unstake</h2>
        <p>
          When you “unstake” your JET tokens they will immediately enter the unbonding period,
          during which time you may not vote, and rewards will cease to accrue. After the unbonding
          period, you may withdraw the staked JET to your wallet.
        </p>

        <h2>Unbonding Period</h2>
        <p>
          When you elect to unstake JET tokens, the unbonding period of 29.5 days (1 full lunar
          cycle phase; wen moon?) begins as soon as the unstaking transaction is completed by the
          user. During this unbonding period, the user may not vote on any proposals, and will not
          earn any interest. While unbonding, the staked JET is still in use as an insurance
          backstop for the platform.
        </p>

        <h2>APR</h2>
        <p>
          This is the rate at which staked JET will accrue more staked JET. This rate will vary
          based on several factors, including the amount of protocol revenue and the total amount of
          JET staked. Protocol fees are directed in part to JET stakers as described in our docs.
          Additionally, during the first 90-day period after staking goes live, there will be a
          total of XXX JET rewarded to this pool in addition to the protocol fees as described in
          our Medium post. Note that if the user wants to unstake their JET and enters the unbonding
          period, that user’s APR will drop to 0% for the duration of the unbonding period.
        </p>
      </div>
    </div>
  );
};
