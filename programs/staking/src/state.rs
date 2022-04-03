use std::convert::TryInto;

use anchor_lang::prelude::*;

use crate::ErrorCode;

const INIT_TOKEN_SCALE: u64 = 1_000_000_000;
const INIT_SHARE_SCALE: u64 = 10_000_000_000;

/// Pool of tokens with shared ownership by all shareholders. Tokens by default are
/// bonded and subject to airdrops (spl token transfer) or dilutions (withdraw_bonded).
///
/// Tokens can be unbonded for eventual withdrawal after the unbonding period.
/// Unbonding tokens are exempt from airdrops. Bonded and unbonding tokens each have
/// their own sub-pool (SharedTokenPool) with their own separate shares that are
/// incompatible with the other pool because they have distinct exchange rates.
///
/// Bonded tokens are eligible to be used to mint voting tokens. Once voting tokens are
/// minted, the bonded tokens are locked and cannot be unbonded until the voting tokens
/// are returned.
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

    /// The amount of tokens stored by the pool's vault
    pub vault_amount: u64,

    /// Tokens that are currently bonded,
    /// and the distinctly valued shares that represent stake in bonded tokens
    pub bonded: SharedTokenPool,

    /// Tokens that are in the process of unbonding,
    /// and the distinctly valued shares that represent stake in unbonding tokens
    pub unbonding: SharedTokenPool,
}

impl StakePool {
    pub fn signer_seeds(&self) -> [&[u8]; 2] {
        [&self.seed[..self.seed_len as usize], &self.bump_seed[..]]
    }

    /// Updates the vault total to be consistent with any deposits that came from another
    /// program. The increase in value is credited as a donation to the bonded pool.
    ///
    /// Do not use this for regular bookkeeping of valut_amount for internal transfers,
    /// within this program because it may break the bonded token totals. vault_amount
    /// should be independently handled where necessary.
    pub fn update_vault(&mut self, vault_amount: u64) {
        self.bonded
            .donate(vault_amount.checked_sub(self.vault_amount).unwrap());
        self.vault_amount = vault_amount;
    }

    /// Specify the desired number of tokens to deposit and they will be bonded.
    /// The depositing account is be credited with bonded shares.
    pub fn deposit(&mut self, account: &mut StakeAccount, tokens: u64) -> FullAmount {
        let full_amount = self.bonded.deposit(tokens);

        self.vault_amount = self
            .vault_amount
            .checked_add(full_amount.token_amount)
            .unwrap();

        account.deposit(full_amount.share_amount);

        full_amount
    }

    /// Optionally specify a number of tokens to unbond, otherwise unbond all tokens.
    /// Tokens are moved from the bonded pool to the unbonding pool.
    /// Bonded shares are redeemed and unbonding shares are issued.
    pub fn unbond(
        &mut self,
        account: &mut StakeAccount,
        record: &mut UnbondingAccount,
        tokens: Option<u64>,
    ) -> Result<FullAmount> {
        let bonded_to_unbond = match tokens {
            Some(n) => self.bonded.withdraw_tokens(n),
            None => self.bonded.withdraw(
                account
                    .bonded_shares
                    .checked_sub(account.minted_votes)
                    .unwrap(),
            ),
        };
        let unbonding_shares = self
            .unbonding
            .deposit(bonded_to_unbond.token_amount)
            .share_amount;

        account.unbond(bonded_to_unbond.share_amount, unbonding_shares)?;

        record.shares = unbonding_shares;

        Ok(bonded_to_unbond)
    }

    /// Redeems unbonding shares for tokens.
    /// Caller is responsible for checking that the unbonding period has completed.
    pub fn withdraw_unbonded(
        &mut self,
        account: &mut StakeAccount,
        record: &UnbondingAccount,
    ) -> FullAmount {
        let full_amount = self.unbonding.withdraw(record.shares);
        account.withdraw_unbonded(full_amount.share_amount);
        self.vault_amount = self
            .vault_amount
            .checked_sub(full_amount.token_amount)
            .unwrap();

        full_amount
    }

    /// Specially permissioned withdrawal that should only be executed by the stake pool owner.
    /// Dilutes bonded shares by removing tokens without returning any shares.
    pub fn withdraw_bonded(&mut self, amount: u64) {
        let bonded_withdrawal: u64 = (amount as u128)
            .checked_mul(self.bonded.tokens as u128)
            .unwrap()
            .checked_div(self.vault_amount as u128)
            .unwrap()
            .try_into()
            .unwrap();
        let unbonding_withdrawal = amount.checked_sub(bonded_withdrawal).unwrap();
        self.bonded.dilute(bonded_withdrawal);
        self.unbonding.dilute(unbonding_withdrawal);
        self.vault_amount = self.vault_amount.checked_sub(amount).unwrap();
    }

    /// Cancel an unbonding account and restore the tokens to the bonded pool.
    /// Redeems unbonding shares and issues bonded shares.
    pub fn rebond(&mut self, account: &mut StakeAccount, record: &UnbondingAccount) -> FullAmount {
        let amount = self.withdraw_unbonded(account, record);
        self.deposit(account, amount.token_amount);

        amount
    }
}

/// Primitive that represents a pool of tokens with ownership of a portion
/// of the pool represented by shares. Each SharedTokenPool has a distinct
/// value for its own shares.
#[derive(Default, Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct SharedTokenPool {
    /// Number of tokens held by this pool
    tokens: u64,

    /// Number of shares that have been issued to users
    /// to represent ownership of a portion of the tokens
    shares: u64,
}

/// Before moving any tokens or shares into this pool using these methods,
/// ensure the tokens/shares are available and not allocated in the program
/// for any other purpose.
impl SharedTokenPool {
    pub fn amount(&self) -> FullAmount {
        let (tokens, shares) = match self.tokens {
            0 => (INIT_TOKEN_SCALE, INIT_SHARE_SCALE),
            n => (n, self.shares),
        };

        FullAmount {
            token_amount: 0,
            share_amount: 0,
            all_shares: shares,
            all_tokens: tokens,
        }
    }

    /// Adds specified token amount to the pool, and mints a proportional amount of shares.
    ///
    /// - Before calling this function, ensure the tokens are held in an account owned by this
    /// program, and not allocated for any other purpose.
    /// - After calling this function, allocate the shares to a user that they can redeem later by calling withdraw
    pub fn deposit(&mut self, tokens: u64) -> FullAmount {
        let full_amount = self.amount().with_tokens(Rounding::Down, tokens);
        self.shares = self.shares.checked_add(full_amount.share_amount).unwrap();
        self.tokens = self.tokens.checked_add(full_amount.token_amount).unwrap();

        full_amount
    }

    /// Burns specified shares and remove a proportional amount of tokens.
    ///
    /// - Before calling this function, ensure the shares being redeemed are being subtracted
    /// from a balance held by a user
    /// - After calling this function, allocate the returned token amount to a user in some other way,
    /// either by depositing to another pool or transferring the actual tokens to their wallet.
    pub fn withdraw(&mut self, shares: u64) -> FullAmount {
        let full_amount = self.amount().with_shares(Rounding::Down, shares);
        self.withdraw_full_amount_impl(&full_amount);

        full_amount
    }

    /// Remove specified tokens and burn a proportional amount of shares
    ///
    /// Same as withdraw() except the parameter specifies the number of desired tokens.
    pub fn withdraw_tokens(&mut self, tokens: u64) -> FullAmount {
        let full_amount = self.amount().with_tokens(Rounding::Up, tokens);
        self.withdraw_full_amount_impl(&full_amount);

        full_amount
    }

    /// only use with a FullAmount derived from this SharedTokenPool
    fn withdraw_full_amount_impl(&mut self, full_amount: &FullAmount) {
        self.shares = self.shares.checked_sub(full_amount.share_amount).unwrap();
        self.tokens = self.tokens.checked_sub(full_amount.token_amount).unwrap();
    }

    /// Deposit tokens without creating any shares
    pub fn donate(&mut self, tokens: u64) {
        self.tokens = self.tokens.checked_add(tokens).unwrap();
    }

    /// Remove tokens without burning any sharesp
    pub fn dilute(&mut self, tokens: u64) {
        self.tokens = self.tokens.checked_sub(tokens).unwrap();
    }
}

#[derive(Debug, Eq, PartialEq, Clone, Copy)]
pub enum Rounding {
    Up,
    Down,
}

/// Used to calculate exchanges between tokens and shares.
///
/// The struct is initially constructed with the all_* values set to the total supply
/// of shares and tokens to represent the actual exchange rate. Then, the with_*
/// methods can be used to calculate the exchange of tokens for shares or vice versa.
/// These methods return another FullAmount struct that has the *_amount fields
/// filled in with the requested conversion values of shares and tokens that are
/// equivalent to each other in value. The resulting struct can continue to be used for
/// accurate calculations since it retains the original values in the all_* fields.
#[derive(AnchorSerialize, AnchorDeserialize, Debug, Default, Clone, Copy)]
pub struct FullAmount {
    /// Desired number of tokens resulting from the latest calculation
    pub token_amount: u64,

    /// Desired number of shares resulting from the latest calculation
    pub share_amount: u64,

    /// Full amount of shares from entire pool used to determine exchange rate
    all_shares: u64,

    /// Full amount of tokens from entire pool used to determine exchange rate
    all_tokens: u64,
}

impl FullAmount {
    /// Returns a new FullAmount with:
    /// - the same all_shares and all_tokens values
    /// - token_amount: input token_amount
    /// - share_amount: calculated shares equivalent in value to token_amount based on all_* exchange rate.
    pub fn with_tokens(&self, rounding: Rounding, token_amount: u64) -> Self {
        // Given x = a / b, we round up by introducing c = (b - 1) and calculating
        // x = (c + a) / b.
        // If a % b = 0, c / b = 0, and introduces no rounding.
        // If a % b > 0, c / b = 1, and rounds up by adding 1 to x.
        let round_amount = match rounding {
            Rounding::Up if token_amount > 0 => self.all_tokens as u128 - 1,
            _ => 0,
        };
        // (round_amount + token_amount * self.all_shares) / self.all_tokens
        let share_amount = (round_amount
            .checked_add(
                (token_amount as u128)
                    .checked_mul(self.all_shares as u128)
                    .unwrap(),
            )
            .unwrap())
            / (self.all_tokens as u128);

        assert!(share_amount < std::u64::MAX as u128);
        assert!((share_amount > 0 && token_amount > 0) || (share_amount == 0 && token_amount == 0));

        let share_amount = share_amount as u64;
        let token_amount = token_amount as u64;

        Self {
            token_amount,
            share_amount,
            all_shares: self.all_shares,
            all_tokens: self.all_tokens,
        }
    }

    /// Returns a new FullAmount with:
    /// - the same all_shares and all_tokens values
    /// - share_amount: input share_amount
    /// - token_amount: calculated tokens equivalent in value to share_amount based on all_* exchange rate.
    pub fn with_shares(&self, rounding: Rounding, share_amount: u64) -> Self {
        // Given x = a / b, we round up by introducing c = (b - 1) and calculating
        // x = (c + a) / b.
        // If a % b = 0, c / b = 0, and introduces no rounding.
        // If a % b > 0, c / b = 1, and rounds up by adding 1 to x.
        let round_amount = match rounding {
            Rounding::Up if share_amount > 0 => self.all_shares as u128 - 1,
            _ => 0,
        };
        // (round_amount + share_amount * self.all_tokens) / self.all_shares
        let token_amount = (round_amount
            .checked_add(
                (self.all_tokens as u128)
                    .checked_mul(share_amount as u128)
                    .unwrap(),
            )
            .unwrap())
            / (self.all_shares as u128);

        assert!(token_amount < std::u64::MAX as u128);
        assert!((share_amount > 0 && token_amount > 0) || (share_amount == 0 && token_amount == 0));

        let token_amount = token_amount as u64;

        Self {
            token_amount,
            share_amount,
            all_shares: self.all_shares,
            all_tokens: self.all_tokens,
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
    /// this number must remain > max(minted_votes, minted_collateral)
    pub bonded_shares: u64,

    /// The balance of bonded shares locked by existence of voting tokens
    pub minted_votes: u64,

    /// The balance of bonded shares locked by existence of collateral tokens
    pub minted_collateral: u64,

    /// The total share of currently unbonding tokens to be withdrawn in the future
    pub unbonding_shares: u64,
}

impl StakeAccount {
    pub fn deposit(&mut self, shares: u64) {
        self.bonded_shares = self.bonded_shares.checked_add(shares).unwrap();
    }

    pub fn rebond(&mut self, bonded_shares: u64, unbonding_shares: u64) {
        self.withdraw_unbonded(unbonding_shares);
        self.deposit(bonded_shares);
    }

    pub fn unbond(
        &mut self,
        bonded_shares_to_burn: u64,
        unbonding_shares_to_award: u64,
    ) -> Result<()> {
        if self.bonded_shares < bonded_shares_to_burn {
            return err!(ErrorCode::InsufficientStake);
        }

        let new_bonded_shares_total = self
            .bonded_shares
            .checked_sub(bonded_shares_to_burn)
            .unwrap();

        if self.minted_votes > new_bonded_shares_total {
            return err!(ErrorCode::VotesLocked);
        }

        if self.minted_collateral > new_bonded_shares_total {
            return err!(ErrorCode::CollateralLocked);
        }

        self.bonded_shares = new_bonded_shares_total;
        self.unbonding_shares = self
            .unbonding_shares
            .checked_add(unbonding_shares_to_award)
            .unwrap();

        Ok(())
    }

    pub fn withdraw_unbonded(&mut self, shares: u64) {
        self.unbonding_shares = self.unbonding_shares.checked_sub(shares).unwrap();
    }

    /// Mints vote tokens for bonded shares, preventing those bonded shares from being unbonded
    /// until the votes are burned.
    pub fn mint_votes(&mut self, amount: Option<u64>) -> Result<u64> {
        let desired_vote_amount = match amount {
            Some(desired_vote_amount) => desired_vote_amount,
            None => self.bonded_shares.checked_sub(self.minted_votes).unwrap(),
        };
        if desired_vote_amount == 0 {
            msg!("the requested amount is 0, no new votes need to be minted");
            return Ok(0);
        }
        let new_votes_total = self
            .minted_votes
            .checked_add(desired_vote_amount)
            .ok_or(ErrorCode::InvalidAmount)?;
        if new_votes_total > self.bonded_shares {
            msg!(
                "insufficient stake for votes: requested={}, available={}",
                new_votes_total,
                self.bonded_shares
            );
            return Err(ErrorCode::InsufficientStake.into());
        }
        self.minted_votes = new_votes_total;

        Ok(desired_vote_amount)
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

    /// The share of the unbonding tokens to be unstaked
    /// These shares do not have equal value to the bonded shares
    pub shares: u64,

    /// The time after which the staked amount can be withdrawn
    pub unbonded_at: i64,
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
        assert_eq!(10_000, pool.bonded.shares);

        // increase the vault contents to change the unit to share ratio to 0.15:1
        pool.vault_amount += 500;
        pool.bonded.tokens += 500;

        // user B deposit 28 units, which is about 186.6 shares (rounded to 22 units)
        pool.deposit(&mut user_b, 28);

        assert_eq!(1_528, pool.vault_amount);
        assert_eq!(10_186, pool.bonded.shares);

        // attempt to withdraw all 186 shares for user B, expect 27 units
        let mut unbond_b_0 = UnbondingAccount::default();
        pool.unbond(&mut user_b, &mut unbond_b_0, None).unwrap();
        pool.withdraw_unbonded(&mut user_b, &unbond_b_0);

        assert_eq!(1_501, pool.vault_amount);
        assert_eq!(10_000, pool.bonded.shares);

        // Increase share ratio to 1.5:1
        pool.vault_amount *= 10;
        pool.bonded.tokens *= 10;

        // user B deposits 1_732_311 units
        pool.deposit(&mut user_b, 1_732_311);

        assert_eq!(1_747_321, pool.vault_amount);
        assert_eq!(1_164_104, pool.bonded.shares);

        // attempt to withdraw all tokens for user B, expect 1 less token
        let mut unbond_b_1 = UnbondingAccount::default();
        pool.unbond(&mut user_b, &mut unbond_b_1, None).unwrap();
        pool.withdraw_unbonded(&mut user_b, &unbond_b_1);

        assert_eq!(15_011, pool.vault_amount);
        assert_eq!(10_000, pool.bonded.shares);
    }

    #[test]
    fn check_unbond_conversion_effect() {
        let mut pool = StakePool::default();
        let mut user_a = StakeAccount::default();
        let mut user_b = StakeAccount::default();

        pool.deposit(&mut user_a, 1_250_000);
        pool.deposit(&mut user_b, 750_000);

        assert_eq!(2_000_000, pool.vault_amount);
        assert_eq!(20_000_000, pool.bonded.shares);

        pool.vault_amount += 1_200_000;
        pool.bonded.tokens += 1_200_000;

        // at this point user_a has 2_000_000 tokens
        // ..            user_b has 1_200_000 tokens

        // unbond 200_000 tokens, which should be equal to 1_250_000 shares
        let mut unbond_b_0 = UnbondingAccount::default();
        pool.unbond(&mut user_b, &mut unbond_b_0, Some(200_000))
            .unwrap();

        // unbonding shares are counted separately and init at 10x the tokens
        assert_eq!(2_000_000, user_b.unbonding_shares);
        assert_eq!(6_250_000, user_b.bonded_shares);

        // increase share value while unbond is waiting
        pool.vault_amount += 2_400_000;
        pool.bonded.tokens += 2_400_000;

        // unbond 200_000 tokens, which should be equal to 694_446 bonded shares and 2_000_000 unbonding shares
        let mut unbond_b_1 = UnbondingAccount::default();
        pool.unbond(&mut user_b, &mut unbond_b_1, Some(200_000))
            .unwrap();

        assert_eq!(4_000_000, user_b.unbonding_shares);
        assert_eq!(5_555_555, user_b.bonded_shares);

        // increased share value shouldn't matter
        pool.vault_amount += 2_400_000;
        pool.bonded.tokens += 2_400_000;

        // withdraw all unbonded tokens
        pool.withdraw_unbonded(&mut user_b, &unbond_b_1);
        pool.withdraw_unbonded(&mut user_b, &unbond_b_0);

        assert_eq!(0, user_b.unbonding_shares);
        assert_eq!(5_555_555, user_b.bonded_shares);
        assert_eq!(7_600_000, pool.vault_amount);

        // start unbonding again, then reduce share values
        let mut unbond_b_2 = UnbondingAccount::default();
        pool.unbond(&mut user_b, &mut unbond_b_2, Some(233_844))
            .unwrap();

        pool.withdraw_bonded(5_600_000);

        // withdraw should provide less than what was unbonded, since token per share was reduced
        let _ = pool.withdraw_unbonded(&mut user_b, &unbond_b_2);

        assert_eq!(0, user_b.unbonding_shares);
        assert_eq!(5_000_004, user_b.bonded_shares);
        assert_eq!(1_938_463, pool.vault_amount);
    }

    #[test]
    fn check_minting_votes_effect() {
        let mut pool = StakePool::default();
        let mut user_a = StakeAccount::default();
        let mut user_b = StakeAccount::default();

        pool.deposit(&mut user_a, 1_250_000);
        pool.deposit(&mut user_b, 750_000);

        pool.vault_amount += 1_200_000;
        pool.bonded.tokens += 1_200_000;

        // at this point user_a has 2_000_000 tokens
        // ..            user_b has 1_200_000 tokens

        let result_a = user_a.mint_votes(Some(2_000_000));
        let result_b = user_b.mint_votes(None);

        assert_eq!(2_000_000, result_a.unwrap());
        assert_eq!(7_500_000, result_b.unwrap());

        let result_a = user_a.mint_votes(Some(12_500_000));

        if let anchor_lang::error::Error::AnchorError(result_a_err) = result_a.unwrap_err() {
            assert_eq!(
                ErrorCode::InsufficientStake as u32,
                result_a_err.error_code_number
            );
        }

        pool.vault_amount += 1_200_000;
        pool.bonded.tokens += 1_200_000;

        // at this point user_a has 2_750_000 tokens
        // ..            user_b has 1_650_000 tokens

        let result_a = user_a.mint_votes(Some(750_000));
        let result_b = user_b.mint_votes(Some(450_000));

        assert_eq!(750_000, result_a.unwrap());
        assert_err(ErrorCode::InsufficientStake, result_b);
    }

    fn assert_err<T: std::fmt::Debug>(expected: ErrorCode, actual: Result<T>) {
        if let anchor_lang::error::Error::AnchorError(actual) = actual.unwrap_err() {
            assert_eq!(expected as u32, actual.error_code_number);
        }
    }

    #[test]
    fn check_full_amount_rounding() {
        let full_amount = FullAmount {
            token_amount: 0,
            share_amount: 0,
            all_shares: 5,
            all_tokens: 4,
        };

        let up = full_amount.with_tokens(Rounding::Up, 1);
        assert_eq!(2, up.share_amount); // 1.25 rounded up
        assert_eq!(1, up.token_amount);

        let down = full_amount.with_tokens(Rounding::Down, 1);
        assert_eq!(1, down.share_amount);
        assert_eq!(1, down.token_amount);

        // Should have the same effect when the share:token ratio is unchanged
        let full_amount = FullAmount {
            token_amount: 0,
            share_amount: 0,
            all_shares: 10,
            all_tokens: 8,
        };

        let up = full_amount.with_tokens(Rounding::Up, 1);
        assert_eq!(2, up.share_amount); // 1.25 rounded up
        assert_eq!(1, up.token_amount);

        let down = full_amount.with_tokens(Rounding::Down, 1);
        assert_eq!(1, down.share_amount);
        assert_eq!(1, down.token_amount);

        // Should round to 1 digit
        let up = full_amount.with_tokens(Rounding::Up, 10);
        assert_eq!(13, up.share_amount); // 12.5 rounded up
        assert_eq!(10, up.token_amount);

        let down = full_amount.with_tokens(Rounding::Down, 10);
        assert_eq!(12, down.share_amount);
        assert_eq!(10, down.token_amount);

        let up = full_amount.with_tokens(Rounding::Up, 10);
        assert_eq!(13, up.share_amount); // 12.5 rounded up
        assert_eq!(10, up.token_amount);

        let down = full_amount.with_tokens(Rounding::Down, 10);
        assert_eq!(12, down.share_amount);
        assert_eq!(10, down.token_amount);

        // No rounding
        let up = full_amount.with_tokens(Rounding::Up, 100);
        assert_eq!(125, up.share_amount); // 125 has no fractions
        assert_eq!(100, up.token_amount);

        let down = full_amount.with_tokens(Rounding::Down, 100);
        assert_eq!(125, down.share_amount); // 125 has no fractions
        assert_eq!(100, down.token_amount);
    }
}
