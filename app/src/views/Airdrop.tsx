import { Divider } from 'antd';
import { useWallet } from '@solana/wallet-adapter-react';
import { useProposalContext } from '../contexts/proposal';
import { BN } from '@project-serum/anchor';
import { useState, useEffect } from 'react';
import { Button } from 'antd';
import { ClaimModal } from '../components/modals/ClaimModal';
import { CheckOutlined } from '@ant-design/icons';
import { getRemainingTime } from '../utils';
import { FooterLinks } from '../components/FooterLinks';
import { GlossaryModal } from '../components/modals/GlossaryModal';
import { useRpcContext } from '../hooks/useRpcContext';
import { claimAndStake } from '../actions/claimAndStake';
import { Airdrop } from '@jet-lab/jet-engine';

export const AirdropView = () => {
  const rpcContext = useRpcContext();
  const { connected, publicKey } = useWallet();
  const { rewardsProgram, airdropsByWallet, stakePool, stakeAccount } =
    useProposalContext();
  const [showModal, setShowModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showGlossaryModal, setShowGlossaryModal] = useState(false);

  const toggleGlossaryModal = () => {
    setShowGlossaryModal(!showGlossaryModal);
  };

  // Update current time every second
  useEffect(() => {
    const secondInterval = setInterval(() => {
      setCurrentTime(currentTime + 1000);
    }, 1000);
    return () => clearInterval(secondInterval);
  });

  const claimAirdrop = (airdrop: Airdrop) => {
    if (!!rewardsProgram && !!stakePool && !!stakeAccount) {
      // TODO - double check: txn function called, did it send on-chain?
      // TODO - check v1 & v1-react pattern, connect with the wallet
      // console.log(rewardsProgram, airdrop, stakePool, stakeAccount);
      claimAndStake(
        rpcContext,
        rewardsProgram,
        airdrop,
        stakePool,
        stakeAccount
      );

      setShowModal(true);
    }
  };

  const availAirdropsRender = airdropsByWallet?.map((airdrop) => ({
    airdrop,
    airdropAddress: airdrop.airdropAddress,
    shortDesc: String.fromCharCode(...airdrop.airdrop.shortDesc),
    expireAt: airdrop.airdrop.expireAt.toNumber(),
    amount: airdrop.targetInfo.recipients
      .find(({ recipient }) => recipient.toString() === publicKey?.toString())
      ?.amount?.toNumber(),
  }));

  return (
    <div className='view-container column-grid'>
      <div className='neu-container centered' id='airdrop'>
        <h1>Claim your airdrop!</h1>
        <p>
          Available airdrops for the connected wallet are listed below. All
          airdrops must be claimed by the receiver within 90 days. After 90
          days, any unclaimed claims will be redirected to the Jet DAO treasury
          for future allocation.
        </p>

        <p>
          All airdrops will be autostaked in the governance module immediately
          after claiming, and will begin earning yield immediately. Staked
          tokens are subject to a 29.5-day unbonding period.
        </p>

        <p>
          In addition to the
          <u>
            <a href='https://medium.com/jetprotocol/jet-staking-and-the-jetdrop-two-more-steps-towards-jet-governance-84d8de26be4a'>
              blog announcement
            </a>
          </u>
          on airdrop and staking details, more details can be found in the
          <u>
            <a href='https://docs.jetprotocol.io/jet-protocol/protocol/jet-staking'>
              docs
            </a>
          </u>
          and
          <span
            onClick={toggleGlossaryModal}
            style={{ textDecoration: 'underline', cursor: 'pointer' }}
          >
            glossary
            <GlossaryModal
              visible={showGlossaryModal}
              onClose={() => setShowGlossaryModal(false)}
            />
          </span>
        </p>
        <Divider />

        {connected &&
          availAirdropsRender?.map((airdrop) => {
            const claimed = new BN(0).toNumber();
            // TODO - double check: see if the numbers, expireAt & currentTime are same format comparable
            const expired = airdrop.expireAt < currentTime;
            const key = airdrop.airdropAddress.toString();

            return (
              <div
                className='flex justify-between align-center avail-list'
                key={key}
              >
                <span className='avail-info'>
                  <strong>
                    CARE PACKAGE |{' '}
                    {airdrop.amount && airdrop.amount / 1000000000} JET
                  </strong>
                  <br />
                  {airdrop.shortDesc}{' '}
                  <span className='gray'>
                    Ends in{' '}
                    {getRemainingTime(currentTime, airdrop.expireAt * 1000)}
                  </span>
                </span>
                <Button
                  type='primary'
                  className='claim-button'
                  onClick={() => claimAirdrop(airdrop.airdrop)} // function send txn onchain
                  disabled={!claimed || expired ? false : true}
                >
                  {claimed ? <CheckOutlined /> : 'claim'}
                </Button>
                <ClaimModal
                  visible={showModal}
                  stakeAmount={airdrop.amount && airdrop.amount / 1000000000}
                  setShowModal={setShowModal}
                />
              </div>
            );
          })}
      </div>
      {/* todo - styling */}
      <FooterLinks />
    </div>
  );
};
