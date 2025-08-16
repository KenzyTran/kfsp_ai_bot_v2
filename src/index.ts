import { run, withTrace } from '@openai/agents';
import { createSupervisor } from './supervisor.js';
import { pathToFileURL } from 'node:url';

const TEST_Q = 'Kinh tế VN Quý 2 có gì đáng chú ý?';

export async function main() {
  const { supervisor, closeMcp } = await createSupervisor();
  try {
    const res = await withTrace('Supervisor+BraveMCP', async () => run(supervisor, TEST_Q));
    console.log(res.finalOutput);
  } finally {
    await closeMcp();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(console.error);
}
