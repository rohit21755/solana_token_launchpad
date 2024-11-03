import { createInitializeMint2Instruction, createInitializeMetadataPointerInstruction, getMintLen, ExtensionType, TYPE_SIZE, LENGTH_SIZE, TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync, createAssociatedTokenAccount, createAssociatedTokenAccountInstruction, createMintToInstruction } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair, Transaction } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { SystemProgram } from "@solana/web3.js";
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import { useState } from "react";
export function TokenLaunchpad() {
    const [name, setName] = useState("");
    const [symbol, setSymbol] = useState("");
    const [uri, setUri] = useState("");
    const [ initialSupply, setInitialSupply] = useState(0);
    const [decimal, setDecimal] = useState(2)
    const wallet = useWallet()
    const { connection } = useConnection()
    async function createToken(){
        const isFormVaid = name.trim() !== "" && symbol.trim() !== ""
        const keypair = Keypair.generate()
        if(!isFormVaid){
            alert("Please fil the details")
            return
        }
        const metaData = {
            mint: keypair.publicKey,
            name: name || 'KIRA',
            symbol: symbol || 'KIR',
            uri: uri || 'https://cdn.100xdevs.com/metadata.json',
            additionalMetadata: [],
        };
        
        const mintLen = getMintLen([ExtensionType.MetadataPointer]);
        const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metaData).length;

        const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);
        console.log("public key:",keypair.publicKey.toBase58())
        const transaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: wallet.publicKey,
                newAccountPubkey: keypair.publicKey,
                space: mintLen,
                lamports,
                programId : TOKEN_2022_PROGRAM_ID,
            }),
            // createInitializeMint2Instruction(keypair.publicKey, 6, wallet.publicKey, wallet.publicKey, TOKEN_PROGRAM_ID)
            createInitializeMetadataPointerInstruction(keypair.publicKey, wallet.publicKey, keypair.publicKey, TOKEN_2022_PROGRAM_ID),
            createInitializeMint2Instruction(keypair.publicKey, 6,wallet.publicKey, wallet.publicKey, TOKEN_2022_PROGRAM_ID),
            createInitializeInstruction({
                programId: TOKEN_2022_PROGRAM_ID,
                mint: keypair.publicKey,
                metadata: keypair.publicKey,
                name: metaData.name,
                symbol: metaData.symbol,
                uri: metaData.uri,
                mintAuthority: wallet.publicKey,
                updateAuthority: wallet.publicKey
            })
        );
        transaction.feePayer = wallet.publicKey;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        transaction.partialSign(keypair);
        await wallet.sendTransaction(transaction, connection)
        
        console.log("Token mint created")

        const associatedToken = getAssociatedTokenAddressSync(
            keypair.publicKey, wallet.publicKey, false, TOKEN_2022_PROGRAM_ID
        )
        const transaction2 = new Transaction().add(
            createAssociatedTokenAccountInstruction(
                wallet.publicKey,
                associatedToken,
                wallet.publicKey,
                keypair.publicKey,
                TOKEN_2022_PROGRAM_ID
            ),
        )
        try {
            await wallet.sendTransaction(transaction2, connection);
        } catch (error) {
            alert("Transaction rejected by the user.");
            return;
        }

        const transaction3 = new Transaction().add(
            createMintToInstruction(
                keypair.publicKey,
                associatedToken,
                wallet.publicKey,
                100000,
                [],
                TOKEN_2022_PROGRAM_ID
            )
        )
        await wallet.sendTransaction(transaction3, connection);
        console.log("Minted")
        window.open(`https://explorer.solana.com/address/${keypair.publicKey.toBase58()}?cluster=devnet`)
        
    }

    if(!wallet.publicKey) {
        return<>
        <div className="text-center">
            Please Connect you Wallet First
        </div>
        </>
    }

    return  <div style={{
        height: '90vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
    }}>
        <h1>Solana Token Launchpad</h1>
        <input id="name" className='inputText' type='text' placeholder='Name' onChange={(e)=>setName(e.target.value)}></input> <br />
        <input id="symbol" className='inputText' type='text' placeholder='Symbol' onChange={(e)=>setSymbol(e.target.value)}></input> <br />
        <input id="image" className='inputText' type='text' placeholder='Image URL' onChange={(e)=>setUri(e.target.value)}></input> <br />
        <input id="initialSupply" className='inputText' type='number' placeholder='Deciaml (default: 2)' onChange={(e)=>setDecimal(e.target.value)}></input><br/>
        <input id="initialSupply" className='inputText' type='number' placeholder='Initial Supply' onChange={(e)=>setInitialSupply(e.target.value)}></input>
         <br />
        <button onClick={createToken} className='btn'>Create a token</button>
    </div>
}