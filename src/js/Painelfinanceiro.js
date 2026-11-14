const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
let metaMensal = 0;


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
  const anoAtual = new Date().getFullYear();
  const servicosAno = estado.servicos.filter(s => s.status === 'Concluído' && new Date(`${s.data}T00:00:00`).getFullYear() === anoAtual);
  servicosAno.forEach(s => {
    valoresMensais[s.mes] += s.valor; 
  });
  
  // Atualiza os conjuntos de dados de ambos os gráficos com os valores somados corretos
  graficoBarras.data.datasets[0].data = [...valoresMensais];
  graficoLinhas.data.datasets[0].data = [...valoresMensais];
  
  graficoBarras.update(); 
  graficoLinhas.update();

  // Calcular KPIs do ano corrente e destacar o mês atual.
  const total = servicosAno.reduce((acumulador, s) => acumulador + s.valor, 0);
  const mesesComGanhos = valoresMensais.filter(valor => valor > 0).length;
  const media = mesesComGanhos ? total / mesesComGanhos : 0;
  const ganhoAtual = valoresMensais[new Date().getMonth()];
  const porcentagem = metaMensal > 0 ? Math.min(Math.round((ganhoAtual / metaMensal) * 100), 100) : 0;

  $('ganhoMes').textContent = formatarMoeda(ganhoAtual);
  $('mediaMensal').textContent = formatarMoeda(media);
  $('progressFill').style.width = porcentagem + '%';
  $('progressLabel').textContent = `${formatarMoeda(ganhoAtual)} / ${formatarMoeda(metaMensal)}`;
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

async function salvarRegistro() {
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

  const payload = {
    name: dados.nome, category: dados.categoria, amount: dados.valor,
    service_date: dados.data, client_name: dados.cliente,
    status: dados.status, notes: dados.obs
  };
  try {
    const { request } = await window.nexlarReady;
    if (estado.idEditando) {
      await request(`finance/${estado.idEditando}`, { method: 'PATCH', body: JSON.stringify(payload) });
      exibirAviso('✓ Registro atualizado!');
    } else {
      await request('finance', { method: 'POST', body: JSON.stringify(payload) });
      exibirAviso('✓ Registro adicionado com sucesso!');
    }
    fecharModal();
    await carregarRegistros();
  } catch (error) {
    exibirAviso(error.message, true);
  }
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

$('deleteRecord').addEventListener('click', async () => {
  if (!confirm('Deseja excluir este registro?')) return;
  try {
    const { request } = await window.nexlarReady;
    await request(`finance/${estado.idInspecionando}`, { method: 'DELETE' });
    fecharInspecao();
    await carregarRegistros();
    exibirAviso('🗑 Registro excluído.');
  } catch (error) {
    exibirAviso(error.message, true);
  }
});

async function carregarRegistros() {
  const { request, requireSession } = await window.nexlarReady;
  await requireSession();
  const me = await request('me');
  if (!['autonomo', 'empresa'].includes(me.role)) {
    window.location.replace('inicio.html');
    return;
  }
  const [registros, goal, payouts, pix] = await Promise.all([request('finance'), request('finance/goal'), request('finance/payouts'), request('finance/pix-key')]);
  metaMensal = Number(goal.amount) || 0;
  $('monthlyGoal').value = metaMensal || '';
  estado.servicos = registros.map(item => ({
    id: item.id,
    nome: item.name,
    categoria: item.category || '',
    mes: new Date(`${item.service_date}T00:00:00`).getMonth(),
    valor: Number(item.amount),
    data: item.service_date,
    cliente: item.client_name || '',
    status: item.status,
    obs: item.notes || '',
    source: item.source
  }));
  atualizacaoCompleta();
  $('pixCurrent').textContent = pix.configured ? `Chave cadastrada (${pix.pix_key_type}): ${pix.pix_key_hint}` : 'Nenhuma chave Pix cadastrada.';
  $('pixType').value = pix.pix_key_type || 'CPF';
  renderizarRepasses(payouts);
}

function renderizarRepasses(payouts) {
  const container = $('payoutList'); container.replaceChildren();
  const labels = { aguardando_servico: 'Aguardando conclusão do serviço', aguardando_confirmacao: 'Aguardando confirmação do cliente', disponivel: 'Disponível para repasse', processando: 'Repasse processando', pago: 'Pago', falhou: 'Falha no repasse', bloqueado: 'Bloqueado por contestação' };
  if (!payouts.length) { container.innerHTML = '<p class="empty-state">Ainda não há repasses de contratações.</p>'; return; }
  payouts.forEach(payout => {
    const row = document.createElement('article'); row.className = 'payout-item card';
    const title = document.createElement('strong'); title.textContent = payout.contract_id ? `Contratação #${payout.contract_id}` : 'Repasse';
    const amount = document.createElement('span'); amount.textContent = formatarMoeda(Number(payout.provider_amount));
    const status = document.createElement('span'); status.className = 'badge ' + (payout.status === 'pago' ? 'badge-green' : payout.status === 'falhou' ? 'badge-yellow' : 'badge-gray'); status.textContent = labels[payout.status] || payout.status;
    const detail = document.createElement('small'); detail.textContent = `Comissão Nexlar: ${formatarMoeda(Number(payout.platform_commission))} · Tarifa Pix: ${formatarMoeda(Number(payout.transfer_fee || 0))}`;
    row.append(title, amount, status, detail);
    if (payout.receipt_url) { const receipt = document.createElement('a'); receipt.href = payout.receipt_url; receipt.target = '_blank'; receipt.rel = 'noopener noreferrer'; receipt.textContent = 'Ver comprovante'; row.appendChild(receipt); }
    if (payout.status === 'falhou') {
      const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'btn-secondary'; retry.textContent = 'Tentar repasse novamente';
      retry.addEventListener('click', async () => { retry.disabled = true; try { const { request } = await window.nexlarReady; await request(`finance/payouts/${payout.id}/retry`, { method: 'POST' }); await carregarRegistros(); } catch (error) { retry.disabled = false; exibirAviso(error.message, true); } });
      row.appendChild(retry);
    }
    if (payout.failure_reason) { const error = document.createElement('small'); error.textContent = `Detalhe: ${payout.failure_reason}`; row.appendChild(error); }
    container.appendChild(row);
  });
}

$('savePix').addEventListener('click', async () => {
  const key = $('pixKey').value.trim();
  if (!key) return exibirAviso('Informe a chave Pix.', true);
  try {
    const { request } = await window.nexlarReady;
    await request('finance/pix-key', { method: 'PUT', body: JSON.stringify({ pix_key: key, pix_key_type: $('pixType').value }) });
    $('pixKey').value = ''; exibirAviso('Chave Pix salva com segurança.'); await carregarRegistros();
  } catch (error) { exibirAviso(error.message, true); }
});

$('saveGoal').addEventListener('click', async () => {
  const amount = Number($('monthlyGoal').value);
  if (!Number.isFinite(amount) || amount < 0) return exibirAviso('⚠ Informe uma meta válida.', true);
  try {
    const { request } = await window.nexlarReady;
    await request('finance/goal', { method: 'POST', body: JSON.stringify({ amount }) });
    metaMensal = amount;
    atualizacaoCompleta();
    exibirAviso('✓ Meta mensal atualizada!');
  } catch (error) { exibirAviso(error.message, true); }
});

carregarRegistros().catch(error => exibirAviso(error.message, true));



