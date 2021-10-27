import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ProposalState {
  id: number,
  active: boolean,
  end?: Date,
  result?: string,
  headline: string
}

const initialState: ProposalState[] = [{
  id: 7,
  active: true,
  end: new Date("Jul 25, 2022 16:37:52"),
  headline: "Lorem ipsum dolor sit amet, consectetur adipiscing elit"
}, {
  id: 6,
  active: true,
  end: new Date("Dec 25, 2021 16:37:52"),
  headline: "Lorem ipsum"
}, {
  id: 5,
  active: false,
  result: "inactive",
  headline: "sed do eiusmod tempor incididunt ut labore et dolore magna aliqua"
}, {
  id: 4,
  active: false,
  result: "passed",
  headline: "Lorem ipsum"
}, {
  id: 3,
  active: false,
  result: "rejected",
  headline: "Ut enim ad minim veniam, quis nostrud exercitation ullamco"
},{
  id: 2,
  active: false,
    result: "inactive",
  headline: "Lorem ipsum"
  }, {
  id: 1,
  active: false,
  result: "inactive",
  headline: "Lorem ipsum"
}]

export const proposalSlice = createSlice({
  name: 'proposal',
  initialState,
  reducers: {
    // increment: (state) => {
    //   // Redux Toolkit allows us to write "mutating" logic in reducers. It
    //   // doesn't actually mutate the state because it uses the Immer library,
    //   // which detects changes to a "draft state" and produces a brand new
    //   // immutable state based off those changes
    //   state.value += 1
    // },
    // decrement: (state) => {
    //   state.value -= 1
    // },
    // incrementByAmount: (state, action: PayloadAction<number>) => {
    //   state.value += action.payload
    // },
  },
})

// Action creators are generated for each case reducer function
// export const { increment, decrement, incrementByAmount } = proposalSlice.actions

export default proposalSlice.reducer