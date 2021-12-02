use std::ops::DerefMut;

use anchor_lang::prelude::*;
use crate::state::proposal::Proposal;
use crate::state::realm::Realm;

use super::transition_proposal::Time;



#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Propose<'info> {
    /// The user with authority over the proposal.
    #[account(signer)]
    pub owner: AccountInfo<'info>,

    #[account(has_one = owner)] // For now, only realm owner can propose
    pub realm: ProgramAccount<'info, Realm>,

    #[account(init,
        space = 8 + std::mem::size_of::<Proposal>(),
        payer = owner)]
    pub proposal: ProgramAccount<'info, Proposal>,

    /// Required to init account
    pub system_program: AccountInfo<'info>,
}

pub fn handler(
    ctx: Context<Propose>,
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
