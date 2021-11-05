mod token;
mod solana;


/// tests the actual program - requires a running cluster with program deployed
#[cfg(test)]
mod tests {
    use std::str::FromStr;

    use anchor_client::{Program, solana_sdk::pubkey::Pubkey};
    use anyhow::Result;
    use jet_governance_client::{instructions, load, state};
    use solana_sdk::signer::Signer;

    use crate::solana::PayingClient;

    use super::*;

    #[test]
    fn test_init_realm() -> Result<()> {
        let payer = load::wallet("~/.config/solana/id.json");
        let anchor_program = load::program(payer.clone());
        let paying_client = PayingClient {
            rpc_client: &anchor_program.rpc(),
            payer: payer.clone(),
        };

        let mint = token::initialize_mint(&paying_client)?;
        solana::finalize(&paying_client)?;
        let realm_pubkey = instructions::init_realm(
            &anchor_program,
            payer.pubkey(),
            mint,
        )?;
        let realm = state::get_realm(&anchor_program, realm_pubkey)?;
        let expected_authority = Pubkey::find_program_address(
            &[b"realm-authority", &realm_pubkey.to_bytes()],
            &anchor_program.id()
        ).0;
        let expected_vault = Pubkey::find_program_address(
            &[b"vault", &realm_pubkey.to_bytes()],
            &anchor_program.id()
        ).0;

        assert_eq!(payer.pubkey(), realm.owner);
        assert_eq!(expected_authority, realm.authority);
        assert_eq!(expected_vault, realm.vault);
        
        Ok(())
    }
}
