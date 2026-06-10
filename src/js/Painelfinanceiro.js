const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const META   = 5000;


const estado = { 
  servicos: [], 
  ganhoMes: new Array(12).fill(0), 
  idEditando: null, 
  idInspecionando: null 
};


const $ = id => document.getElementById(id);
const camposFormulario = ['fNome', 'fCategoria', 'fMes', 'fValor', 'fData', 'fCliente', 'fStatus', 'fObs'];

const formatarMoeda = valor => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const gerarIdUnico = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const classeBadgeStatus = status => status === 'Concluído' ? 'badge badge-green' : status === 'Em andamento' ? 'badge badge-yellow' : 'badge badge-gray';


const MARCA_EIXO = { color: '#94a3b8', font: { size: 10 } };
const LINHA_GRADE = { color: '#f1f5f9' };

// Configuração padrão de Tooltip para exibir em formato de Moeda (R$) ao passar o mouse
const CONFIG_TOOLTIP = {
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: function(context) {
          let valor = context.raw || 0;
          return ' Ganho: ' + formatarMoeda(valor);
        }
      }
    }
  },
  scales: {
    y: { 
      min: 0, 
      grid: LINHA_GRADE, 
      ticks: { ...MARCA_EIXO, callback: valor => 'R$ ' + valor } 
    }, 
    x: { 
      grid: { display: false }, 
      ticks: MARCA_EIXO 
    }
  },
  responsive: true,
  maintainAspectRatio: true
};

const graficoBarras = new Chart($('barChart'), {
  type: 'bar',
  data: { 
    labels: MESES, 
    datasets: [{ data: [...estado.ganhoMes], backgroundColor: '#7c3aed', borderRadius: 5, borderSkipped: false }] 
  },
  options: CONFIG_TOOLTIP
});

const graficoLinhas = new Chart($('lineChart'), {
  type: 'line',
  data: { 
    labels: MESES, 
    datasets: [{ data: [...estado.ganhoMes], borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,.08)', fill: true, pointBackgroundColor: '#fff', pointBorderColor: '#6366f1', pointRadius: 4, tension: 0.35 }] 
  },
  options: CONFIG_TOOLTIP
});

function abrirJanela() {} // Mantida vazia caso use em escopos externos

function atualizacaoCompleta() {
  // Inicializa o array limpando os meses para o recálculo somatório
  const valoresMensais = new Array(12).fill(0);
  
  // Agora calcula somando o valor real (s.valor) guardado no objeto do serviço
  estado.servicos.forEach(s => { 
    valoresMensais[s.mes] += s.valor; 
  });
  
  // Atualiza os conjuntos de dados de ambos os gráficos com os valores somados corretos
  graficoBarras.data.datasets[0].data = [...valoresMensais];
  graficoLinhas.data.datasets[0].data = [...valoresMensais];
  
  graficoBarras.update(); 
  graficoLinhas.update();

  // Calcular KPIs globais baseados no histórico total carregado
  const total = estado.servicos.reduce((acumulador, s) => acumulador + s.valor, 0);
  const media = estado.servicos.length ? total / estado.servicos.length : 0;
  const porcentagem = Math.min(Math.round((total / META) * 100), 100);

  $('ganhoMes').textContent = formatarMoeda(total);
  $('mediaMensal').textContent = formatarMoeda(media);
  $('progressFill').style.width = porcentagem + '%';
  $('progressLabel').textContent = `${formatarMoeda(total)} / ${formatarMoeda(META)}`;
  $('progressPct').textContent = porcentagem + '%';

  // Renderizar a lista do Histórico visual
  if (!estado.servicos.length) {
    $('historyList').innerHTML = '<p class="empty-state">Nenhum registro ainda. Clique em "Adicionar Registro".</p>';
    return;
  }
  
  $('historyList').innerHTML = '';
  [...estado.servicos].reverse().forEach(s => {
    const elemento = document.createElement('div');
    elemento.className = 'service-item';
    elemento.innerHTML = `<span>${s.nome}<span class="service-hint"> ▸ clique para ver detalhes</span></span><span class="service-val">+${formatarMoeda(s.valor)}</span>`;
    elemento.addEventListener('click', () => abrirInspecao(s.id));
    $('historyList').appendChild(elemento);
  });
}

/* ---------- CONTROLADORES DE MODAL (CRUD) ---------- */
function abrirModal(idParaEditar = null) {
  estado.idEditando = idParaEditar;
  $('modalTitle').textContent = idParaEditar ? 'Editar Registro' : 'Adicionar Registro';
  $('saveModal').textContent = idParaEditar ? 'Salvar Alterações' : 'Salvar Registro';

  if (idParaEditar) {
    const s = estado.servicos.find(x => x.id === idParaEditar);
    camposFormulario.forEach(id => $(id).value = s[id.slice(1).toLowerCase()]);
  } else {
    camposFormulario.forEach(id => $(id).value = '');
    $('fCategoria').selectedIndex = 0; $('fStatus').selectedIndex = 0;
    $('fData').valueAsDate = new Date();
    $('fMes').value = new Date().getMonth();
  }
  $('modalOverlay').classList.add('open');
}

function fecharModal() { $('modalOverlay').classList.remove('open'); estado.idEditando = null; }

function salvarRegistro() {
  const dados = {
    nome: $('fNome').value.trim(), 
    categoria: $('fCategoria').value, 
    mes: parseInt($('fMes').value),
    valor: parseFloat($('fValor').value), 
    data: $('fData').value, 
    cliente: $('fCliente').value.trim(),
    status: $('fStatus').value, 
    obs: $('fObs').value.trim()
  };

  if (!dados.nome) return exibirAviso('⚠ Informe o nome do serviço.', true);
  if (isNaN(dados.valor) || dados.valor <= 0) return exibirAviso('⚠ Informe um valor válido.', true);

  if (estado.idEditando) {
    const indice = estado.servicos.findIndex(x => x.id === estado.idEditando);
    estado.servicos[indice] = { ...estado.servicos[indice], ...dados };
    exibirAviso('✓ Registro atualizado!');
  } else {
    estado.servicos.push({ id: gerarIdUnico(), ...dados });
    exibirAviso('✓ Registro adicionado com sucesso!');
  }
  fecharModal(); 
  atualizacaoCompleta();
}

function abrirInspecao(id) {
  estado.idInspecionando = id;
  const s = estado.servicos.find(x => x.id === id);
  const dataFormatada = s.data ? new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—';

  $('inspectBody').innerHTML = `
    <div class="inspect-grid">
      <div class="inspect-field full"><label>Nome do Serviço</label><span>${s.nome}</span></div>
      <div class="inspect-field"><label>Valor</label><span class="inspect-valor">+${formatarMoeda(s.valor)}</span></div>
      <div class="inspect-field"><label>Status</label><span><span class="${classeBadgeStatus(s.status)}">${s.status}</span></span></div>
      <div class="inspect-field"><label>Categoria</label><span>${s.categoria || '—'}</span></div>
      <div class="inspect-field"><label>Mês</label><span>${MESES[s.mes]}</span></div>
      <div class="inspect-field"><label>Data</label><span>${dataFormatada}</span></div>
      <div class="inspect-field"><label>Cliente / Local</label><span>${s.cliente || '—'}</span></div>
      ${s.obs ? `<div class="inspect-field full"><label>Observações</label><span>${s.obs}</span></div>` : ''}
    </div>`;
  $('inspectOverlay').classList.add('open');
}

function fecharInspecao() { $('inspectOverlay').classList.remove('open'); estado.idInspecionando = null; }

function exibirAviso(mensagem, ehAviso = false) {
  $('toast').textContent = mensagem; 
  $('toast').style.background = ehAviso ? '#b91c1c' : '#1e293b';
  $('toast').classList.add('show'); 
  setTimeout(() => $('toast').classList.remove('show'), 3000);
}

/* ---------- GERENCIAMENTO DE EVENTOS ---------- */
$('openModal').addEventListener('click', () => abrirModal());
$('closeModal').addEventListener('click', fecharModal);
$('cancelModal').addEventListener('click', fecharModal);
$('saveModal').addEventListener('click', salvarRegistro);
$('modalOverlay').addEventListener('click', e => { if (e.target === $('modalOverlay')) fecharModal(); });

$('closeInspect').addEventListener('click', fecharInspecao);
$('closeInspect2').addEventListener('click', fecharInspecao);
$('inspectOverlay').addEventListener('click', e => { if (e.target === $('inspectOverlay')) fecharInspecao(); });

$('editRecord').addEventListener('click', () => { const id = estado.idInspecionando; fecharInspecao(); abrirModal(id); });

$('deleteRecord').addEventListener('click', () => {
  if (!confirm('Deseja excluir este registro?')) return;
  estado.servicos = estado.servicos.filter(x => x.id !== estado.idInspecionando);
  fecharInspecao(); 
  atualizacaoCompleta(); 
  exibirAviso('🗑 Registro excluído.');
});

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
  
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  });
});
// Inicialização Automática
atualizacaoCompleta();