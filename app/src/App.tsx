import React from "react";
import "./App.less";
import { ProposalProvider } from "./contexts/proposal";
import { Routes } from "./routes";

function App() {
  return (
    <ProposalProvider>
      <Routes />
    </ProposalProvider>);
}

export default App;
