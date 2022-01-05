use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct AirdropClaimBegin<'info> {
    /// The airdrop to claim from
    #[account(constraint = airdrop.load().unwrap().has_recipient(&entitled.key()))]
    pub airdrop: AccountLoader<'info, Airdrop>,

    /// The account to use for claiming, which can be used for any
    /// precondition checks needed for the recipient.
    #[account(init,
              seeds = [
                  entitled.key().as_ref(),
                  airdrop.key().as_ref(),
              ],
              bump = bump,
              payer = payer)]
    pub claim: Account<'info, AirdropClaim>,

    /// The address entitled to the airdrop, which must sign to claim
    pub entitled: Signer<'info>,

    /// The address paying the rent
    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn airdrop_claim_begin_handler(ctx: Context<AirdropClaimBegin>, _bump: u8) -> ProgramResult {
    let claim = &mut ctx.accounts.claim;

    claim.airdrop = ctx.accounts.airdrop.key();
    claim.recipient = ctx.accounts.entitled.key();
    claim.verified = false;

    Ok(())
}
