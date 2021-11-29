import React, { useState, useEffect } from 'react';
import { List, Avatar, Button, Skeleton } from 'antd';
import { Voter, TOP_STAKEHOLDERS } from "../models/TOP_STAKEHOLDERS";
import { Stakeholders } from './Stakeholders';

const count = 10;

export const VoterList = () => {
  const [initLoading, setInitLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [list, setList] = useState<Voter[]>([]);

  useEffect(() => {
      // setData();
      setList(TOP_STAKEHOLDERS);
  }, [])

  const onLoadMore = () => {
    setLoading(true);
    setList([])

    // setList((prev) => prev.concat(
    //   [...new Array(count)].map(() => ({
    //     loading: true,
    //     name: {},
    //     picture: {}
    //   })),
    // ));
  }

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
  ;

  const loadMore =
      !initLoading && !loading ? (
        <div
          style={{
            textAlign: 'center',
            marginTop: 12,
            height: 32,
            lineHeight: '32px',
          }}
        >
          <Button onClick={onLoadMore}>more</Button>
        </div>
      ) : null;

    return (
      <List
        className="demo-loadmore-list"
        loading={initLoading}
        itemLayout="horizontal"
        loadMore={loadMore}
        dataSource={list}
        renderItem={item => (
            <List.Item
              // actions={[<a key="list-loadmore-edit">edit</a>, <a key="list-loadmore-more">more</a>]}
            >
              <Skeleton avatar title={false} loading={loading} active>
                {/* <List.Item.Meta
                  title={<a href="https://ant.design">{item.name.last}</a>}
                  description="Ant Design, a design language for background applications, is refined by Ant UED Team"
              /> */}
                <Stakeholders 
                type={item.vote}
                amount={item.amount}
                address={item.address}
                   />

              </Skeleton>
            </List.Item>
          )
        }
      />
    );
  }