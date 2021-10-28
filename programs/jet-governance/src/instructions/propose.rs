use std::ops::DerefMut;

use anchor_lang::prelude::*;
use crate::state::voter::Voter;
use crate::state::proposal::{Proposal, ProposalState, VoteCount};

use super::Time;


#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Propose<'info> {
    /// The user with authority over the proposal.
    #[account(signer)]
    pub owner: AccountInfo<'info>,

    pub realm: AccountInfo<'info>,

    #[account(
        has_one=owner,
        has_one=realm)]
    pub voter: ProgramAccount<'info, Voter>,

    #[account(init,
        space = 8 + std::mem::size_of::<Proposal>(),
        payer = owner)]
    pub proposal: ProgramAccount<'info, Proposal>,

    //. Required to init account
    pub system_program: AccountInfo<'info>,
}

pub fn handler(
    ctx: Context<Propose>,
    name: String,
    description: String,
    activate: Time,
    finalize: Time,
) -> ProgramResult {
    *ctx.accounts.proposal.deref_mut() = Proposal {
        realm: ctx.accounts.realm.key(),
        owner: ctx.accounts.owner.key(),
        name,
        description,
        created_slot: Clock::get()?.slot,
        state: ProposalState::new(activate.resolve(), finalize.resolve()),
    };
    Ok(())
}
