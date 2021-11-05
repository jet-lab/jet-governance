use anchor_client::{Program, solana_sdk::{pubkey::Pubkey, signature::Keypair, signer::Signer, system_program, sysvar::rent}};
use anyhow::Result;
use jet_governance::instructions::InitRealmBumpSeeds;


pub fn init_realm(
    anchor_program: &Program,
    owner: Pubkey,
    governance_token_mint: Pubkey,
) -> Result<Pubkey> {
    let realm_acct = Keypair::new();
    let (authority, authority_bump) = Pubkey::find_program_address(
        &[b"realm-authority", &realm_acct.pubkey().to_bytes()],
        &anchor_program.id()
    );
    let (vault, vault_bump) = Pubkey::find_program_address(
        &[b"vault", &realm_acct.pubkey().to_bytes()],
        &anchor_program.id()
    );
    anchor_program
        .request()
        .accounts(jet_governance::accounts::InitRealm {
            realm: realm_acct.pubkey(),
            owner,
            authority,
            vault,
            governance_token_mint,
            token_program: spl_token::id(),
            system_program: system_program::id(),
            rent: rent::id(),
        })
        .args(jet_governance::instruction::InitRealm {
            _bump: InitRealmBumpSeeds {
                authority: authority_bump,
                vault: vault_bump,
            }
        })
        .signer(&realm_acct)
        .send()?;
    Ok(realm_acct.pubkey())
}


pub fn init_voter(
    anchor_program: &Program,
    realm: Pubkey,
    owner: Pubkey,
) -> Result<Pubkey> {
    let (voter, voter_bump) = Pubkey::find_program_address(
        &[b"voter", &owner.to_bytes(), &realm.to_bytes()],
        &anchor_program.id()
    );
    anchor_program
        .request()
        .accounts(jet_governance::accounts::InitVoter {
            realm,
            owner,
            voter,
            system_program: system_program::id(),
        })
        .args(jet_governance::instruction::InitVoter {
            _bump: voter_bump
        })
        .send()?;
    Ok(voter)
}
