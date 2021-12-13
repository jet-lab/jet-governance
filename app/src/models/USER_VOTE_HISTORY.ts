enum Votes {
  InFavor = "inFavor",
  Against = "against",
  Abstain = "abstain"
}

export interface VoteState {
  id: number,
  vote: Votes,
  amount: number,
}

export const USER_VOTE_HISTORY: VoteState[] = [{
  id: 7,
  vote: Votes.InFavor,
  amount: 8000
}, {
  id: 6,
  vote: Votes.Against,
  amount: 8000
}, {
  id: 5,
  vote: Votes.InFavor,
  amount: 8000
}, {
  id: 3,
  vote: Votes.InFavor,
  amount: 8000
},{
  id: 2,
  vote: Votes.Against,
  amount: 8000
  }, {
  id: 1,
  vote: Votes.Against,
  amount: 8000
  }]