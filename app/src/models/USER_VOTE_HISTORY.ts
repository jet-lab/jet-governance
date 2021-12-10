enum Votes {
  InFavor = "inFavor",
  Against = "against",
  Abstain = "abstain"
}

export interface VoteState {
  id: number,
  vote: string,
  amount: number,
}

export const USER_VOTE_HISTORY: VoteState[] = [{
  id: 7,
  vote: "inFavor",
  amount: 8000
}, {
  id: 6,
  vote: "against",
  amount: 8000
}, {
  id: 5,
  vote: "inFavor",
  amount: 8000
}, {
  id: 3,
  vote: "inFavor",
  amount: 8000
},{
  id: 2,
  vote: "against",
  amount: 8000
  }, {
  id: 1,
  vote: "against",
  amount: 8000
  }]