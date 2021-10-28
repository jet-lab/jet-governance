use anchor_lang::prelude::*;
use solana_program::clock::Slot;
use super::Vote2;


#[account]
pub struct Proposal {
    pub realm: Pubkey,
    pub owner: Pubkey,
    created_slot: u64,
    content: ProposalContent,
    pub lifecycle: ProposalLifecycle,
    count: VoteCount,
}

impl Proposal {
    pub fn new(
        realm: Pubkey,
        owner: Pubkey,
        name: String,
        description: String,
        activate: Option<Slot>,
        finalize: Option<Slot>
    ) -> Proposal {
        Proposal {
            realm,
            owner,
            created_slot: Clock::get().unwrap().slot,
            content: ProposalContent {
                name,
                description,
            },
            lifecycle: ProposalLifecycle {
                activate,
                finalize,
            },
            count: VoteCount::new(),
        }
    }

    pub fn content(&mut self) -> &mut ProposalContent {
        if !self.lifecycle.activated(Clock::get().unwrap().slot) {
            panic!("Proposal is not editable.")
        }
        &mut self.content
    }

    pub fn vote(&mut self) -> &mut VoteCount {
        let current_slot = Clock::get().unwrap().slot;
        if !self.lifecycle.activated(current_slot) || self.lifecycle.finalized(current_slot) {
            panic!("Proposal is not votable");
        }
        &mut self.count
    }
}


#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct ProposalContent {
    pub name: String,
    pub description: String,
}


#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct ProposalLifecycle {
    activate: Option<Slot>,
    finalize: Option<Slot>,
}

impl ProposalLifecycle {
    pub fn activate(&mut self, slot: Option<Slot>) {
        if self.activated(Clock::get().unwrap().slot) {
            panic!("Cannot modify the activation time of a proposal that was already activated.");
        }
        self.activate = slot;
    }

    pub fn finalize(&mut self, slot: Option<Slot>) {
        if self.finalized(Clock::get().unwrap().slot) {
            panic!("Cannot modify the finalization time of a proposal that was already finalized.");
        }
        self.finalize = slot;
    }

    fn activated(&self, current_slot: Slot) -> bool {
        self.done(self.activate, current_slot)
    }

    fn finalized(&self, current_slot: Slot) -> bool {
        self.done(self.finalize, current_slot)
    }
    
    fn done(&self, it: Option<Slot>, current_slot: Slot) -> bool {
        match it {
            Some(slot) => current_slot >= slot,
            None => false,
        }
    }
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct VoteCount {
    yes: u64,
    no: u64,
    abstain: u64,
}

impl VoteCount {
    pub fn new() -> VoteCount {
        VoteCount {
            yes: 0,
            no: 0,
            abstain: 0,
        }
    }

    pub fn add(&mut self, vote: Vote2, weight: u64) {
        self.edit(vote, weight, u64::checked_add)
    }

    pub fn rescind(&mut self, vote: Vote2, weight: u64) {
        self.edit(vote, weight, u64::checked_sub)
    }

    fn edit<F: Fn(u64, u64) -> Option<u64>>(
        &mut self, vote: Vote2, weight: u64, op: F
    ) {
        match vote {
            Vote2::Yes => self.yes = op(self.yes, weight).unwrap(),
            Vote2::No => self.no = op(self.no, weight).unwrap(),
            Vote2::Abstain => self.abstain = op(self.abstain, weight).unwrap(),
        }
    }
}

#[derive(AnchorDeserialize, AnchorSerialize, Eq, PartialEq, Debug, Clone, Copy)]
pub enum ProposalEvent {
    Activate,
    Finalize,
}
