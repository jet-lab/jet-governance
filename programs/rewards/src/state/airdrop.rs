use anchor_lang::prelude::*;

use jet_proto_proc_macros::assert_size;

use crate::ErrorCode;

#[account(zero_copy)]
pub struct Airdrop {
    /// The address of this account
    pub address: Pubkey,

    /// The token account containing the tokens to be distributed
    /// as the airdrop reward
    pub reward_vault: Pubkey,

    /// The address allowed to make changes to the airdrop metadata
    /// before finalizing.
    pub authority: Pubkey,

    /// The time at which vesting for the claimed tokens begins
    pub vest_start_at: i64,

    /// The time at which vesting for the claimed tokens should be completed
    pub vest_end_at: i64,

    /// The time at which this airdrop expires, and can no longer be claimed
    pub expire_at: i64,

    /// The stake pool that rewards are staked into when claimed
    pub stake_pool: Pubkey,

    /// Settings for airdrops
    pub flags: u64,

    /// A short descriptive text for the airdrop
    pub short_desc: [u8; 31],

    /// The bump seed for the reward vault
    pub vault_bump: [u8; 1],

    /// Storage space for the list of airdrop recipients
    pub target_info: [u8; 400024],
}

impl Airdrop {
    pub fn add_recipients(
        &mut self,
        start_idx: u64,
        to_add: impl Iterator<Item = (Pubkey, u64)>,
    ) -> Result<(), ErrorCode> {
        let target = self.target_info_mut();

        if target.recipients_total != start_idx {
            return Err(ErrorCode::AddOutOfOrder);
        }

        if target.finalized > 0 {
            return Err(ErrorCode::AirdropFinal);
        }

        for (recipient, amount) in to_add {
            target.recipients[target.recipients_total as usize] =
                AirdropTarget { recipient, amount };

            target.recipients_total += 1;
            target.reward_total = target.reward_total.checked_add(amount).unwrap();
        }

        Ok(())
    }

    pub fn has_recipient(&self, recipient: &Pubkey) -> bool {
        self.target_info().get_recipient(recipient).is_ok()
    }

    pub fn finalize(&mut self, vault_balance: u64) -> Result<(), ErrorCode> {
        let target = self.target_info_mut();

        if vault_balance < target.reward_total {
            return Err(ErrorCode::AirdropInsufficientRewardBalance);
        }

        target.finalized = 1;
        Ok(())
    }

    pub fn claim(&mut self, claim: &AirdropClaim) -> Result<u64, ErrorCode> {
        if self.flags().contains(AirdropFlags::VERIFICATION_REQUIRED) && !claim.verified {
            return Err(ErrorCode::ClaimNotVerified);
        }

        let target = self.target_info_mut();
        let entry = target.get_recipient_mut(&claim.recipient)?;
        let amount = entry.amount;

        entry.amount = 0;
        target.reward_total = target.reward_total.checked_sub(amount).unwrap();

        Ok(amount)
    }

    pub fn signer_seeds(&self) -> [&[u8]; 3] {
        [self.address.as_ref(), b"vault".as_ref(), &self.vault_bump]
    }

    pub fn flags(&self) -> AirdropFlags {
        AirdropFlags::from_bits(self.flags).unwrap()
    }

    fn target_info_mut(&mut self) -> &mut AirdropTargetInfo {
        bytemuck::from_bytes_mut(&mut self.target_info)
    }

    fn target_info(&self) -> &AirdropTargetInfo {
        bytemuck::from_bytes(&self.target_info)
    }
}

#[repr(C)]
#[assert_size(400024)]
#[derive(Clone, Copy)]
pub struct AirdropTargetInfo {
    /// The total amount of reward tokens that are claimable by recipients
    pub reward_total: u64,

    /// The total number of airdrop recipients
    pub recipients_total: u64,

    /// Marker to indicate when the airdrop has been finalized
    /// from further edits
    pub finalized: u64,

    /// List of airdrop recipients that can claim tokens
    pub recipients: [AirdropTarget; 10000],
}

impl AirdropTargetInfo {
    fn get_recipient_mut(&mut self, recipient: &Pubkey) -> Result<&mut AirdropTarget, ErrorCode> {
        let recipients = &mut self.recipients[..self.recipients_total as usize];

        let found = recipients
            .binary_search_by_key(recipient, |r: &AirdropTarget| r.recipient)
            .map_err(|_| ErrorCode::RecipientNotFound)?;

        Ok(&mut recipients[found])
    }

    fn get_recipient(&self, recipient: &Pubkey) -> Result<&AirdropTarget, ErrorCode> {
        let recipients = &self.recipients[..self.recipients_total as usize];

        let found = recipients
            .binary_search_by_key(recipient, |r: &AirdropTarget| r.recipient)
            .map_err(|_| ErrorCode::RecipientNotFound)?;

        Ok(&recipients[found])
    }
}

#[repr(C)]
#[assert_size(40)]
#[derive(Clone, Copy)]
pub struct AirdropTarget {
    /// The amount of tokens that the target can claim
    pub amount: u64,

    /// The address allowed to claim the airdrop tokens
    pub recipient: Pubkey,
}

unsafe impl bytemuck::Pod for AirdropTargetInfo {}
unsafe impl bytemuck::Zeroable for AirdropTargetInfo {}

#[account]
#[derive(Default)]
pub struct AirdropClaim {
    /// The airdrop being claimed from
    pub airdrop: Pubkey,

    /// The address claiming the tokens
    pub recipient: Pubkey,

    /// Flag indicating the recipient has been verified, and is
    /// allowed to claim the tokens
    pub verified: bool,
}

bitflags::bitflags! {
    pub struct AirdropFlags: u64 {
        /// Claims have to be verified with some 3rd party first
        const VERIFICATION_REQUIRED = 1 << 0;
    }
}
