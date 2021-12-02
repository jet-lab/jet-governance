use std::ops::DerefMut;

use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::UnixTimestamp;
use crate::state::voter::Voter;
use crate::state::proposal::{Proposal, ProposalEvent};


#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct TransitionProposal<'info> {
    /// The user with authority over the proposal.
    pub owner: Signer<'info>,

    pub realm: AccountInfo<'info>,

    // todo is this needed? if so require it when creating proposal
    #[account(
        has_one = owner,
        has_one = realm)]
    pub voter: Account<'info, Voter>,

    #[account(mut,
        has_one = realm,
        has_one = owner)]
    pub proposal: Account<'info, Proposal>,
}


pub fn handler(
    ctx: Context<TransitionProposal>,
    event: ProposalEvent,
    when: Time
) -> ProgramResult {
    let proposal = ctx.accounts.proposal.deref_mut();
    match event {
        ProposalEvent::Activate => proposal.lifecycle.activate(when.resolve()),
        ProposalEvent::Finalize => proposal.lifecycle.finalize(when.resolve()),
    }
    Ok(())
}

#[derive(AnchorDeserialize, AnchorSerialize, Eq, PartialEq, Debug, Clone, Copy)]
pub enum Time {
    Now,
    At(UnixTimestamp),
    Never
}

impl Time {
    pub fn resolve(&self) -> Option<UnixTimestamp> {
        match self {
            Time::Now => Some(Clock::get().unwrap().unix_timestamp),
            Time::At(timestamp) => Some(*timestamp),
            Time::Never => None,
        }
    }
}
