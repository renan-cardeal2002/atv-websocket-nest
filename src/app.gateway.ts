import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface Message {
  clientId: string;
  type: 'text' | 'file';
  content: string;
  filename?: string;
}

@WebSocketGateway({ cors: true })
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private messages: Message[] = [];

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('AppGateway');

  @SubscribeMessage('msgToServer')
  handleMessage(client: Socket, payload: Message): void {
    this.addToHistory(client.id, payload);
    this.server.emit('msgToClient', payload, client.id);
  }

  afterInit(server: Server) {
    this.server.emit('history', this.messages);
    this.logger.log('Init');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client conected ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconected ${client.id}`);
  }

  addToHistory(clientId: string, payload: Message) {
    this.messages.push({
      clientId,
      ...payload,
    });
    this.showHistory();
  }

  showHistory() {
    this.server.emit('history', this.messages);
  }
}
