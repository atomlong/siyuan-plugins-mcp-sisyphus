/** Resolve the current workspace kernel endpoint for Node-based clients. */
export function getWorkspaceApiUrl(origin: string | undefined): string {
    if (!origin || !/^https?:\/\//.test(origin)) {
        throw new Error('Cannot determine the current SiYuan workspace API origin. Reopen this workspace before starting HTTP MCP.');
    }
    const kernelUrl = new URL(origin);
    if (kernelUrl.protocol === 'https:' && ['127.0.0.1', 'localhost', '[::1]'].includes(kernelUrl.hostname)) {
        // SiYuan's desktop kernel accepts HTTP on the same loopback port.
        // Electron trusts its local HTTPS certificate, but the Node child
        // does not. Preserve this workspace's port instead of guessing 6806
        // or disabling TLS verification for remote kernels.
        const port = kernelUrl.port || '443';
        kernelUrl.protocol = 'http:';
        kernelUrl.port = port;
    }
    return kernelUrl.origin;
}
