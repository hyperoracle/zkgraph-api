/* eslint-disable no-console */
import { it } from 'vitest'
import * as zkgapi from '../src/index'
import { config } from './config'

(global as any).__BROWSER__ = false

it('test deposit', async () => {
  const enableLog = true
  const rpcUrl = config.JsonRpcProviderUrl.sepolia
  const deployedContractAddress = '0x870ef9B5DcBB6F71139a5f35D10b78b145853e69'
  const depositAmount = '0.001'
  const userPrivateKey = config.UserPrivateKey
  const result = await zkgapi.deposit(rpcUrl, deployedContractAddress, depositAmount, userPrivateKey, enableLog)

  console.log(result)
}, { timeout: 100000 })