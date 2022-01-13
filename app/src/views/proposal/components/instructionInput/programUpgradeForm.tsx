import { Form, FormInstance } from 'antd';
import { Governance } from '../../../../models/accounts';
import {
  AccountInfo,
  ParsedAccountData,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import React from 'react';
import { createUpgradeInstruction } from '../../../../tools/sdk/bpfUpgradeableLoader/createUpgradeInstruction';
import { formDefaults } from '../../../../tools/forms';
import { AccountFormItem } from '../../../../components/oyster/AccountFormItem/accountFormItem';
import { validateProgramBufferAccount } from '../../../../tools/validators/accounts/upgradeable-program';
import { utils } from '@project-serum/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { ExplorerLink } from '../../../../components';
import { ParsedAccount } from '../../../../contexts';
import { programIds } from '../../../../utils';

export const ProgramUpgradeForm = ({
  form,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  governance: ParsedAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const { publicKey } = useWallet();

  if (!publicKey) {
    return <div>Wallet not connected</div>;
  }

  const { bpf_upgrade_loader: bpfUpgradableLoaderId } = programIds();

  const onCreate = async ({ bufferAddress }: { bufferAddress: string }) => {
    const upgradeIx = await createUpgradeInstruction(
      governance.info.governedAccount,
      new PublicKey(bufferAddress),
      governance.pubkey,
      publicKey,
    );

    onCreateInstruction(upgradeIx);
  };

  const bufferValidator = (info: AccountInfo<Buffer | ParsedAccountData>) =>
    validateProgramBufferAccount(info, governance.pubkey);

  return (
    <Form {...formDefaults} form={form} onFinish={onCreate}>
      <Form.Item label="program id">
        <ExplorerLink address={bpfUpgradableLoaderId} type="address" />
      </Form.Item>
      <Form.Item label="program (governed account)">
        <ExplorerLink
          address={governance.info.governedAccount}
          type="address"
        />
      </Form.Item>
      <AccountFormItem
        name="bufferAddress"
        label="buffer address"
        accountInfoValidator={bufferValidator}
      ></AccountFormItem>
      <Form.Item label="spill account (wallet)">
        <ExplorerLink address={publicKey} type="address" />
      </Form.Item>
      <Form.Item label="upgrade authority (governance account)">
        <ExplorerLink address={governance.pubkey} type="address" />
      </Form.Item>
    </Form>
  );
};
