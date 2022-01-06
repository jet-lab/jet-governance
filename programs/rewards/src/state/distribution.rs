use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Distribution {
    /// The address of this distribution account
    pub address: Pubkey,

    /// The authority that can manage this distribution.
    pub authority: Pubkey,

    /// The account with the tokens to be distributed
    pub vault: Pubkey,

    /// The seed for the address
    pub seed: [u8; 30],

    /// The length of the seed string
    pub seed_len: u8,

    /// The bump seed for the address
    pub bump_seed: [u8; 1],

    /// The account the rewards are distributed into
    pub target_account: Pubkey,

    /// The details on the token distribution
    pub token_distribution: TokenDistribution,
}

impl Distribution {
    pub fn signer_seeds(&self) -> [&[u8]; 2] {
        [
            &self.seed[..self.seed_len as usize],
            self.bump_seed.as_ref(),
        ]
    }
}

impl std::ops::Deref for Distribution {
    type Target = TokenDistribution;

    fn deref(&self) -> &Self::Target {
        &self.token_distribution
    }
}

impl std::ops::DerefMut for Distribution {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.token_distribution
    }
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub enum DistributionKind {
    Linear,
}

impl Default for DistributionKind {
    fn default() -> Self {
        DistributionKind::Linear
    }
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Default)]
pub struct TokenDistribution {
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

impl TokenDistribution {
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
