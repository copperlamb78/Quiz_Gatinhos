## Quiz de Animais — Projeto

Este projeto é um pequeno quiz de perguntas e respostas sobre animais com frontend simples e backend em Express. Quando o jogador acerta uma pergunta, o frontend exibe um gatinho aleatório (buscado do backend, que por sua vez usa TheCatAPI).
---

## Descrição

O backend fornece duas rotas principais:

- `GET /quiz` — puxa perguntas do OpenTDB e as retorna; aceita query `lang` para traduzir as perguntas (ex.: `/quiz?lang=pt`).
- `GET /gatinho` — puxa uma imagem aleatória de gato (TheCatAPI) e retorna os dados para que o frontend mostre o gatinho.

O backend também serve o frontend estático de modo que você pode abrir `http://localhost:3000` e usar a aplicação sem configurar um servidor adicional.

O frontend contém HTML, CSS e JavaScript que:

- Busca as perguntas em `/quiz?lang=pt` por padrão.
- Renderiza as opções embaralhadas.
- Ao acertar, incrementa o placar e pede `/gatinho` para mostrar uma imagem.

---

## Requisitos

- Node.js
- Conexão à internet
---

## Como executar (Windows / PowerShell)

1. Abra o terminal na pasta do projeto:

2. Instale dependências (se ainda não instalou):

```powershell
npm install
```

3. Inicie o servidor:

```powershell
node src/server.js
```

4. Abra no navegador:

```
http://localhost:3000
```

Observação: o backend serve os arquivos estáticos do frontend automaticamente. Se preferir rodar o frontend em um servidor estático separado, mantenha o backend em execução para que as rotas `/quiz` e `/gatinho` funcionem corretamente.

---

## Endpoints da API

1) GET /quiz

- Query params:
  - `lang` (opcional) — código do idioma de destino (ex.: `pt` para português). Ex.: `/quiz?lang=pt`

- Resposta (exemplo):

```json
{
  "results": [
    {
      "category": "Animals",
      "type": "multiple",
      "difficulty": "easy",
      "question": "Pergunta traduzida (ou original)",
      "correct_answer": "Resposta correta",
      "incorrect_answers": ["Errada 1", "Errada 2", "Errada 3"]
    }
  ]
}
```

Observações sobre tradução (quando `lang` é fornecido):
- O backend tenta traduzir a `question`, `correct_answer` e cada `incorrect_answers`.
- Primeiro tenta usar o serviço LibreTranslate público. Se esse serviço responder com HTML ou falhar, há um fallback que usa o endpoint público do Google Translate (`translate.googleapis.com`) para traduzir cada string.
- Caso a tradução falhe por completo, o backend retorna o texto original em inglês.


2) GET /gatinho

- Retorna um JSON de `https://api.thecatapi.com/v1/images/search` (normalmente um array com um objeto que contém `url`).

Exemplo de uso no frontend: o código pega `data[0].url` e insere no `<img>` para mostrar o gatinho.

---

## Comportamento do frontend

- Arquivo principal: `frontend/index.html` (marcações)
- Estilos: `frontend/style.css` (layout, botões, modal do gatinho)
- Lógica: `frontend/script.js`
  - Ao carregar, o script chama `fetch('/quiz?lang=pt')` por padrão.
  - Renderiza pergunta e opções (embaralhadas) e protege contra múltiplos cliques.
  - Ao acertar, incrementa o placar e chama `/gatinho` para obter a imagem e abrir um modal.
  - Controles: botão `Próxima`, `Reiniciar` e fechar modal do gatinho.

---