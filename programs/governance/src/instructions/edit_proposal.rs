use std::ops::DerefMut;

use crate::state::proposal::Proposal;
use crate::state::voter::Voter;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct EditProposal<'info> {
    /// The user with authority over the proposal.
    pub owner: Signer<'info>,

    pub realm: AccountInfo<'info>,

    #[account(
        has_one = owner,
        has_one = realm)]
    pub voter: Account<'info, Voter>,

    #[account(mut,
        has_one = realm,
        has_one = owner)]
    pub proposal: Account<'info, Proposal>,
}

pub fn handler(ctx: Context<EditProposal>, name: String, description: String) -> ProgramResult {
    let content = ctx.accounts.proposal.deref_mut().content_mut();
    content.name = name;
    content.description = description;
    Ok(())
}
