import dotenv from "dotenv";
import { initListener } from "./src/sniper";
import "dotenv/config";
import * as mongodb from "mongodb";
import TelegramBot from 'node-telegram-bot-api';
import { errorLOG, informationsLOG, successLOG } from "./utils/logs";
import { startCommand } from "./commands/start";
import { addWalletCallback, genWalletCallback, importWalletCallback, refreshWalletCallback, removeWalletCallback, removeWalletIndexCallback, walletCallback, walletInfoCallback, walletInfoIndexCallback } from "./callbacks/wallets";
import { User } from "./types/user";
import { GENERIC_ERROR_MESSAGE } from "./config";
import { InputTokenAddr } from "./callbacks/settings";


// Load environment variables from .env file
dotenv.config();


// initListener()