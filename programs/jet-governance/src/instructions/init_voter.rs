use anchor_lang::prelude::*;
use crate::state::voter::Voter;
use crate::state::realm::Realm;


#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitializeVoter<'info> {
    /// The user with authority over the voter account.
    #[account(signer)]
    pub owner: AccountInfo<'info>,

    /// Realm that voter account exists within
    pub realm: ProgramAccount<'info, Realm>,


    #[account(init,
              seeds = [
                  b"voter".as_ref(),
                  owner.key().as_ref(),
                  realm.key().as_ref()
              ],
              bump = bump,
              space = 8 + std::mem::size_of::<Voter>(),
              payer = owner)]
    pub voter: ProgramAccount<'info, Voter>,

    /// Required to init account
    pub system_program: AccountInfo<'info>,
}

pub fn handler(ctx: Context<InitializeVoter>) -> ProgramResult {
    ctx.accounts.voter.owner = ctx.accounts.owner.key();
    ctx.accounts.voter.realm = ctx.accounts.realm.key();
    Ok(())
}
