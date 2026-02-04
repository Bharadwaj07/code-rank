import Docker from 'dockerode';
import { logger } from '../utils/logger';

export interface DockerContainerConfig {
    image: string;
    cmd: string[];
    env?: string[];
    memory?: number; // Bytes
    networkDisabled?: boolean; // Default true for security
    binds?: string[]; // Volume mounts
    workingDir?: string; // Working directory inside container
}

export interface ContainerExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}

export class DockerManager {
    private docker: Docker;

    constructor() {
        this.docker = new Docker();
        logger.info('DockerManager initialized');
    }

    /**
     * Ensures the image exists locally, pulling it if necessary
     */
    async ensureImageExists(image: string): Promise<void> {
        try {
            const localImage = this.docker.getImage(image);

            try {
                await localImage.inspect();
                logger.debug(`Image exists locally: ${image}`);
                return;
            } catch (err: any) {
                if (err.statusCode !== 404) {
                    throw err;
                }
                logger.info(`Image not found locally, pulling: ${image}`);
            }

            await new Promise((resolve, reject) => {
                this.docker.pull(image, (err: any, stream: any) => {
                    if (err) return reject(err);

                    this.docker.modem.followProgress(stream, (err: any, output: any) => {
                        if (err) return reject(err);
                        logger.info(`Successfully pulled image: ${image}`);
                        resolve(output);
                    }, (event: any) => {
                        // Optional: Log progress here if verbose logging is enabled
                    });
                });
            });

        } catch (error) {
            logger.error(`Failed to ensure image exists: ${image}`, error);
            throw error;
        }
    }



    /**
     * Creates and starts a container, waits for completion, and returns logs/exit code
     */
    async runContainer(config: DockerContainerConfig, timeoutMs: number = 10000): Promise<ContainerExecutionResult> {
        let container: Docker.Container | undefined;

        try {
            await this.ensureImageExists(config.image);

            logger.debug(`Creating container with image: ${config.image}`);

            const createOptions: Docker.ContainerCreateOptions = {
                Image: config.image,
                Cmd: config.cmd,
                Env: config.env,
                WorkingDir: config.workingDir,
                HostConfig: {
                    Memory: config.memory || 256 * 1024 * 1024, // Default 256MB
                    MemorySwap: config.memory || 256 * 1024 * 1024, // No swap
                    NetworkMode: config.networkDisabled !== false ? 'none' : 'bridge', // Default no network
                    Binds: config.binds,
                    AutoRemove: false, // We need to read logs/exit code before removing
                },
                Tty: false,
            };

            container = await this.docker.createContainer(createOptions);
            const containerId = container.id;
            logger.debug(`Container created: ${containerId.substring(0, 12)}`);

            await container.start();
            logger.debug(`Container started: ${containerId.substring(0, 12)}`);

            // Wait for the container to finish or timeout
            await this.waitForContainer(container, timeoutMs);

            // Get logs
            const logs = await container.logs({
                stdout: true,
                stderr: true,
                follow: false,
            }) as Buffer;


            const { stdout, stderr } = this.demuxLogs(logs);

            // Inspect for exit code
            const data = await container.inspect();
            const exitCode = data.State.ExitCode;

            return {
                stdout,
                stderr,
                exitCode,
            };

        } catch (error: any) {
            if (container && error.message === 'Container timed out') {
                logger.warn(`Container execution timed out: ${config.image}`);
                try {
                    await container.stop();
                } catch (e) { /* ignore */ }
                return {
                    stdout: '',
                    stderr: 'Execution time limit exceeded',
                    exitCode: 124, // Timeout
                };
            }

            logger.error('Docker execution failed', error);
            throw error;

        } finally {
            // Always cleanup
            if (container) {
                try {
                    await container.remove({ force: true });
                    logger.debug(`Container removed: ${container.id.substring(0, 12)}`);
                } catch (error) {
                    logger.warn(`Failed to remove container: ${container.id}`, error);
                }
            }
        }
    }

    private waitForContainer(container: Docker.Container, timeoutMs: number): Promise<void> {
        return new Promise((resolve, reject) => {
            let resolved = false;

            // Timeout timer
            const timer = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    reject(new Error('Container timed out'));
                }
            }, timeoutMs);

            container.wait((err, data) => {
                clearTimeout(timer);
                if (!resolved) {
                    resolved = true;
                    if (err) reject(err);
                    else resolve();
                }
            });
        });
    }

    /**
     * Basic demuxer for Docker log stream format
     * Header is 8 bytes: [STREAM_TYPE, 0, 0, 0, SIZE1, SIZE2, SIZE3, SIZE4]
     * STREAM_TYPE: 1 = stdout, 2 = stderr
     */
    private demuxLogs(buffer: Buffer): { stdout: string; stderr: string } {
        let stdout = '';
        let stderr = '';
        let headerOffset = 0;

        while (headerOffset < buffer.length) {
            const type = buffer[headerOffset];
            const length = buffer.readUInt32BE(headerOffset + 4);
            const contentOffset = headerOffset + 8;

            if (contentOffset + length > buffer.length) break; // Incomplete chunk

            const content = buffer.toString('utf-8', contentOffset, contentOffset + length);

            if (type === 1) {
                stdout += content;
            } else if (type === 2) {
                stderr += content;
            }

            headerOffset = contentOffset + length;
        }

        return { stdout, stderr };
    }
}
