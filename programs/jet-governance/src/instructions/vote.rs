use std::ops::DerefMut;

use anchor_lang::prelude::*;
use crate::{state::proposal::Proposal, state::{Vote2, voter::VoteRecord}, state::voter::Voter};


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

pub fn handler(ctx: Context<VoteAccounts>, vote: Vote2) -> ProgramResult {
    let proposal = &mut ctx.accounts.proposal;
    let voter = &mut ctx.accounts.voter;
    *ctx.accounts.vote_record.deref_mut() = VoteRecord {
        proposal: proposal.key(),
        owner: ctx.accounts.owner.key(),
        vote: vote,
        weight: voter.deposited,
    };
    proposal.vote().add(vote, voter.deposited);
    voter.active_votes += 1;
    Ok(())
}
