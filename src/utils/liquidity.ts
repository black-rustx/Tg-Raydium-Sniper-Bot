import {
    Liquidity,
    LiquidityPoolKeys,
    Market,
    TokenAccount,
    SPL_ACCOUNT_LAYOUT,
    publicKey,
    struct,
    MAINNET_PROGRAM_ID,
    LiquidityStateV4,
} from '@raydium-io/raydium-sdk';

export const RAYDIUM_LIQUIDITY_PROGRAM_ID_V4 = MAINNET_PROGRAM_ID.AmmV4;
export const OPENBOOK_PROGRAM_ID = MAINNET_PROGRAM_ID.OPENBOOK_MARKET;