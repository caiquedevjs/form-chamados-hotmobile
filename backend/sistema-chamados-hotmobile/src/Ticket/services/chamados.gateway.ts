import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Permite conexão do seu React
  },
})
export class ChamadosGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  afterInit() {
    console.log('📡 Websocket Gateway iniciado!');
  }

  // Função que vamos chamar no Service para enviar a mensagem
  emitirNovaInteracao(chamadoId: number, interacao: any) {
    // Emite um evento chamado 'nova_interacao' contendo os dados
    this.server.emit('nova_interacao', {
      chamadoId,
      ...interacao
    });
  }
}