solana-test-validator &
validator_pid=$!
anchor build
anchor deploy
cargo test -p integration-tests
kill $validator_pid
