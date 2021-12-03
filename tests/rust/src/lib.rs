mod token;
mod solana;
mod helper;


/// tests the actual program - requires a running cluster with program deployed
#[cfg(test)]
mod tests {
    use anchor_client::{solana_sdk::pubkey::Pubkey};
    use anyhow::Result;
    use jet_governance::{instructions::Time, state::Vote2};
    use jet_governance_client::instructions;
    use solana_sdk::{signature::Keypair, signer::Signer};

    use crate::helper::{TestClient, TestRealm, now};
    
    #[test]
    fn init_realm_should_create_realm_account_with_correct_data() -> Result<()> {
        let client = TestClient::new();
        let test_realm = TestRealm::new(&client)?;
        let expected_authority = Pubkey::find_program_address(
            &[b"realm-authority", &test_realm.key.to_bytes()],
            &client.anchor_program.id()
        ).0;
        let expected_vault = Pubkey::find_program_address(
            &[b"vault", &test_realm.key.to_bytes()],
            &client.anchor_program.id()
        ).0;

        let realm = test_realm.state()?;
        assert_eq!(client.payer.pubkey(), realm.owner);
        assert_eq!(expected_authority, realm.authority);
        assert_eq!(expected_vault, realm.vault);

        Ok(())
    }

    #[test]
    fn init_voter_should_create_voter_account_with_correct_data() -> Result<()> {
        let client = TestClient::new();
        let realm = TestRealm::new(&client)?;
        let voter = realm.init_voter(client.payer.as_ref())?.state()?;

        assert_eq!(client.payer.pubkey(), voter.owner);
        assert_eq!(realm.key, voter.realm);
        assert_eq!(0, voter.deposited);
        assert_eq!(0, voter.active_votes);
        
        Ok(())
    }

    #[test]
    fn deposit_token_should_increment_voter_deposited_amount() -> Result<()> {
        let client = TestClient::new();
        let realm = TestRealm::new(&client)?;
        let test_voter = realm.init_voter(client.payer.as_ref())?;
        test_voter.mint(100)?;
        test_voter.deposit(80)?;
        let voter = test_voter.state()?;

        assert_eq!(client.payer.pubkey(), voter.owner);
        assert_eq!(realm.key, voter.realm);
        assert_eq!(80, voter.deposited);
        assert_eq!(0, voter.active_votes);

        Ok(())
    }

    #[test]
    fn only_realm_owner_may_propose() -> Result<()> {
        let client = TestClient::new();
        let realm_owner = Keypair::new();
        let realm = TestRealm::new_custom_owner(&client, realm_owner.pubkey())?;
        let proposer = realm.init_voter(&realm_owner)?;
        proposer.init_proposal(
            "hello world",
            "this proposal says hello",
            Time::Now,
            Time::Never,
        )?;

        let voter_signer = Keypair::new();
        let voter = realm.init_voter(&voter_signer)?;
        let result = voter.init_proposal(
            "hello world 2",
            "this proposal says hello too",
            Time::Now,
            Time::Never,
        );
        assert_eq!(true, result.is_err());
        
        Ok(())
    }

    #[test]
    fn only_proposal_owner_may_edit() -> Result<()> {
        let client = TestClient::new();
        let realm_owner = Keypair::new();
        let realm = TestRealm::new_custom_owner(&client, realm_owner.pubkey())?;
        let proposer = realm.init_voter(&realm_owner)?;
        let proposal = proposer.init_proposal(
            "draft",
            "this is a draft",
            Time::Never,
            Time::Never,
        )?;
        proposal.edit("hello", "hello world")?;

        let voter_signer = Keypair::new();
        realm.init_voter(&voter_signer)?;
        instructions::edit_proposal(
            &proposal.client.anchor_program,
            proposal.key,
            proposal.realm.key,
            &voter_signer,
            "bad",
            "do something evil",
        ).unwrap_err();

        let proposal = proposal.state()?;
        assert_eq!("hello", proposal.content().name);
        assert_eq!("hello world", proposal.content().description);
        
        Ok(())
    }

    #[test]
    fn activated_proposal_cannot_be_edited_or_retransitioned() -> Result<()> {
        let client = TestClient::new();
        let realm_owner = Keypair::new();
        let realm = TestRealm::new_custom_owner(&client, realm_owner.pubkey())?;
        let proposer = realm.init_voter(&realm_owner)?;
        let proposal = proposer.init_proposal(
            "draft",
            "this is a draft",
            Time::Never,
            Time::Never,
        )?;
        proposal.edit("hello", "hello world")?;
        proposal.activate(Time::Now)?;
        proposal.edit("oops", "too late").unwrap_err();
        proposal.activate(Time::Now).unwrap_err();
        proposal.finalize(Time::Now)?;
        proposal.edit("oops", "too late").unwrap_err();
        proposal.activate(Time::Now).unwrap_err();
        proposal.finalize(Time::Now).unwrap_err();

        let proposal = proposal.state()?;
        assert_eq!("hello", proposal.content().name);
        assert_eq!("hello world", proposal.content().description);
        
        Ok(())
    }

    #[test]
    fn early_finalized_proposal_cannot_be_edited_or_transitioned() -> Result<()> {
        let client = TestClient::new();
        let realm_owner = Keypair::new();
        let realm = TestRealm::new_custom_owner(&client, realm_owner.pubkey())?;
        let proposer = realm.init_voter(&realm_owner)?;
        let proposal = proposer.init_proposal(
            "draft",
            "this is a draft",
            Time::Never,
            Time::Never,
        )?;
        proposal.edit("hello", "hello world")?;
        proposal.finalize(Time::Now)?;
        proposal.edit("oops", "too late").unwrap_err();
        proposal.activate(Time::Now).unwrap_err();
        proposal.finalize(Time::Now).unwrap_err();

        let proposal = proposal.state()?;
        assert_eq!("hello", proposal.content().name);
        assert_eq!("hello world", proposal.content().description);
        
        Ok(())
    }

    #[test]
    fn voter_should_not_be_able_to_withdraw_with_active_votes() -> Result<()> {
        let client = TestClient::new();
        let realm_owner = Keypair::new();
        let realm = TestRealm::new_custom_owner(&client, realm_owner.pubkey())?;
        let proposer = realm.init_voter(&realm_owner)?;
        let proposal = proposer.init_proposal(
            "hello world",
            "this proposal says hello",
            Time::Now,
            Time::Never,
        )?;

        let voter_signer = Keypair::new();
        let voter = realm.init_voter(&voter_signer)?;
        voter.mint(100)?;
        voter.deposit(80)?;
        voter.vote(proposal, Vote2::Yes)?;
        
        voter.withdraw(1).unwrap_err();
        
        Ok(())
    }

    #[test]
    fn cannot_vote_on_inactive_proposal() -> Result<()> {
        let client = TestClient::new();
        let realm = TestRealm::new(&client)?;
        let proposer = realm.init_voter(client.payer.as_ref())?;
        let proposal = proposer.init_proposal(
            "hello world",
            "this proposal says hello",
            Time::Never,
            Time::Never,
        )?;

        let voter_signer = Keypair::new();
        let voter = realm.init_voter(&voter_signer)?;
        voter.mint(100)?;
        voter.deposit(60)?;
        voter.vote(proposal, Vote2::Yes).unwrap_err();
        
        proposal.activate(Time::Now)?;
        let voter_signer = Keypair::new();
        let voter = realm.init_voter(&voter_signer)?;
        voter.mint(100)?;
        voter.deposit(50)?;
        voter.vote(proposal, Vote2::No)?;

        proposal.finalize(Time::Now)?;
        let voter_signer = Keypair::new();
        let voter = realm.init_voter(&voter_signer)?;
        voter.mint(100)?;
        voter.deposit(40)?;
        voter.vote(proposal, Vote2::Abstain).unwrap_err();
        
        let proposal = proposal.state()?;
        assert_eq!(0, proposal.vote().yes());
        assert_eq!(50, proposal.vote().no());
        assert_eq!(0, proposal.vote().abstain());
        
        Ok(())
    }

    #[test]
    fn voter_should_not_be_able_to_withdraw_more_tokens_than_they_deposited() -> Result<()> {
        let client = TestClient::new();
        let realm = TestRealm::new(&client)?;

        let key = Keypair::new();
        let voter1 = realm.init_voter(&key)?;
        voter1.mint(100)?;
        voter1.deposit(80)?;
        
        let key = Keypair::new();
        let voter2 = realm.init_voter(&key)?;
        voter2.mint(100)?;
        voter2.deposit(40)?;
        
        voter2.withdraw(41).unwrap_err();

        let voter2 = voter2.state()?;
        assert_eq!(40, voter2.deposited);
        
        Ok(())
    }


    #[test]
    fn voter_should_not_be_able_to_incrementally_withdraw_more_tokens_than_they_deposited() -> Result<()> {
        let client = TestClient::new();
        let realm = TestRealm::new(&client)?;

        let key = Keypair::new();
        let voter1 = realm.init_voter(&key)?;
        voter1.mint(100)?;
        voter1.deposit(80)?;
        
        let key = Keypair::new();
        let voter2 = realm.init_voter(&key)?;
        voter2.mint(100)?;
        voter2.deposit(40)?;
        voter2.withdraw(40)?;
        
        voter2.withdraw(1).unwrap_err();

        let voter2 = voter2.state()?;
        assert_eq!(0, voter2.deposited);
        
        Ok(())
    }

    #[test]
    fn full_workflow_with_payer_as_voter() -> Result<()> {
        let client = TestClient::new();
        let realm = TestRealm::new(&client)?;

        // voter
        let test_voter = realm.init_voter(client.payer.as_ref())?;
        test_voter.mint(100)?;
        test_voter.deposit(80)?;
        let voter = test_voter.state()?;
        assert_eq!(80, voter.deposited);
        
        // proposal
        let test_proposal = test_voter.init_proposal(
            "Hello world",
            "This proposal says hello",
            Time::Now,
            Time::Never,
        )?;
        let proposal = test_proposal.state()?;
        let current_timestamp = now();
        assert_eq!(true, proposal.lifecycle.activated(current_timestamp));
        assert_eq!(false, proposal.lifecycle.finalized(current_timestamp));
        
        // vote
        test_voter.vote(test_proposal, Vote2::Yes)?;

        let proposal = test_proposal.state()?;
        assert_eq!(80, proposal.vote().yes());
        assert_eq!(0, proposal.vote().no());
        assert_eq!(0, proposal.vote().abstain());
        let voter = test_voter.state()?;
        assert_eq!(1, voter.active_votes);
        
        // change vote
        test_voter.change_vote(test_proposal, Vote2::No)?;

        let proposal = test_proposal.state()?;
        assert_eq!(0, proposal.vote().yes());
        assert_eq!(80, proposal.vote().no());
        assert_eq!(0, proposal.vote().abstain());
        let voter = test_voter.state()?;
        assert_eq!(1, voter.active_votes);
        
        // rescind vote
        test_voter.rescind(test_proposal)?;

        let proposal = test_proposal.state()?;
        assert_eq!(0, proposal.vote().yes());
        assert_eq!(0, proposal.vote().no());
        assert_eq!(0, proposal.vote().abstain());
        let voter = test_voter.state()?;
        assert_eq!(0, voter.active_votes);
        
        // withdraw
        test_voter.withdraw(30)?;
        let voter = test_voter.state()?;
        assert_eq!(50, voter.deposited);
        
        // re-vote
        test_voter.vote(test_proposal, Vote2::Abstain)?;

        let proposal = test_proposal.state()?;
        assert_eq!(0, proposal.vote().yes());
        assert_eq!(0, proposal.vote().no());
        assert_eq!(50, proposal.vote().abstain());
        let voter = test_voter.state()?;
        assert_eq!(1, voter.active_votes);
        
        // finalize
        test_proposal.finalize(Time::Now)?;
        let current_timestamp = now();

        let proposal = test_proposal.state()?;
        assert_eq!(true, proposal.lifecycle.activated(current_timestamp));
        assert_eq!(true, proposal.lifecycle.finalized(current_timestamp));
        assert_eq!(0, proposal.vote().yes());
        assert_eq!(0, proposal.vote().no());
        assert_eq!(50, proposal.vote().abstain());

        Ok(())
    }
}
