pub mod instructions;
pub mod load;
pub mod state;


/// tests the actual program - requires a running cluster with program deployed
#[cfg(test)]
mod tests {
    use super::*;

    use std::str::FromStr;
    use anchor_client::solana_sdk::pubkey::Pubkey;
    use anyhow::Result;

    #[test]
    fn test_init_realm() -> Result<()> {
        let payer = load::wallet("~/.config/solana/id.json");
        let anchor_program = load::program(&*payer);
        let realm_pubkey = instructions::init_realm(
            &anchor_program,
            payer.pubkey(),
            Pubkey::from_str("CDrjDVTqX6eEsikUUWdY9k8ouwJHrydxN3cVvjehwZCV")?,
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
