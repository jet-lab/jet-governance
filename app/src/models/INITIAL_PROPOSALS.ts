export interface ProposalState {
  id: number,
  active: boolean,
  end?: Date,
  result?: string,
  headline: string,
  hash: string
}

export const INITIAL_STATE: ProposalState[] = [{
  id: 7,
  active: true,
  end: new Date("Jul 25, 2022 16:37:52"),
  headline: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
  hash: "0xsolanabreakpoint2022"
}, {
  id: 6,
  active: true,
  end: new Date("Dec 25, 2021 16:37:52"),
  headline: "Lorem ipsum",
  hash: "0xsolanabreakpoint2023"
}, {
  id: 5,
  active: false,
  result: "inactive",
  headline: "sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
  hash: "0xsolanabreakpoint2024"
}, {
  id: 4,
  active: false,
  result: "passed",
  headline: "Lorem ipsum",
  hash: "0xsolanabreakpoint2025"
}, {
  id: 3,
  active: false,
  result: "rejected",
  headline: "Ut enim ad minim veniam, quis nostrud exercitation ullamco",
  hash: "0xsolanabreakpoint2026"
},{
  id: 2,
  active: false,
    result: "inactive",
  headline: "Lorem ipsum",
  hash: "0xsolanabreakpoint2027"
  }, {
  id: 1,
  active: false,
  result: "inactive",
  headline: "Lorem ipsum",
  hash: "0xsolanabreakpoint2028"
  }]

interface User {
  address: string,
  wallet: number,
  staked: number,
  votes: {
    hash: string,
    hasVoted: boolean,
    vote?: string
  }[]
}

export const USER: User = {
  address: "dummyaddress0x1",
  wallet: 500000,
  staked: 200000,
  votes: [{
    hash: "0xsolanabreakpoint2028",
    hasVoted: true,
    vote: "approve"
  }, {
    hash: "0xsolanabreakpoint2024",
    hasVoted: false
  }, {
    hash: "0xsolanabreakpoint2027",
    hasVoted: false
  }, {
    hash: "0xsolanabreakpoint2023",
    hasVoted: true,
    vote: "approve"
  }, ]
}