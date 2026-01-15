import React, { useEffect } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { IconButton, Box, Typography } from '@mui/material';
import { Mic, Stop, Delete, CheckCircle } from '@mui/icons-material';

export default function AudioRecorder({ onAudioReady }) {
  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } = useReactMediaRecorder({ 
    audio: true,
    blobPropertyBag: { type: "audio/webm" } // Formato padrão web otimizado
  });

  // Converte o Blob URL em um objeto File compatível com seu formulário
  const handleSave = async () => {
    if (!mediaBlobUrl) return;

    try {
      const response = await fetch(mediaBlobUrl);
      const blob = await response.blob();
      
      // Cria um nome de arquivo único
      const fileName = `audio-gravado-${new Date().getTime()}.webm`;
      const file = new File([blob], fileName, { type: "audio/webm" });

      // Envia para o componente pai
      onAudioReady(file);
      clearBlobUrl(); // Limpa para nova gravação
    } catch (error) {
      console.error("Erro ao processar áudio", error);
    }
  };

  return (
    <Box display="flex" alignItems="center" gap={1} sx={{ border: '1px dashed #ccc', borderRadius: 2, p: 1, width: 'fit-content' }}>
      
      {status !== 'recording' && !mediaBlobUrl && (
        <IconButton color="primary" onClick={startRecording} title="Gravar Áudio">
          <Mic />
        </IconButton>
      )}

      {status === 'recording' && (
        <>
          <Typography variant="caption" sx={{ color: 'red', fontWeight: 'bold', animation: 'pulse 1s infinite' }}>
            Gravando...
          </Typography>
          <IconButton color="error" onClick={stopRecording}>
            <Stop />
          </IconButton>
        </>
      )}

      {status === 'stopped' && mediaBlobUrl && (
        <>
          <audio src={mediaBlobUrl} controls style={{ height: 30, width: 200 }} />
          
          <IconButton color="success" onClick={handleSave} title="Confirmar Áudio">
            <CheckCircle />
          </IconButton>
          
          <IconButton color="default" onClick={clearBlobUrl} title="Descartar">
            <Delete />
          </IconButton>
        </>
      )}
    </Box>
  );
}