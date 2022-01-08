import { Col, List, Row } from 'antd';
import React, { useMemo } from 'react';
import { useRealms } from '../../contexts/GovernanceContext';
import { useHistory } from 'react-router-dom';
import { RealmBadge } from '../../components/RealmBadge/realmBadge';
import { useWalletTokenOwnerRecords } from '../../hooks/apiHooks';
import { RealmDepositBadge } from '../../components/RealmDepositBadge/realmDepositBadge';
import { useRpcContext } from '../../hooks/useRpcContext';
import { getRealmUrl } from '../../tools/routeTools';
import { AppLayout } from '../../components/Layout/layout';

export const AllRealmsView = () => {
  const history = useHistory();
  const realm = useRealms().filter((g) => g.info.name === "Much Shib");
  const { programIdBase58 } = useRpcContext();
  const tokenOwnerRecords = useWalletTokenOwnerRecords();

  const realmItems = useMemo(() => {
    

    return realm.map(r => {
        const communityTokenOwnerRecord = tokenOwnerRecords.find(
          tor =>
            tor.info.governingTokenMint.toBase58() ===
            r.info.communityMint.toBase58(),
        );

        const councilTokenOwnerRecord =
          r.info.config.councilMint &&
          tokenOwnerRecords.find(
            tor =>
              tor.info.governingTokenMint.toBase58() ===
              r.info.config.councilMint!.toBase58(),
          );

        return {
          href: getRealmUrl(r.pubkey, programIdBase58),
          title: r.info.name,
          badge: (
            <RealmBadge
              communityMint={r.info.communityMint}
              councilMint={r.info.config.councilMint}
            ></RealmBadge>
          ),
          key: r.pubkey.toBase58(),
          description: (
            <RealmDepositBadge
              communityTokenOwnerRecord={communityTokenOwnerRecord}
              councilTokenOwnerRecord={councilTokenOwnerRecord}
            ></RealmDepositBadge>
          ),
        };
      });
  }, [realm, tokenOwnerRecords, programIdBase58]);

  return (
    <AppLayout>
      <Row className="oyster">
        <Col flex="auto" xxl={15} xs={24} className="governance-container">
          <List
            itemLayout="vertical"
            size="large"
            pagination={false}
            dataSource={realmItems}
            renderItem={item => (
              <List.Item
                key={item.key}
                className="governance-item"
                onClick={() => history.push(item.href)}
              >
                <List.Item.Meta
                  avatar={item.badge}
                  title={item.title}
                  description={item.description}
                ></List.Item.Meta>
              </List.Item>
            )}
          />
        </Col>
      </Row>
    </AppLayout>
  );
};
