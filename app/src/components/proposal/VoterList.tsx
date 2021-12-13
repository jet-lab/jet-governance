import React, { useState, useEffect } from "react";
import { List, Button, Skeleton } from "antd";
import { Voter, TOP_STAKEHOLDERS } from "../../models/TOP_STAKEHOLDERS";
import { Stakeholders } from "./Stakeholders";
import { useUser } from "../../hooks/useClient";
import { useWallet } from "@solana/wallet-adapter-react";

export const VoterList = (props: {
  id: number;
  userVote?: string;
  amount?: number;
}) => {
  const [initLoading, setInitLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Voter[]>(TOP_STAKEHOLDERS);
  const [list, setList] = useState<Voter[]>([]);

  const { publicKey } = useWallet();
  const { id, userVote, amount } = props;

  const count = 5;

  useEffect(() => {
    setList(data.slice(0, count * page));
  }, [data, page]);

 // Function to fake lazy loading
  const onLoadMore = () => {
    setLoading(true);
    setList(() =>
      list.concat(data.slice(count * page, count * page + 1))
    );
    setPage(page + 1);

    setLoading(false);
    setInitLoading(false);
  };

  const loadMore =
    !initLoading && !loading ? (
      <div
        style={{
          textAlign: "center",
          marginTop: 12,
          height: 32,
          lineHeight: "32px",
        }}
      >
        <Button onClick={onLoadMore}>Load more</Button>
      </div>
    ) : null;

  return (
    <>
      {amount && userVote && publicKey && (
          <Stakeholders
            type={userVote}
            amount={amount}
            address={publicKey.toString()}
            thisUser={true}
          />
      )}
      <List
        loading={initLoading}
        itemLayout="horizontal"
        loadMore={loadMore}
        dataSource={list}
        renderItem={(item) => (
          <List.Item
          >
            <Skeleton avatar title={false} loading={loading} active>
              <Stakeholders
                type={item.vote}
                amount={item.amount ?? 0}
                address={item.address}
              />
            </Skeleton>
          </List.Item>
        )}
      />
    </>
  );
};
