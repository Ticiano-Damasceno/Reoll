// SENHA DE ACESSO: altere o valor de ACCESS_CODE abaixo.
// Os textos da página ficam no index.html.

const ACCESS_CODE = 'elementos'; // Troque pela senha desejada. Em site estático, ela é visível no código-fonte.
const gate = document.getElementById('gate');
const password = document.getElementById('password');
const status = document.getElementById('status');
gate.addEventListener('submit', event => {
  event.preventDefault();
  if (password.value === ACCESS_CODE) {
    document.body.classList.add('unlocked');
    status.hidden = true;
    password.value = '';
    document.getElementById('archive').querySelector('h2').focus();
  } else {
    status.hidden = false;
    password.value = '';
    password.focus();
  }
});
document.getElementById('lock').addEventListener('click', () => {
  document.body.classList.remove('unlocked');
  password.focus();
});
