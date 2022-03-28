use anchor_lang::prelude::*;

#[event]
pub struct InitPoolEvent {
    pub payer: Pubkey,
    pub authority: Pubkey,
    pub stake_pool: Pubkey,
    pub stake_pool_vote_mint: Pubkey,
    pub stake_pool_collateral_mint: Pubkey,
    pub stake_pool_vault: Pubkey,
    pub unbond_period_config: i64, 
    pub token_mint: Pubkey,
}

#[event]
pub struct InitStakeAccountEvent {
    pub auth: Pubkey,
    pub stake_pool: Pubkey,
    pub stake_account: Pubkey,
    pub owner: Pubkey,
}


#[event]
pub struct AddStakeEvent {
    pub stake_pool: Pubkey,
    pub amount: u64, 
    pub payer: Pubkey,

    // Stake Pool Amounts
    pub bonded_pool_tokens: u64,
    pub unbonding_pool_tokens: u64,
    pub vault_pool_amount: u64,

    // Stake Account Amounts
    pub bonded_owner_shares: u64, 
    pub minted_owner_votes: u64, 
    pub minted_owner_collateral: u64, 
    pub unbonding_owner_shares: u64

    // pub stake_account: Pubkey,
    // pub stake_pool_vault: Pubkey,
    // pub payer_token_account: Pubkey,
}

#[event]
pub struct UnbondStakeEvent {
    pub owner: Pubkey, 
    // pub stake_account: Pubkey, 
    pub stake_pool: Pubkey, 
    // pub stake_pool_vault: Pubkey, 
    // pub unbonding_account: Pubkey, 
    pub amount_unbonded: Option<u64>,

    // Stake Pool Amounts
    pub bonded_pool_tokens: u64,
    pub unbonding_pool_tokens: u64,
    pub vault_pool_amount: u64,

    // Stake Account Amounts
    pub bonded_owner_shares: u64, 
    pub minted_owner_votes: u64, 
    pub minted_owner_collateral: u64, 
    pub unbonding_owner_shares: u64
}

#[event]
pub struct CancelUnbondEvent {
    pub owner: Pubkey,
    pub stake_pool: Pubkey,

    // Stake Pool Amounts
    pub bonded_pool_tokens: u64,
    pub unbonding_pool_tokens: u64,
    pub vault_pool_amount: u64,

    // Stake Account Amounts
    pub bonded_owner_shares: u64, 
    pub minted_owner_votes: u64, 
    pub minted_owner_collateral: u64, 
    pub unbonding_owner_shares: u64
}

#[event]
pub struct WithdrawUnbondedEvent {
    pub owner: Pubkey,
    pub token_receiver: Pubkey,
    pub stake_pool: Pubkey,

    // Stake Pool Amounts
    pub bonded_pool_tokens: u64,
    pub unbonding_pool_tokens: u64,
    pub vault_pool_amount: u64,

    // Stake Account Amounts
    pub bonded_owner_shares: u64, 
    pub minted_owner_votes: u64, 
    pub minted_owner_collateral: u64, 
    pub unbonding_owner_shares: u64
}

#[event]
pub struct WithdrawBondedEvent {
    pub stake_pool: Pubkey,
    pub token_receiver: Pubkey,
    pub amount: u64, 

    // Stake Pool Amounts
    pub bonded_pool_tokens: u64,
    pub unbonding_pool_tokens: u64,
    pub vault_pool_amount: u64,
}

#[event]
pub struct MintVotesEvent {
    pub owner: Pubkey, 
    pub stake_pool: Pubkey, 
    pub governance_realm: Pubkey, 
    pub governance_vault: Pubkey, 
    pub votes_minted: u64,
}

#[event]
pub struct BurnVotesEvent {
    pub owner: Pubkey,
    pub stake_pool: Pubkey,
    pub vote_amount: u64,

}

#[event]
pub struct CloseStakeAccountEvent {
    pub owner: Pubkey,
    pub stake_account: Pubkey
}







