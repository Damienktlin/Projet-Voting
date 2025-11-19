'use client';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { contractAddress, contractAbi } from "@/constants";
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt} from "wagmi";
import ProposalReg from "./ProposalReg";
import VotingSession from "./VotingSession";
import Result from "./Result";
import AddVoter from "./AddVoter";
import { toast } from "sonner";

interface Voter {
        isRegistered : boolean;
        hasVoted : boolean;
        votedProposalId : bigint;
    }
interface Prop {
    description:string,
    voteCount: bigint
}

const Voting = () => {  
    
    const [Authorized, setAuthorized]  = useState(false);
    const { address } = useAccount();
    const [addr, setAddr] = useState<string>("");
    const [idProp, setIdProp] = useState<string>("0");
    const [prop, setProp] = useState<Prop | null>(null)

    const workflow = ["RegisteringVoters","ProposalsRegistrationStarted","ProposalsRegistrationEnded", "VotingSessionStarted", "VotingSessionEnded", "VotesTallied"];

    const [voter, setVoter] = useState<Voter | null>(null);

    const {data : ownerAddress, isError: errorReadOwner, isPending, refetch} = useReadContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: "owner"
    });

    const {data : workflowStatus, refetch : getWorkflowStatus} = useReadContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: "workflowStatus"
    });

    const {data : dataVoter, refetch : refetchVoter} = useReadContract({
        account: address,
        address: contractAddress,
        abi: contractAbi,
        functionName: "getVoter",
        args: addr ? [addr] : undefined,
        });

    const {data : dataProposal, refetch : refetchProposal} = useReadContract({
        account: address,
        address: contractAddress,
        abi: contractAbi,
        functionName: "getOneProposal",
        args: [BigInt(idProp)],
        query: {
            enabled: !!idProp,
    }});
    
    const { data: hash1, error: errorSF1, isPending: isPendingSF1, isSuccess : isSuccessSF1, writeContract: writeContractTo1 } = useWriteContract()
    const { data: hash2, error: errorSF2, isPending: isPendingSF2, isSuccess : isSuccessSF2, writeContract: writeContractTo2 } = useWriteContract()
    const { data: hash3, error: errorSF3, isPending: isPendingSF3, isSuccess : isSuccessSF3, writeContract: writeContractTo3 } = useWriteContract()
    const { data: hash4, error: errorSF4, isPending: isPendingSF4, isSuccess : isSuccessSF4, writeContract: writeContractTo4 } = useWriteContract()

    const { isLoading: isConfirmingSF1, isSuccess: isConfirmedSF1 } = useWaitForTransactionReceipt({hash : hash1})
    const { isLoading: isConfirmingSF2, isSuccess: isConfirmedSF2 } = useWaitForTransactionReceipt({hash : hash2})
    const { isLoading: isConfirmingSF3, isSuccess: isConfirmedSF3 } = useWaitForTransactionReceipt({hash : hash3})
    const { isLoading: isConfirmingSF4, isSuccess: isConfirmedSF4 } = useWaitForTransactionReceipt({hash : hash4})


    const getVoter = async (address : string) => {
        try {
            setAddr(address);
            const result = await refetchVoter();
            console.log("Voter data:", result.data);
            if (!result.data) {
                return null;
            }
            const voter = result.data as Voter;
            setVoter(voter);
            return voter;
        } catch (error) {
            return null;
          
        }
    }
    const getVoterButton = async (address : string) => {
        const fcntRtrn = await getVoter(address);
        if (!fcntRtrn) {
            toast.error(`Error fetching voter`, { duration: 5000 });
        }
    }
    const authorize = async () => {
        const fcntRtrn =  await getVoter(address as string);
        if (fcntRtrn?.isRegistered) {
            setAuthorized(true);
        } else {
            setAuthorized(false);
        }   
    }

    const getProposal = async () =>{
        try {
            const result = await refetchProposal();
            if (!result.data) {
                toast.error(`Proposal with ID ${idProp} does not exist`, { duration: 5000 });
                return;
            }
            const getProp = result.data as Prop;
            setProp(getProp);
            } catch (error) {
                toast.error(`Error fetching proposal: ${error}`, { duration: 5000 });
            }
        }

    const startPropReg = async() => {
        writeContractTo1({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'startProposalsRegistering' 
        })}

    const endPropReg = async() => {
        writeContractTo2({
            address: contractAddress,
            abi: contractAbi,
            functionName: "endProposalsRegistering" 
        })}
    const startVoteSession = async() => {
        writeContractTo3({
            address: contractAddress,
            abi: contractAbi,
            functionName: "startVotingSession" 
        })}
    const endVoteSession = async() => {
        writeContractTo4({
            address: contractAddress,
            abi: contractAbi,
            functionName: "endVotingSession" 
        })}
    const refetchEverything = async() => {
        await getWorkflowStatus();
    }

    useEffect(() => {
        if(errorSF1 || errorSF2 || errorSF3 || errorSF4){
            toast.error("Error confirming the workflow status change");
        }
    }, [errorSF1, errorSF2, errorSF3, errorSF4]);

    useEffect(() => {
        refetchEverything();
    },[isConfirmedSF1, isConfirmedSF2, isConfirmedSF3,isConfirmedSF4])

    useEffect(() => {
        authorize();
    },[])   
    
  return (
    <div>
        <div className="p-5 bg-gray-200 rounded-lg">
            <h2 className="title">Admin</h2>
            <p>Owner address : {ownerAddress?.toString()}</p>
            <p>Current workflow status : {workflow[Number(workflowStatus)]}</p>
            <div className="flex p-5 justify-between justify-center items-center gap-5">
                <Button variant="outline" onClick={startPropReg} disabled={address!==ownerAddress || isConfirmingSF1} >Start Proposals Registration </Button>
                <Button variant="outline" onClick={endPropReg} disabled={address!==ownerAddress || isConfirmingSF2} >End Proposals Registration </Button>
                <Button variant="outline" onClick={startVoteSession} disabled={address!==ownerAddress || isConfirmingSF3} >Start Voting Session </Button>
                <Button variant="outline" onClick={endVoteSession} disabled={address!==ownerAddress || isConfirmingSF4} >End Voting Session</Button>

            </div>

        </div>
        <div className="grid grid-cols-2 gap-2 p-5">
            
            <div className="flex">
                <Input placeholder="enter the voter address" onChange={(e) => setAddr(e.target.value)} />
                <Button variant="outline" onClick={() => getVoterButton(addr)}>Get Voter</Button>
            </div>
            
            <div className="flex ">
            <Input placeholder="enter the proposal id" onChange={(e)=> setIdProp(e.target.value)}/>
            <Button variant="outline" onClick={() => getProposal()}>Get proposal</Button>
            
            </div>
            <div>
                {voter && (
                    <Alert className="mb-4 bg-blue-100">
                        <AlertTitle>{voter.isRegistered ?`The voter is registered ${addr}` : "The voter is not registered"}</AlertTitle>
                        <AlertDescription>
                            <div className="flex gap-10">
                            <div><strong>Has voted:</strong> {voter.hasVoted ? "Yes" : "No"}</div>
                            <div><strong>Voted Proposal ID:</strong> {voter.votedProposalId.toString()}</div>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}
            </div>
            <div>
            {prop && (
                <Alert className="mb-4 bg-blue-100">
                    <AlertTitle>Proposal Details</AlertTitle>
                    <AlertDescription className="flex gap-10">
                        <div><strong>Description:</strong> {prop.description}</div>
                        <div><strong>Vote Count:</strong> {prop.voteCount.toString()}</div>
                    </AlertDescription>
                </Alert>
            )} 
            </div>
            
        </div>      
            <div>
                {(workflowStatus === 0 && address === ownerAddress) && (
                    <AddVoter />
                )}
                {(workflowStatus === 1 && Authorized)&& (
                    <ProposalReg />
                )}
                {(workflowStatus === 3 && Authorized) && (
                    <VotingSession />
                )}
                {((workflowStatus === 4 && address === ownerAddress) || workflowStatus === 5)  && (
                    <Result />
                )}

            </div>

    </div>
  )
}

export default Voting