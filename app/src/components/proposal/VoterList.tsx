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
  const [data, setData] = useState([]);
  const [list, setList] = useState<Voter[]>([]);

  // const { address } = useUser()
  const { publicKey, connected } = useWallet();
  const { id, userVote, amount } = props;

  const count = 5;

  useEffect(() => {
    setList(TOP_STAKEHOLDERS.slice(page, count * page));
  }, [page]);

  const onLoadMore = () => {
    setLoading(true);
    setList(
      list.concat(TOP_STAKEHOLDERS.slice(count * page, count * page + 1))
    );
    setPage(page + 1);

    setLoading(false);
    setInitLoading(false);

    // setList((prev) => prev.concat(
    //   [...new Array(count)].map(() => ({
    //     loading: true,
    //     name: {},
    //     picture: {}
    //   })),
    // ));
  };

  // this.setState({
  //   loading: true,
  //   list: this.state.data.concat(
  //     [...new Array(count)].map(() => ({ loading: true, name: {}, picture: {} })),
  //   ),
  // });
  // this.getData(res => {
  //   const data = this.state.data.concat(res.results);
  //   this.setState(
  //     {
  //       data,
  //       list: data,
  //       loading: false,
  //     },
  //     () => {
  //       // Resetting window's offsetTop so as to display react-virtualized demo underfloor.
  //       // In real scene, you can using public method of react-virtualized:
  //       // https://stackoverflow.com/questions/46700726/how-to-use-public-method-updateposition-of-react-virtualized
  //       window.dispatchEvent(new Event('resize'));
  //     },
  //   );
  // });
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
        <Button onClick={onLoadMore}>More</Button>
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
