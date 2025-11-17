import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("VotingModule", (m) => {
  const voting = m.contract("Voting", ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"], {value: 1000n});

  return { voting };
});
