use std::ops::DerefMut;

use crate::state::proposal::Proposal;
use crate::state::realm::Realm;
use crate::state::voter::Voter;
use anchor_lang::prelude::*;

use super::transition_proposal::Time;

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitProposal<'info> {
    /// The user with authority over the proposal.
    pub owner: AccountInfo<'info>,

    #[account(has_one = owner)] // For now, only realm owner can propose
    pub realm: Account<'info, Realm>,

    /// Proposer must have an initialized voting account
    /// in case deposit constraints are introduced
    #[account(
        has_one = owner,
        has_one = realm)]
    pub voter: Account<'info, Voter>,

    #[account(init,
        space = 8 + std::mem::size_of::<Proposal>(),
        payer = payer)]
    pub proposal: Account<'info, Proposal>,

    /// Required to init account
    pub system_program: AccountInfo<'info>,

    pub payer: Signer<'info>,
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
