mod token;
mod solana;


/// tests the actual program - requires a running cluster with program deployed
#[cfg(test)]
mod tests {
    use std::{rc::Rc, str::FromStr};

    use anchor_client::{Program, solana_sdk::pubkey::Pubkey};
    use anyhow::Result;
    use jet_governance_client::{instructions, load, state};
    use solana_sdk::signer::Signer;

    use crate::solana::PayingClient;

    use super::*;

    struct TestClient {
        payer: Rc<dyn Signer>,
        anchor_program: Program,
        paying_client: PayingClient,
    }

    fn test_client() -> TestClient {
        let payer = load::wallet("~/.config/solana/id.json");
        let anchor_program = load::program(payer.clone());
        let paying_client = PayingClient {
            rpc_client: Rc::new(anchor_program.rpc()),
            payer: payer.clone(),
        };
        TestClient {
            payer,
            anchor_program,
            paying_client,
        }
    }

    #[test]
    fn test_init_realm() -> Result<()> {
        let client = test_client();
        let mint = token::initialize_mint(&client.paying_client)?;
        solana::finalize(&client.paying_client)?;
        let realm_pubkey = instructions::init_realm(
            &client.anchor_program,
            client.payer.pubkey(),
            mint,
        )?;
        let realm = state::get_realm(&client.anchor_program, realm_pubkey)?;
        let expected_authority = Pubkey::find_program_address(
            &[b"realm-authority", &realm_pubkey.to_bytes()],
            &client.anchor_program.id()
        ).0;
        let expected_vault = Pubkey::find_program_address(
            &[b"vault", &realm_pubkey.to_bytes()],
            &client.anchor_program.id()
        ).0;

        assert_eq!(client.payer.pubkey(), realm.owner);
        assert_eq!(expected_authority, realm.authority);
        assert_eq!(expected_vault, realm.vault);

        Ok(())
    }

    #[test]
    fn test_init_voter() -> Result<()> {
        let client = test_client();
        let mint = token::initialize_mint(&client.paying_client)?;
        solana::finalize(&client.paying_client)?;
        let realm = instructions::init_realm(
            &client.anchor_program,
            client.payer.pubkey(),
            mint,
        )?;
        let voter_pubkey = instructions::init_voter(
            &client.anchor_program,
            realm,
            client.payer.pubkey(),
        )?;
        let voter = state::get_voter(&client.anchor_program, voter_pubkey)?;

        assert_eq!(client.payer.pubkey(), voter.owner);
        assert_eq!(realm, voter.realm);
        assert_eq!(0, voter.deposited);
        assert_eq!(0, voter.active_votes);
        
        Ok(())
    }
}
