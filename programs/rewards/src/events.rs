use anchor_lang::prelude::*;

use crate::instructions::{AirdropCreateParams, AirdropRecipientParam};

#[event]
pub struct AirdropCreated {
    pub airdrop: Pubkey,
    pub token_mint: Pubkey,
    pub params: AirdropCreateParams,
}

#[event]
pub struct AirdropRecipientsAdded {
    pub airdrop: Pubkey,
    pub reward_additional: u64,
    pub reward_total: u64,
    pub recipients_additional: u64,
    pub recipients_total: u64,
    pub recipients: Vec<AirdropRecipientParam>,
}

#[event]
pub struct AirdropFinalized {
    pub airdrop: Pubkey,
    pub reward_total: u64,
    pub recipients_total: u64,
}

#[event]
pub struct AirdropClaimed {
    pub airdrop: Pubkey,
    pub recipient: Pubkey,
    pub claimed_amount: u64,
    pub remaining_amount: u64,
}

#[event]
pub struct AirdropClosed {
    pub airdrop: Pubkey,
}
