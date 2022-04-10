use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use itertools::Itertools;

use crate::{ErrorCode, SplGovernance};

#[derive(Accounts)]
pub struct RelinquishMany<'info> {
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
    /// CHECK: by spl governance
    pub beneficiary: UncheckedAccount<'info>,

    pub governance_program: Program<'info, SplGovernance>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    // remaining accounts: [(mut proposal, mut vote record address)]
}

impl<'info> RelinquishMany<'info> {
    fn relinquish_vote(
        &self,
        proposal: AccountInfo<'info>,
        vote_record_address: AccountInfo<'info>,
    ) -> Result<()> {
        let ix = spl_governance::instruction::relinquish_vote(
            &SplGovernance::id(),
            self.governance.key,
            proposal.key,
            self.voter_token_owner_record.key,
            self.governing_token_mint.key,
            Some(*self.governance_authority.key),
            Some(*self.beneficiary.key),
        );

        invoke(
            &ix,
            &[
                self.governance.to_account_info(),
                proposal,
                self.voter_token_owner_record.to_account_info(),
                vote_record_address,
                self.governing_token_mint.to_account_info(),
                self.governance_authority.to_account_info(),
                self.beneficiary.to_account_info(),
            ],
        )
        .map_err(Into::into)
    }
}

pub fn handler<'info>(ctx: Context<'_, '_, '_, 'info, RelinquishMany<'info>>) -> Result<()> {
    if ctx.remaining_accounts.len() % 2 != 0 {
        return err!(ErrorCode::ProposalsAndVotesMisaligned);
    }
    ctx.remaining_accounts
        .iter()
        .chunks(2)
        .into_iter()
        .try_for_each(|mut c| {
            let (proposal, vote_record_address) = (c.next().unwrap(), c.next().unwrap());
            ctx.accounts
                .relinquish_vote(proposal.clone(), vote_record_address.clone())
        })
}