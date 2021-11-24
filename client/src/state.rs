use anchor_client::{Program, solana_sdk::pubkey::Pubkey};
use anyhow::Result;
use jet_governance::state::{Proposal, Realm, VoteRecord, Voter};


pub fn get_realm(
    anchor_program: &Program,
    realm: Pubkey,
) -> Result<Realm> {
    Ok(anchor_program.account(realm)?)
}


pub fn get_voter(
    anchor_program: &Program,
    voter: Pubkey,
) -> Result<Voter> {
    Ok(anchor_program.account(voter)?)
}


pub fn get_proposal(
    anchor_program: &Program,
    proposal: Pubkey,
) -> Result<Proposal> {
    Ok(anchor_program.account(proposal)?)
}

pub fn get_vote_record(
    anchor_program: &Program,
    proposal: Pubkey,
) -> Result<VoteRecord> {
    Ok(anchor_program.account(proposal)?)
}
