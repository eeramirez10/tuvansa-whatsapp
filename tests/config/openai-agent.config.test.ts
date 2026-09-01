import test from 'node:test'
import assert from 'node:assert/strict'
import { TUVANSA_AGENT_TOOLS } from '../../src/config/openai-agent.config'

test('declara todas las herramientas implementadas por el backend', () => {
  assert.deepEqual(
    TUVANSA_AGENT_TOOLS.map((tool) => tool.name),
    [
      'get_info_customer',
      'get_branches',
      'process_file_for_quote',
      'update_customer_info',
      'extract_customer_info'
    ]
  )
})
