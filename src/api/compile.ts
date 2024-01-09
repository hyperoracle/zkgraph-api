import { hasOwnProperty, randomStr } from '@murongg/utils'
import type { AxiosRequestConfig } from 'axios'
import axios from 'axios'
import type { ZkGraphExecutable } from '../types/api'
import { dspHub } from '../dsp/hub'
import { DSPNotFound } from '../common/error'
const codegen = (libDSPName: string, mappingFileName: string, handleFuncName: string) => `
import { zkmain_lib, asmain_lib, registerHandle } from "@hyperoracle/zkgraph-lib/dsp/${libDSPName}"
import { ${handleFuncName} } from "./${mappingFileName}"

declare function __call_as_start(): void;

export function zkmain(): void {
  __call_as_start();
  registerHandle(${handleFuncName})
  return zkmain_lib()
}

export function asmain(): Uint8Array {
  __call_as_start();
  registerHandle(${handleFuncName})
  return asmain_lib()
}
function abort(a: usize, b: usize, c: u32, d: u32): void {}
`
// TODO: merge codegen_local & codegen into 1 var
const codegen_local = (libDSPName: string, mappingFileName: string, handleFuncName: string) => `
import { zkmain_lib, asmain_lib, registerHandle } from "@hyperoracle/zkgraph-lib/dsp/${libDSPName}"
import { ${handleFuncName} } from "./${mappingFileName}"

export function zkmain(): void {
  registerHandle(${handleFuncName})
  return zkmain_lib()
}

export function asmain(): Uint8Array {
  registerHandle(${handleFuncName})
  return asmain_lib()
}
function abort(a: usize, b: usize, c: u32, d: u32): void {}
`

function getAbortTsFilepath(innerTsFilePath: string) {
  return `${innerTsFilePath.replace('.ts', '')}/abort`.replaceAll('\\', '/')
}

const getCompilerOptions = (isLocal = false) => {
  const options: string[] = []
  options.push('--optimize')
  options.push('--noAssert')
  options.push('--exportRuntime')
  options.push('--disable', 'bulk-memory')
  options.push('--disable', 'mutable-globals')
  if (!isLocal)
    options.push('--exportStart', '__as_start')
  options.push('--memoryBase', '70000')
  options.push('--target', 'release')
  options.push('--runtime', 'stub')
  return options
}

export interface CompileResult {
  outputs: Record<string, string | Uint8Array>
  /** Encountered error, if any. */
  error: Error | null
  /** Standard output stream. */
  stdout: any
  /** Standard error stream.  */
  stderr: any
  /** Statistics. */
  stats: any
}

export interface CompileOptions {
  isLocal?: boolean
}

export async function compile(
  zkGraphExecutable: Omit<ZkGraphExecutable, 'wasmUint8Array'>,
  sources: Record<string, string>,
  options: CompileOptions = {},
): Promise<CompileResult> {
  const { zkgraphYaml } = zkGraphExecutable
  const { isLocal = false } = options

  const dsp = dspHub.getDSPByYaml(zkgraphYaml, { isLocal })
  if (!dsp)
    throw new DSPNotFound('Can\'t find DSP for this data source kind.')

  const libDSPName = dsp.getLibDSPName()
  const mappingFileName = zkgraphYaml.mapping.file
  const handleFuncName = zkgraphYaml.mapping.handler

  const tsModule = `entry_${randomStr()}.ts`
  const textModule = 'inner_pre_pre.wat'
  const wasmModule = 'inner_pre_pre.wasm'
  const abortPath = getAbortTsFilepath(tsModule)
  const asc = await import('assemblyscript/dist/asc.js')
  const stdout = asc.createMemoryStream()
  const outputs: Record<string, string | Uint8Array> = {}
  sources = {
    ...sources,
    [tsModule]: isLocal ? codegen_local(libDSPName, mappingFileName, handleFuncName) : codegen(libDSPName, mappingFileName, handleFuncName),
  }
  const config = {
    stdout,
    stderr: stdout,
    readFile: (name: string) => hasOwnProperty(sources, name) ? sources[name] : null,
    writeFile: (name: string, contents: any) => { outputs[name] = contents },
    listFiles: () => [],
  }
  const compileOptions = [
    tsModule,
    '--path', 'node_modules',
    '--use', `abort=${abortPath}`,
    '--textFile', textModule,
    '--outFile', wasmModule,
    ...getCompilerOptions(isLocal),
  ]
  const ascResult = await asc.main(compileOptions, config)
  return {
    outputs,
    ...ascResult,
  }
}

export async function compileRequest(endpoint: string, data: any) {
  // Set up request config
  const requestConfig: AxiosRequestConfig = {
    method: 'post',
    maxBodyLength: Infinity,
    url: endpoint,
    headers: {
      ...data?.getHeaders(),
    },
    data,
    timeout: 50000,
  }

  return await axios.request(requestConfig)
}
