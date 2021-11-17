use anchor_lang::prelude::*;



#[account]
#[derive(Debug)]
pub struct Voter {
    pub realm: Pubkey,
    pub owner: Pubkey,
    pub deposited: u64,
    pub active_votes: u8,
}


#[account]
pub struct VoteRecord {
    pub proposal: Pubkey,
    pub owner: Pubkey,
    pub weight: u64,
    pub vote: Vote2,
}


#[derive(AnchorDeserialize, AnchorSerialize, Eq, PartialEq, Debug, Clone, Copy)]
pub enum Vote2 { // anchor bug: cannot call this Vote
    Yes,
    No,
    Abstain,
}
