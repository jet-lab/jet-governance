use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
pub struct AirdropClaimVerify<'info> {
    /// The airdrop to claim from
    #[account(has_one = authority)]
    pub airdrop: AccountLoader<'info, Airdrop>,

    /// The claim to verify
    #[account(mut, has_one = airdrop)]
    pub claim: Account<'info, AirdropClaim>,

    /// The authority for the airdrop, which is allowed to verify
    pub authority: Signer<'info>,
}

pub fn airdrop_claim_verify_handler(ctx: Context<AirdropClaimVerify>) -> ProgramResult {
    let claim = &mut ctx.accounts.claim;

    claim.verified = true;

    Ok(())
}
