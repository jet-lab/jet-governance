use std::ops::DerefMut;

use anchor_lang::prelude::*;
use crate::state::proposal::Proposal;
use crate::state::realm::Realm;

use super::transition_proposal::Time;



#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitProposal<'info> {
    /// The user with authority over the proposal.
    pub owner: Signer<'info>,

    #[account(has_one = owner)] // For now, only realm owner can propose
    pub realm: Account<'info, Realm>,

    #[account(init,
        space = 8 + std::mem::size_of::<Proposal>(),
        payer = owner)]
    pub proposal: Account<'info, Proposal>,

    /// Required to init account
    pub system_program: AccountInfo<'info>,
}

pub fn handler(
    ctx: Context<InitProposal>,
    name: String,
    description: String,
    activate: Time,
    finalize: Time,
) -> ProgramResult {
    *ctx.accounts.proposal.deref_mut() = Proposal::new(
        ctx.accounts.realm.key(),
        ctx.accounts.owner.key(),
        name,
        description,
        activate.resolve(),
        finalize.resolve(),
    );
    Ok(())
}
