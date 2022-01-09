import React, { useState, useEffect } from "react";
import { List, Button, Skeleton } from "antd";
import { Stakeholders } from "./Stakeholders";
import { useUser } from "../../hooks/useClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { VoteRecord } from "../../models/accounts";
import { VoterDisplayData } from "../../hooks/proposalHooks";
import { bnToIntLossy } from "../../tools/units";

export const VoterList = (props: {
  voteRecords: VoterDisplayData[],
  userVoteRecord?: VoterDisplayData
}) => {
  const [page, setPage] = useState(1);
  const [list, setList] = useState<VoterDisplayData[]>([]);

  const count = 5;

  useEffect(() => {
    setList(props.voteRecords.slice(0, count * page));
  }, [props.voteRecords, page]);

  // Function to fake lazy loading
  const onLoadMore = () => {
    setPage(page + 1);
  };

  const loadMore =
    (
      <div
        style={{
          textAlign: "center",
          marginTop: 12,
          height: 32,
          lineHeight: "32px",
          visibility: count * page < list.length ? "visible" : "collapse"
        }}
      >
        <Button onClick={onLoadMore}>Load more</Button>
      </div>
    );

  return (
    <>
      {props.userVoteRecord && (
        <Stakeholders
          type={props.userVoteRecord.group}
          amount={bnToIntLossy(props.userVoteRecord.value)}
          address={props.userVoteRecord.title}
          thisUser={true}
        />
      )}
      <List
        itemLayout="horizontal"
        loadMore={loadMore}
        dataSource={list}
        renderItem={(item) => item.title !== props.userVoteRecord?.title && (
          <List.Item>
            <Skeleton avatar title={false} loading={false} active>
              <Stakeholders
                type={item.group}
                amount={bnToIntLossy(item.value)}
                address={item.title}
              />
            </Skeleton>
          </List.Item>
        )}
      />
    </>
  );
};
