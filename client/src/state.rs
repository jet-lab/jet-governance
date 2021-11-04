use anchor_client::{Program, solana_sdk::pubkey::Pubkey};
use anyhow::Result;
use jet_governance::state::Realm;


pub fn get_realm(
    anchor_program: &Program,
    realm: Pubkey,
) -> Result<Realm> {
    Ok(anchor_program.account(realm)?)
}
