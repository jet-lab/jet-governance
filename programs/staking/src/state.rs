use anchor_lang::prelude::*;

use crate::ErrorCode;

#[account]
#[derive(Default)]
pub struct StakePool {
    /// The authority allowed to withdraw the staked tokens
    pub authority: Pubkey,

    /// The seed used to generate the pool address
    pub seed: [u8; 31],
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

    /// The total amount of virtual stake tokens (shares)
    pub share_supply: u64,
}

impl StakePool {
    pub fn signer_seeds(&self) -> [&[u8]; 2] {
        [&self.seed[..], &self.bump_seed[..]]
    }

    pub fn deposit(&mut self, vault_amount: u64, token_amount: u64) -> u64 {
        let share_amount = self.tokens_as_shares(vault_amount, token_amount);
        self.share_supply = self.share_supply.checked_add(share_amount).unwrap();

        share_amount
    }

    pub fn withdraw(&mut self, vault_amount: u64, share_amount: u64) -> u64 {
        let tokens = self.shares_as_tokens(vault_amount, share_amount);
        self.share_supply = self.share_supply.checked_sub(share_amount).unwrap();

        tokens
    }

    pub fn tokens_as_shares(&self, vault_amount: u64, token_amount: u64) -> u64 {
        let vault_amount = vault_amount as u128;
        let share_supply = self.share_supply as u128;

        let shares = (share_supply * token_amount as u128) / vault_amount;

        assert!(shares < std::u64::MAX as u128);

        shares as u64
    }

    pub fn shares_as_tokens(&self, vault_amount: u64, share_amount: u64) -> u64 {
        let vault_amount = vault_amount as u128;
        let share_supply = self.share_supply as u128;

        let tokens = (vault_amount * share_amount as u128) / share_supply;

        assert!(tokens < std::u64::MAX as u128);

        tokens as u64
    }
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

    /// The amount to be unstaked
    pub amount: u64,

    /// The time after which the staked amount can be withdrawn
    pub unbonded_at: i64,
}

#[account]
#[derive(Default)]
pub struct VestingAccount {
    /// The related account that owns the stake
    pub stake_account: Pubkey,

    /// The seed used to generate the account address
    pub seed: u32,
    pub bump: u8,

    /// Total amount to be vested
    pub total: u64,

    /// The amount that has already been vested and unlocked
    pub unlocked: u64,

    /// The time at which vesting should start
    pub vest_start_at: i64,

    /// The time at which vesting should be completed for 100% of the balance
    pub vest_end_at: i64,
}

impl VestingAccount {
    /// Calculate the amount of the stake that is vested and available for unlock
    pub fn unlockable(&self, timestamp: i64) -> u64 {
        if timestamp < self.vest_start_at {
            return 0;
        }

        if timestamp >= self.vest_end_at {
            return self.total;
        }

        let vest_period = (self.vest_end_at - self.vest_start_at) as i128;
        let vest_progress = (timestamp - self.vest_start_at) as i128;

        let vested = vest_progress
            .checked_mul(self.total as i128)
            .unwrap()
            .checked_div(vest_period)
            .unwrap();

        assert!(vested > 0);
        assert!(vested < std::u64::MAX as i128);

        vested as u64
    }
}
