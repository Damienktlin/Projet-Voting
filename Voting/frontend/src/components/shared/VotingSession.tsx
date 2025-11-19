'use client';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {toast} from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "../ui/item";
import { contractAddress, contractAbi } from "@/constants";
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt} from "wagmi";
import { publicClient } from "../../../utils/client";
import { parseAbi, parseAbiItem } from "viem";


interface proposal{
    id: number,
    voteCount: number,
    description: string
}
interface EventLog {
    eventName: string;
    id: number;
}
interface Voter {
        isRegistered : boolean;
        hasVoted : boolean;
        votedProposalId : bigint;
    }

const VotingSession = () => {
    const { address } = useAccount();
    const [voter, setVoter] = useState<Voter>({isRegistered:false, hasVoted:false, votedProposalId: 0n });
    const [idProp, setIdProp] = useState<number>(0);
    const [listProposals, setListProposals] = useState<proposal[]>([])
    const [events, setEvents] = useState<EventLog[]>([])

    const {data : dataProposal, refetch : refetchProposal} = useReadContract({
        account: address,
        address: contractAddress,
        abi: contractAbi,
        functionName: "getOneProposal",
        args: [BigInt(idProp)],
        query: {
            enabled: !!idProp,
    }});

    const {data : dataVoter, refetch : refetchVoter} = useReadContract({
            account: address,
            address: contractAddress,
            abi: contractAbi,
            functionName: "getVoter",
            args: [address],
            query: {
                enabled: !!address,
            }});

    const getEvents = async () => {

            const getProposalEvents = publicClient.getLogs({
                address: contractAddress,
                event: parseAbiItem('event ProposalRegistered(uint proposalId)'),
                fromBlock: 9661680n,
                toBlock: 'latest'
            });

            const formattedEvents = (await getProposalEvents).map(log => ({
                eventName: 'ProposalRegistered',
                id: Number(log.args.proposalId)
            }));

            setEvents(formattedEvents);
            return formattedEvents;
    }

    const getProposals = async (List: EventLog[]) => {
        //const proposalsPromises = List.map(async (event) => {
        for (const event of List){
            setIdProp(event.id);
            console.log("Fetching proposal with ID:", idProp);
            const result = await refetchProposal();
            console.log("Proposal data:", result.data);
            const proposal: proposal = {
                id: event.id,
                description: (result.data as {description:string, voteCount: bigint}).description,
                voteCount: Number((result.data as {description:string, voteCount: bigint}).voteCount)
            };
            //return proposal;
            setListProposals(prev => [...prev, proposal]);
        };

        //const proposals = await Promise.all(proposalsPromises);
        //setListProposals(proposals);
        }
    let check = true;
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (check) {
                check = false;

                const fetchedEvents = await getEvents();
                console.log("Fetched events:", fetchedEvents);
                if(fetchedEvents.length > 0) {
                    await getProposals(fetchedEvents);
                }}
            } catch (error) {
                console.error("Erreur dans la récupération des proposals:", error);
            }
        };  
        fetchData();
    }, [])


    const { data: hash, error: errorVote, isPending: isPendingVote, isSuccess : isSuccessVote, writeContract } = useWriteContract()
    const { isLoading, isSuccess: isConfirmed, error: errorConfirmation } = useWaitForTransactionReceipt({hash})
    const vote = async (id:number) => {
        writeContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'setVote',
            args: [BigInt(id)]
        });
    }

    useEffect(() => {
        const getVoter = async () => {
            try {
                if(isConfirmed) {
                    toast.success("Vote registered successfully");
                }
                if(errorVote || errorConfirmation) {
                    toast.error("Error confirming the vote");
                }
                const result = await refetchVoter();
                if (!result.data) {
                    return;
                }
                const voter = result.data as Voter;
                setVoter(voter);
            } catch (error) {
                console.error("Error getting voter data:", error);
            }
        };
        getVoter();
    }, [isConfirmed, errorVote, errorConfirmation]);
  return (
    <div>
        <h2 className="title p-5">Vote</h2>
        {voter.hasVoted ? (
                            <Alert className="mb-4 bg-lime-200">
                                <AlertTitle>You have already voted </AlertTitle>
                            </Alert>
                        ) : (
                            <Alert className="mb-4 bg-yellow-200">
                                <AlertTitle>You have not voted yet </AlertTitle>
                                <AlertDescription>Please select a proposal and cast your vote.</AlertDescription>
                            </Alert>
                        )}

        <div className="container mx-auto px-4 py-8">
            {listProposals.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {listProposals.map((proposal) => {
                        return (
                            <div key={proposal.id}>
                            <Item variant="outline">
                                <ItemContent>
                                <ItemTitle>Proposal #{proposal.id}</ItemTitle>
                                <ItemDescription>
                                    {proposal.description}
                                </ItemDescription>
                                </ItemContent>
                            <ItemActions>
                                <Button size="sm" onClick={()=>vote(proposal.id)} disabled={isPendingVote || isLoading || voter.hasVoted}>
                                     Vote
                                </Button>
                            </ItemActions>
                            </Item>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <p>No proposals available.</p>
            )}
        </div>

    </div>
  )
}

export default VotingSession