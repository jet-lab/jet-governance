use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use itertools::Itertools;
use solana_program::{instruction::Instruction, system_program, sysvar};
use spl_governance::{
    instruction::GovernanceInstruction,
    state::vote_record::{get_vote_record_address, Vote, VoteChoice},
};

use crate::{ErrorCode, SplGovernance};

#[derive(Accounts)]
pub struct VoteMany<'info> {
    /// The owner of the TokenOwnerRecord
    /// CHECK: by spl governance
    pub owner: UncheckedAccount<'info>,

    /// CHECK: by spl governance
    pub realm: UncheckedAccount<'info>,

    /// CHECK: by spl governance
    pub governance: UncheckedAccount<'info>,

    /// CHECK: by spl governance
    #[account(mut)]
    pub voter_token_owner_record: UncheckedAccount<'info>,

    /// CHECK: by spl governance
    pub governance_authority: Signer<'info>,

    /// CHECK: by spl governance
    pub governing_token_mint: UncheckedAccount<'info>,

    /// CHECK: by spl governance
    pub realm_config: UncheckedAccount<'info>,

    /// CHECK: by spl governance
    pub voter_weight_record: UncheckedAccount<'info>,

    /// CHECK: by spl governance
    pub max_voter_weight_record: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub governance_program: Program<'info, SplGovernance>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    // remaining accounts: (mut proposal, mut proposal_owner_record, mut vote_record)
}

impl<'info> VoteMany<'info> {
    fn cast_vote(
        &self,
        proposal: AccountInfo<'info>,
        vote_record: AccountInfo<'info>,
        proposal_owner_record: AccountInfo<'info>,
        vote: Vote,
    ) -> Result<()> {
        // no clue why, but i get VoteAlreadyExists with vote_record.key instead of this function
        let vote_record_address = get_vote_record_address(
            &SplGovernance::id(),
            proposal.key,
            self.voter_token_owner_record.key,
        );
        let ix = Instruction {
            program_id: SplGovernance::id(),
            accounts: vec![
                AccountMeta::new_readonly(*self.realm.key, false),
                AccountMeta::new_readonly(*self.governance.key, false),
                AccountMeta::new(*proposal.key, false),
                AccountMeta::new(*proposal_owner_record.key, false),
                AccountMeta::new(*self.voter_token_owner_record.key, false),
                AccountMeta::new_readonly(*self.governance_authority.key, true),
                AccountMeta::new(vote_record_address, false),
                AccountMeta::new_readonly(*self.governing_token_mint.key, false),
                AccountMeta::new(*self.payer.key, true),
                AccountMeta::new_readonly(system_program::id(), false),
                AccountMeta::new_readonly(*self.realm_config.key, false),
                AccountMeta::new_readonly(*self.voter_weight_record.key, false),
                AccountMeta::new_readonly(*self.max_voter_weight_record.key, false),
                AccountMeta::new_readonly(sysvar::rent::id(), false),
                AccountMeta::new_readonly(sysvar::clock::id(), false),
            ],
            data: GovernanceInstruction::CastVote { vote }
                .try_to_vec()
                .unwrap(),
        };

        invoke(
            &ix,
            &[
                // self.governance_program.to_account_info(),
                self.realm.to_account_info(),
                self.realm.to_account_info(),
                self.governance.to_account_info(),
                proposal,
                // self.proposal_owner_record.to_account_info(),
                proposal_owner_record,
                self.voter_token_owner_record.to_account_info(),
                self.governance_authority.to_account_info(),
                vote_record,
                self.governing_token_mint.to_account_info(),
                self.payer.to_account_info(),
                self.system_program.to_account_info(),
                self.realm_config.to_account_info(),
                self.voter_weight_record.to_account_info(),
                self.max_voter_weight_record.to_account_info(),
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
    if ctx.remaining_accounts.len() % 3 != 0 || ctx.remaining_accounts.len() / 3 != votes.len() {
        return err!(ErrorCode::ProposalsAndVotesMisaligned);
    }
    ctx.remaining_accounts
        .iter()
        .chunks(3)
        .into_iter()
        .map(|c| {
            let c = c.collect::<Vec<_>>();
            (c[0], c[1], c[2])
        })
        .zip(votes)
        .try_for_each(
            |((proposal, proposal_owner_record, vote_record_address), vote)| {
                msg!("{:?}", vote);
                ctx.accounts.cast_vote(
                    proposal.clone(),
                    proposal_owner_record.clone(),
                    vote_record_address.clone(),
                    // Vote::Approve(vec![VoteChoice {
                    //     rank: 1,
                    //     weight_percentage: 100,
                    // }]),
                    vote.into(),
                )
            },
        )
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub enum GolfVote {
    Yes,
    No,
}

impl From<GolfVote> for Vote {
    fn from(golf: GolfVote) -> Vote {
        match golf {
            GolfVote::Yes => Vote::Approve(vec![VoteChoice {
                rank: 0,
                weight_percentage: 100,
            }]),
            GolfVote::No => Vote::Deny,
        }
    }
}
