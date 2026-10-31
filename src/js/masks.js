(function (root) {
  const digits = (value, limit) => String(value || '').replace(/\D/g, '').slice(0, limit);

  const date = value => {
    const number = digits(value, 8);
    return number.replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2}\/\d{2})(\d)/, '$1/$2');
  };

  const cpf = value => digits(value, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3}\.\d{3}\.\d{3})(\d{1,2})$/, '$1-$2');

  const cnpj = value => digits(value, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2}\.\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{2}\.\d{3}\.\d{3})(\d)/, '$1/$2')
    .replace(/^(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d{1,2})$/, '$1-$2');

  const phone = value => {
    const number = digits(value, 11);
    if (number.length <= 10) return number.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    return number.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
  };

  const validDate = value => {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (!match) return false;
    const [, day, month, year] = match.map(Number);
    const parsed = new Date(year, month - 1, day);
    return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day && year >= 1900;
  };

  const api = { date, cpf, cnpj, phone, validDate };
  root.NexlarMasks = api;
  root.maskDate = input => { input.value = date(input.value); };
  root.maskCPF = input => { input.value = cpf(input.value); };
  root.maskCNPJ = input => { input.value = cnpj(input.value); };
  root.maskPhone = input => { input.value = phone(input.value); };
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
