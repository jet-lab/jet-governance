use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use itertools::Itertools;
use spl_governance::state::vote_record::{Vote, VoteChoice};

use crate::{ErrorCode, SplGovernance};

#[derive(Accounts)]
pub struct VoteMany<'info> {
    /// The owner of the TokenOwnerRecord
    pub owner: Signer<'info>,

    /// The governance realm to deposit votes into
    /// CHECK: by spl governance
    pub realm: UncheckedAccount<'info>,

    /// The governance where the proposal is
    /// CHECK: by spl governance
    pub governance: UncheckedAccount<'info>,

    /// The proposal to vote on
    /// CHECK: by spl governance
    #[account(mut)]
    pub proposal_owner_record: UncheckedAccount<'info>,

    /// The Token Owner Record for the owner of this account
    /// CHECK: by spl governance
    #[account(mut)]
    pub voter_token_owner_record: UncheckedAccount<'info>,

    /// CHECK: by spl governance
    pub governance_authority: UncheckedAccount<'info>,

    /// CHECK: by spl governance
    pub governing_token_mint: UncheckedAccount<'info>,

    /// CHECK: by spl governance
    pub voter_weight_record: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub governance_program: Program<'info, SplGovernance>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    // remaining accounts: (mut proposal, mut vote record address)
}

impl<'info> VoteMany<'info> {
    fn cast_vote(
        &self,
        proposal: AccountInfo<'info>,
        vote_record_address: AccountInfo<'info>,
        vote: Vote,
    ) -> Result<()> {
        let ix = spl_governance::instruction::cast_vote(
            &SplGovernance::id(),
            self.realm.key,
            self.governance.key,
            proposal.key,
            self.proposal_owner_record.key,
            self.voter_token_owner_record.key,
            self.governance_authority.key,
            self.governing_token_mint.key,
            self.payer.key,
            Some(*self.voter_weight_record.key),
            vote,
        );

        invoke(
            &ix,
            &[
                self.realm.to_account_info(),
                self.governance.to_account_info(),
                proposal,
                self.proposal_owner_record.to_account_info(),
                self.voter_token_owner_record.to_account_info(),
                self.governance_authority.to_account_info(),
                vote_record_address,
                self.governing_token_mint.to_account_info(),
                self.payer.to_account_info(),
                self.system_program.to_account_info(),
                self.rent.to_account_info(),
                self.clock.to_account_info(),
            ],
        )
        .map_err(Into::into)
    }
}

pub fn handler<'c, 'info>(
    ctx: Context<'_, '_, 'c, 'info, VoteMany<'info>>,
    votes: Vec<GolfVote>,
) -> Result<()> {
    if ctx.remaining_accounts.len() % 2 != 0 || ctx.remaining_accounts.len() / 2 != votes.len() {
        return err!(ErrorCode::ProposalsAndVotesMisaligned);
    }
    ctx.remaining_accounts
        .iter()
        .chunks(2)
        .into_iter()
        .map(|c| {
            let c = c.collect::<Vec<_>>();
            (c[0], c[1])
        })
        .zip(votes)
        .try_for_each(|((proposal, vote_record_address), vote)| {
            ctx.accounts
                .cast_vote(proposal.clone(), vote_record_address.clone(), vote.into())
        })
}

//// copied from spl governance:

/// Voter choice for a proposal option
/// In the current version only 1) Single choice and 2) Multiple choices proposals are supported
/// In the future versions we can add support for 1) Quadratic voting, 2) Ranked choice voting and 3) Weighted voting
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct GolfVoteChoice {
    /// The rank given to the choice by voter
    /// Note: The filed is not used in the current version
    pub rank: u8,

    /// The voter's weight percentage given by the voter to the choice
    pub weight_percentage: u8,
}

/// User's vote
#[derive(AnchorSerialize, AnchorDeserialize)]
pub enum GolfVote {
    /// Vote approving choices
    Approve(Vec<GolfVoteChoice>),

    /// Vote rejecting proposal
    Deny,
}

impl From<&GolfVoteChoice> for VoteChoice {
    fn from(golf: &GolfVoteChoice) -> VoteChoice {
        VoteChoice {
            rank: golf.rank,
            weight_percentage: golf.weight_percentage,
        }
    }
}

impl From<GolfVote> for Vote {
    fn from(golf: GolfVote) -> Vote {
        match golf {
            GolfVote::Approve(choices) => Vote::Approve(choices.iter().map(|c| c.into()).collect()),
            GolfVote::Deny => Vote::Deny,
        }
    }
}
