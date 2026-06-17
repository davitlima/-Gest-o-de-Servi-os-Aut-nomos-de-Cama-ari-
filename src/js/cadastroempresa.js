function maskDate(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 8);
  if (v.length >= 5)      v = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4);
  else if (v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2);
  input.value = v;
}
 
function maskCNPJ(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 14);
  if (v.length > 12)     v = v.slice(0,2) + '.' + v.slice(2,5) + '.' + v.slice(5,8) + '/' + v.slice(8,12) + '-' + v.slice(12);
  else if (v.length > 8) v = v.slice(0,2) + '.' + v.slice(2,5) + '.' + v.slice(5,8) + '/' + v.slice(8);
  else if (v.length > 5) v = v.slice(0,2) + '.' + v.slice(2,5) + '.' + v.slice(5);
  else if (v.length > 2) v = v.slice(0,2) + '.' + v.slice(2);
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
 
// Nova função simplificada: apenas garante que o número tem 14 dígitos
function isValidCNPJ(cnpj) {
  const nums = cnpj.replace(/\D/g, '');
  return nums.length === 14;
}
 
function isValidDate(str) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return false;
  const [d, m, y] = str.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}
 
let toastTimer = null;
 
function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return; 
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
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
  });
}

function handleSubmit() {
  const nome      = document.getElementById('nome').value.trim();
  const nasc      = document.getElementById('nascimento').value.trim();
  const cnpj      = document.getElementById('cnpj').value.trim();
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
 
  if (!isValidCNPJ(cnpj)) {
    showToast('⚠️ O campo deve conter um número de 14 dígitos.');
    focusField('cnpj');
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
 
  showToast('⌛ Processando cadastro...', 1500);

  setTimeout(() => {
     showToast('✅ Cadastro realizado com sucesso!', 2000);
     window.location.href = "inicio.html";
  }, 1500);
}
 
function showHelp() {
  showToast('💡 Preencha todos os campos para criar sua conta Nexlar.', 4000);
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formCadastroEmpresa');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault(); 
      handleSubmit();
    });
  }

  const nascInput = document.getElementById('nascimento');
  if (nascInput) {
    nascInput.addEventListener('input', () => maskDate(nascInput));
  }

  const cnpjInput = document.getElementById('cnpj');
  if (cnpjInput) {
    cnpjInput.addEventListener('input', () => maskCNPJ(cnpjInput));
  }

  const contatoInput = document.getElementById('contato');
  if (contatoInput) {
    contatoInput.addEventListener('input', () => maskPhone(contatoInput));
  }
});