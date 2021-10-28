#![cfg_attr(feature = "no-entrypoint", allow(dead_code))]

pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use instructions::*;

use state::proposal::ProposalEvent;
use state::voter::Vote2;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");


#[program]
mod jet_governance {
    use super::*;

    pub fn init_realm(ctx: Context<InitializeRealm>) -> ProgramResult {
        init_realm::handler(ctx)
    }

    pub fn init_voter(ctx: Context<InitializeVoter>) -> ProgramResult {
        init_voter::handler(ctx)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> ProgramResult {
        deposit::handler(ctx, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> ProgramResult {
        withdraw::handler(ctx, amount)
    }

    pub fn propose(ctx: Context<Propose>, name: String, description: String, activate: Time, finalize: Time) -> ProgramResult {
        propose::handler(ctx, name, description, activate, finalize)
    }

    pub fn vote(ctx: Context<VoteAccounts>, vote: Vote2) -> ProgramResult {
        vote::handler(ctx, vote)
    }

    pub fn rescind(ctx: Context<Rescind>) -> ProgramResult {
        rescind::handler(ctx)
    }

    pub fn transition_proposal(ctx: Context<TransitionProposal>, event: ProposalEvent, when: Time) -> ProgramResult {
        transition_proposal::handler(ctx, event, when)
    }
}


// pub struct VoteRecord {
//     pub voter: Pubkey,
//     pub vote: Vote,
//     pub weight: u64,
// }


// macro_rules! anchor_program {
//     ($($name:ident($accounts:ty $(,$param:ident: $param_type:ty)*))*) => {
//         use super::*;
//         $(pub fn $name(ctx: Context<$accounts>, $($param: $param_type),*) -> ProgramResult {
//             $name::handler(ctx, $($param),*)
//         })*
//     };
// }
// pub(crate) use anchor_program;


// #[program]
// mod jet_governance {
//     anchor_program! {
//         init_realm(InitializeRealm)
//         init_voter(InitializeVoter)
//         deposit(Deposit, amount: u64)
//         withdraw(Withdraw, amount: u64)
//         propose(Propose)
//         vote(VoteAccounts, vote: Vote)
//         rescind(Rescind)
//         finalize(Finalize)
//     }
// }
