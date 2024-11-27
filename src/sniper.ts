import lo from "lodash";
import {
    Keypair,
    PublicKey,
    TransactionMessage,
    VersionedTransaction,
    TransactionInstruction,
    SystemProgram,
    ParsedTransactionWithMeta,
    Logs,
    ComputeBudgetProgram,
    Commitment,
} from '@solana/web3.js'
import {
    ApiPoolInfoV4,
    BigNumberish,
    jsonInfo2PoolKeys,
    Liquidity,
    LIQUIDITY_STATE_LAYOUT_V4,
    LiquidityPoolKeys,
    LiquidityPoolKeysV4,
    Percent,
    Token,
    TokenAmount,
} from '@raydium-io/raydium-sdk'
import bs58 from "bs58";
import { CHECK_IF_MINT_IS_BURNED, CHECK_IF_MINT_IS_FROZEN, CHECK_IF_MINT_IS_RENOUNCED, LOG_LEVEL, PRIVATE_KEY, solanaConnection, solanaSubcribeConnection } from "./config/config"
import { logger } from "./utils/utils"
import fs from 'fs'
import { RAYDIUM_LIQUIDITY_PROGRAM_ID_V4 } from './utils/liquidity';
import { LOG_TYPE, RAY_IX_TYPE } from "./utils/type";
import { SOL_ADDRESS } from "./utils/token";
import { checkBurn, checkFreezable, checkMintable } from "./tokenFilter";
import { executeJitoTx } from "./executor/jito";
import base58 from "bs58";
import { getBuyTx, getSellTx } from "./executor/swapOnlyAmm";
import { dateTime } from "@metaplex-foundation/umi";
import { getAssociatedTokenAddress } from "@solana/spl-token";

const COMMITMENT_LEVEL = 'confirmed'
const jitoCommitment: Commitment = "confirmed"

let wallet: Keypair

let running: Boolean = false
let minSize: number = 0
let maxSize: number = 0

export const mainKp = Keypair.fromSecretKey(base58.decode(PRIVATE_KEY))
/** Address of the special mint for wrapped native SOL in spl-token */
export const NATIVE_MINT = new PublicKey('So11111111111111111111111111111111111111112');

export const initListener = async (): Promise<void> => {
    logger.info('Initialize')
    logger.level = LOG_LEVEL
    const data = JSON.parse(fs.readFileSync("data.json", `utf8`))

    // get wallet
    const PRIVATE_KEY = data.privKey
    wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));

    running = data.running
    console.log({ running })
    runListener()
}

const processRaydiumPool = async (signature: string) => {
    try {
        console.log('processRaydiumPool', signature)
        const tx = await solanaConnection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed'
        })

        const innerInstructions = tx?.meta?.innerInstructions
        const postTokenBalances = tx?.meta?.postTokenBalances
        let baseMint: string = ''
        let poolId: string = ''
        let solAmount: number = 0
        innerInstructions?.map((mt: any) => {
            mt.instructions.map((item: any) => {
                // @ts-ignore
                if (item.parsed?.type == "initializeAccount" && item.parsed?.info.mint.toString() != SOL_ADDRESS.toString()) {
                    // @ts-ignore
                    baseMint = item.parsed?.info.mint.toString()
                }
                // @ts-ignore
                if (item.parsed?.type == "allocate" && item.parsed?.info.space == 752) {
                    // @ts-ignore
                    poolId = item.parsed?.info.account.toString()
                }
            })
        })

        postTokenBalances?.map((balance: any) => {
            if (balance.mint == SOL_ADDRESS.toString() && balance.owner == "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1" && balance.programId == "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") solAmount = balance.uiTokenAmount.uiAmount
        })

        console.log('mint', baseMint)
        console.log('poolId', poolId)
        console.log('solAmount', solAmount)

        // if (baseMint) {
        //     console.log("1===", baseMint)
        //     let baseToken = new PublicKey(baseMint)
        //     let buyAmount = 0.001;
        //     let buyTx = await getBuyTx(mainKp, baseToken, NATIVE_MINT, buyAmount, poolId);
        //     console.log("2=======", buyTx)
        //     // let sellAmount = 0;
        //     // let sellTx = await getSellTx(mainKp, baseToken, NATIVE_MINT, sellAmount, poolId)
        //     let txSig;

        //     if (buyTx) {
        //         const confirmation = await solanaConnection.simulateTransaction(buyTx)
        //         console.log('confirmation', confirmation)
        //         txSig = await executeJitoTx([buyTx], mainKp, jitoCommitment)
        //     }

        //     if (txSig) {
        //         const tokenBuyTx = txSig ? `https://solscan.io/tx/${txSig}` : ''
        //         console.log("Success in buy transaction: ", tokenBuyTx)
        //         return tokenBuyTx
        //     } else {
        //         return null
        //     }

        // }

        return
    } catch (e) {
        console.log(e)
        return null
    }
}

export const runListener = async () => {


    logger.info('Raydium tracking started')

    // let baseMint = "E8TdfeJfjXYUKAMkbHoDb3TwLAH9iPTeTXdBq8djpump"
    // let baseToken = new PublicKey(baseMint)
    // let poolId = "7ENxYHW9KzGxbMsVQ9YwxP9ktvAWArnqkPz59d8XWH8k"
    // const tokenAta = await getAssociatedTokenAddress(baseToken, mainKp.publicKey);
    // const tokenBalInfo = await solanaConnection.getTokenAccountBalance(tokenAta);
    // if (!tokenBalInfo) {
    //     console.log('Balance incorrect');
    //     return null;
    // }
    // const tokenBalance = tokenBalInfo.value.amount;
    // // let sellAmount = 0;
    // let sellTx = await getSellTx(mainKp, baseToken, NATIVE_MINT, tokenBalance, poolId)
    // let txSig;

    // if (sellTx) {
    //     const confirmation = await solanaConnection.simulateTransaction(sellTx)
    //     console.log('confirmation', confirmation)
    //     txSig = await executeJitoTx([sellTx], mainKp, jitoCommitment)
    // }

    // if (txSig) {
    //     const tokenBuyTx = txSig ? `https://solscan.io/tx/${txSig}` : ''
    //     console.log("Success in buy transaction: ", tokenBuyTx)
    //     return tokenBuyTx
    // } else {
    //     return null
    // }


    const raydiumLogId = solanaSubcribeConnection.onLogs(RAYDIUM_LIQUIDITY_PROGRAM_ID_V4, async (Logs) => {
        const { logs, signature, err } = Logs
        const ray_log = lo.find(logs, (y: string) => y.includes("ray_log"));
        if (!err && ray_log) {
            const match = ray_log.match(/ray_log: (.*)/)
            if (match?.length) {
                const ray_data = Buffer.from(
                    match[1],
                    "base64"
                );
                const log_type = LOG_TYPE.decode(ray_data).log_type;
                if (log_type == RAY_IX_TYPE.CREATE_POOL) {
                    console.log('signature', signature)
                    processRaydiumPool(signature)
                }
            }
        }
    })


    logger.info(`Listening for raydium changes: ${raydiumLogId}`)
    logger.info('----------------------------------------')
    logger.info('Bot is running! Press CTRL + C to stop it.')
    logger.info('----------------------------------------')
}