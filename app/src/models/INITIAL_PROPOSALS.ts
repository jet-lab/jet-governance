export interface ProposalState {
  id: number,
  start: Date,
  end: Date,
  result?: string,
  headline: string,
  description: string,
  hash: string,
  type: string[],
  inFavor: number,
  against: number,
  abstain: number
}

export const INITIAL_STATE: ProposalState[] = [{
  id: 7,
  start: new Date("Aug 25, 2021 16:37:52"),
  end: new Date("Jul 25, 2022 16:37:52"),
  headline: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Mattis aliquam faucibus purus in massa. Ac auctor augue mauris augue neque gravida. Aenean euismod elementum nisi quis eleifend quam. Augue lacus viverra vitae congue. Diam sollicitudin tempor id eu nisl nunc.",
  hash: "0xsolanabreakpoint2022",
  type: ["test", "1", "2", "3"],
  inFavor: 722300,
  against: 220700,
  abstain: 70200
}, {
  id: 6,
  start: new Date("Aug 25, 2021 16:37:52"),
  end: new Date("Dec 25, 2021 16:37:52"),
  headline: "Lorem ipsum",
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Mattis aliquam faucibus purus in massa. Ac auctor augue mauris augue neque gravida. Aenean euismod elementum nisi quis eleifend quam. Augue lacus viverra vitae congue. Diam sollicitudin tempor id eu nisl nunc.",
  hash: "0xsolanabreakpoint2023",
  type: ["test", "1", "2", "3"],
  inFavor: 722300,
  against: 220700,
  abstain: 70200
}, {
  id: 5,
  start: new Date("Aug 25, 2021 16:37:52"),
  end: new Date("Jan 25, 2022 16:37:52"),
  headline: "sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Mattis aliquam faucibus purus in massa. Ac auctor augue mauris augue neque gravida. Aenean euismod elementum nisi quis eleifend quam. Augue lacus viverra vitae congue. Diam sollicitudin tempor id eu nisl nunc.",
  hash: "0xsolanabreakpoint2024",
  type: ["test", "1", "2", "3"],
  inFavor: 722300,
  against: 220700,
  abstain: 70200
}, {
  id: 4,
  start: new Date("Aug 25, 2021 16:37:52"),
  end: new Date("Feb 25, 2022 16:37:52"),
  headline: "Lorem ipsum",
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Mattis aliquam faucibus purus in massa. Ac auctor augue mauris augue neque gravida. Aenean euismod elementum nisi quis eleifend quam. Augue lacus viverra vitae congue. Diam sollicitudin tempor id eu nisl nunc.",
  hash: "0xsolanabreakpoint2025",
  type: ["test", "1", "2", "3"],
  inFavor: 722300,
  against: 220700,
  abstain: 70200
}, {
  id: 3,
  start: new Date("Jul 25, 2021 16:37:52"),
  end: new Date("Nov 25, 2021 16:37:52"),
  result: "rejected",
  headline: "Ut enim ad minim veniam, quis nostrud exercitation ullamco",
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Mattis aliquam faucibus purus in massa. Ac auctor augue mauris augue neque gravida. Aenean euismod elementum nisi quis eleifend quam. Augue lacus viverra vitae congue. Diam sollicitudin tempor id eu nisl nunc.",
  hash: "0xsolanabreakpoint2026",
  type: ["test", "1", "2", "3"],
  inFavor: 722300,
  against: 220700,
  abstain: 70200
},{
  id: 2,
  result: "inactive",
  start: new Date("Jul 25, 2021 16:37:52"),
  end: new Date("Oct 25, 2021 16:37:52"),
  headline: "Lorem ipsum",
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Mattis aliquam faucibus purus in massa. Ac auctor augue mauris augue neque gravida. Aenean euismod elementum nisi quis eleifend quam. Augue lacus viverra vitae congue. Diam sollicitudin tempor id eu nisl nunc.",
  hash: "0xsolanabreakpoint2027",
  type: ["test", "1", "2", "3"],
  inFavor: 722300,
  against: 220700,
  abstain: 70200
  }, {
  id: 1,
  result: "inactive",
  start: new Date("Jul 25, 2021 16:37:52"),
  end: new Date("Sep 25, 2021 16:37:52"),
  headline: "Lorem ipsum",
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Mattis aliquam faucibus purus in massa. Ac auctor augue mauris augue neque gravida. Aenean euismod elementum nisi quis eleifend quam. Augue lacus viverra vitae congue. Diam sollicitudin tempor id eu nisl nunc.",
  hash: "0xsolanabreakpoint2028",
  type: ["test", "1", "2", "3"],
  inFavor: 722300,
  against: 220700,
  abstain: 70200
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