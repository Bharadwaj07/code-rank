import { CodeExecutorService } from './src/workers/code-executor';
import { ExecutionJob } from './src/types/execution.types';
import { logger } from './src/utils/logger';

// Mock logger
logger.info = console.log;
logger.debug = console.debug;
logger.warn = console.warn;
logger.error = console.error;

async function runSimulation() {
    console.log('Starting E2E Payload Simulation...');

    // 1. Construct the payload EXACTLY as Core API would send it
    // Based on src/app/submissions/submissions.service.ts in core-api
    const mockCoreApiPayload: ExecutionJob = {
        submissionId: 'e2e-test-sub-123',
        userId: 'user-e2e',
        language: 'javascript',
        sourceCode: 'console.log("Hello from Core API payload!");',
        inputData: undefined,
        languageConfig: {
            languageId: 'javascript',
            displayName: 'JavaScript',
            dockerImage: 'node:18-alpine', // Using the image we discussed
            compileCommand: undefined,
            executeCommand: 'node solution.js',
            timeoutSeconds: 10,
            maxMemoryMb: 256,
            isActive: true
        }
    };

    const executor = new CodeExecutorService();

    try {
        console.log('Simulating job execution with payload:', JSON.stringify(mockCoreApiPayload, null, 2));

        // This will trigger auto-pull if node:18-alpine is missing (as per our previous fix)
        const result = await executor.execute(mockCoreApiPayload);

        console.log('Execution Result:', JSON.stringify(result, null, 2));

        if (result.exitCode === 0 && result.stdout.includes('Hello from Core API payload!')) {
            console.log('SUCCESS: Execution Orchestrator correctly processed logic from Core API payload.');
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

runSimulation();
