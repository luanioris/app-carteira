# 📋 Plano Detalhado de Desenvolvimento - Sistema Gestor de Carteiras

## Estrutura de 9 Fases com Checklists Completos

---

## ✅ FASE 1: Setup e Autenticação

### Backend/Infraestrutura:
- [x] Criar projeto Next.js 14+ com App Router
- [x] Configurar TypeScript
- [x] Configurar Tailwind CSS
- [x] Integrar Supabase (client + SSR)
- [x] Criar schema do banco de dados
- [x] Configurar Row Level Security (RLS)
- [x] Seed de perfis predefinidos

### Autenticação:
- [x] Página de login
- [x] Página de cadastro
- [x] Callback de autenticação
- [x] Middleware de proteção de rotas
- [x] Logout
- [x] Persistência de sessão

---

## ✅ FASE 2: Criação de Carteira Inicial

### Wizard de Criação (4 Etapas):
- [x] **Etapa 1:** Definições básicas
  - [x] Nome da carteira
  - [x] Valor inicial
  - [x] Seleção de perfil (Conservador/Moderado/Agressivo)
- [x] **Etapa 2:** Seleção de ativos
  - [x] Busca de ativos por ticker
  - [x] Separação por categoria (Ações, ETF Inter, ETF RF)
  - [x] Validação de quantidade mínima por categoria
- [x] **Etapa 3:** Preços
  - [x] Busca automática de cotações (API)
  - [x] Input manual de preços
  - [x] Validação de preços preenchidos
- [x] **Etapa 4:** Confirmação
  - [x] Cálculo de distribuição proporcional
  - [x] Preview de alocação
  - [x] Criação da carteira no banco

### Lógica de Negócio:
- [x] Algoritmo de distribuição proporcional
- [x] Cálculo de quantidade por ativo
- [x] Validação de orçamento
- [x] Criação de posições iniciais
- [x] Registro de transações (COMPRA_INICIAL)

---

## ✅ FASE 3: Dashboard e Visualização

### Dashboard Principal:
- [x] Card de resumo (valor total, rentabilidade)
- [x] Gráfico de pizza (alocação por categoria)
- [x] Lista de posições
  - [x] Ticker, quantidade, PM, valor atual
  - [x] Rentabilidade individual
  - [x] Percentual na carteira
- [x] Indicadores de performance
  - [x] Rentabilidade total (%)
  - [x] Rentabilidade em R$
  - [x] Comparação com metas do perfil

### Cotações:
- [x] Busca automática de cotações
- [x] Override manual de cotações
- [x] Persistência de cotações manuais
- [x] Atualização em tempo real

### Histórico:
- [x] Lista de transações
- [x] Filtros (por tipo, por ativo)
- [x] Busca por ticker
- [x] Ordenação por data

---

## ✅ FASE 4: Aportes Adicionais

### Fluxo de Aporte:
- [x] Input de valor do aporte
- [x] Cálculo de distribuição automática
- [x] Respeito ao perfil atual
- [x] Preview antes de confirmar
- [x] Atualização de posições
- [x] Recálculo de preço médio
- [x] Registro de transações (COMPRA_ADICIONAL)

---

## ✅ FASE 5: Rebalanceamento Anual

### Wizard de Rebalanceamento (6 Etapas):
- [x] **Etapa 1:** Definições
  - [x] Valor do novo aporte
  - [x] Seleção de novo perfil
- [x] **Etapa 2:** Novos ativos
  - [x] Adicionar novos ativos
  - [x] Manter ativos existentes
  - [x] Marcar ativos para venda total
- [x] **Etapa 3:** Preços dos novos ativos
  - [x] Busca automática
  - [x] Input manual
- [x] **Etapa 4:** Vendas totais
  - [x] Lista de ativos a vender
  - [x] Input de preço de venda
  - [x] Cálculo de valor liberado
- [x] **Etapa 5:** Distribuição inteligente
  - [x] Algoritmo de distribuição igualitária
  - [x] Greedy Fill (minimizar caixa)
  - [x] Priorização de categorias defasadas
  - [x] Ajuste manual de quantidades
- [x] **Etapa 6:** Confirmação
  - [x] Editar quantidade de compras
  - [x] Editar quantidade de vendas
  - [x] Editar preços
  - [x] **Calculadora de PM** (lote + fracionário)
  - [x] Preview final
  - [x] Alerta de saldo negativo

### Migração de Carteira:
- [x] Criar nova carteira versionada
- [x] Transferir ativos mantidos
- [x] Registrar compras adicionais
- [x] Registrar vendas parciais
- [x] Encerrar carteira antiga
- [x] Histórico detalhado com rastreabilidade

### Pendente:
- [ ] Testes completos de todos os cenários
- [ ] Validação do histórico

---

## 🔜 FASE 6: Proventos e Reinvestimento

### Registro de Proventos:
- [ ] Formulário de registro
  - [ ] Ticker
  - [ ] Valor recebido
  - [ ] Data de pagamento
  - [ ] Tipo (Dividendo, JCP, Rendimento)
- [ ] Lista de proventos recebidos
- [ ] Filtros e busca

### Reinvestimento:
- [ ] Opção "Reinvestir" no registro
- [ ] Cálculo automático de quantidade
- [ ] Atualização de posição
- [ ] Recálculo de PM
- [ ] Registro de transação (PROVENTO_REINVESTIDO)

### Dashboard de Proventos:
- [ ] Total recebido no mês
- [ ] Total recebido no ano
- [ ] Dividend Yield por ativo
- [ ] Dividend Yield da carteira
- [ ] Gráfico de evolução mensal
- [ ] Projeção de proventos futuros

### Relatórios:
- [ ] Relatório mensal de proventos
- [ ] Relatório anual
- [ ] Exportação para Excel/PDF

---

## ✅ FASE 7: Relatórios e Analytics

### Gráficos de Performance:
- [x] Evolução patrimonial (linha do tempo)
- [x] Comparação com benchmarks
  - [x] CDI
  - [x] IBOV
- [x] Rentabilidade por ativo
- [x] Rentabilidade por categoria
- [x] Distribuição por categoria (Pie Chart)

### Análise de Risco:
- [x] Análise de concentração (maior posição)
- [x] Alertas de diversificação

### Relatórios Customizados:
- [x] Exportação Excel (Fase 6)
  - [x] Resumo da carteira
  - [x] Posições detalhadas
  - [x] Histórico de transações
  - [x] Proventos recebidos

### Metas e Objetivos:
- [x] Definir meta de patrimônio
- [x] Definir data alvo
- [x] Acompanhamento de progresso (barra visual)
- [x] Projeções futuras (gráfico de área)
- [x] Simulador de aportes (juros compostos)
  - [x] Aporte mensal configurável
  - [x] Taxa de retorno anual
  - [x] Período de investimento
  - [x] Visualização gráfica da projeção

---

## 🔜 FASE 8: Automações e Alertas

### Sistema de Alertas:
- [ ] Alerta de rebalanceamento necessário
  - [ ] Quando categoria desbalancear >10%
  - [ ] Sugestão de ajustes
- [ ] Alerta de proventos
  - [ ] Notificação de pagamento
  - [ ] Lembrete de registro
- [ ] Alertas de preço
  - [ ] Stop loss
  - [ ] Take profit
  - [ ] Variação percentual

### Automações:
- [ ] Atualização automática de cotações
  - [ ] Integração com API de cotações (pendente para fazer após migração e colocar o app em produção na hospedagem da vercel)
  - [ ] Agendamento diário
  - [ ] Cache inteligente
- [ ] Relatório mensal automático
  - [ ] Geração automática
  - [ ] Envio por email
- [ ] Sugestão de aportes mensais
  - [ ] Baseado em metas
  - [ ] Distribuição automática

### Integrações:
- [x] **API de cotações com fallback automático** ✨
  - [x] Brapi (fonte primária)
  - [x] Yahoo Finance (fallback automático)
  - [x] Normalização de tickers (.SA para Brasil)
  - [x] Tratamento de erros e timeouts
  - [x] Suporte a plano gratuito (1 ticker/request)
  - [x] Chamadas paralelas otimizadas
  - [x] Logs detalhados para debugging
- [ ] Email (Resend / SendGrid)
- [ ] Notificações push (OneSignal)
- [ ] Webhooks para eventos importantes

---

## 🔜 FASE 9: UX/UI e Otimizações

### Melhorias Visuais:
- [ ] **Design System completo**
  - [ ] Paleta de cores refinada
  - [ ] Tipografia consistente
  - [ ] Espaçamentos padronizados
  - [ ] Componentes reutilizáveis
- [ ] **Dark Mode**
  - [ ] Toggle de tema
  - [ ] Persistência de preferência
  - [ ] Transições suaves
- [ ] **Temas customizáveis**
  - [ ] Seleção de cores
  - [ ] Layouts alternativos
- [ ] **Animações e transições**
  - [ ] Micro-interações
  - [ ] Loading states
  - [ ] Skeleton screens
  - [ ] Transições de página

### Responsividade:
- [ ] Mobile-first design
- [ ] Tablet optimization
- [ ] Desktop layouts
- [ ] Touch gestures
- [ ] PWA (Progressive Web App)
  - [ ] Instalável
  - [ ] Offline-first
  - [ ] Push notifications

### Performance:
- [ ] Code splitting
- [ ] Lazy loading de componentes
- [ ] Otimização de imagens
- [ ] Cache de cotações
- [ ] Otimização de queries
- [ ] Server-side rendering (SSR)
- [ ] Static generation onde possível

### Acessibilidade:
- [ ] ARIA labels
- [ ] Navegação por teclado
- [ ] Contraste adequado
- [ ] Screen reader support
- [ ] Textos alternativos

### Features Avançadas:
- [ ] **Múltiplas carteiras**
  - [ ] Criar várias carteiras
  - [ ] Alternar entre carteiras
  - [ ] Comparação entre carteiras
  - [ ] Consolidação de todas
- [ ] **Compartilhamento**
  - [ ] Compartilhar carteira (read-only)
  - [ ] Link público
  - [ ] Exportar snapshot
- [ ] **Importação de dados**
  - [ ] Importar de Excel
  - [ ] Importar de CSV
  - [ ] Importar de outras plataformas

### Gamificação (Opcional):
- [ ] Conquistas (achievements)
- [ ] Badges por metas atingidas
- [ ] Ranking de performance
- [ ] Desafios mensais

---

## 📊 Progresso Detalhado

```
FASE 1: Setup e Autenticação
████████████████████ 100% (12/12 itens)

FASE 2: Criação de Carteira
████████████████████ 100% (15/15 itens)

FASE 3: Dashboard
████████████████████ 100% (18/18 itens)

FASE 4: Aportes
████████████████████ 100% (7/7 itens)

FASE 5: Rebalanceamento
████████████████████ 100% (30/30 itens)
✅ Fluxo Otimizado e Validado

FASE 6: Proventos
████████████████████ 100% (15/15 itens)
✅ Registro, Reinvestimento, Dashboard

FASE 7: Analytics
████████████████████ 100% (20/20 itens)
✅ Gráficos, Benchmarks, Metas, Simulador

FASE 8: Automações e Integrações
████░░░░░░░░░░░░░░░░  23% (7/30 itens)
✅ API de Cotações com Fallback

FASE 9: UX/UI
███░░░░░░░░░░░░░░░░░   15% (5/35 itens)
✅ Interfaces Premium (Criação/Rebalanceamento)
```

**Total:** 111/152 itens concluídos (~73%)

---

## 🎯 Priorização Sugerida

### Curto Prazo (Próximas 2-4 semanas):
1. ✅ ~~Finalizar Fase 5 (testes)~~
2. ✅ ~~Implementar Fase 6 (Proventos)~~
3. ✅ ~~Completar Fase 7 (Analytics)~~
4. **Deploy na Vercel** 🚀
5. Implementar Cron Job (atualização automática)

### Médio Prazo (1-2 meses):
6. Implementar Fase 8 (Alertas e Email)
7. Iniciar Fase 9 (Dark mode + responsividade)
8. Testes de carga e otimizações

### Longo Prazo (3+ meses):
9. Completar Fase 8 (Automações completas)
10. Completar Fase 9 (UX/UI polido)
11. Features avançadas (múltiplas carteiras, etc.)

---

**Última atualização:** 05/12/2024
