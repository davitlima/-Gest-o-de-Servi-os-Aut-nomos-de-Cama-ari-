document.addEventListener('DOMContentLoaded', async () => {
  const api = await window.nexlarReady;
  const rows = document.getElementById('accountRows');
  const count = document.getElementById('accountCount');
  const search = document.getElementById('accountSearch');
  const message = document.getElementById('adminMessage');
  let accounts = [];

  const showMessage = (text, isError = false) => {
    message.textContent = text;
    message.classList.toggle('is-error', isError);
    message.classList.add('is-visible');
  };

  const cell = (text, className = '') => {
    const element = document.createElement('td');
    element.textContent = text || '—';
    if (className) element.className = className;
    return element;
  };

  function render() {
    const term = search.value.trim().toLocaleLowerCase('pt-BR');
    const filtered = accounts.filter((account) =>
      `${account.name} ${account.email} ${account.role}`.toLocaleLowerCase('pt-BR').includes(term),
    );
    count.textContent = `${filtered.length} de ${accounts.length} conta(s)`;
    rows.replaceChildren();

    if (!filtered.length) {
      const empty = document.createElement('td');
      empty.colSpan = 6;
      empty.className = 'admin-empty';
      empty.textContent = 'Nenhuma conta encontrada.';
      const row = document.createElement('tr');
      row.append(empty);
      rows.append(row);
      return;
    }

    for (const account of filtered) {
      const row = document.createElement('tr');
      const userCell = document.createElement('td');
      const name = document.createElement('span');
      name.className = 'admin-user-name';
      name.textContent = account.name || 'Sem nome';
      const role = document.createElement('span');
      role.className = 'admin-user-role';
      role.textContent = account.role;
      userCell.append(name, role);
      row.append(userCell, cell(account.email), cell(account.document), cell(account.phone));

      const statusCell = document.createElement('td');
      const status = document.createElement('span');
      status.className = `admin-status${account.restricted ? ' is-restricted' : ''}`;
      status.textContent = account.restricted ? 'Restrita' : 'Ativa';
      statusCell.append(status);
      row.append(statusCell);

      const actionCell = document.createElement('td');
      if (!account.restricted) {
        const button = document.createElement('button');
        button.className = 'admin-action';
        button.type = 'button';
        button.textContent = 'Restringir';
        button.addEventListener('click', () => restrictAccount(account, button));
        actionCell.append(button);
      }
      row.append(actionCell);
      rows.append(row);
    }
  }

  async function restrictAccount(account, button) {
    const reason = window.prompt(`Motivo para restringir ${account.name} permanentemente:`)?.trim();
    if (!reason) return;
    if (reason.length < 5 || reason.length > 1000) {
      showMessage('O motivo precisa ter entre 5 e 1.000 caracteres.', true);
      return;
    }
    button.disabled = true;
    try {
      const result = await api.request(`admin/users/${encodeURIComponent(account.id)}/restrict`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      account.restricted = true;
      render();
      showMessage(
        result.suspension_failures
          ? `Identificadores bloqueados. O banco protege o acesso à Nexlar, mas ${result.suspension_failures} sessão(ões) não foi(ram) suspensa(s) no Auth.`
          : `Restrição gravada. ${result.accounts_affected} conta(s) correspondente(s) tiveram o login suspenso.`,
        Boolean(result.suspension_failures),
      );
    } catch (error) {
      button.disabled = false;
      showMessage(error.message || 'Não foi possível restringir a conta.', true);
    }
  }

  try {
    const current = await api.request('me');
    if (!current.is_admin) {
      location.replace('/src/pages/inicio.html');
      return;
    }
    accounts = await api.request('admin/users');
    render();
  } catch (error) {
    if (/conta foi impedida/i.test(error.message)) {
      await api.supabase.auth.signOut();
      location.replace('/src/pages/login.html');
      return;
    }
    rows.replaceChildren();
    const empty = document.createElement('td');
    empty.colSpan = 6;
    empty.className = 'admin-empty';
    empty.textContent = 'Não foi possível carregar as contas.';
    const row = document.createElement('tr');
    row.append(empty);
    rows.append(row);
    count.textContent = 'Falha ao carregar';
    showMessage(error.message || 'Não foi possível abrir o painel administrativo.', true);
  }

  search.addEventListener('input', render);
  document.getElementById('logoutButton').addEventListener('click', async () => {
    await api.supabase.auth.signOut();
    location.href = '/src/pages/login.html';
  });
});
