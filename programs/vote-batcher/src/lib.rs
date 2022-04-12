use anchor_lang::prelude::*;
use solana_program::pubkey;

declare_id!("EaK4h4qn9BDoA5taao5F5E3E3MK4HKzhV9EnVsqYr5oJ");

mod instructions;
use instructions::*;

#[program]
pub mod jet_vote_batcher {
    use super::*;

    pub fn vote_many<'info>(
        ctx: Context<'_, '_, '_, 'info, VoteMany<'info>>,
        votes: Vec<SimpleVote>,
    ) -> Result<()> {
        instructions::vote_many::handler(ctx, votes)
    }

    pub fn relinquish_many<'info>(
        ctx: Context<'_, '_, '_, 'info, RelinquishMany<'info>>,
    ) -> Result<()> {
        instructions::relinquish_many::handler(ctx)
    }
}

pub use error::ErrorCode;

mod error {
    use super::*;

    #[error_code(offset = 0)]
    #[derive(Eq, PartialEq)]
    pub enum ErrorCode {
        #[msg("Inconsistent amounts of proposal accounts, vote record accounts, or votes")]
        ProposalsAndVotesMisaligned,
    }
}

#[derive(Copy, Clone)]
pub struct SplGovernance;

impl Id for SplGovernance {
    fn id() -> Pubkey {
        pubkey!("JPGov2SBA6f7XSJF5R4Si5jEJekGiyrwP2m7gSEqLUs")
    }
}
