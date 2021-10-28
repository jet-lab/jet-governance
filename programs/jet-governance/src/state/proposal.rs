use anchor_lang::prelude::*;
use solana_program::clock::Slot;
use super::Vote2;


#[account]
pub struct Proposal {
    pub realm: Pubkey,
    pub owner: Pubkey,
    pub name: String,
    pub description: String,
    pub created_slot: u64,
    pub state: ProposalState,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct ProposalState {
    count: VoteCount,
    activate: Option<Slot>,
    finalize: Option<Slot>,
}

impl ProposalState {
    pub fn new(activate: Option<Slot>, finalize: Option<Slot>) -> ProposalState {
        ProposalState {
            count: VoteCount::new(),
            activate,
            finalize,
        }
    }

    pub fn activate(&mut self, slot: Option<Slot>) {
        if let Some(activation_time) = self.activate { 
            if activation_time <= Clock::get().unwrap().slot {
                panic!("Cannot modify the activation time of a proposal that was already activated.");
            }
        }
        self.activate = slot;
    }

    pub fn finalize(&mut self, slot: Option<Slot>) {
        // todo restrictions?
        self.finalize = slot;
    }

    pub fn vote(&mut self, vote: Vote2, weight: u64) {
        self.edit(vote, weight, u64::checked_add)
    }

    pub fn rescind(&mut self, vote: Vote2, weight: u64) {
        self.edit(vote, weight, u64::checked_sub)
    }

    fn edit<F: Fn(u64, u64) -> Option<u64>>(
        &mut self, vote: Vote2, weight: u64, op: F
    ) {
        if self.votable() {
            match vote {
                Vote2::Yes => self.count.yes = op(self.count.yes, weight).unwrap(),
                Vote2::No => self.count.no = op(self.count.no, weight).unwrap(),
                Vote2::Abstain => self.count.abstain = op(self.count.abstain, weight).unwrap(),
            }
        }
    }

    fn votable(&self) -> bool {
        self.status() == ProposalStatus::Active
    }

    fn status(&self) -> ProposalStatus {
        let current_slot = Clock::get().unwrap().slot;
        let activated = self.activated(current_slot);
        let finalized = self.finalized(current_slot);
        if !activated && !finalized {
            ProposalStatus::Draft
        } else if activated && !finalized {
            ProposalStatus::Active
        } else if activated && finalized {
            ProposalStatus::Closed
        } else {
            panic!("no status found for activated {} and finalized {}", activated, finalized);
        }
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
    pub yes: u64,
    pub no: u64,
    pub abstain: u64,
}

impl VoteCount {
    pub fn new() -> VoteCount {
        VoteCount {
            yes: 0,
            no: 0,
            abstain: 0,
        }
    }
}

#[derive(Eq, PartialEq)]
pub enum ProposalStatus {
    Draft,
    Active,
    Closed,
}

// // pub enum ProposalStateTransition

#[derive(AnchorDeserialize, AnchorSerialize, Eq, PartialEq, Debug, Clone, Copy)]
pub enum ProposalEvent {
    Activate,
    Finalize,
}


// pub struct ProposalState {
//     editable: bool,
//     votable: bool,
//     events: [(ProposalStatus, u64); 2]
// }

// fn transition(previous_state: ProposalStatus, next_state: ProposalStatus) {
//     Transition {}
// }