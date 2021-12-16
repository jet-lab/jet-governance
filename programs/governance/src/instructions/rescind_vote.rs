use anchor_lang::{AccountsClose, prelude::*};
use crate::{state::voter::Voter, state::voter::VoteRecord, state::proposal::Proposal};


#[derive(Accounts)]
pub struct RescindVote<'info> {
    /// The user with authority over the voter account.
    pub owner: Signer<'info>,

    pub realm: AccountInfo<'info>,

    #[account(mut,
        has_one = owner,
        has_one = realm)]
    pub voter: Account<'info, Voter>,

    #[account(mut, has_one = realm)]
    pub proposal: Account<'info, Proposal>,

    #[account(mut,
        has_one = voter,
        has_one = proposal)]
    pub vote_record: Account<'info, VoteRecord>,
}

pub fn handler(ctx: Context<RescindVote>) -> ProgramResult {
    let vote_record = &ctx.accounts.vote_record;
    let proposal = &mut ctx.accounts.proposal;
    let voter = &mut ctx.accounts.voter;
    proposal.vote_mut().rescind(vote_record.vote, vote_record.weight);
    voter.active_votes -= 1;
    vote_record.close(ctx.accounts.owner.to_account_info())?;
    Ok(())
}
