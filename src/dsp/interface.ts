/* eslint-disable @typescript-eslint/no-unused-vars */
// - prepare data from yaml
// - fill input
// - prep structure

import { dspParamsNormalize } from '../common/utils'
import type { ZkGraphYaml } from '../types/zkgyaml'

export class DataPrep {}

export class DataSourcePlugin {
  static getLibDSPName() {
    // SHOULD align with zkgraph-lib/dsp/ethereum/index.ts
    // return ['zkmain_name_in_lib', 'asmain_name_in_lib']
    throw new Error('default: getLibDSPName not implemented in DSP.')
  }

  static async prepareData(zkgraphYaml: ZkGraphYaml, prepareParams: Record<string, any>): Promise<any> {
    throw new Error('default: prepareData not implemented in DSP.')
  }

  static fillExecInput(input: any, zkgraphYaml: any, dataPrep: any) {
    throw new Error('default: fillInput not implemented in DSP.')
  }

  static fillProveInput(input: any, zkgraphYaml: any, dataPrep: any) {
    throw new Error('default: fillInput not implemented in DSP.')
  }

  static toProveDataPrep(execDataPrep: any, execResult: any) {
    throw new Error('default: toProveDataPrep not implemented in DSP.')
  }

  static toPrepareParams(...args: any[]) {
    throw new Error('default: toPrepareParams not implemented in DSP.')
  }

  static execParams: string[] = []

  static toExecParams(params: Record<string, any>) {
    throw new Error('default: toExecParams not implemented in DSP.')
  }

  static proveParams: string[] = []

  static toProveParams(params: Record<string, any>) {
    throw new Error('default: toProveParams not implemented in DSP.')
  }

  static async toPrepareParamsFromExecParams(execParams: any): Promise<any> {
    throw new Error('default: toPrepareParamsFromExecParams not implemented in DSP.')
  }

  static async toPrepareParamsFromProveParams(proveParams: any): Promise<any> {
    throw new Error('default: toPrepareParamsFromProveParams not implemented in DSP.')
  }
}

export abstract class DataSourcePlugin2<EP extends object, PP extends object> {
  abstract getLibDSPName(): string
  abstract prepareData(zkgraphYaml: ZkGraphYaml, prepareParams: Record<string, any>): Promise<any>
  abstract fillExecInput(input: any, zkgraphYaml: any, dataPrep: any): any
  abstract fillProveInput(input: any, zkgraphYaml: any, dataPrep: any): any
  abstract toProveDataPrep(execDataPrep: any, execResult: any): any
  abstract toPrepareParams(...args: any[]): any
  abstract execParams: string[]
  toExecParams(params: Record<string, any>) {
    return dspParamsNormalize(this.execParams as string[], params) as EP
  }

  abstract proveParams: string[]
  toProveParams(params: Record<string, any>) {
    return dspParamsNormalize(this.proveParams as string[], params) as PP
  }
  abstract toPrepareParamsFromExecParams(execParams: any): Promise<any>
  abstract toPrepareParamsFromProveParams(proveParams: any): Promise<any>
}
