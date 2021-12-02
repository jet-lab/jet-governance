mod token;
mod solana;
mod helper;


/// tests the actual program - requires a running cluster with program deployed
#[cfg(test)]
mod tests {
    use anchor_client::{solana_sdk::pubkey::Pubkey};
    use anyhow::Result;
    use jet_governance::{instructions::Time, state::Vote2};
    use jet_governance_client::{instructions, state};

    use crate::helper::{TestClient, TestRealm, now};

    use super::*;

    #[test]
    fn test_init_realm() -> Result<()> {
        let client = TestClient::new();
        let mint = token::initialize_mint(&client.paying_client)?;
        let realm_pubkey = instructions::init_realm(
            &client.anchor_program,
            client.payer.pubkey(),
            mint,
        )?;
        let realm = state::get_realm(&client.anchor_program, realm_pubkey)?;
        let expected_authority = Pubkey::find_program_address(
            &[b"realm-authority", &realm_pubkey.to_bytes()],
            &client.anchor_program.id()
        ).0;
        let expected_vault = Pubkey::find_program_address(
            &[b"vault", &realm_pubkey.to_bytes()],
            &client.anchor_program.id()
        ).0;

        assert_eq!(client.payer.pubkey(), realm.owner);
        assert_eq!(expected_authority, realm.authority);
        assert_eq!(expected_vault, realm.vault);

        Ok(())
    }

    #[test]
    fn test_init_voter() -> Result<()> {
        let client = TestClient::new();
        let mint = token::initialize_mint(&client.paying_client)?;
        let realm = instructions::init_realm(
            &client.anchor_program,
            client.payer.pubkey(),
            mint,
        )?;
        let voter_pubkey = instructions::init_voter(
            &client.anchor_program,
            realm,
            client.payer.as_ref(),
        )?;
        let voter = state::get_voter(&client.anchor_program, voter_pubkey)?;

        assert_eq!(client.payer.pubkey(), voter.owner);
        assert_eq!(realm, voter.realm);
        assert_eq!(0, voter.deposited);
        assert_eq!(0, voter.active_votes);
        
        Ok(())
    }

    #[test]
    fn test_deposit() -> Result<()> {
        let client = TestClient::new();
        let mint = token::initialize_mint(&client.paying_client)?;
        let token_account = token::create_account(
            &client.paying_client,
            &mint,
            &client.payer.pubkey()
        )?;
        token::mint_to(&client.paying_client, mint, token_account, 100)?;
        let realm_pubkey = instructions::init_realm(
            &client.anchor_program,
            client.payer.pubkey(),
            mint,
        )?;
        let voter_pubkey = instructions::init_voter(
            &client.anchor_program,
            realm_pubkey,
            client.payer.as_ref(),
        )?;
        instructions::deposit(
            &client.anchor_program,
            realm_pubkey,
            client.payer.as_ref(),
            token_account,
            80,
        )?;

        let voter = state::get_voter(&client.anchor_program, voter_pubkey)?;
        
        assert_eq!(client.payer.pubkey(), voter.owner);
        assert_eq!(realm_pubkey, voter.realm);
        assert_eq!(80, voter.deposited);
        assert_eq!(0, voter.active_votes);

        Ok(())
    }

    #[test]
    fn test_full_workflow_one_voter() -> Result<()> {
        let client = TestClient::new();
        let realm = TestRealm::new(&client)?;

        // voter
        let test_voter = realm.new_voter(client.payer.as_ref())?;
        test_voter.mint(100)?;
        test_voter.deposit(80)?;
        let voter = test_voter.state()?;
        assert_eq!(80, voter.deposited);
        
        // proposal
        let test_proposal = realm.new_proposal(
            client.payer.as_ref(),
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
        test_proposal.finalize(client.payer.as_ref(), Time::Now)?;
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
