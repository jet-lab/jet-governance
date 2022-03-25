use anchor_lang::prelude::*;

#[event]
pub struct CreateAuthAccount {
    user: Pubkey
}

#[event]
pub struct Authenticate {
    user: Pubkey
}
