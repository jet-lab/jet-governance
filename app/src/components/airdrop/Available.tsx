import { useState, useEffect } from 'react';
import { Button } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { ClaimModal } from '../modals/ClaimModal';
import { getRemainingTime } from '../../utils';
import { Airdrop } from '@jet-lab/jet-engine';
import { PublicKey } from '@solana/web3.js';

interface availAirdropsRender {
  airdrop: Airdrop;
  airdropAddress: PublicKey;
  shortDesc: string;
  expireAt: number;
  amount: number | undefined;
}

export const Available = ({ airdrop }: { airdrop: availAirdropsRender }) => {
  const [showModal, setShowModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const key = airdrop.airdropAddress.toString();

  // Update current time every second
  useEffect(() => {
    const secondInterval = setInterval(() => {
      setCurrentTime(currentTime + 1000);
    }, 1000);
    return () => clearInterval(secondInterval);
  });

  const getAirdropAmount = (airdropAmount: number | undefined): number | undefined => {
    return airdrop.amount ? airdrop.amount / 1000000000 : 0;
  };
  const claimed = getAirdropAmount(airdrop.amount) === 0 ? true : false;
  const expired = airdrop.expireAt * 1000 < currentTime;

  return (
    <div className="flex justify-between align-center avail-list" key={key}>
      <span className="avail-info">
        <strong>CARE PACKAGE | {getAirdropAmount(airdrop.amount)} JET</strong>
        <br />
        {airdrop.shortDesc}{' '}
        <span className="gray">
          Ends in {getRemainingTime(currentTime, airdrop.expireAt * 1000)}
        </span>
      </span>
      <Button
        type="primary"
        className="claim-button"
        onClick={() => setShowModal(true)}
        disabled={claimed || expired ? true : false}
      >
        {claimed ? <CheckOutlined /> : 'claim'}
      </Button>
      <ClaimModal
        visible={showModal}
        stakeAmount={getAirdropAmount(airdrop.amount)}
        airdrop={airdrop.airdrop}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};
