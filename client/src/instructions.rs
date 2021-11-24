use anchor_client::{Program, solana_sdk::{pubkey::Pubkey, signature::Keypair, signer::Signer, system_program, sysvar::rent}};
use anyhow::Result;
use jet_governance::{instructions::{InitRealmBumpSeeds, Time}, state::{ProposalEvent, Vote2}};


pub fn init_realm(
    anchor_program: &Program,
    owner: Pubkey,
    governance_token_mint: Pubkey,
) -> Result<Pubkey> {
    let realm_acct = Keypair::new();
    let (authority, authority_bump) = Pubkey::find_program_address(
        &[b"realm-authority", &realm_acct.pubkey().to_bytes()],
        &anchor_program.id()
    );
    let (vault, vault_bump) = Pubkey::find_program_address(
        &[b"vault", &realm_acct.pubkey().to_bytes()],
        &anchor_program.id()
    );
    anchor_program
        .request()
        .accounts(jet_governance::accounts::InitRealm {
            realm: realm_acct.pubkey(),
            owner,
            authority,
            vault,
            governance_token_mint,
            token_program: spl_token::id(),
            system_program: system_program::id(),
            rent: rent::id(),
        })
        .args(jet_governance::instruction::InitRealm {
            _bump: InitRealmBumpSeeds {
                authority: authority_bump,
                vault: vault_bump,
            }
        })
        .signer(&realm_acct)
        .send()?;
    Ok(realm_acct.pubkey())
}


pub fn init_voter(
    anchor_program: &Program,
    realm: Pubkey,
    owner: &dyn Signer,
) -> Result<Pubkey> {
    let (voter, voter_bump) = Pubkey::find_program_address(
        &[b"voter", &owner.pubkey().to_bytes(), &realm.to_bytes()],
        &anchor_program.id()
    );
    anchor_program
        .request()
        .accounts(jet_governance::accounts::InitVoter {
            realm,
            owner: owner.pubkey(),
            voter,
            system_program: system_program::id(),
        })
        .args(jet_governance::instruction::InitVoter {
            _bump: voter_bump
        })
        .signer(owner)
        .send()?;
    Ok(voter)
}


pub fn deposit(
    anchor_program: &Program,
    realm: Pubkey,
    owner: &dyn Signer,
    token_account: Pubkey,
    amount: u64,
) -> Result<()> {
    let voter = Pubkey::find_program_address(
        &[b"voter", &owner.pubkey().to_bytes(), &realm.to_bytes()],
        &anchor_program.id()
    ).0;
    let vault = Pubkey::find_program_address(
        &[b"vault", &realm.to_bytes()],
        &anchor_program.id()
    ).0;
    anchor_program
        .request()
        .accounts(jet_governance::accounts::Deposit {
            realm,
            owner: owner.pubkey(),
            voter,
            vault,
            token_account,
            token_program: spl_token::id(),
        })
        .args(jet_governance::instruction::Deposit {
            amount
        })
        .signer(owner)
        .send()?;
    Ok(())
}


pub fn withdraw(
    anchor_program: &Program,
    realm: Pubkey,
    owner: &dyn Signer,
    token_account: Pubkey,
    amount: u64,
) -> Result<()> {
    let voter = Pubkey::find_program_address(
        &[b"voter", &owner.pubkey().to_bytes(), &realm.to_bytes()],
        &anchor_program.id()
    ).0;
    let vault = Pubkey::find_program_address(
        &[b"vault", &realm.to_bytes()],
        &anchor_program.id()
    ).0;
    let (authority, bump) = Pubkey::find_program_address(
        &[b"realm-authority", &realm.to_bytes()],
        &anchor_program.id()
    );
    anchor_program
        .request()
        .accounts(jet_governance::accounts::Withdraw {
            realm,
            owner: owner.pubkey(),
            voter,
            vault,
            authority,
            token_account,
            token_program: spl_token::id(),
        })
        .args(jet_governance::instruction::Withdraw {
            bump,
            amount
        })
        .signer(owner)
        .send()?;
    Ok(())
}


pub fn propose(
    anchor_program: &Program,
    realm: Pubkey,
    owner: &dyn Signer,
    name: &str,
    description: &str,
    activate: Time,
    finalize: Time,
) -> Result<Pubkey> {
    let proposal_account = Keypair::new();
    anchor_program
        .request()
        .accounts(jet_governance::accounts::Propose {
            realm,
            owner: owner.pubkey(),
            proposal: proposal_account.pubkey(),
            system_program: system_program::id(),
        })
        .args(jet_governance::instruction::Propose {
            name: name.to_string(),
            description: description.to_string(),
            activate,
            finalize,
        })
        .signer(owner)
        .signer(&proposal_account)
        .send()?;
    Ok(proposal_account.pubkey())
}


pub fn vote(
    anchor_program: &Program,
    realm: Pubkey,
    owner: &dyn Signer,
    proposal: Pubkey,
    vote: Vote2,
) -> Result<Pubkey> {
    let voter = Pubkey::find_program_address(
        &[b"voter", &owner.pubkey().to_bytes(), &realm.to_bytes()],
        &anchor_program.id()
    ).0;
    let (vote_record, vote_record_bump) = Pubkey::find_program_address(
        &[b"vote-record", &voter.to_bytes(), &proposal.to_bytes()],
        &anchor_program.id()
    );
    anchor_program
        .request()
        .accounts(jet_governance::accounts::VoteAccounts {
            realm,
            owner: owner.pubkey(),
            voter,
            proposal,
            vote_record,
            system_program: system_program::id(),
        })
        .args(jet_governance::instruction::Vote {
            vote,
            _bump: vote_record_bump,
        })
        .signer(owner)
        .send()?;
    Ok(vote_record)
}


pub fn change_vote(
    anchor_program: &Program,
    realm: Pubkey,
    owner: &dyn Signer,
    proposal: Pubkey,
    vote: Vote2,
) -> Result<Pubkey> {
    let voter = Pubkey::find_program_address(
        &[b"voter", &owner.pubkey().to_bytes(), &realm.to_bytes()],
        &anchor_program.id()
    ).0;
    let vote_record = Pubkey::find_program_address(
        &[b"vote-record", &voter.to_bytes(), &proposal.to_bytes()],
        &anchor_program.id()
    ).0;
    anchor_program
        .request()
        .accounts(jet_governance::accounts::ChangeVote {
            realm,
            owner: owner.pubkey(),
            voter,
            proposal,
            vote_record,
        })
        .args(jet_governance::instruction::ChangeVote {
            vote,
        })
        .signer(owner)
        .send()?;
    Ok(vote_record)
}


pub fn rescind(
    anchor_program: &Program,
    realm: Pubkey,
    owner: &dyn Signer,
    proposal: Pubkey,
) -> Result<Pubkey> {
    let voter = Pubkey::find_program_address(
        &[b"voter", &owner.pubkey().to_bytes(), &realm.to_bytes()],
        &anchor_program.id()
    ).0;
    let vote_record = Pubkey::find_program_address(
        &[b"vote-record", &voter.to_bytes(), &proposal.to_bytes()],
        &anchor_program.id()
    ).0;
    anchor_program
        .request()
        .accounts(jet_governance::accounts::Rescind {
            realm,
            owner: owner.pubkey(),
            voter,
            proposal,
            vote_record,
        })
        .args(jet_governance::instruction::Rescind { })
        .signer(owner)
        .send()?;
    Ok(vote_record)
}



pub fn transition_proposal(
    anchor_program: &Program,
    realm: Pubkey,
    owner: &dyn Signer,
    proposal: Pubkey,
    event: ProposalEvent,
    when: Time,
) -> Result<Pubkey> {
    let voter = Pubkey::find_program_address(
        &[b"voter", &owner.pubkey().to_bytes(), &realm.to_bytes()],
        &anchor_program.id()
    ).0;
    let vote_record = Pubkey::find_program_address(
        &[b"vote-record", &voter.to_bytes(), &proposal.to_bytes()],
        &anchor_program.id()
    ).0;
    anchor_program
        .request()
        .accounts(jet_governance::accounts::TransitionProposal {
            realm,
            owner: owner.pubkey(),
            voter,
            proposal,
        })
        .args(jet_governance::instruction::TransitionProposal { 
            event,
            when,
        })
        .signer(owner)
        .send()?;
    Ok(vote_record)
}
