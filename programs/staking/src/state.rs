use anchor_lang::prelude::*;

use crate::{Amount, AmountKind, ErrorCode};

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

    /// The total amount of tokens that are being unbonded, and can be withdrawn
    /// in the future.
    pub tokens_unbonding: u64,
}

impl StakePool {
    pub fn signer_seeds(&self) -> [&[u8]; 2] {
        [&self.seed[..self.seed_len as usize], &self.bump_seed[..]]
    }

    pub fn deposit(&mut self, amount: &FullAmount) {
        self.shares_bonded = self.shares_bonded.checked_add(amount.share_amount).unwrap();
    }

    pub fn withdraw(&mut self, amount: &FullAmount) {
        self.shares_bonded = self.shares_bonded.checked_sub(amount.share_amount).unwrap();
        self.tokens_unbonding = self
            .tokens_unbonding
            .checked_sub(amount.token_amount)
            .unwrap();
    }

    pub fn unbond(&mut self, amount: &FullAmount) {
        self.tokens_unbonding = self
            .tokens_unbonding
            .checked_add(amount.token_amount)
            .unwrap();
    }

    pub fn rebond(&mut self, amount: &FullAmount) {
        self.withdraw(amount);
        self.deposit(amount);
    }

    pub fn convert_amount(
        &self,
        vault_amount: u64,
        amount: Amount,
    ) -> Result<FullAmount, ErrorCode> {
        if amount.value == 0 {
            msg!("the amount cannot be zero");
            return Err(ErrorCode::InvalidAmount);
        }

        let tokens = std::cmp::max(vault_amount, 1);
        let shares = std::cmp::max(self.shares_bonded, 1);
        let full_amount = FullAmount {
            token_amount: 0,
            share_amount: 0,
            shares,
            tokens,
        };

        Ok(match amount.kind {
            AmountKind::Tokens => full_amount.with_tokens(amount.value),
            AmountKind::Shares => full_amount.with_shares(amount.value),
        })
    }

    pub fn convert_withdraw_amount(
        &self,
        vault_amount: u64,
        full_amount: &FullAmount,
    ) -> Result<FullAmount, ErrorCode> {
        let cur_amount =
            self.convert_amount(vault_amount, Amount::shares(full_amount.share_amount))?;

        if cur_amount.token_amount < full_amount.token_amount {
            Ok(cur_amount)
        } else {
            Ok(*full_amount)
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Default, Clone, Copy)]
pub struct FullAmount {
    pub token_amount: u64,
    pub share_amount: u64,
    pub shares: u64,
    pub tokens: u64,
}

impl FullAmount {
    pub fn with_tokens(&self, token_amount: u64) -> Self {
        let share_amount = (token_amount as u128) * (self.shares as u128) / (self.tokens as u128);
        assert!(share_amount < std::u64::MAX as u128);
        assert!((share_amount > 0 && token_amount > 0) || (share_amount == 0 && token_amount == 0));

        let share_amount = share_amount as u64;
        Self {
            token_amount,
            share_amount,
            shares: self.shares,
            tokens: self.tokens,
        }
    }

    pub fn with_shares(&self, share_amount: u64) -> Self {
        let token_amount = (self.tokens as u128) * (share_amount as u128) / (self.shares as u128);
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
#[derive(Default)]
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

        let minted_vote_amount = amount.with_tokens(self.minted_votes);
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

    pub fn mint_votes(&mut self, amount: &FullAmount) -> Result<(), ErrorCode> {
        let initial_minted_amount = amount.with_tokens(self.minted_votes);
        let total_requested_vote_amount = self
            .minted_votes
            .checked_add(amount.token_amount)
            .ok_or(ErrorCode::InvalidAmount)?;

        let minted_vote_amount = amount.with_tokens(total_requested_vote_amount);
        if initial_minted_amount.share_amount == minted_vote_amount.share_amount {
            msg!("the amount provided is too insignificant to mint new votes for");
            return Err(ErrorCode::InvalidAmount);
        }

        if minted_vote_amount.share_amount > self.shares {
            let max_amount = amount.with_shares(self.shares);
            msg!(
                "insufficient stake for votes: requested={}, available={}",
                minted_vote_amount.token_amount,
                max_amount.token_amount
            );
            return Err(ErrorCode::InsufficientStake);
        }

        self.minted_votes = total_requested_vote_amount;
        Ok(())
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
}

#[cfg(test)]
mod tests {
    use super::*;

    fn deposit(pool: &mut StakePool, user: &mut StakeAccount, vault: &mut u64, amount: Amount) {
        let full_amount = pool.convert_amount(*vault, amount).unwrap();

        pool.deposit(&full_amount);
        user.deposit(&full_amount);
        *vault += full_amount.token_amount;
    }

    fn unbond(
        pool: &mut StakePool,
        user: &mut StakeAccount,
        vault: &mut u64,
        amount: Amount,
    ) -> FullAmount {
        let full_amount = pool.convert_amount(*vault, amount).unwrap();

        pool.unbond(&full_amount);
        user.unbond(&full_amount).unwrap();

        full_amount
    }

    fn withdraw(
        pool: &mut StakePool,
        user: &mut StakeAccount,
        vault: &mut u64,
        full_amount: &FullAmount,
    ) {
        let full_amount = pool.convert_withdraw_amount(*vault, full_amount).unwrap();

        pool.withdraw(&full_amount);
        user.withdraw_unbonded(&full_amount);
        *vault -= full_amount.token_amount;
    }

    fn mint_votes(
        pool: &StakePool,
        user: &mut StakeAccount,
        vault: &u64,
        amount: Amount,
    ) -> Result<(), ErrorCode> {
        let full_amount = pool.convert_amount(*vault, amount)?;

        user.mint_votes(&full_amount)
    }

    #[test]
    fn check_precision() {
        let mut vault = 0;
        let mut pool = StakePool::default();
        let mut user_a = StakeAccount::default();
        let mut user_b = StakeAccount::default();

        // user A deposit 1_000 units, should be 1:1 ratio with shares
        deposit(&mut pool, &mut user_a, &mut vault, Amount::tokens(1_000));

        assert_eq!(1_000, vault);
        assert_eq!(1_000, pool.shares_bonded);

        // increase the vault contents to change the unit to share ratio to 1.5:1
        vault += 500;

        // user B deposit 19 units, which is about 12.66 shares
        deposit(&mut pool, &mut user_b, &mut vault, Amount::tokens(19));

        assert_eq!(1_519, vault);
        assert_eq!(1_012, pool.shares_bonded);

        // attempt to withdraw all 12 shares for user B, expect only 18 units
        let unbonded = unbond(&mut pool, &mut user_b, &mut vault, Amount::shares(12));
        withdraw(&mut pool, &mut user_b, &mut vault, &unbonded);

        assert_eq!(1_501, vault);
        assert_eq!(1_000, pool.shares_bonded);
        assert_eq!(0, pool.tokens_unbonding);

        // user B deposits 173_231 units, with 1.5:1 ratio
        deposit(&mut pool, &mut user_b, &mut vault, Amount::tokens(173_231));

        assert_eq!(174_732, vault);
        assert_eq!(116_410, pool.shares_bonded);

        // attempt to withdraw all shares for user B, expect 1 less token
        let unbonded = unbond(&mut pool, &mut user_b, &mut vault, Amount::shares(115410));
        withdraw(&mut pool, &mut user_b, &mut vault, &unbonded);

        assert_eq!(1_502, vault);
        assert_eq!(1_000, pool.shares_bonded);
        assert_eq!(0, pool.tokens_unbonding);
    }

    #[test]
    fn check_unbond_conversion_effect() {
        let mut vault = 0;
        let mut pool = StakePool::default();
        let mut user_a = StakeAccount::default();
        let mut user_b = StakeAccount::default();

        deposit(
            &mut pool,
            &mut user_a,
            &mut vault,
            Amount::tokens(1_250_000),
        );
        deposit(&mut pool, &mut user_b, &mut vault, Amount::tokens(750_000));

        assert_eq!(2_000_000, vault);
        assert_eq!(2_000_000, pool.shares_bonded);

        vault += 1_200_000;

        // at this point user_a has 2_000_000 tokens
        // ..            user_b has 1_200_000 tokens

        // unbond 200_000 tokens, which should be equal to 125_000 shares
        let unbonded_0 = unbond(&mut pool, &mut user_b, &mut vault, Amount::tokens(200_000));

        assert_eq!(125_000, user_b.unbonding);
        assert_eq!(625_000, user_b.shares);

        // increase share value while unbond is waiting
        vault += 2_400_000;

        // unbond 200_000 tokens, which should be equal to 71_429 shares
        let unbonded_1 = unbond(&mut pool, &mut user_b, &mut vault, Amount::tokens(200_000));

        assert_eq!(196_428, user_b.unbonding);
        assert_eq!(553_572, user_b.shares);

        // increased share value shouldn't matter
        vault += 2_400_000;

        // withdraw all unbonded tokens
        withdraw(&mut pool, &mut user_b, &mut vault, &unbonded_0);
        withdraw(&mut pool, &mut user_b, &mut vault, &unbonded_1);

        assert_eq!(0, user_b.unbonding);
        assert_eq!(553_572, user_b.shares);
        assert_eq!(7_600_000, vault);

        // start unbonding again, then reduce share values
        let unbonded_2 = unbond(&mut pool, &mut user_b, &mut vault, Amount::shares(53_572));

        vault -= 5_600_000;

        // withdraw should provide less than what was unbonded, since token per share was reduced
        withdraw(&mut pool, &mut user_b, &mut vault, &unbonded_2);

        assert_eq!(0, user_b.unbonding);
        assert_eq!(500_000, user_b.shares);
        assert_eq!(1_940_594, vault);
    }

    #[test]
    fn check_minting_votes_effect() {
        let mut vault = 0;
        let mut pool = StakePool::default();
        let mut user_a = StakeAccount::default();
        let mut user_b = StakeAccount::default();

        deposit(
            &mut pool,
            &mut user_a,
            &mut vault,
            Amount::tokens(1_250_000),
        );
        deposit(&mut pool, &mut user_b, &mut vault, Amount::tokens(750_000));

        vault += 1_200_000;

        // at this point user_a has 2_000_000 tokens
        // ..            user_b has 1_200_000 tokens

        let result_a = mint_votes(&pool, &mut user_a, &vault, Amount::tokens(2_000_000));

        let shares_b = Amount::shares(user_b.shares);
        let result_b = mint_votes(&pool, &mut user_b, &vault, shares_b);

        assert_eq!(Ok(()), result_a);
        assert_eq!(Ok(()), result_b);

        let result_a = mint_votes(&pool, &mut user_a, &vault, Amount::tokens(2));
        let result_b = mint_votes(&pool, &mut user_b, &vault, Amount::shares(2));

        assert_eq!(Err(ErrorCode::InsufficientStake), result_a);
        assert_eq!(Err(ErrorCode::InsufficientStake), result_b);

        vault += 1_200_000;

        // at this point user_a has 2_750_000 tokens
        // ..            user_b has 1_650_000 tokens

        let result_a = mint_votes(&pool, &mut user_a, &vault, Amount::tokens(750_000));
        let result_b = mint_votes(&pool, &mut user_b, &vault, Amount::tokens(450_000));

        assert_eq!(Ok(()), result_a);
        assert_eq!(Ok(()), result_b);
    }
}
