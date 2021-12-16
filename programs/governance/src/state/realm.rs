use anchor_lang::prelude::*;

#[account]
#[derive(Debug)]
pub struct Realm {
    // external account with permission to modify realm
    pub owner: Pubkey,

    // PDA that can sign on behalf of the realm
    pub authority: Pubkey,

    // PDA token account that stores governance tokens
    pub vault: Pubkey,
}
