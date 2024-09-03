import express from 'express';
import bodyParser from 'body-parser';
import pkg from 'twilio';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const { MessagingResponse } = pkg.twiml;
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const apiKey = process.env.COHERE_API_KEY;

app.post('/whatsapp', async (req, res) => {
    console.log('Requisição recebida:', req.body); // Log da requisição recebida

    const incomingMessage = req.body.Body;
    const from = req.body.From;

    // Chama a API da Cohere para gerar uma resposta de IA
    try {
        const cohereResponse = await fetch('https://api.cohere.ai/v1/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'command-xlarge-nightly',
                prompt: `Você é um bot que responde de forma muito informal e grosseira, usando gírias e palavrões. Use o mínimo de pontuação possível, a não ser que seja uma pergunta. Responda de forma curta e direta. Responda à seguinte pergunta de forma concisa, com até 50 palavras:\nUsuário: ${incomingMessage}\nBot:`,
                max_tokens: 50,
                temperature: 0.7,
            }),
        });

        if (!cohereResponse.ok) {
            throw new Error(`Erro na API da Cohere: ${cohereResponse.statusText}`);
        }

        const cohereData = await cohereResponse.json();
        console.log('Resposta da API da Cohere:', cohereData); // Log da resposta da API

        if (!cohereData || !cohereData.generations || !cohereData.generations.length) {
            throw new Error('Nenhuma resposta válida recebida da API da Cohere.');
        }

        const botResponse = cohereData.generations[0].text.trim();

        const twiml = new MessagingResponse();
        twiml.message(botResponse || "Desculpe, não entendi o que você quis dizer.");

        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
    } catch (error) {
        console.error('Erro ao chamar a API da Cohere:', error); // Log de erro
        const twiml = new MessagingResponse();
        twiml.message("Ocorreu um erro ao tentar processar sua mensagem. Tente novamente mais tarde.");

        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`); // Log de inicialização do servidor
});
