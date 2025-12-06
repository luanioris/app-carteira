# Planejamento Fase 6: Dashboard e Relatórios Inteligentes

## Objetivos Principais
Transformar o App Carteira de um "registrador" para um "analisador" de patrimônio, focando na clareza dos dados e na evolução histórica.

## Tarefas Prioritárias (Feedback do Usuário)

### 1. Gestão de Carteiras Ativas/Inativas
- [ ] **Filtragem no Dashboard**: O dashboard principal deve somar APENAS o patrimônio de carteiras ativas (`ativa = true`).
- [ ] **Listagem de Carteiras**: Separar visualmente ou por abas: "Carteiras Ativas" vs "Histórico/Arquivadas".
- [ ] **Visualização de Histórico**: Permitir consultar uma carteira encerrada (apenas leitura) para ver como era a posição no momento do fechamento.

### 2. Dashboard Consolidado
- [ ] **Gráfico de Evolução Patrimonial**: Mostrar o crescimento do patrimônio total mês a mês (somando todas as carteiras ativas).
- [ ] **Alocação Global**: Gráfico de pizza mostrando a exposição total por classe de ativo (Ações, FIIs, Renda Fixa, Exterior) considerando todas as carteiras.
- [ ] **Rentabilidade**: Exibir a rentabilidade consolidada (ponderada pelo valor investido).

### 3. Relatórios de Performance
- [ ] **Comparativo com Benchmarks**: Comparar a rentabilidade da carteira com CDI e Ibovespa (se possível via API).
- [ ] **Proventos Recebidos**: Gráfico de barras mensal de dividendos recebidos.

### 4. Melhorias de UX/UI
- [ ] **Dark Mode**: Refinar o tema escuro se necessário.
- [ ] **Responsividade**: Garantir que gráficos e tabelas funcionem bem no mobile.

---

## Próximos Passos Imediatos
1. Implementar o filtro de `ativa = true` na query do Dashboard principal (`app/(dashboard)/page.tsx`).
2. Ajustar a listagem de carteiras (`app/(dashboard)/carteiras/page.tsx`) para separar as arquivadas.
