use anchor_lang::prelude::*;

#[account]
pub struct Distribution {
    /// The address of this distribution account
    pub address: Pubkey,

    /// The authority that can manage this distribution.
    pub authority: Pubkey,

    /// The account with the tokens to be distributed
    pub vault: Pubkey,

    /// The bump seed for the vault account
    pub vault_bump: [u8; 1],

    /// The account the rewards are distributed into
    pub target_account: Pubkey,

    /// The total amount of tokens to be distributed
    pub target_amount: u64,

    /// The amount of tokens already distributed
    pub distributed: u64,

    /// The time after which rewards will start to be distributed
    pub begin_at: u64,

    /// The time the distribution will be complete by
    pub end_at: u64,

    /// The type of distribution
    pub kind: DistributionKind,
}

impl Distribution {
    pub fn vault_signer_seeds(&self) -> [&[u8]; 3] {
        [
            self.address.as_ref(),
            b"vault".as_ref(),
            self.vault_bump.as_ref(),
        ]
    }

    pub fn distribute(&mut self, timestamp: u64) -> u64 {
        let distributed = self.distributed;
        self.distributed = self.distributed_amount(timestamp);

        let to_distribute = self.distributed.checked_sub(distributed).unwrap();

        to_distribute
    }

    pub fn distributed_amount(&self, timestamp: u64) -> u64 {
        match self.kind {
            DistributionKind::Linear => self.distributed_amount_linear(timestamp),
        }
    }

    fn distributed_amount_linear(&self, timestamp: u64) -> u64 {
        let range = (self.end_at - self.begin_at) as u128;
        let remaining = (self.end_at - timestamp) as u128;

        let distributed = (remaining * self.target_amount as u128) / range;
        assert!(distributed < std::u64::MAX as u128);

        distributed as u64
    }
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub enum DistributionKind {
    Linear,
}
