#![cfg_attr(feature = "no-entrypoint", allow(dead_code))]

pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use instructions::*;
use state::*;

declare_id!("5TBwvU5xoA13fzmZgWVgFBUmBz1YCdiq2AshDZpPn3AL");

#[program]
mod jet_governance {
    use super::*;

    pub fn init_realm(ctx: Context<InitRealm>, bump: InitRealmBumpSeeds) -> ProgramResult {
        init_realm::handler(ctx, bump)
    }

    pub fn init_voter(ctx: Context<InitVoter>, bump: u8) -> ProgramResult {
        init_voter::handler(ctx, bump)
    }

    pub fn deposit_token(ctx: Context<DepositToken>, amount: u64) -> ProgramResult {
        deposit_token::handler(ctx, amount)
    }

    pub fn withdraw_token(ctx: Context<WithdrawToken>, bump: u8, amount: u64) -> ProgramResult {
        withdraw_token::handler(ctx, bump, amount)
    }

    pub fn init_proposal(
        ctx: Context<InitProposal>,
        name: String,
        description: String,
        activate: Time,
        finalize: Time,
    ) -> ProgramResult {
        init_proposal::handler(ctx, name, description, activate, finalize)
    }

    pub fn edit_proposal(
        ctx: Context<EditProposal>,
        name: String,
        description: String,
    ) -> ProgramResult {
        edit_proposal::handler(ctx, name, description)
    }

    pub fn cast_vote(ctx: Context<CastVote>, bump: u8, vote: Vote2) -> ProgramResult {
        cast_vote::handler(ctx, bump, vote)
    }

    pub fn rescind_vote(ctx: Context<RescindVote>) -> ProgramResult {
        rescind_vote::handler(ctx)
    }

    pub fn change_vote(ctx: Context<ChangeVote>, vote: Vote2) -> ProgramResult {
        change_vote::handler(ctx, vote)
    }

    pub fn transition_proposal(
        ctx: Context<TransitionProposal>,
        event: ProposalEvent,
        when: Time,
    ) -> ProgramResult {
        transition_proposal::handler(ctx, event, when)
    }
}
