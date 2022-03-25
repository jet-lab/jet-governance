use anchor_lang::prelude::*;

#[event]
pub struct CreateAuthAccount {
    pub user: Pubkey,
}

#[event]
pub struct Authenticate {
    pub user: Pubkey,
}
