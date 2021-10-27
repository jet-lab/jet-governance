use std::ops::DerefMut;

use anchor_lang::prelude::*;
use crate::state::voter::Voter;
use crate::state::proposal::{Proposal, ProposalEvent};


#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct TransitionProposal<'info> {
    /// The user with authority over the proposal.
    #[account(signer)]
    pub owner: AccountInfo<'info>,

    pub realm: AccountInfo<'info>,

    #[account(
        has_one = owner,
        has_one = realm)]
    pub voter: ProgramAccount<'info, Voter>,

    #[account(
        has_one = realm,
        has_one = owner)]
    pub proposal: ProgramAccount<'info, Proposal>,
}

pub fn handler(ctx: Context<TransitionProposal>, event: ProposalEvent, slot: Option<u64>) -> ProgramResult {
    let proposal = ctx.accounts.proposal.deref_mut();
    let slot = if let Some(actual_slot) = slot {
        if actual_slot == 0 { // todo better way to say "now"
            Some(Clock::get().unwrap().slot)
        } else {
            slot
        }
    } else {
        slot
    };
    match event {
        ProposalEvent::Activate => proposal.state.activate(slot),
        ProposalEvent::Finalize => proposal.state.finalize(slot),
    }
    Ok(())
}
