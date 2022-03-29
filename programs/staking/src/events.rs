use anchor_lang::prelude::*;

use crate::{
    instructions::PoolConfig,
    state::{FullAmount, SharedTokenPool, StakeAccount, StakePool},
};

#[event]
pub struct StakePoolCreated {
    pub stake_pool: Pubkey,
    pub authority: Pubkey,
    pub seed: String,
    pub token_mint: Pubkey,
    pub config: PoolConfig,
}

#[event]
pub struct StakeAccountCreated {
    pub stake_pool: Pubkey,
    pub stake_account: Pubkey,
    pub owner: Pubkey,
}

#[event]
pub struct StakeAdded {
    pub stake_pool: Pubkey,
    pub stake_account: Pubkey,
    pub owner: Pubkey,
    pub depositor: Pubkey,

    pub staked_amount: FullAmount,

    pub pool_note: StakePoolNote,
    pub account_note: StakeAccountNote,
}

#[event]
pub struct StakeUnbonded {
    pub stake_pool: Pubkey,
    pub stake_account: Pubkey,
    pub unbonding_account: Pubkey,
    pub owner: Pubkey,

    pub unbonded_amount: FullAmount,
    pub unbonded_at: i64,

    pub pool_note: StakePoolNote,
    pub account_note: StakeAccountNote,
}

#[event]
pub struct UnbondCancelled {
    pub stake_pool: Pubkey,
    pub stake_account: Pubkey,
    pub unbonding_account: Pubkey,
    pub owner: Pubkey,

    pub cancelled_amount: FullAmount,

    pub pool_note: StakePoolNote,
    pub account_note: StakeAccountNote,
}

#[event]
pub struct UnbondedWithdrawn {
    pub stake_pool: Pubkey,
    pub stake_account: Pubkey,
    pub owner: Pubkey,

    pub withdrawn_amount: FullAmount,

    pub pool_note: StakePoolNote,
    pub account_note: StakeAccountNote,
}

#[event]
pub struct BondedWithdrawn {
    pub stake_pool: Pubkey,

    pub withdrawn_amount: u64,

    pub pool_note: StakePoolNote,
}

#[event]
pub struct VotesMinted {
    pub stake_pool: Pubkey,
    pub stake_account: Pubkey,
    pub owner: Pubkey,

    pub minted_amount: u64,

    pub pool_note: StakePoolNote,
    pub account_note: StakeAccountNote,

    pub governance_realm: Pubkey,
    pub voter_account_balance: u64,
}

#[event]
pub struct VotesBurned {
    pub stake_pool: Pubkey,
    pub stake_account: Pubkey,
    pub owner: Pubkey,

    pub burned_amount: u64,

    pub pool_note: StakePoolNote,
    pub account_note: StakeAccountNote,

    pub voter_account_balance: u64,
}

#[event]
pub struct StakeAccountClosed {
    pub stake_account: Pubkey,
    pub owner: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct StakePoolNote {
    pub vault_amount: u64,
    pub bonded: SharedTokenPool,
    pub unbonding: SharedTokenPool,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct StakeAccountNote {
    bonded_shares: u64,
    minted_votes: u64,
    minted_collateral: u64,
    unbonding_shares: u64,
}

pub trait Note {
    type Output;

    fn note(&self) -> Self::Output;
}

impl Note for StakePool {
    type Output = StakePoolNote;

    fn note(&self) -> Self::Output {
        StakePoolNote {
            vault_amount: self.vault_amount,
            bonded: self.bonded,
            unbonding: self.unbonding,
        }
    }
}

impl Note for StakeAccount {
    type Output = StakeAccountNote;

    fn note(&self) -> Self::Output {
        StakeAccountNote {
            bonded_shares: self.bonded_shares,
            minted_votes: self.minted_votes,
            minted_collateral: self.minted_collateral,
            unbonding_shares: self.unbonding_shares,
        }
    }
}