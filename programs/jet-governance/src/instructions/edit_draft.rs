use std::ops::DerefMut;

use anchor_lang::prelude::*;
use crate::state::voter::Voter;
use crate::state::proposal::Proposal;


#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct EditDraft<'info> {
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

pub fn handler(
    ctx: Context<EditDraft>,
    name: String,
    description: String,
) -> ProgramResult {
    let content = ctx.accounts.proposal.deref_mut().content_mut();
    content.name = name;
    content.description = description;
    Ok(())
}
