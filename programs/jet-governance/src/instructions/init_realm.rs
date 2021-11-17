use std::ops::DerefMut;

use anchor_lang::prelude::*;
use crate::state::realm::Realm;


#[derive(Accounts)]
#[instruction(bump: InitRealmBumpSeeds)]
pub struct InitRealm<'info> {
    // newly created realm - key provided by initializer: not a PDA
    #[account(init,
        space = 8 + std::mem::size_of::<Realm>(),
        payer = owner)]
    pub realm: ProgramAccount<'info, Realm>,

    // account with permission to modify realm configuration
    pub owner: AccountInfo<'info>,

    // PDA that can sign on behalf of the realm
    #[account(init,
        seeds = [
            b"realm-authority".as_ref(),
            realm.key().as_ref()
        ],
        bump = bump.authority,
        space = 8,
        payer = owner)]
    pub authority: AccountInfo<'info>,

    // Account to store deposited governance tokens
    #[account(init,
        seeds = [
            b"vault".as_ref(),
            realm.key().as_ref()
        ],
        bump = bump.vault,
        token::mint = governance_token_mint,
        token::authority = authority,
        payer = owner)]
    pub vault: AccountInfo<'info>,

    /// The mint for the governance token
    pub governance_token_mint: AccountInfo<'info>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: AccountInfo<'info>,
    
    //. Required to init account
    pub system_program: AccountInfo<'info>,

    pub rent: Sysvar<'info, Rent>,
}


#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct InitRealmBumpSeeds {
    pub authority: u8,
    pub vault: u8,
}


pub fn handler(ctx: Context<InitRealm>) -> ProgramResult {
    let realm = ctx.accounts.realm.deref_mut();
    realm.owner = ctx.accounts.owner.key();
    realm.authority = ctx.accounts.authority.key();
    realm.vault = ctx.accounts.vault.key();
    Ok(())
}
