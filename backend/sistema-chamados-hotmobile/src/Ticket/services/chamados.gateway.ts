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

  // 👇 ADICIONE ESTE: Quando um chamado é criado no formulário
  emitirNovoChamado(chamado: any) {
    this.server.emit('novo_chamado', chamado);
  }

  // 👇 ADICIONE ESTE: Quando um status muda (para outros admins verem)
  emitirMudancaStatus(id: number, novoStatus: string) {
    this.server.emit('mudanca_status', { id, status: novoStatus });
  }
}
