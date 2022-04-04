import { useState, useMemo } from "react";
import { List, Button, Skeleton } from "antd";
import { Stakeholders } from "./Stakeholders";
import { ProgramAccount, VoteRecord } from "@solana/spl-governance";
import { getVoterDisplayData, VoterDisplayData } from "../../hooks";
import { bnToNumber } from "@jet-lab/jet-engine";
import { useProposalContext } from "../../contexts/proposal";
import { sharesToTokens } from "../../utils/utils";

export const VoterList = (props: {
  voteRecords: VoterDisplayData[] | undefined;
  userVoteRecord?: ProgramAccount<VoteRecord>;
}) => {
  const { stakePool } = useProposalContext();

  const [page, setPage] = useState(1);

  const count = 5;

  const list = useMemo(() => {
    if (!props.voteRecords) {
      return;
    }
    return props.voteRecords.slice(0, count * page);
  }, [props.voteRecords, page]);

  const userVote = useMemo(() => {
    return getVoterDisplayData(props.userVoteRecord);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.userVoteRecord]);

  // Function to fake lazy loading
  const onLoadMore = () => {
    setPage(page + 1);
  };

  const loadMore = (
    <div
      style={{
        textAlign: "center",
        marginTop: 12,
        height: 32,
        lineHeight: "32px",
        visibility: list && count * page < list.length ? "visible" : "collapse"
      }}
    >
      <Button onClick={onLoadMore}>Load more</Button>
    </div>
  );

  return (
    <>
      {userVote && (
        <Stakeholders
          type={userVote.voteKind}
          amount={bnToNumber(sharesToTokens(userVote.voteWeight, stakePool).tokens)}
          user={userVote.user}
          thisUser={true}
        />
      )}
      <List
        itemLayout="horizontal"
        loadMore={loadMore}
        dataSource={list}
        renderItem={item =>
          (!props.userVoteRecord ||
            !item.user.equals(props.userVoteRecord.account.governingTokenOwner)) && (
            <List.Item>
              <Skeleton avatar title={false} loading={false} active>
                <Stakeholders
                  type={item.voteKind}
                  amount={bnToNumber(sharesToTokens(item.voteWeight, stakePool).tokens)}
                  user={item.user}
                />
              </Skeleton>
            </List.Item>
          )
        }
      />
    </>
  );
};
