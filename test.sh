solana-test-validator -r &
validator_pid=$!
anchor build
anchor deploy
cargo test -p integration-tests
kill $validator_pid
