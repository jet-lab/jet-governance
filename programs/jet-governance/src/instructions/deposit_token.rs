use std::ops::DerefMut;

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};
use crate::state::{voter::Voter, realm::Realm};


#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Deposit<'info> {
    /// The user with authority over the voter account.
    #[account(signer)]
    pub owner: AccountInfo<'info>,

    #[account(has_one = vault)]
    pub realm: Account<'info, Realm>,

    // Account to store deposited governance tokens
    #[account(mut)]
    pub vault: AccountInfo<'info>,

    #[account(mut,
        has_one = owner,
        has_one = realm)]
    pub voter: Account<'info, Voter>,

    /// Owner's token account containing the tokens to deposit
    #[account(mut)]
    pub token_account: AccountInfo<'info>,

    #[account(address = token::ID)]
    pub token_program: AccountInfo<'info>,
}

pub fn handler(
    ctx: Context<Deposit>,
    amount: u64,
) -> ProgramResult {
    (*ctx.accounts.voter.deref_mut()).deposited += amount;
    let context = CpiContext::new(
        ctx.accounts.token_program.clone(),
        Transfer {
            from: ctx.accounts.token_account.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.owner.clone(),
        },
    );
    token::transfer(
        context,
        amount
    )?;
    Ok(())
}
