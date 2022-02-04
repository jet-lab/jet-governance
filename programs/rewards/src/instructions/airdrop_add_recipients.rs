use anchor_lang::prelude::*;

use crate::state::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct AirdropAddRecipientsParams {
    pub start_index: u64,
    pub recipients: Vec<AirdropRecipientParam>,
}

#[derive(Clone, Copy, AnchorSerialize, AnchorDeserialize)]
pub struct AirdropRecipientParam {
    /// The amount to receive
    pub amount: u64,

    /// The address allowed to claim the airdrop amount
    pub recipient: Pubkey,
}

#[derive(Accounts)]
pub struct AirdropAddRecipients<'info> {
    /// The airdrop to add to
    #[account(mut, has_one = authority)]
    pub airdrop: AccountLoader<'info, Airdrop>,

    /// The authority to make changes to the airdrop, which must sign
    pub authority: Signer<'info>,
}

pub fn airdrop_add_recipients_handler(
    ctx: Context<AirdropAddRecipients>,
    params: AirdropAddRecipientsParams,
) -> ProgramResult {
    let mut airdrop = ctx.accounts.airdrop.load_mut()?;

    airdrop.add_recipients(
        params.start_index,
        params
            .recipients
            .into_iter()
            .map(|r| (r.recipient, r.amount)),
    )?;

    Ok(())
}
