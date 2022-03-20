use anchor_lang::prelude::*;

use crate::ErrorCode;

const INIT_TOKEN_SCALE: u64 = 1_000_000_000;
const INIT_SHARE_SCALE: u64 = 10_000_000_000;

#[account]
#[derive(Default, Debug)]
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

    /// The total amount of tokens being unbonded
    pub tokens_unbonding: u64,

    /// The amount of tokens stored by the pool's vault
    pub vault_amount: u64,

    /// A token to identify when unbond conversions are invalidated due to
    /// a withdraw of bonded tokens.
    pub unbond_change_index: u64,
}

impl StakePool {
    pub fn signer_seeds(&self) -> [&[u8]; 2] {
        [&self.seed[..self.seed_len as usize], &self.bump_seed[..]]
    }

    pub fn amount(&self) -> FullAmount {
        let (tokens, shares) = match self.vault_amount {
            0 => (INIT_TOKEN_SCALE, INIT_SHARE_SCALE),
            n => (n - self.tokens_unbonding, self.shares_bonded),
        };

        FullAmount {
            token_amount: 0,
            share_amount: 0,
            shares,
            tokens,
        }
    }

    pub fn update_vault(&mut self, vault_amount: u64) {
        self.vault_amount = vault_amount;
    }

    pub fn deposit(&mut self, account: &mut StakeAccount, amount: u64) -> FullAmount {
        let full_amount = self.amount().with_tokens(Rounding::Down, amount);

        self.shares_bonded = self
            .shares_bonded
            .checked_add(full_amount.share_amount)
            .unwrap();

        self.vault_amount = self
            .vault_amount
            .checked_add(full_amount.token_amount)
            .unwrap();

        account.deposit(&full_amount);

        full_amount
    }

    pub fn unbond(
        &mut self,
        account: &mut StakeAccount,
        record: &mut UnbondingAccount,
        amount: Option<u64>,
    ) -> Result<(), ErrorCode> {
        let full_amount = match amount {
            Some(n) => self.amount().with_tokens(Rounding::Up, n),
            None => self.amount().with_shares(Rounding::Down, account.shares),
        };

        account.unbond(&full_amount)?;

        self.shares_bonded = self
            .shares_bonded
            .checked_sub(full_amount.share_amount)
            .unwrap();
        self.tokens_unbonding = self
            .tokens_unbonding
            .checked_add(full_amount.token_amount)
            .unwrap();

        record.amount = full_amount;
        record.unbond_change_index = self.unbond_change_index;

        Ok(())
    }

    pub fn withdraw_unbonded(
        &mut self,
        account: &mut StakeAccount,
        record: &UnbondingAccount,
    ) -> FullAmount {
        let full_amount = match record.unbond_change_index {
            idx if idx == self.unbond_change_index => {
                self.tokens_unbonding = self
                    .tokens_unbonding
                    .checked_sub(record.amount.token_amount)
                    .unwrap();

                record.amount
            }

            _ => self
                .amount()
                .with_shares(Rounding::Down, record.amount.share_amount),
        };

        account.withdraw_unbonded(&full_amount);
        self.vault_amount = self
            .vault_amount
            .checked_sub(full_amount.token_amount)
            .unwrap();

        full_amount
    }

    pub fn withdraw_bonded(&mut self, amount: u64) {
        self.tokens_unbonding = 0;
        self.unbond_change_index += 1;
        self.vault_amount = self.vault_amount.checked_sub(amount).unwrap();
    }

    pub fn rebond(&mut self, account: &mut StakeAccount, record: &UnbondingAccount) {
        let amount = self.withdraw_unbonded(account, record);
        self.deposit(account, amount.token_amount);
    }

    pub fn mint_votes(
        &self,
        account: &mut StakeAccount,
        amount: Option<u64>,
    ) -> Result<u64, ErrorCode> {
        let full_amount = match amount {
            Some(token_amount) => self.amount().with_tokens(Rounding::Up, token_amount),
            None => {
                let user_amount = self.amount().with_shares(Rounding::Down, account.shares);

                let unminted = user_amount.token_amount - account.minted_votes;
                user_amount.with_tokens(Rounding::Up, unminted)
            }
        };

        account.mint_votes(&full_amount)
    }
}

#[derive(Debug, Eq, PartialEq, Clone, Copy)]
pub enum Rounding {
    Up,
    Down,
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Default, Clone, Copy)]
pub struct FullAmount {
    pub token_amount: u64,
    pub share_amount: u64,
    pub shares: u64,
    pub tokens: u64,
}

impl FullAmount {
    pub fn with_tokens(&self, rounding: Rounding, token_amount: u64) -> Self {
        let round_amount = match rounding {
            Rounding::Up if token_amount > 0 => self.shares as u128 / 2,
            _ => 0,
        };
        let share_amount =
            (round_amount + (token_amount as u128) * (self.shares as u128)) / (self.tokens as u128);

        assert!(share_amount < std::u64::MAX as u128);
        assert!((share_amount > 0 && token_amount > 0) || (share_amount == 0 && token_amount == 0));

        let share_amount = share_amount as u64;
        let token_amount = token_amount as u64;

        Self {
            token_amount,
            share_amount,
            shares: self.shares,
            tokens: self.tokens,
        }
    }

    pub fn with_shares(&self, rounding: Rounding, share_amount: u64) -> Self {
        let round_amount = match rounding {
            Rounding::Up if share_amount > 0 => self.tokens as u128 / 2,
            _ => 0,
        };
        let token_amount =
            (round_amount + (self.tokens as u128) * (share_amount as u128)) / (self.shares as u128);

        assert!(token_amount < std::u64::MAX as u128);
        assert!((share_amount > 0 && token_amount > 0) || (share_amount == 0 && token_amount == 0));

        let token_amount = token_amount as u64;

        Self {
            token_amount,
            share_amount,
            shares: self.shares,
            tokens: self.tokens,
        }
    }
}

#[account]
#[derive(Default, Debug)]
pub struct StakeAccount {
    /// The account that has ownership over this stake
    pub owner: Pubkey,

    /// The pool this account is associated with
    pub stake_pool: Pubkey,

    /// The stake balance (in share units)
    pub shares: u64,

    /// The token balance locked by existence of voting tokens
    pub minted_votes: u64,

    /// The stake balance locked by existence of collateral tokens
    pub minted_collateral: u64,

    /// The total staked tokens currently unbonding so as to be withdrawn in the future
    pub unbonding: u64,
}

impl StakeAccount {
    pub fn deposit(&mut self, amount: &FullAmount) {
        self.shares = self.shares.checked_add(amount.share_amount).unwrap();
    }

    pub fn rebond(&mut self, amount: &FullAmount) {
        self.withdraw_unbonded(amount);
        self.deposit(amount);
    }

    pub fn unbond(&mut self, amount: &FullAmount) -> Result<(), ErrorCode> {
        if self.shares < amount.share_amount {
            return Err(ErrorCode::InsufficientStake);
        }

        self.shares = self.shares.checked_sub(amount.share_amount).unwrap();
        self.unbonding = self.unbonding.checked_add(amount.share_amount).unwrap();

        let minted_vote_amount = amount.with_tokens(Rounding::Up, self.minted_votes);
        if minted_vote_amount.share_amount > self.shares {
            return Err(ErrorCode::VotesLocked);
        }

        if self.minted_collateral > self.shares {
            return Err(ErrorCode::CollateralLocked);
        }

        Ok(())
    }

    pub fn withdraw_unbonded(&mut self, amount: &FullAmount) {
        self.unbonding = self.unbonding.checked_sub(amount.share_amount).unwrap();
    }

    pub fn mint_votes(&mut self, amount: &FullAmount) -> Result<u64, ErrorCode> {
        let initial_minted_amount = amount.with_tokens(Rounding::Down, self.minted_votes);
        let total_requested_vote_amount = self
            .minted_votes
            .checked_add(amount.token_amount)
            .ok_or(ErrorCode::InvalidAmount)?;

        let minted_vote_amount = amount.with_tokens(Rounding::Down, total_requested_vote_amount);
        if initial_minted_amount.share_amount == minted_vote_amount.share_amount {
            msg!("the amount provided is too insignificant to mint new votes for");
            return Ok(0);
        }

        if minted_vote_amount.share_amount > self.shares {
            msg!(
                "insufficient stake for votes: requested={}, available={}",
                minted_vote_amount.share_amount,
                self.shares
            );
            return Err(ErrorCode::InsufficientStake);
        }

        self.minted_votes = total_requested_vote_amount;
        Ok(amount.token_amount)
    }

    pub fn burn_votes(&mut self, amount: u64) {
        self.minted_votes = self.minted_votes.checked_sub(amount).unwrap();
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

    /// The unbonding index at the time the request was made
    pub unbond_change_index: u64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn check_precision() {
        let mut pool = StakePool::default();
        let mut user_a = StakeAccount::default();
        let mut user_b = StakeAccount::default();

        // user A deposit 1_000 units, should be 1:1 ratio with shares
        pool.deposit(&mut user_a, 1_000);

        assert_eq!(1_000, pool.vault_amount);
        assert_eq!(10_000, pool.shares_bonded);

        // increase the vault contents to change the unit to share ratio to 0.15:1
        pool.vault_amount += 500;

        // user B deposit 28 units, which is about 186.6 shares (rounded to 22 units)
        pool.deposit(&mut user_b, 28);

        assert_eq!(1_528, pool.vault_amount);
        assert_eq!(10_186, pool.shares_bonded);

        // attempt to withdraw all 186 shares for user B, expect 27 units
        let mut unbond_b_0 = UnbondingAccount::default();
        pool.unbond(&mut user_b, &mut unbond_b_0, None).unwrap();
        pool.withdraw_unbonded(&mut user_b, &mut unbond_b_0);

        assert_eq!(1_501, pool.vault_amount);
        assert_eq!(10_000, pool.shares_bonded);

        // Increase share ratio to 1.5:1
        pool.vault_amount *= 10;

        // user B deposits 1_732_311 units
        pool.deposit(&mut user_b, 1_732_311);

        assert_eq!(1_747_321, pool.vault_amount);
        assert_eq!(1_164_104, pool.shares_bonded);

        // attempt to withdraw all tokens for user B, expect 1 less token
        let mut unbond_b_1 = UnbondingAccount::default();
        pool.unbond(&mut user_b, &mut unbond_b_1, None).unwrap();
        pool.withdraw_unbonded(&mut user_b, &mut unbond_b_1);

        assert_eq!(15_011, pool.vault_amount);
        assert_eq!(10_000, pool.shares_bonded);
    }

    #[test]
    fn check_unbond_conversion_effect() {
        let mut pool = StakePool::default();
        let mut user_a = StakeAccount::default();
        let mut user_b = StakeAccount::default();

        pool.deposit(&mut user_a, 1_250_000);
        pool.deposit(&mut user_b, 750_000);

        assert_eq!(2_000_000, pool.vault_amount);
        assert_eq!(20_000_000, pool.shares_bonded);

        pool.vault_amount += 1_200_000;

        // at this point user_a has 2_000_000 tokens
        // ..            user_b has 1_200_000 tokens

        // unbond 200_000 tokens, which should be equal to 1_250_000 shares
        let mut unbond_b_0 = UnbondingAccount::default();
        pool.unbond(&mut user_b, &mut unbond_b_0, Some(200_000))
            .unwrap();

        assert_eq!(1_250_003, user_b.unbonding);
        assert_eq!(6_249_997, user_b.shares);

        // increase share value while unbond is waiting
        pool.vault_amount += 2_400_000;

        // unbond 200_000 tokens, which should be equal to 694_446 shares
        let mut unbond_b_1 = UnbondingAccount::default();
        pool.unbond(&mut user_b, &mut unbond_b_1, Some(200_000))
            .unwrap();

        assert_eq!(1_944_449, user_b.unbonding);
        assert_eq!(5_555_551, user_b.shares);

        // increased share value shouldn't matter
        pool.vault_amount += 2_400_000;

        // withdraw all unbonded tokens
        pool.withdraw_unbonded(&mut user_b, &unbond_b_1);
        pool.withdraw_unbonded(&mut user_b, &unbond_b_0);

        assert_eq!(0, user_b.unbonding);
        assert_eq!(5_555_551, user_b.shares);
        assert_eq!(7_600_000, pool.vault_amount);

        // start unbonding again, then reduce share values
        let mut unbond_b_2 = UnbondingAccount::default();
        pool.unbond(&mut user_b, &mut unbond_b_2, Some(233_844))
            .unwrap();

        pool.withdraw_bonded(5_600_000);

        // withdraw should provide less than what was unbonded, since token per share was reduced
        let _ = pool.withdraw_unbonded(&mut user_b, &unbond_b_2);

        assert_eq!(0, user_b.unbonding);
        assert_eq!(5_000_000, user_b.shares);
        assert_eq!(1_936_509, pool.vault_amount);
    }

    #[test]
    fn check_minting_votes_effect() {
        let mut pool = StakePool::default();
        let mut user_a = StakeAccount::default();
        let mut user_b = StakeAccount::default();

        pool.deposit(&mut user_a, 1_250_000);
        pool.deposit(&mut user_b, 750_000);

        pool.vault_amount += 1_200_000;

        // at this point user_a has 2_000_000 tokens
        // ..            user_b has 1_200_000 tokens

        let result_a = pool.mint_votes(&mut user_a, Some(2_000_000));
        let result_b = pool.mint_votes(&mut user_b, None);

        assert_eq!(Ok(2_000_000), result_a);
        assert_eq!(Ok(1_200_000), result_b);

        let result_a = pool.mint_votes(&mut user_a, Some(20));

        assert_eq!(Err(ErrorCode::InsufficientStake), result_a);

        pool.vault_amount += 1_200_000;

        // at this point user_a has 2_750_000 tokens
        // ..            user_b has 1_650_000 tokens

        let result_a = pool.mint_votes(&mut user_a, Some(750_000));
        let result_b = pool.mint_votes(&mut user_b, Some(450_000));

        assert_eq!(Ok(750_000), result_a);
        assert_eq!(Ok(450_000), result_b);
    }
}
