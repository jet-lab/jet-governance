use anchor_lang::{AccountsClose, prelude::*};
use crate::{state::voter::Voter, state::voter::VoteRecord, state::proposal::Proposal};


#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Rescind<'info> {
    /// The user with authority over the voter account.
    #[account(signer)]
    pub owner: AccountInfo<'info>,

    pub realm: AccountInfo<'info>,

    #[account(mut,
        has_one=owner,
        has_one=realm,
        seeds = [
            b"voter".as_ref(),
            owner.key().as_ref(),
            realm.key().as_ref()
        ],
        bump = bump)]
    pub voter: ProgramAccount<'info, Voter>,

    #[account(mut)]
    pub proposal: ProgramAccount<'info, Proposal>,

    #[account(mut,
        seeds = [
            b"vote-record".as_ref(),
            owner.key().as_ref(),
            proposal.key().as_ref()
        ],
        bump = bump)]
    pub vote_record: ProgramAccount<'info, VoteRecord>,
}

pub fn handler(ctx: Context<Rescind>) -> ProgramResult {
    let vote_record = &ctx.accounts.vote_record;
    let proposal = &mut ctx.accounts.proposal;
    let voter = &mut ctx.accounts.voter;
    proposal.state.rescind(vote_record.vote, vote_record.weight);
    voter.active_votes -= 1;
    vote_record.close(ctx.accounts.owner.to_account_info())?;
    Ok(())
}
