import express from "express"
import path from "path"
import fs from 'fs'
import { fileURLToPath } from 'url'

const app = express()
const port = 3000

// resolver __dirname em ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// localizar pasta frontend — pode estar em two locations depending on how repo was rearranged
const candidateRoot = path.join(__dirname, '..', '..', 'frontend') 
const candidateBackend = path.join(__dirname, '..', 'frontend') 
let frontendPath = null
if (fs.existsSync(candidateBackend)) {
    frontendPath = candidateBackend
    console.log('Serving frontend from', frontendPath)
} else if (fs.existsSync(candidateRoot)) {
    frontendPath = candidateRoot
    console.log('Serving frontend from', frontendPath)
} else {
    // fallback: try parent of __dirname
    frontendPath = candidateRoot
    console.warn('Frontend folder not found in expected locations; using', frontendPath)
}

app.use(express.static(frontendPath))

app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'))
})

app.get("/quiz", async (req, res) => { // Rota que puxa da api de perguntas e respostas
    try {
        const response = await fetch("https://opentdb.com/api.php?amount=10&category=27&type=multiple")
        const data = await response.json()
        // Se for pedida tradução via query ?lang=pt (ou outra), tentamos traduzir
        const lang = (req.query.lang || 'en').toLowerCase()
        if(lang && lang !== 'en' && data && Array.isArray(data.results) && data.results.length){
            try{
                // coletar todos os textos para traduzir de uma vez
                const texts = []
                const map = [] // para mapear posições -> {i, field, idx}
                data.results.forEach((q, i) => {
                    // pergunta
                    map.push({i, field: 'question', idx: texts.length})
                    texts.push(q.question)
                    // correct
                    map.push({i, field: 'correct_answer', idx: texts.length})
                    texts.push(q.correct_answer)
                    // incorrects
                    q.incorrect_answers.forEach((inc, k) => {
                        map.push({i, field: 'incorrect_answers', idx: texts.length, subIdx: k})
                        texts.push(inc)
                    })
                })

                if(texts.length){
                    let translations = []
                    // primeiro tentar LibreTranslate (padrão público)
                    try{
                        const translateEndpoint = 'https://libretranslate.de/translate'
                        const resp = await fetch(translateEndpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ q: texts, source: 'en', target: lang, format: 'text' })
                        })
                        // se não for JSON válido, isso lançará
                        const tr = await resp.json()
                        if(Array.isArray(tr) && tr.length === texts.length){
                            translations = tr.map(item => (typeof item === 'string' ? item : (item.translatedText || item)))
                        } else if(Array.isArray(tr) && tr.length){
                            // tr pode ser array de objetos com translatedText
                            translations = tr.map(item => (item && item.translatedText) ? item.translatedText : (typeof item === 'string' ? item : ''))
                        }
                    } catch(libErr){
                        console.warn('LibreTranslate falhou, tentarei fallback:', libErr && libErr.message)
                    }

                    // fallback: Google Translate endpoint público (um pedido por texto)
                    if(translations.length !== texts.length){
                        try{
                            const googleTranslate = async (text) => {
                                try{
                                    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(lang)}&dt=t&q=${encodeURIComponent(text)}`
                                    const r = await fetch(url)
                                    const j = await r.json()
                                    // estrutura: [ [ [ translatedText, original, ... ], ... ], ... ]
                                    if(Array.isArray(j) && Array.isArray(j[0]) && Array.isArray(j[0][0])){
                                        return j[0][0][0]
                                    }
                                }catch(e){
                                    // ignore per-text errors
                                }
                                return text
                            }

                            const results = await Promise.all(texts.map(t => googleTranslate(t)))
                            translations = results
                        } catch(gErr){
                            console.warn('Fallback Google Translate falhou:', gErr && gErr.message)
                        }
                    }

                    // aplicar traduções de volta se tivermos traduções válidas
                    if(translations.length === texts.length){
                        data.results.forEach(r => { r.incorrect_answers = Array.isArray(r.incorrect_answers) ? r.incorrect_answers : [] })
                        map.forEach(m => {
                            const val = translations[m.idx]
                            if(m.field === 'question') data.results[m.i].question = val
                            else if(m.field === 'correct_answer') data.results[m.i].correct_answer = val
                            else if(m.field === 'incorrect_answers') data.results[m.i].incorrect_answers[m.subIdx] = val
                        })
                    } else {
                        console.warn('Tradução retornou tamanho diferente; retornando original')
                    }
                }
            } catch(transErr){
                console.error('Erro ao traduzir perguntas:', transErr)
                // se der erro na tradução, continuar com os originais
            }
        }

        res.status(200).json(data)
    } catch(error) {
        console.error("Erro Api:", error)
        res.status(500).json({ error: "Deu um erro ao encontrar perguntas e respostas"})
    }
})

app.get("/gatinho", async (req, res) => { // Rota que puxa gatinhos da api de gatinhos
    try {
        const response = await fetch(`https://api.thecatapi.com/v1/images/search`)
        const data = await response.json()
        res.status(200).json(data)
    } catch(error) {
        console.error("Error ao encontrar gatinho:", error)
        res.status(500).json({ error: "Deu error ao encontrar gatinho"})
    }
})

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})
