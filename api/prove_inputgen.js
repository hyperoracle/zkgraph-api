import {
  formatVarLenInput,
  formatIntInput,
  formatHexStringInput,
} from "../common/api_helper.js";
import {
  getBlockByNumber,
  getBlockByHash,
  getRawReceipts,
  getProof,
  getBlock,
} from "../common/ethers_helper.js";
import { filterEvents } from "../common/api_helper.js";
import { toHexString, trimPrefix } from "../common/utils.js";
import {
  loadZKGraphEventSources,
  loadZKGraphStorageSources,
  loadZKGraphType,
} from "../common/config_utils.js";
import { Input } from "../common/input.js";
import { ethers, providers } from "ethers";
import { ZkGraphYaml } from "../type/zkgyaml.js";
import { BlockPrep } from "../type/blockprep.js";
import { prepareOneBlockByYaml } from "../inputgen/prepare_blocks.js";
import { fillExecInput } from "../inputgen/fill_input.js";
import { fillProveInput } from "./prove_inputgen-old.js";

/**
 * Generate the private and public inputs in hex string format
 * @param {string} yamlContent
 * @param {string} rpcUrl
 * @param {number | string} blockid
 * @param {string} expectedStateStr
 * @param {boolean} isLocal
 * @param {boolean} enableLog
 * @returns {[string, string]} - private input string, public input string
 */
export async function proveInputGen(
  yamlContent,
  rpcUrl,
  blockid,
  expectedStateStr,
  isLocal = false,
  enableLog = true
) {

  const provider = new providers.JsonRpcProvider(rpcUrl);
  let zkgyaml = ZkGraphYaml.fromYamlContent(yamlContent);

  // Get block
  let block = await getBlock(provider, blockid);

  const blockNumber = parseInt(block.number);
  const blockHash = block.hash;

  //////// TODO: multi blocks
  let blockPrep = await prepareOneBlockByYaml(provider, blockNumber, zkgyaml);

  let blockPrepMap = new Map();
  blockPrepMap.set(blockNumber, blockPrep)

  let blocknumOrder = [blockNumber]

  return proveInputGenOnBlockPrepMap(zkgyaml, blockPrepMap, blocknumOrder, blockHash, expectedStateStr)
}

export function proveInputGenOnBlockPrepMap(
  zkgyaml,
  blockPrepMap,
  blocknumOrder,
  blockHash,
  expectedStateStr
) {
  let input = new Input();
  
  input = fillProveInput(input, zkgyaml, blockPrepMap, blocknumOrder, blockHash, expectedStateStr)

  return [input.getPrivateInputStr(), input.getPublicInputStr()];
}
