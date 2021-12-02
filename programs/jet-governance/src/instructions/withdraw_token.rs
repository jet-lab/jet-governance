use std::ops::DerefMut;

use anchor_lang::prelude::*;
use crate::state::{voter::Voter, realm::Realm};
use anchor_spl::token::{self, Transfer};


#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Withdraw<'info> {
    /// The user with authority over the voter account.
    pub owner: Signer<'info>,

    #[account(
        has_one = vault,
        has_one = authority)]
    pub realm: Account<'info, Realm>,

    // PDA that can sign on behalf of the realm
    #[account(
        seeds = [
            b"realm-authority".as_ref(),
            realm.key().as_ref()
        ],
        bump = bump)]
    pub authority: AccountInfo<'info>,

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
    ctx: Context<Withdraw>,
    bump: u8,
    amount: u64,
) -> ProgramResult {
    let voter = ctx.accounts.voter.deref_mut();
    if amount > voter.deposited {
        panic!("Cannot withdraw more than the total deposited");
    }
    if voter.active_votes > 0 {
        panic!("Cannot withdraw when there are active votes");
    }
    voter.deposited -= amount;
    let seeds: &[&[&[u8]]] = &[&[
        b"realm-authority".as_ref(),
        ctx.accounts.realm.to_account_info().key.as_ref(),
        &[bump],
    ]];
    let context = CpiContext::new_with_signer(
        ctx.accounts.token_program.clone(),
        Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.authority.clone(),
        },
        seeds,
    );
    token::transfer(
        context,
        amount
    )?;
    Ok(())
}
