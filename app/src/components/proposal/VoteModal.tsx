import { useState, useEffect } from "react";
import { Button, Input, Modal } from "antd";

export const VoteModal = (props: { vote: string, staked: boolean }) => {
  const [isVoteModalVisible, setIsVoteModalVisible] = useState(false);
  const [isStakeRedirectVisible, setIsStakeRedirectModalVisible] = useState(false);
  const [collateral, setCollateral] = useState("500");

  const { vote, staked } = props;

  const handleOk = () => {
    setIsVoteModalVisible(false);
  };

  const showModal = () => {
    if (!staked) {
      return setIsStakeRedirectModalVisible(true);
    }
    setIsVoteModalVisible(true);
  };

  return (
    <>
      <Button onClick={showModal}>Make Offer</Button>
      <Modal
        title={`Create offer for TEST`}
        visible={isVoteModalVisible}
        okText="Create Offer"
        onOk={handleOk}
        onCancel={() => setIsVoteModalVisible(false)}
        closable={false}
      >
        <p>Test</p>
        <p>Collateral</p>
        <Input
          suffix="ATLAS"
          value={collateral}
          onChange={(event) => setCollateral(event.target.value)}
        />
        <p>Fee</p>
      </Modal>

      <Modal
        title="Before you can vote, you have to stake some JET tokens."
        visible={isStakeRedirectVisible}
        okText="I understand"
        onOk={handleOk}
        onCancel={() => setIsStakeRedirectModalVisible(false)}
      >
        <p>You gotta stake!</p>
      </Modal>
    </>
  );
};
