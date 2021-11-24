use std::ops::DerefMut;

use anchor_lang::prelude::*;
use crate::{state::proposal::Proposal, state::voter::{Vote2, VoteRecord}, state::voter::Voter};


#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct ChangeVote<'info> {
    /// The user with authority over the voter account.
    #[account(signer)]
    pub owner: AccountInfo<'info>,

    pub realm: AccountInfo<'info>,

    #[account(
        has_one = owner,
        has_one = realm)]
    pub voter: ProgramAccount<'info, Voter>,

    #[account(mut, has_one = realm)]
    pub proposal: ProgramAccount<'info, Proposal>,

    #[account(mut,
        has_one = voter,
        has_one = proposal)]
    pub vote_record: ProgramAccount<'info, VoteRecord>,
}

pub fn handler(ctx: Context<ChangeVote>, vote: Vote2) -> ProgramResult {
    let vote_record = ctx.accounts.vote_record.deref_mut();
    let proposal = ctx.accounts.proposal.deref_mut();
    let voter = ctx.accounts.voter.deref_mut();
    proposal.vote_mut().rescind(vote_record.vote, vote_record.weight);
    proposal.vote_mut().add(vote, voter.deposited);
    vote_record.weight = voter.deposited;
    vote_record.vote = vote;
    Ok(())
}
