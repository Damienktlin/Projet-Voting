import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("VotingModule", (m) => {
  const voting = m.contract("Voting", ["0xEca123C09b23c5a78017e1E3A3FC0c7cdc05c8a7"], {value: 1000n});

  return { voting };
});
