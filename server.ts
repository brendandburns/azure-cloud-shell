import * as http from 'http';
import * as net from 'net';
import * as process from 'process';

export class AzureTunnelInfo {
    url: string;
}

export class AzureCloudShell {
    static isAzureCloudShell() {
        return (process.env.ACC_CLOUD && process.env.ACC_CLOUD.length != 0);
    }

    static initAzureCloudShellTunnel(server: http.Server) {
        if (!this.isAzureCloudShell()) {
            return;
        }
        AzureCloudShell.addAzureCloudShellTunnel(server).then((url) => {
            console.log(`Server is available: ${url}`);
        });
    }

    static async addAzureCloudShellTunnel(server: http.Server): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            server.on('listening', async () => {
                const addr = server.address() as net.AddressInfo;
                const tunnel = new AzureCloudShellTunnel(addr.port);
                const exit = () => {
                  tunnel.close().then(() => {
                        process.exit();
                  });
                }
                process.on('SIGINT', exit);
                process.on('SIGUSR1', exit);
                process.on('SIGUSR2', exit);

                try {
                    const info = await tunnel.open();
                    resolve(info.url);
                } catch (ex) {
                    reject(ex);
                }
            });
        });
    }
}

export class AzureCloudShellTunnel {
    readonly port: number;

    constructor(port: number) {
        this.port = port;
    }

    open(): Promise<AzureTunnelInfo> {
        const opts = {
            host: 'localhost',
            port: '8888',
            path: `/openport/${this.port}`,
            method: 'POST',
            headers: {}
        };

        return AzureCloudShellTunnel.connect(opts);
    }

    close(): Promise<AzureTunnelInfo> {
        const opts = {
            host: 'localhost',
            port: 8888,
            path: `/closeport/${this.port}`,
            method: 'POST',
            headers: {}
        }

        return AzureCloudShellTunnel.connect(opts);
    }

    private static connect(opts: http.RequestOptions): Promise<AzureTunnelInfo> {
        return new Promise<AzureTunnelInfo>((resolve, reject) => {
            const req = http.request(opts, (res) => {
                res.setEncoding('utf8');
                let str = '';
                res.on('data', (chunk) => {
                    str = str + chunk;
                });
                res.on('end', () => {
                    const obj = JSON.parse(str) as AzureTunnelInfo;
                    resolve(obj);
                });
                res.on('error', (err) => {
                    reject(err);
                })
            });
            req.end();
        });
    }
}