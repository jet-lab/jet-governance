use anchor_lang::prelude::*;
use solana_program::pubkey;

declare_id!("jHdzmKjaVSf3XEMusqYRg3TeUTmxo5yohX1CRt8Y3SA");

mod instructions;
use instructions::*;


#[program]
pub mod jet_spl_golf {
    use super::*;

    pub fn vote_many<'info>(ctx: Context<'_, '_, '_, 'info, VoteMany<'info>>, votes: Vec<GolfVote>) -> Result<()> {
        instructions::vote_many::handler(ctx, votes)
    }

    pub fn relinquish_many<'info>(ctx: Context<'_, '_, '_, 'info, RelinquishMany<'info>>) -> Result<()> {
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
        pubkey!("JPGovTiAUgyqirerBbXXmfyt3SkHVEcpSAPjRCCSHVx")
    }
}
