'use client';

import NotConnected from "@/components/shared/NotConnected";
import Voting from "@/components/shared/Voting";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount();
  return (
    <div>
      {isConnected ? <Voting /> : <NotConnected />}
      
    </div>
  );
}
