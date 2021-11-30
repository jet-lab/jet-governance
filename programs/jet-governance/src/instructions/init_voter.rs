use std::ops::DerefMut;

use anchor_lang::prelude::*;
use crate::state::voter::Voter;
use crate::state::realm::Realm;


#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitVoter<'info> {
    /// The user with authority over the voter account.
    pub owner: Signer<'info>,

    /// Realm that voter account exists within
    pub realm: Account<'info, Realm>,

    #[account(init,
              seeds = [
                  b"voter".as_ref(),
                  owner.key().as_ref(),
                  realm.key().as_ref()
              ],
              bump = bump,
              space = 8 + std::mem::size_of::<Voter>(),
              payer = owner)]
    pub voter: Account<'info, Voter>,

    /// Required to init account
    pub system_program: AccountInfo<'info>,
}

pub fn handler(ctx: Context<InitVoter>, bump: u8) -> ProgramResult {
    *ctx.accounts.voter.deref_mut() = Voter {
        realm: ctx.accounts.realm.key(),
        owner: ctx.accounts.owner.key(),
        deposited: 0,
        active_votes: 0,
    };
    Ok(())
}
