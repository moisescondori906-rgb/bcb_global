const URL = 'http://localhost:4000/api/health';
const CONCURRENCY = 50;
const TOTAL_REQUESTS = 500;

// Usar fetch nativo de Node 18+
async function runTest() {
  console.log(`🚀 Starting load test: ${TOTAL_REQUESTS} requests, ${CONCURRENCY} concurrent`);
  const start = Date.now();
  let completed = 0;
  let success = 0;
  let failed = 0;

  const batches = Math.ceil(TOTAL_REQUESTS / CONCURRENCY);

  for (let i = 0; i < batches; i++) {
    const promises = [];
    for (let j = 0; j < CONCURRENCY && completed < TOTAL_REQUESTS; j++) {
      promises.push(
        fetch(URL)
          .then(res => {
            if (res.ok) success++;
            else failed++;
          })
          .catch((err) => {
            // console.error(err);
            failed++;
          })
          .finally(() => completed++)
      );
    }
    await Promise.all(promises);
    process.stdout.write(`\rProgress: ${completed}/${TOTAL_REQUESTS} | Success: ${success} | Failed: ${failed}`);
  }

  const duration = (Date.now() - start) / 1000;
  console.log('\n\n--- Test Results ---');
  console.log(`Total Time: ${duration.toFixed(2)}s`);
  console.log(`Requests/sec: ${(TOTAL_REQUESTS / duration).toFixed(2)}`);
  console.log(`Success Rate: ${((success / TOTAL_REQUESTS) * 100).toFixed(2)}%`);
  
  if (failed > 0) {
    console.warn('⚠️ Warning: Some requests failed. Check server logs.');
  } else {
    console.log('✅ System handled the load perfectly!');
  }
}

runTest().catch(console.error);
