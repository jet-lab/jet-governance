use super::Vote2;
use anchor_lang::{prelude::*, solana_program::clock::UnixTimestamp};

#[account]
pub struct Proposal {
    pub realm: Pubkey,
    pub owner: Pubkey,
    created_timestamp: UnixTimestamp,
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
        activate: Option<UnixTimestamp>,
        finalize: Option<UnixTimestamp>,
    ) -> Proposal {
        Proposal {
            realm,
            owner,
            created_timestamp: Clock::get().unwrap().unix_timestamp,
            content: ProposalContent { name, description },
            lifecycle: ProposalLifecycle { activate, finalize },
            count: VoteCount::new(),
        }
    }

    pub fn content(&self) -> &ProposalContent {
        &self.content
    }

    pub fn vote(&self) -> &VoteCount {
        &self.count
    }

    pub fn content_mut(&mut self) -> &mut ProposalContent {
        if self
            .lifecycle
            .activated(Clock::get().unwrap().unix_timestamp)
            || self
                .lifecycle
                .finalized(Clock::get().unwrap().unix_timestamp)
        {
            panic!("Proposal is not editable.")
        }
        &mut self.content
    }

    pub fn vote_mut(&mut self) -> &mut VoteCount {
        let current_timestamp = Clock::get().unwrap().unix_timestamp;
        if !self.lifecycle.activated(current_timestamp)
            || self.lifecycle.finalized(current_timestamp)
        {
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
    activate: Option<UnixTimestamp>,
    finalize: Option<UnixTimestamp>,
}

impl ProposalLifecycle {
    pub fn activate(&mut self, timestamp: Option<UnixTimestamp>) {
        if self.activated(Clock::get().unwrap().unix_timestamp)
            || self.finalized(Clock::get().unwrap().unix_timestamp)
        {
            panic!("Cannot modify the activation time of a proposal that was already activated or finalized.");
        }
        self.activate = timestamp;
    }

    pub fn finalize(&mut self, timestamp: Option<UnixTimestamp>) {
        if self.finalized(Clock::get().unwrap().unix_timestamp) {
            panic!("Cannot modify the finalization time of a proposal that was already finalized.");
        }
        self.finalize = timestamp;
    }

    pub fn activated(&self, current_timestamp: UnixTimestamp) -> bool {
        self.done(self.activate, current_timestamp)
    }

    pub fn finalized(&self, current_timestamp: UnixTimestamp) -> bool {
        self.done(self.finalize, current_timestamp)
    }

    fn done(&self, it: Option<UnixTimestamp>, current_timestamp: UnixTimestamp) -> bool {
        match it {
            Some(timestamp) => current_timestamp >= timestamp,
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

    pub fn yes(&self) -> u64 {
        self.yes
    }
    pub fn no(&self) -> u64 {
        self.no
    }
    pub fn abstain(&self) -> u64 {
        self.abstain
    }

    pub fn add(&mut self, vote: Vote2, weight: u64) {
        self.edit(vote, weight, u64::checked_add)
    }

    pub fn rescind(&mut self, vote: Vote2, weight: u64) {
        self.edit(vote, weight, u64::checked_sub)
    }

    fn edit<F: Fn(u64, u64) -> Option<u64>>(&mut self, vote: Vote2, weight: u64, op: F) {
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
