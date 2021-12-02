use std::ops::DerefMut;

use anchor_lang::prelude::*;
use crate::{state::proposal::Proposal, state::{Vote2, voter::VoteRecord}, state::voter::Voter, state::realm::Realm};


#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CastVote<'info> {
    /// The user with authority over the voter account.
    pub owner: Signer<'info>,

    pub realm: Account<'info, Realm>,

    #[account(mut,
        has_one = owner,
        has_one = realm)]
    pub voter: Account<'info, Voter>,

    #[account(mut, has_one = realm)]
    pub proposal: Account<'info, Proposal>,

    #[account(init,
             seeds = [
                 b"vote-record".as_ref(),
                 voter.key().as_ref(),
                 proposal.key().as_ref()
             ],
             bump = bump,
             space = 8 + std::mem::size_of::<VoteRecord>(),
             payer = owner)]
    pub vote_record: Account<'info, VoteRecord>,
    
    /// Required to init account
    pub system_program: AccountInfo<'info>,
}

pub fn handler(ctx: Context<CastVote>, _bump: u8, vote: Vote2) -> ProgramResult {
    let voter_key = ctx.accounts.voter.key();
    let proposal_key = ctx.accounts.proposal.key();
    let proposal = ctx.accounts.proposal.deref_mut();
    let voter = ctx.accounts.voter.deref_mut();
    *ctx.accounts.vote_record.deref_mut() = VoteRecord {
        proposal: proposal_key,
        voter: voter_key,
        vote,
        weight: voter.deposited,
    };
    proposal.vote_mut().add(vote, voter.deposited);
    voter.active_votes += 1;
    Ok(())
}
