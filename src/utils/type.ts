import { struct, u8, u64, publicKey } from "@raydium-io/raydium-sdk";

export const LOG_TYPE = struct([u8("log_type")]);

export const RAY_IX_TYPE = {
    CREATE_POOL: 0,
    ADD_LIQUIDITY: 1,
    BURN_LIQUIDITY: 2,
    SWAP: 3,
};