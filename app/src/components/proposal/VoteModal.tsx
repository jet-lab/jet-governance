import { useState, useEffect } from "react";
import { Button, Input, Modal } from "antd";
import { useUser } from "../../hooks/useClient";

export const VoteModal = (props: {
  vote: string;
  setIsVoteModalVisible: Function;
  isVoteModalVisible: boolean;
  setIsStakeRedirectModalVisible: Function;
  isStakeRedirectModalVisible: boolean;
  proposalNumber: number;
  endDate: Date;
}) => {
  const [voteType, setVoteType] = useState("")
  const { stakedBalance } = useUser()


  const {
    vote,
    setIsVoteModalVisible,
    isVoteModalVisible,
    setIsStakeRedirectModalVisible,
    isStakeRedirectModalVisible,
    proposalNumber,
    endDate} = props;
  
  useEffect(() => {
    if (vote === "inFavor") {
      setVoteType("in favor of")
    } else if (vote === "against") {
      setVoteType("against")
    } else if (vote === "abstain") {
      setVoteType("to abstain from")
    }
  }, [vote])
    
  
  // Handlers for vote modal
  const confirmVote = () => {
    setIsVoteModalVisible(false);
  };


  // Handlers for stake redirect modal
  const handleOk = () => {
    setIsStakeRedirectModalVisible(false);
  };

  return (
    <>
      <Modal
        title={`You are about to vote ${voteType} proposal #${proposalNumber}`}
        visible={isVoteModalVisible}
        okText="Confirm vote"
        onOk={confirmVote}
        onCancel={() => setIsVoteModalVisible(false)}
        closable={false}
      >
        <p>You have {stakedBalance} JET staked, and will be able to unstake these funds when voting ends on {endDate.toLocaleDateString()}.</p>
      </Modal>

      <Modal
        title="Before you can vote, you have to stake some JET tokens."
        visible={isStakeRedirectModalVisible}
        okText="I understand"
        onOk={handleOk}
        cancelButtonProps={{ style: { display: "none " } }}
      >
        <p>You gotta stake!</p>
      </Modal>
    </>
  );
};
