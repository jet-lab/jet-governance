/// Purpose: Make test code as terse and declarative as possible.
/// It's OK if this code is a little bit spaghetti, as long as 
/// it makes the tests themselves simpler.
use std::{convert::TryInto, rc::Rc, time::{SystemTime, UNIX_EPOCH}};

use anchor_client::{Program, solana_sdk::pubkey::Pubkey};
use anyhow::Result;
use jet_governance::{instructions::Time, state::{Proposal, ProposalEvent, Realm, Vote2, Voter}};
use jet_governance_client::{instructions, load, state};
use solana_sdk::{clock::UnixTimestamp, commitment_config::CommitmentLevel, signer::Signer};

use crate::{solana::PayingClient, token};


pub struct TestClient {
    pub payer: Rc<dyn Signer>,
    pub anchor_program: Program,
    pub paying_client: PayingClient,
}

impl TestClient {
    pub fn new() -> TestClient {
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
}


pub struct TestRealm<'a> {
    pub client: &'a TestClient,
    pub key: Pubkey,
    pub mint: Pubkey,
}


// impl TestVoter {
//     pub fn get(&self, client: &TestClient) -> Result<Voter> {
//         state::get_voter(&client.anchor_program, self.key)
//     }
// }

impl<'a> TestRealm<'a> {
    pub fn new(client: &'a TestClient) -> Result<Self> {
        println!("Initializing mint");
        let mint = token::initialize_mint(&client.paying_client)?;
        println!("Initializing realm");
        let realm = instructions::init_realm(
            &client.anchor_program,
            client.payer.pubkey(),
            mint,
        )?;
        Ok(TestRealm {
            client,
            key: realm,
            mint,
        })
    }

    pub fn new_voter(&'a self, owner: &'a dyn Signer) -> Result<TestVoter<'a>> {
        println!("Creating voter");
        let token_account = token::create_account(
            &self.client.paying_client,
            &self.mint,
            &owner.pubkey()
        )?;
        let voter_pubkey = instructions::init_voter(
            &self.client.anchor_program,
            self.key,
            owner,
        )?;
        let test_voter = TestVoter {
            client: self.client,
            realm: self,
            owner,
            key: voter_pubkey,
            token: token_account,
        };
        let voter = test_voter.state()?;
        assert_eq!(self.client.payer.pubkey(), voter.owner);
        assert_eq!(self.key, voter.realm);
        assert_eq!(0, voter.deposited);
        assert_eq!(0, voter.active_votes);
        Ok(test_voter)
    }

    /// does not validate lifecycle
    pub fn new_proposal(
        &self,
        owner: &dyn Signer,
        name: &str,
        description: &str,
        activate: Time,
        finalize: Time,
    ) -> Result<TestProposal> {
        println!("Creating proposal");
        let key = instructions::propose(
            &self.client.anchor_program,
            self.key,
            owner,
            name,
            description,
            activate,
            finalize,
        )?;
        let test_proposal = TestProposal {
            client: self.client,
            realm: self,
            owner: owner.pubkey(),
            key,
        };
        let proposal = test_proposal.state()?;
        assert_eq!(self.client.payer.pubkey(), proposal.owner);
        assert_eq!(self.key, proposal.realm);
        assert_eq!(name, proposal.content().name);
        assert_eq!(description, proposal.content().description);
        assert_eq!(0, proposal.vote().yes());
        assert_eq!(0, proposal.vote().no());
        assert_eq!(0, proposal.vote().abstain());
        Ok(test_proposal)
    }

    pub fn state(&self) -> Result<Realm> {
        state::get_realm(&self.client.anchor_program, self.key)
    }
}


#[derive(Clone, Copy)]
pub struct TestVoter<'a> {
    pub client: &'a TestClient,
    pub realm: &'a TestRealm<'a>,
    pub owner: &'a dyn Signer,
    pub key: Pubkey,
    pub token: Pubkey,
}

impl<'a> TestVoter<'a> {
    pub fn mint(&self, amount: u64) -> Result<()> {
        token::mint_to(&self.client.paying_client, self.realm.mint, self.token, amount)
    }

    pub fn state(&self) -> Result<Voter> {
        state::get_voter(&self.client.anchor_program, self.key)
    }

    pub fn deposit(&self, amount: u64) -> Result<()> {
        println!("Depositing");
        instructions::deposit(
            &self.client.anchor_program,
            self.realm.key,
            self.owner,
            self.token,
            amount,
        )
    }

    pub fn withdraw(&self, amount: u64) -> Result<()> {
        println!("Withdrawing");
        instructions::withdraw(
            &self.client.anchor_program,
            self.realm.key,
            self.owner,
            self.token,
            amount,
        )
    }

    pub fn vote(&self, proposal: TestProposal, vote: Vote2) -> Result<Pubkey> {
        println!("Voting");
        instructions::vote(
            &self.client.anchor_program,
            self.realm.key,
            self.owner,
            proposal.key,
            vote,
        )
    }

    pub fn change_vote(&self, proposal: TestProposal, vote: Vote2) -> Result<Pubkey> {
        println!("Changing vote");
        instructions::change_vote(
            &self.client.anchor_program,
            self.realm.key,
            self.owner,
            proposal.key,
            vote,
        )
    }

    pub fn rescind(&self, proposal: TestProposal) -> Result<Pubkey> {
        println!("Rescinding");
        instructions::rescind(
            &self.client.anchor_program,
            self.realm.key,
            self.owner,
            proposal.key,
        )
    }
}


#[derive(Clone, Copy)]
pub struct TestProposal<'a> {
    pub client: &'a TestClient,
    pub realm: &'a TestRealm<'a>,
    pub owner: Pubkey,
    pub key: Pubkey,
}

impl<'a> TestProposal<'a> {
    pub fn state(&self) -> Result<Proposal> {
        state::get_proposal(&self.client.anchor_program, self.key)
    }

    pub fn finalize(&self, owner: &dyn Signer, when: Time) -> Result<()> {
        println!("Finalizing");
        self.transition(owner, ProposalEvent::Finalize, when)
    }

    pub fn transition(&self, owner: &dyn Signer, event: ProposalEvent, when: Time) -> Result<()> {
        instructions::transition_proposal(
            &self.client.anchor_program,
            self.realm.key,
            owner,
            self.key,
            event,
            when,
        )
    }
}


pub fn now() -> UnixTimestamp {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
        .try_into()
        .unwrap()
}