import { Button } from "@/components/ui/button";
import { contractAddress, contractAbi } from "@/constants";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { publicClient } from "../../../utils/client";


const Result = () => {
    const [winner, setWinner] = useState<string>("");
    const { data: hash, error: errorTally, isPending: isPendingTally, isSuccess : isSuccessTally, writeContract } = useWriteContract()
    const { isLoading, isSuccess: isConfirmed, error: errorConfirmation } = useWaitForTransactionReceipt({hash})

    const tallyVote = async () => {
        writeContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: "tallyVotes",
        });
    };

    const getWinner = async () => {
            try {
                const winningProposal = await publicClient.readContract({
                    address: contractAddress,
                    abi: contractAbi,
                    functionName: 'winningProposalID',
                }) as bigint;
                setWinner(winningProposal.toString());
            } catch (error) {
                console.error("Error getting winning proposal:", error);
            }
    };

    useEffect(() => {
    if(isConfirmed) {
        toast.success("Votes tallied successfully");
    }   
    if(errorTally || errorConfirmation) {
        toast.error("Error confirming the transaction");
    }
    getWinner();
  }, [isConfirmed, errorTally, errorConfirmation]); 

  return (
    <div>
        <h2 className="title p-10">Result</h2>

        <div className="flex p-5 justify-between justify-center items-center gap-5">
            <Button variant="outline" onClick={tallyVote} size="lg" disabled={winner !== "0" || isLoading}><strong>Tally vote</strong>  </Button>
        </div>
        {winner !== "0" ? (
            <div className="p-5 items-center justify-center mb-4 bg-green-500 rounded-lg">
                <p> <strong>The votes have been tallied. The winner is the proposal with ID: {winner}</strong></p>
            </div>
        ) : (
            <div className="p-5 items-center justify-center mb-4 bg-yellow-400 rounded-lg">
                <p>The votes have not been tallied yet.</p>
            </div>
        )}
    </div>
  )
}

export default Result