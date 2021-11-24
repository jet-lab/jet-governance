mod token;
mod solana;


/// tests the actual program - requires a running cluster with program deployed
#[cfg(test)]
mod tests {
    use std::{convert::TryInto, rc::Rc, time::{SystemTime, UNIX_EPOCH}};

    use anchor_client::{Program, solana_sdk::pubkey::Pubkey};
    use anyhow::Result;
    use jet_governance::{instructions::Time, state::{ProposalEvent, Vote2}};
    use jet_governance_client::{instructions, load, state};
    use solana_sdk::{commitment_config::CommitmentLevel, signer::Signer};

    use crate::solana::PayingClient;

    use super::*;

    struct TestClient {
        payer: Rc<dyn Signer>,
        anchor_program: Program,
        paying_client: PayingClient,
    }

    fn test_client() -> TestClient {
        let payer = load::wallet("~/.config/solana/id.json");
        let anchor_program = load::program(payer.clone(), CommitmentLevel::Confirmed);
        let paying_client = PayingClient {
            rpc_client: Rc::new(anchor_program.rpc()),
            payer: payer.clone(),
        };
        TestClient {
            payer,
            anchor_program,
            paying_client,
        }
    }

    #[test]
    fn test_init_realm() -> Result<()> {
        let client = test_client();
        let mint = token::initialize_mint(&client.paying_client)?;
        solana::finalize(&client.paying_client)?;
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
        let client = test_client();
        let mint = token::initialize_mint(&client.paying_client)?;
        solana::finalize(&client.paying_client)?;
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
        let client = test_client();
        let mint = token::initialize_mint(&client.paying_client)?;
        let token_account = token::create_account(
            &client.paying_client,
            &mint,
            &client.payer.pubkey()
        )?;
        token::mint_to(&client.paying_client, mint, token_account, 100)?;
        solana::finalize(&client.paying_client)?;
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
        let client = test_client();
        let mint = token::initialize_mint(&client.paying_client)?;
        
        // create voter
        println!("Creating voter");
        let token_account = token::create_account(
            &client.paying_client,
            &mint,
            &client.payer.pubkey()
        )?;
        token::mint_to(&client.paying_client, mint, token_account, 100)?;
        // solana::finalize(&client.paying_client)?;
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
        let voter = state::get_voter(&client.anchor_program, voter_pubkey)?;
        
        assert_eq!(client.payer.pubkey(), voter.owner);
        assert_eq!(realm_pubkey, voter.realm);
        assert_eq!(0, voter.deposited);
        assert_eq!(0, voter.active_votes);
        ////////////

        // deposit
        println!("Deposit");
        instructions::deposit(
            &client.anchor_program,
            realm_pubkey,
            client.payer.as_ref(),
            token_account,
            80,
        )?;
        let voter = state::get_voter(&client.anchor_program, voter_pubkey)?;
        
        assert_eq!(80, voter.deposited);
        ////////////
        
        // create proposal
        println!("Creating proposal");
        let proposal_pubkey = instructions::propose(
            &client.anchor_program,
            realm_pubkey,
            client.payer.as_ref(),
            "Hello world",
            "This proposal says hello",
            Time::Now,
            Time::Never,
        )?;
        let proposal = state::get_proposal(&client.anchor_program, proposal_pubkey)?;
        let current_timestamp: i64 = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
            .try_into()
            .unwrap();
        
        assert_eq!(client.payer.pubkey(), proposal.owner);
        assert_eq!(realm_pubkey, proposal.realm);
        assert_eq!("Hello world", proposal.content().name);
        assert_eq!("This proposal says hello", proposal.content().description);
        assert_eq!(true, proposal.lifecycle.activated(current_timestamp));
        assert_eq!(false, proposal.lifecycle.finalized(current_timestamp));
        assert_eq!(0, proposal.vote().yes());
        assert_eq!(0, proposal.vote().no());
        assert_eq!(0, proposal.vote().abstain());
        ////////////
        
        // vote
        println!("Voting");
        let _vote_record_pubkey = instructions::vote(
            &client.anchor_program,
            realm_pubkey,
            client.payer.as_ref(),
            proposal_pubkey,
            Vote2::Yes,
        )?;

        let proposal = state::get_proposal(&client.anchor_program, proposal_pubkey)?;
        assert_eq!(80, proposal.vote().yes());
        assert_eq!(0, proposal.vote().no());
        assert_eq!(0, proposal.vote().abstain());
        let voter = state::get_voter(&client.anchor_program, voter_pubkey)?;
        assert_eq!(1, voter.active_votes);
        ////////////
        
        // change vote
        println!("Changing vote");
        let _vote_record_pubkey = instructions::change_vote(
            &client.anchor_program,
            realm_pubkey,
            client.payer.as_ref(),
            proposal_pubkey,
            Vote2::No,
        )?;

        let proposal = state::get_proposal(&client.anchor_program, proposal_pubkey)?;
        assert_eq!(0, proposal.vote().yes());
        assert_eq!(80, proposal.vote().no());
        assert_eq!(0, proposal.vote().abstain());
        let voter = state::get_voter(&client.anchor_program, voter_pubkey)?;
        assert_eq!(1, voter.active_votes);
        ////////////
        
        // rescind vote
        println!("Rescinding vote");
        let _vote_record_pubkey = instructions::rescind(
            &client.anchor_program,
            realm_pubkey,
            client.payer.as_ref(),
            proposal_pubkey,
        )?;

        let proposal = state::get_proposal(&client.anchor_program, proposal_pubkey)?;
        assert_eq!(0, proposal.vote().yes());
        assert_eq!(0, proposal.vote().no());
        assert_eq!(0, proposal.vote().abstain());
        let voter = state::get_voter(&client.anchor_program, voter_pubkey)?;
        assert_eq!(0, voter.active_votes);
        ////////////
        
        // withdraw
        println!("Withdrawing tokens");
        instructions::withdraw(
            &client.anchor_program,
            realm_pubkey,
            client.payer.as_ref(),
            token_account,
            30,
        )?;
        let voter = state::get_voter(&client.anchor_program, voter_pubkey)?;
        assert_eq!(50, voter.deposited);
        ////////////
        
        // re-vote
        println!("Voting again");
        let _vote_record_pubkey = instructions::vote(
            &client.anchor_program,
            realm_pubkey,
            client.payer.as_ref(),
            proposal_pubkey,
            Vote2::Abstain,
        )?;

        let proposal = state::get_proposal(&client.anchor_program, proposal_pubkey)?;
        assert_eq!(0, proposal.vote().yes());
        assert_eq!(0, proposal.vote().no());
        assert_eq!(50, proposal.vote().abstain());
        let voter = state::get_voter(&client.anchor_program, voter_pubkey)?;
        assert_eq!(1, voter.active_votes);
        ////////////
        
        // finalize
        println!("Finalizing proposal");
        let _vote_record_pubkey = instructions::transition_proposal(
            &client.anchor_program,
            realm_pubkey,
            client.payer.as_ref(),
            proposal_pubkey,
            ProposalEvent::Finalize,
            Time::Now,
        )?;
        let current_timestamp: i64 = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
            .try_into()
            .unwrap();

        let proposal = state::get_proposal(&client.anchor_program, proposal_pubkey)?;
        assert_eq!(true, proposal.lifecycle.activated(current_timestamp));
        assert_eq!(true, proposal.lifecycle.finalized(current_timestamp));
        assert_eq!(0, proposal.vote().yes());
        assert_eq!(0, proposal.vote().no());
        assert_eq!(50, proposal.vote().abstain());

        Ok(())
    }
}
