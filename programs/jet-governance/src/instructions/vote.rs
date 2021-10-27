use anchor_lang::prelude::*;
use crate::{state::proposal::Proposal, state::{Vote, voter::VoteRecord}, state::voter::Voter};


#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct VoteAccounts<'info> {
    /// The user with authority over the voter account.
    #[account(signer)]
    pub owner: AccountInfo<'info>,

    pub realm: AccountInfo<'info>,

    #[account(
        has_one = owner,
        has_one = realm)]
    pub voter: ProgramAccount<'info, Voter>,

    #[account(mut)]
    pub proposal: ProgramAccount<'info, Proposal>,

    #[account(init,
        seeds = [
            b"vote-record".as_ref(),
            owner.key().as_ref(),
            proposal.key().as_ref()
        ],
        bump = bump,
        space = 8 + std::mem::size_of::<VoteRecord>(),
        payer = owner)]
    pub vote_record: ProgramAccount<'info, VoteRecord>,
    
    /// Required to init account
    pub system_program: AccountInfo<'info>,
}

pub fn handler(ctx: Context<VoteAccounts>, vote: Vote) -> ProgramResult {
    let vote_record = &mut ctx.accounts.vote_record;
    let proposal = &mut ctx.accounts.proposal;
    let voter = &mut ctx.accounts.voter;
    vote_record.proposal = proposal.key();
    vote_record.owner = ctx.accounts.owner.key();
    vote_record.vote = vote;
    proposal.state.vote(vote, voter.deposited);
    voter.active_votes += 1;
    Ok(())
}
