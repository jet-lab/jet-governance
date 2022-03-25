use anchor_lang::prelude::*;
use anchor_spl::token;

use crate::{state::*, events};

#[derive(Accounts)]
pub struct AirdropFinalize<'info> {
    /// The airdrop to finalize
    #[account(mut,
              has_one = authority,
              has_one = reward_vault)]
    pub airdrop: AccountLoader<'info, Airdrop>,

    /// The token account holding the reward tokens to be distributed
    /// CHECK:
    pub reward_vault: AccountInfo<'info>,

    /// The authority to make changes to the airdrop, which must sign
    pub authority: Signer<'info>,
}

pub fn airdrop_finalize_handler(ctx: Context<AirdropFinalize>) -> Result<()> {
    let mut airdrop = ctx.accounts.airdrop.load_mut()?;
    let vault_balance = token::accessor::amount(&ctx.accounts.reward_vault)?;

    airdrop.finalize(vault_balance)?;

    let info = airdrop.target_info();
    emit!(events::AirdropFinalized {
        airdrop: airdrop.address,
        reward_total: info.reward_total,
        recipients_total: info.recipients_total,
    });

    Ok(())
}
