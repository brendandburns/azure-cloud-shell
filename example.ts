import * as http from 'http'
import * as cloudshell from './server'

const requestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => {
  res.end('Hello Cloud Shell!');
}

const server = http.createServer(requestHandler);

// If in cloud shell this adds the tunnel, otherwise noop
cloudshell.AzureCloudShell.addAzureCloudShellTunnel(server);

server.listen(8080, (err) => {
  if (err) {
    return console.log(`Error! ${err}`);
  }
});