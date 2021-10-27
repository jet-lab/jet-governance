use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};
use crate::state::{voter::Voter, realm::Realm};


#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Deposit<'info> {
    /// The user with authority over the voter account.
    #[account(signer)]
    pub owner: AccountInfo<'info>,

    #[account(
        has_one = vault,
        has_one = authority)]
    pub realm: ProgramAccount<'info, Realm>,

    // PDA that can sign on behalf of the realm
    pub authority: AccountInfo<'info>,

    // Account to store deposited governance tokens
    pub vault: AccountInfo<'info>,

    #[account(
        has_one = owner,
        has_one = realm)]
    pub voter: ProgramAccount<'info, Voter>,

    #[account(address = token::ID)]
    pub token_program: AccountInfo<'info>,
}

pub fn handler(
    ctx: Context<Deposit>,
    amount: u64,
) -> ProgramResult {
    ctx.accounts.voter.deposited += amount;
    let context = CpiContext::new(
        ctx.accounts.token_program.clone(),
        Transfer {
            from: ctx.accounts.owner.to_account_info(),
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
