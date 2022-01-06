use anchor_lang::prelude::*;

use crate::{Amount, AmountKind, ErrorCode};

#[account]
#[derive(Default)]
pub struct StakePool {
    /// The authority allowed to withdraw the staked tokens
    pub authority: Pubkey,

    /// The seed used to generate the pool address
    pub seed: [u8; 30],
    pub seed_len: u8,
    pub bump_seed: [u8; 1],

    /// The mint for the tokens being staked
    pub token_mint: Pubkey,

    /// The token account owned by this pool, holding the staked tokens
    pub stake_pool_vault: Pubkey,

    /// The mint for the derived voting token
    pub stake_vote_mint: Pubkey,

    /// The mint for the derived collateral token
    pub stake_collateral_mint: Pubkey,

    /// Length of the unbonding period
    pub unbond_period: i64,

    /// The total amount of virtual stake tokens that can receive rewards
    pub shares_bonded: u64,

    /// The total amount of virtual stake tokens that are ineligible for rewards
    /// because they are being unbonded for future withdrawal.
    pub shares_unbonded: u64,
}

impl StakePool {
    pub fn signer_seeds(&self) -> [&[u8]; 2] {
        [&self.seed[..self.seed_len as usize], &self.bump_seed[..]]
    }

    pub fn deposit(&mut self, amount: &FullAmount) {
        self.shares_bonded = self.shares_bonded.checked_add(amount.shares).unwrap();
    }

    pub fn withdraw(&mut self, amount: &FullAmount) {
        self.shares_unbonded = self.shares_unbonded.checked_sub(amount.shares).unwrap();
    }

    pub fn unbond(&mut self, amount: &FullAmount) {
        self.shares_bonded = self.shares_bonded.checked_sub(amount.shares).unwrap();
        self.shares_unbonded = self.shares_unbonded.checked_add(amount.shares).unwrap();
    }

    pub fn convert_amount(&self, vault_amount: u64, amount: Amount) -> FullAmount {
        let vault_amount = std::cmp::max(vault_amount as u128, 1);
        let share_supply = std::cmp::max(self.shares_bonded as u128, 1);

        match amount.kind {
            AmountKind::Tokens => {
                let shares = (share_supply * amount.value as u128) / vault_amount;
                assert!(shares < std::u64::MAX as u128);

                FullAmount {
                    tokens: amount.value,
                    shares: shares as u64,
                }
            }
            AmountKind::Shares => {
                let tokens = (vault_amount * amount.value as u128) / share_supply;
                assert!(tokens < std::u64::MAX as u128);

                FullAmount {
                    shares: amount.value,
                    tokens: tokens as u64,
                }
            }
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Default, Clone, Copy)]
pub struct FullAmount {
    pub shares: u64,
    pub tokens: u64,
}

#[account]
#[derive(Default)]
pub struct StakeAccount {
    /// The account that has ownership over this stake
    pub owner: Pubkey,

    /// The pool this account is associated with
    pub stake_pool: Pubkey,

    /// The stake balance that can be unstaked by the owner
    /// at any time, not subject to vesting.
    pub unlocked: u64,

    /// The stake balance that is subject to vesting, cannot
    /// be unstaked.
    pub locked: u64,

    /// The stake balance locked by existence of voting tokens
    pub minted_votes: u64,

    /// The stake balance locked by existence of collateral tokens
    pub minted_collateral: u64,

    /// The total staked tokens currently unbonding so as to be withdrawn in the future
    pub unbonding: u64,
}

impl StakeAccount {
    pub fn deposit_unlocked(&mut self, amount: u64) {
        self.unlocked = self.unlocked.checked_add(amount).unwrap();
    }

    pub fn deposit_locked(&mut self, amount: u64) {
        self.locked = self.locked.checked_add(amount).unwrap();
    }

    pub fn unlock(&mut self, amount: u64) {
        self.locked = self.locked.checked_sub(amount).unwrap();
        self.deposit_unlocked(amount);
    }

    pub fn unbond(&mut self, amount: u64) -> Result<(), ErrorCode> {
        if self.unlocked < amount {
            return Err(ErrorCode::InsufficientUnlocked);
        }

        self.unlocked = self.unlocked.checked_sub(amount).unwrap();
        self.unbonding = self.unbonding.checked_add(amount).unwrap();

        if self.minted_votes > self.total_shares() {
            return Err(ErrorCode::VotesLocked);
        }

        if self.minted_collateral > self.unlocked {
            return Err(ErrorCode::CollateralLocked);
        }

        Ok(())
    }

    pub fn withdraw_unbonded(&mut self, amount: u64) {
        self.unbonding = self.unbonding.checked_sub(amount).unwrap();
    }

    pub fn mint_votes(&mut self, amount: u64) -> Result<(), ErrorCode> {
        self.minted_votes = self.minted_votes.checked_add(amount).unwrap();

        if self.minted_votes > self.total_shares() {
            return Err(ErrorCode::InsufficientUnlocked);
        }

        Ok(())
    }

    pub fn burn_votes(&mut self, amount: u64) {
        self.minted_votes = self.minted_votes.checked_sub(amount).unwrap();
    }

    fn total_shares(&self) -> u64 {
        self.unlocked + self.locked
    }
}

#[account]
#[derive(Default)]
pub struct UnbondingAccount {
    /// The related account requesting to unstake
    pub stake_account: Pubkey,

    /// The amount of shares/tokens to be unstaked
    pub amount: FullAmount,

    /// The time after which the staked amount can be withdrawn
    pub unbonded_at: i64,
}
