const perguntaEl = document.getElementById('pergunta');
const questaoNumEl = document.getElementById('questao-num');
const optionsEl = document.getElementById('options');
const feedbackEl = document.getElementById('feedback');
const nextBtn = document.getElementById('next');
const resetBtn = document.getElementById('reset');
const scoreCountEl = document.getElementById('score-count');
const catContainer = document.getElementById('cat-container');
const catImg = document.getElementById('cat-img');
const closeCatBtn = document.getElementById('close-cat');

let perguntas = [];
let index = 0;
let score = 0;
let answered = false;

async function fetchQuiz(){
  try{
    // pedir em português por padrão
    const res = await fetch('/quiz?lang=pt');
    const data = await res.json();
    // API retorna em data.results
    perguntas = data.results || [];
    index = 0; score = 0; updateScore();
    renderQuestion();
  }catch(err){
    perguntaEl.textContent = 'Erro ao carregar perguntas.';
    console.error(err);
  }
}

function decodeHtml(html){
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

function shuffle(a){
  return a.sort(() => Math.random() - 0.5);
}

function renderQuestion(){
  feedbackEl.textContent = '';
  nextBtn.disabled = true;
  optionsEl.innerHTML = '';
  if(!perguntas || !perguntas[index]){
    perguntaEl.textContent = 'Fim do quiz!';
    questaoNumEl.textContent = '';
    return;
  }

  const q = perguntas[index];
  questaoNumEl.textContent = `Questão ${index+1} / ${perguntas.length}`;
  perguntaEl.textContent = decodeHtml(q.question);

  const answers = shuffle([q.correct_answer, ...q.incorrect_answers].map(a => decodeHtml(a)));

  answers.forEach(ans => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.type = 'button';
    btn.innerHTML = ans;
    btn.addEventListener('click', () => onSelectAnswer(btn, ans, q.correct_answer));
    optionsEl.appendChild(btn);
  });
}

function onSelectAnswer(btn, answer, correctRaw){
  if(answered) return;
  answered = true;
  // decode correct for comparison
  const correct = decodeHtml(correctRaw);
  const buttons = optionsEl.querySelectorAll('.option');
  buttons.forEach(b => b.disabled = true);
  btn.classList.add('selected');

  if(answer === correct){
    feedbackEl.textContent = 'Correto!';
    score += 1; updateScore();
    // buscar gatinho e mostrar
    showRandomCat();
  } else {
    feedbackEl.textContent = `Errado! Resposta certa: ${correct}`;
  }

  nextBtn.disabled = false;
}

function updateScore(){
  scoreCountEl.textContent = score;
}

async function showRandomCat(){
  try{
    const res = await fetch('/gatinho');
    const data = await res.json();
    // data é um array com objeto que tem url
    const url = (Array.isArray(data) && data[0] && data[0].url) ? data[0].url : (data.url || '');
    if(url){
      catImg.src = url;
      catContainer.classList.remove('hidden');
    } else {
      console.warn('Sem URL de gatinho no retorno', data);
    }
  }catch(err){
    console.error('Erro ao buscar gatinho', err);
  }
}

nextBtn.addEventListener('click', () => {
  index += 1;
  answered = false;
  renderQuestion();
});

resetBtn.addEventListener('click', () => {
  fetchQuiz();
});

closeCatBtn.addEventListener('click', () => {
  catContainer.classList.add('hidden');
});

// iniciar
fetchQuiz();
