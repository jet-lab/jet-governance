use anchor_lang::prelude::*;
use anchor_spl::token;

use crate::state::*;

#[derive(Accounts)]
pub struct FinalizeAirdrop<'info> {
    /// The airdrop to finalize
    #[account(mut,
              has_one = authority,
              has_one = reward_vault)]
    pub airdrop: AccountLoader<'info, Airdrop>,

    /// The token account holding the reward tokens to be distributed
    pub reward_vault: AccountInfo<'info>,

    /// The authority to make changes to the airdrop, which must sign
    pub authority: Signer<'info>,
}

pub fn finalize_airdrop_handler(ctx: Context<FinalizeAirdrop>) -> ProgramResult {
    let mut airdrop = ctx.accounts.airdrop.load_mut()?;
    let vault_balance = token::accessor::amount(&ctx.accounts.reward_vault)?;

    airdrop.finalize(vault_balance)?;

    Ok(())
}
