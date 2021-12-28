import { Button } from 'antd';
import React from 'react';
import { LABELS } from '../../../../constants';
import {
  Governance,
  Proposal,
  ProposalState,
} from '../../../../models/accounts';
import { finalizeVote } from '../../../../actions/finalizeVote';
import { useRpcContext } from '../../../../hooks/useRpcContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { ParsedAccount } from '../../../../contexts';

export function FinalizeVoteButton({
  governance,
  proposal,
  hasVoteTimeExpired,
}: {
  governance: ParsedAccount<Governance>;
  proposal: ParsedAccount<Proposal>;
  hasVoteTimeExpired: boolean | undefined;
}) {
  const { connected } = useWallet();
  const rpcContext = useRpcContext();

  const isVisible =
    hasVoteTimeExpired === true &&
    connected &&
    proposal.info.state === ProposalState.Voting;

  return (
    <Button
      type="primary"
      disabled={isVisible ? false : true}
      onClick={async () => {
        try {
          await finalizeVote(rpcContext, governance.info.realm, proposal);
        } catch (ex) {
          console.error(ex);
        }
      }}
    >
      {LABELS.FINALIZE_VOTE}
    </Button>
  );
}
