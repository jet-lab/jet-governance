import React, { useState } from 'react';
import { ButtonProps } from 'antd';

import { PublicKey } from '@solana/web3.js';

import { LABELS } from '../../../constants';

import { Redirect } from 'react-router';

import { GovernanceType } from '../../../models/enums';

import { useKeyParam } from '../../../hooks/useKeyParam';
import { ModalFormAction } from '../../../components/ModalFormAction/modalFormAction';

import { AccountFormItem } from '../../../components/AccountFormItem/accountFormItem';

import { useRpcContext } from '../../../hooks/useRpcContext';
import { getGovernanceUrl } from '../../../tools/routeTools';
import {
  getGovernanceConfig,
  GovernanceConfigFormItem,
  GovernanceConfigValues,
} from '../../../components/governanceConfigFormItem/governanceConfigFormItem';
import { Realm } from '../../../models/accounts';
import { useWalletTokenOwnerRecord } from '../../../hooks/apiHooks';
import { createTreasuryAccount } from '../../../actions/createTreasuryAccount';
import { ParsedAccount } from '../../../contexts';

export function CreateTreasuryAccountButton({
  buttonProps,
  realm,
}: {
  buttonProps?: ButtonProps;
  realm: ParsedAccount<Realm> | undefined;
}) {
  const [redirectTo, setRedirectTo] = useState('');
  const rpcContext = useRpcContext();
  const { programId } = rpcContext;

  const realmKey = useKeyParam();

  const communityTokenOwnerRecord = useWalletTokenOwnerRecord(
    realm?.pubkey,
    realm?.info.communityMint,
  );

  const councilTokenOwnerRecord = useWalletTokenOwnerRecord(
    realm?.pubkey,
    realm?.info.config.councilMint,
  );

  if (!realm) {
    return null;
  }

  const canCreateGovernanceUsingCommunityTokens =
    communityTokenOwnerRecord &&
    communityTokenOwnerRecord.info.governingTokenDepositAmount.cmp(
      realm.info.config.minCommunityTokensToCreateGovernance,
    ) >= 0;

  const canCreateGovernanceUsingCouncilTokens =
    councilTokenOwnerRecord &&
    !councilTokenOwnerRecord.info.governingTokenDepositAmount.isZero();

  const tokenOwnerRecord = canCreateGovernanceUsingCouncilTokens
    ? councilTokenOwnerRecord
    : canCreateGovernanceUsingCommunityTokens
    ? communityTokenOwnerRecord
    : undefined;

  const onSubmit = async (
    values: {
      mintAddress: string;
    } & GovernanceConfigValues,
  ) => {
    const config = getGovernanceConfig(values);

    return await createTreasuryAccount(
      rpcContext,
      realmKey,
      new PublicKey(values.mintAddress),
      config,
      tokenOwnerRecord!.pubkey,
    );
  };

  const onComplete = (pk: PublicKey) => {
    setRedirectTo(pk.toBase58());
  };

  if (redirectTo) {
    return <Redirect push to={getGovernanceUrl(redirectTo, programId)} />;
  }

  return (
    <ModalFormAction<PublicKey>
      label="Create Treasury Account"
      buttonProps={{ disabled: !tokenOwnerRecord }}
      formTitle="Create Treasury Account"
      formAction={LABELS.CREATE}
      formPendingAction={LABELS.CREATING}
      onSubmit={onSubmit}
      onComplete={onComplete}
      initialValues={{
        governanceType: GovernanceType.Account,
        transferAuthority: true,
      }}
    >
      <AccountFormItem
        name="mintAddress"
        label="mint address"
      ></AccountFormItem>

      <GovernanceConfigFormItem realm={realm}></GovernanceConfigFormItem>
    </ModalFormAction>
  );
}
