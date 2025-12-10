// Função auxiliar para disparar notificação do navegador
const dispararNotificacaoNativa = (titulo, corpo) => {
  if (!("Notification" in window)) return; // Navegador não suporta

  if (Notification.permission === "granted") {
    // Se já tem permissão, dispara
    new Notification(titulo, { 
      body: corpo,
      icon: '/vite.svg', // Dica: coloque o caminho do seu logo aqui (na pasta public)
      silent: true // Toca o som do seu audio.play(), não o do sistema (evita som duplo)
    });
  } else if (Notification.permission !== "denied") {
    // Se não tem permissão, pede agora
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(titulo, { body: corpo });
      }
    });
  }
};