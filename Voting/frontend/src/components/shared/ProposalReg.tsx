'use client';
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { contractAddress, contractAbi } from "@/constants";
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt} from "wagmi";
import { RocketIcon } from "lucide-react";
import { publicClient } from "../../../utils/client";
import { parseAbi, parseAbiItem } from "viem";

interface proposal{
    id: number,
    desc: string
};
interface EventLog {
    eventName: string;
    id: number;
}

const ProposalReg = () => {

    const [description, setDescription] = useState<string>(``)
    const [proposals, setProposals] = useState<proposal[]>([{id: 0, desc : `GENESIS`}])
    const [events, setEvents] = useState<EventLog[]>([])

    const { data: hash, error: errorAddProposal, isPending: isPendingAddProposal, isSuccess , writeContract } = useWriteContract()
    const { isLoading, isSuccess: isConfirmed, error: errorConfirmation } = useWaitForTransactionReceipt({hash})

    const getEvents = async () => {

            const getProposalEvents = publicClient.getLogs({
                event: parseAbiItem('event ProposalRegistered(uint proposalId)'),
                fromBlock: 0n,
                toBlock: 1000n
            });

            const formattedEvents = (await getProposalEvents).map(log => ({
                eventName: 'ProposalRegistered',
                id: Number(log.args.proposalId)
            }));

            setEvents(formattedEvents);
    }


    const registerProposal = async (desc:string) => {
        try {
            writeContract({
                address: contractAddress,
                abi: contractAbi,
                functionName: "addProposal",
                args: [desc]
            });
        } catch (error) {
            toast.error("Error confirming the transaction");
        }
    };

    useEffect(() => {
    if(isConfirmed) {
        proposals.push({
            id: proposals.length,
            desc: description});
        toast.success("Proposal registered successfully");
        getEvents();
    }
    if(errorAddProposal || errorConfirmation) {
        toast.error("Error confirming the transaction");
    }
  }, [isConfirmed, errorAddProposal, errorConfirmation]);

    useEffect(() => {
        getEvents();
    }, []);
    
  return (
    <div>
        
        <p className="title p-5">Proposal registration</p>
        <div className="grid w-full gap-2">
            <Textarea placeholder="Describe your proposal here." onChange = {(e) => setDescription(e.target.value)}/>
            <Button onClick={() => registerProposal(description)}>Register your proposal</Button>
        </div>
        {isSuccess && 
          <Alert className="mb-4 bg-lime-200">
            <RocketIcon className="h-4 w-4" />
            <AlertTitle>Your proposal has been registered successfully</AlertTitle>
            <AlertDescription>
                <p>The proposal id is: {events.length > 0 ? events[events.length - 1].id : "N/A"}</p>
            </AlertDescription>
          </Alert>
        }
        
    </div>
  )
}

export default ProposalReg