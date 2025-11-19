'use client';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { contractAddress, contractAbi } from "@/constants";
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt} from "wagmi";
import { parseAbi, parseAbiItem } from "viem";
import { publicClient } from "../../../utils/client";

interface EventLog {
    eventName: string;
    voterAddress?: string;
}

const AddVoter = () => {
    const [events, setEvents] = useState<EventLog[]>([])
    const [addrVoter, setAddrVoter] = useState<string>("")
    const { data: hash, error: errorAddVoter, isPending: isPendingAddVoter, isSuccess : isSuccessAddVoter, writeContract } = useWriteContract()
    const { isLoading, isSuccess: isConfirmed, error: errorConfirmation } = useWaitForTransactionReceipt({hash})


    const addVoter = async (addr:string) => {
        writeContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'addVoter',
            args: [addr]
        })
    }

    const getEvents = async () => {
        const getVoterRegisterLogs =  await publicClient.getLogs({
            address: contractAddress,
            event: parseAbiItem('event VoterRegistered(address voterAddress)'),
            fromBlock: 9662462n,
            toBlock: 'latest',
        });
        setEvents(getVoterRegisterLogs.map(log => ({
            eventName: 'VoterRegistered',
            voterAddress: log.args.voterAddress?.toString()
        })));
        getEvents();
    }
    useEffect(() => {
        if(isConfirmed) {
            toast.success("Voter added successfully");
        }   
        if(errorAddVoter || errorConfirmation) {
            toast.error("Error during the voter addition");
        }
    }, [isConfirmed, errorAddVoter, errorConfirmation]);

    useEffect(() => {
        getEvents();
    }, [])



  return (
    <div>
        <p className="title p-5">Add a voter</p>
        <div className="flex">
            <Input placeholder="enter the voter address to register" onChange={(e) => setAddrVoter(e.target.value)} />
            <Button variant="outline" onClick={() => addVoter(addrVoter)} disabled={isPendingAddVoter && isLoading}>Add a voter</Button>
        </div>

        <h2 className="mt-6 mb-4 text-4xl">Events</h2>
                <div className="flex flex-col w-full">
                    {events.length > 0 && events.map((event) => {
                        return (
                            <p key={crypto.randomUUID()}>Event : {event.eventName}  Address : {event.voterAddress}</p>
                    )
                    })}
                 </div>
    </div>
  )
}

export default AddVoter