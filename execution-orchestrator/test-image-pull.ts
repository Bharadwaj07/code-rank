import { DockerManager } from './src/docker/docker-manager';
async function runTest() {
    console.log('Starting Docker Image Pull Test...');

    // Use a small image for testing
    const testImage = 'alpine:3.18';
    const manager = new DockerManager();

    // 1. Clean up: Try to remove the image first to ensure we trigger a pull
    // We'll use a raw docker command or just rely on the fact that we might not have it.
    // To be sure, let's try to remove it using dockerode directly via the manager instance if we could, 
    // but since 'docker' is private, we'll just trust the log output or run a shell command.

    const { execSync } = require('child_process');
    try {
        console.log(`Ensuring ${testImage} is removed locally...`);
        execSync(`docker rmi ${testImage}`, { stdio: 'ignore' });
        console.log('Image removed (if it existed).');
    } catch (e) {
        // Ignore error if image didn't exist
    }

    try {
        console.log(`Attempting to run container with ${testImage}...`);
        // This should trigger an auto-pull
        const result = await manager.runContainer({
            image: testImage,
            cmd: ['echo', 'Hello from Alpine!'],
            workingDir: '/'
        });

        console.log('Execution Result:', JSON.stringify(result, null, 2));

        if (result.exitCode === 0 && result.stdout.includes('Hello from Alpine!')) {
            console.log('SUCCESS: Image was pulled (if missing) and executed.');
            process.exit(0);
        } else {
            console.error('FAILURE: Unexpected execution result.');
            process.exit(1);
        }
    } catch (error) {
        console.error('FAILURE: Execution threw error:', error);
        process.exit(1);
    }
}

runTest();
