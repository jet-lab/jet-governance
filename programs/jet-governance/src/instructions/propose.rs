use anchor_lang::prelude::*;
use crate::state::voter::Voter;
use crate::state::proposal::Proposal;


#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Propose<'info> {
    /// The user with authority over the proposal.
    #[account(signer)]
    pub owner: AccountInfo<'info>,

    pub realm: AccountInfo<'info>,

    #[account(
        has_one=owner,
        has_one=realm)]
    pub voter: ProgramAccount<'info, Voter>,

    #[account(init,
        space = 8 + std::mem::size_of::<Proposal>(),
        payer = owner)]
    pub proposal: ProgramAccount<'info, Proposal>,

    //. Required to init account
    pub system_program: AccountInfo<'info>,
}

pub fn handler(ctx: Context<Propose>) -> ProgramResult {
    Ok(())
}

struct JobResult {
    success: bool,
    jobs_complete: u64,
}

fn aggregate(results: &[JobResult]) -> JobResult {
    JobResult {
        success: results.iter().all(|r| r.success),
        jobs_complete: results.iter().map(|r| r.jobs_complete).sum(),
    }
}
