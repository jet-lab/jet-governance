use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Token};

use crate::state::*;

#[derive(Accounts)]
pub struct CloseAirdrop<'info> {
    /// The airdrop to claim from
    #[account(mut,
              has_one = authority,
              has_one = reward_vault,
              close = receiver)]
    pub airdrop: AccountLoader<'info, Airdrop>,

    #[account(mut)]
    pub reward_vault: AccountInfo<'info>,

    /// The authority to make changes to the airdrop, which must sign
    pub authority: Signer<'info>,

    /// The account to received the rent recovered
    pub receiver: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

impl<'info> CloseAirdrop<'info> {
    fn close_context(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            CloseAccount {
                account: self.reward_vault.to_account_info(),
                destination: self.receiver.to_account_info(),
                authority: self.reward_vault.to_account_info(),
            },
        )
    }
}

pub fn close_airdrop_handler(ctx: Context<CloseAirdrop>) -> ProgramResult {
    let airdrop = ctx.accounts.airdrop.load()?;

    token::close_account(
        ctx.accounts
            .close_context()
            .with_signer(&[&airdrop.signer_seeds()]),
    )?;

    Ok(())
}
