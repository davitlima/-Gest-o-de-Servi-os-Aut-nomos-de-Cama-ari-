
function maskDate(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 8);
  if (v.length >= 5)      v = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4);
  else if (v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2);
  input.value = v;
}
 
function maskCPF(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 9)      v = v.slice(0,3) + '.' + v.slice(3,6) + '.' + v.slice(6,9) + '-' + v.slice(9);
  else if (v.length > 6) v = v.slice(0,3) + '.' + v.slice(3,6) + '.' + v.slice(6);
  else if (v.length > 3) v = v.slice(0,3) + '.' + v.slice(3);
  input.value = v;
}
 
function maskPhone(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 10)     v = '(' + v.slice(0,2) + ') ' + v.slice(2,7) + '-' + v.slice(7);
  else if (v.length > 6) v = '(' + v.slice(0,2) + ') ' + v.slice(2,6) + '-' + v.slice(6);
  else if (v.length > 2) v = '(' + v.slice(0,2) + ') ' + v.slice(2);
  else if (v.length > 0) v = '(' + v;
  input.value = v;
}
 
function isValidCPF(cpf) {
  const nums = cpf.replace(/\D/g, '');
  if (nums.length !== 11 || /^(\d)\1+$/.test(nums)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(nums[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(nums[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(nums[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === parseInt(nums[10]);
}
 

function isValidDate(str) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return false;
  const [d, m, y] = str.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}
 
// ── Toast ──────────────────────────────────────────────────
 
let toastTimer = null;
 
/**
 * Exibe uma mensagem temporária no topo da tela.
  @param {string} msg  
  @param {number} duration 
 */
function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

function handleSubmit() {
  const nome      = document.getElementById('nome').value.trim();
  const nasc      = document.getElementById('nascimento').value.trim();
  const cpf       = document.getElementById('cpf').value.trim();
  const contato   = document.getElementById('contato').value.trim();
  const senha     = document.getElementById('senha').value;
  const termos    = document.getElementById('termos').checked;
 
  if (!nome) {
    showToast('⚠️ Preencha o nome completo.');
    focusField('nome');
    return;
  }
 
  if (!isValidDate(nasc)) {
    showToast('⚠️ Data de nascimento inválida. Use DD/MM/AAAA.');
    focusField('nascimento');
    return;
  }
 
  if (!isValidCPF(cpf)) {
    showToast('⚠️ CPF inválido. Verifique o número informado.');
    focusField('cpf');
    return;
  }
 
  const phoneDigits = contato.replace(/\D/g, '');
  if (phoneDigits.length < 10) {
    showToast('⚠️ Informe um número de contato válido.');
    focusField('contato');
    return;
  }
 
  if (senha.length < 6) {
    showToast('⚠️ A senha deve ter pelo menos 6 caracteres.');
    focusField('senha');
    return;
  }
 
  if (!termos) {
    showToast('⚠️ Aceite os Termos de Uso para continuar.');
    return;
  }
 

  const btn = document.getElementById('btnContinuar');
  btn.disabled = true;
  btn.textContent = 'Processando…';
 
  setTimeout(() => {
    showToast('✅ Cadastro realizado com sucesso!', 4000);
    btn.textContent = 'Continuar';
    btn.disabled = false;
  }, 1500);
}
 
function focusField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.focus();
  el.style.borderColor = '#ef4444';
  el.style.boxShadow   = '0 0 0 3px rgba(239,68,68,0.15)';
  el.addEventListener('input', function clearError() {
    el.style.borderColor = '';
    el.style.boxShadow   = '';
    el.removeEventListener('input', clearError);
  }, { once: true });
}
 
/** Limpa todos os campos do formulário. */
function resetForm() {
  ['nome','nascimento','cpf','contato','senha'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('termos').checked = false;
}
 
// ── Help button ────────────────────────────────────────────
 
/** Exibe um toast de ajuda. */
function showHelp() {
  showToast('💡 Preencha todos os campos para criar sua conta Nexlar.', 4000);
}

// ── Integração Final (Opcional, mas recomendada) ───────────
// Garante que o formulário não seja enviado sem passar pelo handleSubmit
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault(); // Impede o recarregamento da página
      handleSubmit();
    });
  }
});