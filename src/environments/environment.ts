// A API roda na mesma máquina que serve o front, na porta 3001. Usar o hostname da página (e não
// "localhost" fixo) faz o app funcionar também quando aberto de outro aparelho, ex: celular em
// http://192.168.0.10:3000 -> API em http://192.168.0.10:3001.
const apiHost = typeof location !== 'undefined' && location.hostname ? location.hostname : 'localhost';

export const environment = {
  production: false,
  backendUrl: `http://${apiHost}:3001`,
};
