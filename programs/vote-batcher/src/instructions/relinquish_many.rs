use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use itertools::Itertools;
use solana_program::instruction::Instruction;
use spl_governance::instruction::GovernanceInstruction;

use crate::{ErrorCode, SplGovernance};

#[derive(Accounts)]
pub struct RelinquishMany<'info> {
    /// The owner of the TokenOwnerRecord
    pub owner: Signer<'info>,

    /// CHECK: by spl governance
    pub realm: UncheckedAccount<'info>,

    /// CHECK: by spl governance
    pub governance: UncheckedAccount<'info>,

    /// CHECK: by spl governance
    #[account(mut)]
    pub voter_token_owner_record: UncheckedAccount<'info>,

    /// CHECK: by spl governance
    pub governance_authority: UncheckedAccount<'info>,

    /// CHECK: by spl governance
    pub governing_token_mint: UncheckedAccount<'info>,

    /// CHECK: by spl governance
    pub realm_config: UncheckedAccount<'info>,

    /// CHECK: by spl governance
    pub voter_weight_record: UncheckedAccount<'info>,

    /// CHECK: by spl governance
    pub max_voter_weight_record: UncheckedAccount<'info>,

    /// CHECK: by spl governance
    #[account(mut)]
    pub beneficiary: UncheckedAccount<'info>,

    pub governance_program: Program<'info, SplGovernance>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    // remaining accounts: (mut proposal, mut vote_record)
}

impl<'info> RelinquishMany<'info> {
    fn relinquish_vote(
        &self,
        proposal: AccountInfo<'info>,
        vote_record: AccountInfo<'info>,
    ) -> Result<()> {
        let ix = Instruction {
            program_id: SplGovernance::id(),
            accounts: vec![
                AccountMeta::new_readonly(*self.governance.key, false),
                AccountMeta::new(*proposal.key, false),
                AccountMeta::new(*self.voter_token_owner_record.key, false),
                AccountMeta::new(*vote_record.key, false),
                AccountMeta::new_readonly(*self.governing_token_mint.key, false),
                AccountMeta::new_readonly(*self.governance_authority.key, true),
                AccountMeta::new(*self.beneficiary.key, false),
            ],
            data: GovernanceInstruction::RelinquishVote {}
                .try_to_vec()
                .unwrap(),
        };

        invoke(
            &ix,
            &[
                self.governance.to_account_info(),
                proposal,
                self.voter_token_owner_record.to_account_info(),
                vote_record,
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
        msg!(
            "expected an even number of remaining accounts, but got {}",
            ctx.remaining_accounts.len()
        );
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
