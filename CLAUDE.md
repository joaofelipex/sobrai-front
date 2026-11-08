# MiXCo (dentro do repositório sobrai-front)

Gestora de patrimônio pessoal de uma pessoa só, estudante de economia. Foco: se organizar de verdade.
Roda **só localmente** (SQLite em `../sobrai-back/sobrai.db`). **Sem login, por decisão do dono**: nunca expor na internet.
O módulo antigo do Sobrai (MEI/NFS-e) continua no código, no grupo "Negócio (Sobrai)" do menu.

## Como rodar
`npm run mixco` (nesta pasta) sobe a API `../sobrai-back` (3001) e o app (3000). Repositórios lado a lado.

## Mapa
- Telas MiXCo: `src/components/pages/mixco/` (overview, cashflow, wealth, goals, connections, quick-add, `mx-visuals.ts` = rosca/sparkline/anel em SVG)
- Estado: `src/services/mixco.service.ts` (signals; toda escrita recarrega o resumo). Modelos: `src/models/mixco.model.ts`
- Design: tokens e classes `.mx-*` em `src/styles.css` (Tailwind v4, sem PrimeNG/Bootstrap). Mobile first: abas, carrosséis, botão + de lançamento rápido, alvos de 44px
- Inputs no celular têm 16px forçados (iOS); exceção `.mx-amount`

## Regras do domínio (não quebrar)
- Pagamento de fatura e transferência interna (`INTERNAL_CATEGORIES`) ficam **fora** de receita/despesa, mas contam no saldo das contas
- Cartão de crédito = saldo negativo = dívida (não é caixa)
- Contas da Pluggy usam o saldo informado pelo banco (`externalBalance`); sincronização é idempotente por `externalId`

## Pendências conhecidas
- Conexão real com a Pluggy ainda não testada (só contra um mock). Conferir saldos/categorias no primeiro banco conectado
- `pluggyConnectScript` em `src/environments/environment.ts`: versão do widget não validada; sem SRI
- Telas do módulo Sobrai não foram adaptadas ao celular
- Verificado só em emulação (Playwright), não em aparelho físico
