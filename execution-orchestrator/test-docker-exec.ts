import { CodeExecutorService } from './src/workers/code-executor';
import { ExecutionJob } from './src/types/execution.types';
import { logger } from './src/utils/logger';

// Mock logger to avoid clutter
logger.info = console.log;
logger.debug = console.debug;
logger.warn = console.warn;
logger.error = console.error;

async function runTest() {
    const executor = new CodeExecutorService();

    const job: ExecutionJob = {
        submissionId: 'test-submission-1',
        userId: 'user-1',
        language: 'python',
        sourceCode: 'print("Hello from Docker!")\nimport os\nprint(f"User: {os.getuid()}")',
        languageConfig: {
            languageId: 'python',
            displayName: 'Python',
            dockerImage: 'python:3.9-slim',
            executeCommand: 'python3 solution.py',
            timeoutSeconds: 5,
            maxMemoryMb: 128,
            isActive: true
        },
    };

    console.log('Starting Docker execution test...');
    try {
        const result = await executor.execute(job);
        console.log('Execution Result:', JSON.stringify(result, null, 2));

        if (result.stdout.includes('Hello from Docker!') && result.exitCode === 0) {
            console.log('SUCCESS: Docker execution verified.');
            process.exit(0);
        } else {
            console.error('FAILURE: Unexpected result.');
            process.exit(1);
        }
    } catch (error) {
        console.error('FAILURE: Execution threw error:', error);
        process.exit(1);
    }
}

runTest();
