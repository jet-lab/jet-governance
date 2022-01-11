use anchor_lang::prelude::*;

declare_id!("JPALXR88jy2fG3miuu4n3o8Jef4K2Cgc3Uypr3Y8RNX");

/// Hardcoded address of the authority that can authenticate users
mod authority {
    use super::*;

    declare_id!("JPALXR88jy2fG3miuu4n3o8Jef4K2Cgc3Uypr3Y8RNX");
}

#[account]
#[derive(Default)]
pub struct UserAuthentication {
    /// The relevant user address
    pub owner: Pubkey,

    /// Whether or not the authentication workflow for the user has
    /// already been completed.
    pub complete: bool,

    /// Whether or not the user is allowed to access the facilities
    /// requiring the authentication workflow.
    pub allowed: bool,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CreateUserAuthentication<'info> {
    /// The user address to be authenticated
    user: Signer<'info>,

    /// The address paying any rent costs
    #[account(mut)]
    payer: Signer<'info>,

    /// The authentication account to be created
    #[account(init,
              seeds = [user.key().as_ref()],
              bump = bump,
              payer = payer)]
    auth: Account<'info, UserAuthentication>,

    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Authenticate<'info> {
    /// The authentication account for the relevant user to be authenticated
    #[account(mut)]
    auth: Account<'info, UserAuthentication>,

    /// The authority that can authenticate users
    #[cfg_attr(feature = "enforce-authority", account(address = authority::ID))]
    #[cfg(feature = "enforce-authority")]
    authority: Signer<'info>,

    #[cfg(not(feature = "enforce-authority"))]
    authority: UncheckedAccount<'info>,
}

#[program]
pub mod jet_auth {
    use super::*;

    /// Create a new account that can be used to identify that a
    /// wallet/address is properly authenticated to perform protected actions.
    pub fn create_user_auth(ctx: Context<CreateUserAuthentication>, _bump: u8) -> ProgramResult {
        let auth = &mut ctx.accounts.auth;

        auth.owner = ctx.accounts.user.key();
        auth.complete = false;
        auth.allowed = false;

        Ok(())
    }

    /// Authenticate a user address
    pub fn authenticate(ctx: Context<Authenticate>) -> ProgramResult {
        let auth = &mut ctx.accounts.auth;

        auth.complete = true;
        auth.allowed = true;

        Ok(())
    }
}
