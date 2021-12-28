import { Button, Col, Modal, Row } from 'antd';
import React from 'react';
import { Realm } from '../../../models/accounts';
import { LABELS } from '../../../constants';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { depositGoverningTokens } from '../../../actions/depositGoverningTokens';
import { PublicKey } from '@solana/web3.js';
import { useRpcContext } from '../../../hooks/useRpcContext';
import { ParsedAccount } from '../../../contexts';
import { useAccountByMint } from '../../../hooks';

const { confirm } = Modal;
export function DepositGoverningTokensButton({
  realm,
  governingTokenMint,
  tokenName,
}: {
  realm: ParsedAccount<Realm> | undefined;
  governingTokenMint: PublicKey | undefined;
  tokenName?: string;
}) {
  const rpcContext = useRpcContext();

  const governingTokenAccount = useAccountByMint(governingTokenMint);

  if (!realm) {
    return null;
  }

  const isVisible =
    realm != null &&
    governingTokenAccount &&
    !governingTokenAccount.info.amount.isZero();

  return (
    <Button
      type="primary"
      disabled={isVisible ? false : true}
      onClick={() =>
        confirm({
          title: LABELS.DEPOSIT_TOKENS,
          icon: <ExclamationCircleOutlined />,
          content: (
            <Row>
              <Col span={24}>
                <p>{LABELS.DEPOSIT_TOKENS_QUESTION}</p>
              </Col>
            </Row>
          ),
          okText: LABELS.DEPOSIT,
          cancelText: LABELS.CANCEL,
          onOk: async () => {
            if (governingTokenAccount) {
              await depositGoverningTokens(
                rpcContext,
                realm!.pubkey,
                governingTokenAccount,
                governingTokenMint!,
              );
            }
          },
        })
      }
    >
      {LABELS.DEPOSIT_TOKENS(tokenName)}
    </Button>
  );
}
