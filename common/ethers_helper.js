import { ethers, Wallet, providers } from "ethers";
import { formatEther } from "ethers/lib/utils.js";

import { RLP } from '@ethereumjs/rlp'


async function getRawLogsFromBlockReceipts(ethersProvider, blockNumber, ignoreFailedTx) {
    // const blockReceipts = await ethersProvider.send("eth_getBlockReceipts", ["0x" + (blockNumber).toString(16)]);
    const blockReceipts = await ethersProvider.send("eth_getBlockReceipts", [blockNumber]);
    let rawReceipt = []
    for (const receipt of blockReceipts) {
        if (ignoreFailedTx && receipt.status !== "0x1") {
            continue;
        }

        let txRawLogs = [];
        let txRawReceipt = [receipt.status, receipt.cumulativeGasUsed, receipt.logsBloom];

        let logs = receipt.logs;
        for (const log of logs) {
            txRawLogs.push([log.address, log.topics, log.data]);
        }
        txRawReceipt.push(txRawLogs) // empty log will be included
        rawReceipt.push("0x" + Buffer.from(RLP.encode(txRawReceipt)).toString('hex'))
    }

    return rawReceipt;
}

async function getRawLogsFromTxsReceipt(ethersProvider, blockNumber, ignoreFailedTx) {
    const block = await ethersProvider.getBlock(blockNumber)
    let rawReceipt = []
    for (const txHash of block.transactions) {
        const receipt = await ethersProvider.getTransactionReceipt(txHash);
        if (ignoreFailedTx && receipt.status !== 1) {
            continue;
        }

        let txRawLogs = [];
        let txRawReceipt = ["0x" + receipt.status.toString(16), "0x" + receipt.cumulativeGasUsed.toNumber().toString(16), receipt.logsBloom];

        let logs = receipt.logs;
        for (const log of logs) {
            txRawLogs.push([log.address, log.topics, log.data]);
        }
        txRawReceipt.push(txRawLogs) // empty log will be included
        rawReceipt.push("0x" + Buffer.from(RLP.encode(txRawReceipt)).toString('hex'))
    }

    return rawReceipt
}

async function getRawReceiptsWithoutDebugRPC(ethersProvider, blockNumber, ignoreFailedTx=false){

    blockNumber = "0x" + blockNumber.toString(16);

    let isErigon = true;
    try {
        await ethersProvider.send("eth_protocolVersion", []);
    } catch (error) {
        isErigon = false;
    }

    if (isErigon) {
        return await getRawLogsFromBlockReceipts(ethersProvider, blockNumber, ignoreFailedTx);
    } else {
        console.log("The RPC does not support erigon rpc, fetching data may be slow");
        return await getRawLogsFromTxsReceipt(ethersProvider, blockNumber, ignoreFailedTx);
    }
}

async function getRawReceiptsWithDebugRPC(ethersProvider, blockid) {
    // Parse block id
    if (typeof blockid === "string"){
        blockid = blockid.length >= 64 ? blockid : parseInt(blockid)
    }

  if (Number.isFinite(blockid)) {
    blockid = "0x" + blockid.toString(16);
  }

  return ethersProvider.send("debug_getRawReceipts", [blockid]);
}

export async function getRawReceipts(ethersProvider, blockid, useDebugRPC=false){
    if (useDebugRPC){
        return await getRawReceiptsWithDebugRPC(ethersProvider, blockid)
    } else {
        
        // Parse block id
        if (typeof blockid === "string" && blockid.length >= 64){
            throw Error("[-] please provide a valid block number.")
        }
        let blockNumber = blockid;
        return await getRawReceiptsWithoutDebugRPC(ethersProvider, blockNumber, false)
    }
}


export async function getBlockByNumber(ethersProvider, blockNumber) {
  const fullBlock = await ethersProvider.send("eth_getBlockByNumber", [
    ethers.utils.hexValue(blockNumber),
    false,
  ]);
  return fullBlock;
}

export async function getBalance(privateKey, networkName) {
  const wallet = new Wallet(privateKey);
  // Using default provider to avoid errors in user defined provider
  const provider = new providers.getDefaultProvider(networkName)
  const balance = formatEther(await provider.getBalance(wallet.address));
  return balance;
}
