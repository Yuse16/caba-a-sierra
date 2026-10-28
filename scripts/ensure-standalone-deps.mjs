import { cpSync, existsSync, mkdirSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'

const standaloneRoot = join(process.cwd(), '.next', 'standalone')
const sourceLink = join(process.cwd(), 'node_modules', '@swc', 'helpers')
const target = join(standaloneRoot, 'node_modules', '@swc', 'helpers')

if (!existsSync(standaloneRoot)) {
  throw new Error(`Standalone output not found at ${standaloneRoot}`)
}
if (!existsSync(sourceLink)) {
  throw new Error(`Required runtime dependency not found at ${sourceLink}`)
}

mkdirSync(dirname(target), { recursive: true })
cpSync(realpathSync(sourceLink), target, { recursive: true, force: true })
console.log('Ensured @swc/helpers is resolvable inside Next standalone output')
