# Fase 5 - Rebalanceamento/Migração de Carteira

## ✅ Implementação Completa

### Arquivos Criados/Modificados:

1. **Migration SQL** (`migration_rebalanceamento.sql`)
   - Adiciona campos de controle na tabela `carteiras`
   - Adiciona campo `preco_fechamento` na tabela `posicoes`
   - Atualiza constraint de tipos de transação

2. **Server Action** (`app/(dashboard)/carteiras/[id]/rebalancear/actions.ts`)
   - Função `migrarCarteira()` com lógica completa de migração
   - Transferência de ativos mantidos
   - Cálculo de preço médio ponderado
   - Registro de transações de compra/venda
   - Congelamento da carteira antiga

3. **Página** (`app/(dashboard)/carteiras/[id]/rebalancear/page.tsx`)
   - Server Component que busca dados da carteira
   - Busca perfis disponíveis
   - Busca cotações atuais

4. **Formulário** (`app/(dashboard)/carteiras/[id]/rebalancear/rebalancear-form.tsx`)
   - Wizard multi-step (4 etapas)
   - Step 1: Definições (Aporte + Perfil)
   - Step 2: Seleção de Ativos
   - Step 3: Confirmação de Preços
   - Step 4: Confirmação e Execução
   - Cálculo automático de quantidades baseado no perfil

5. **Botão de Acesso** (modificado em `app/(dashboard)/carteiras/[id]/page.tsx`)
   - Botão "Rebalancear" adicionado na página de detalhes

6. **Função Auxiliar** (`lib/calculations/distribuicao-rebalanceamento.ts`)
   - Cálculo de distribuição de ativos (não utilizada diretamente, mas disponível)

---

## 🚀 Próximos Passos (VOCÊ PRECISA FAZER):

### 1. Executar a Migration no Supabase

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Abra o arquivo `migration_rebalanceamento.sql`
5. Cole o conteúdo e execute

### 2. Testar o Fluxo

1. Acesse uma carteira existente
2. Clique em **"Rebalancear"**
3. Siga o wizard:
   - Defina o novo aporte
   - Selecione o novo perfil (ou mantenha o mesmo)
   - Adicione os novos ativos
   - Confirme os preços
   - Execute a migração

### 3. Verificar Resultados

Após a migração, verifique:
- ✅ Nova carteira foi criada
- ✅ Carteira antiga foi marcada como inativa (`ativa = false`)
- ✅ Preços de fechamento foram salvos na carteira antiga
- ✅ Posições foram transferidas/criadas corretamente
- ✅ Transações foram registradas no histórico
- ✅ Preço médio foi calculado corretamente

---

## 📋 Lógica de Migração

### O que acontece quando você rebalanceia:

1. **Carteira Antiga**:
   - Marcada como `ativa = false`
   - `data_encerramento` é preenchida
   - `migrada_para_id` aponta para a nova carteira
   - Preços de fechamento são salvos em cada posição

2. **Carteira Nova**:
   - Criada com nome `[Nome Antigo] (v2025)`
   - `carteira_origem_id` aponta para a carteira antiga
   - Recebe o novo perfil selecionado

3. **Ativos**:
   - **Mantidos**: Transferidos com o preço médio original
   - **Novos**: Comprados com preço atual
   - **Removidos**: Vendidos (registrado no histórico)
   - **Complementados**: PM ponderado entre antigo e novo

4. **Transações Registradas**:
   - `TRANSFERENCIA_ENTRADA`: Para ativos mantidos
   - `REBALANCEAMENTO_COMPRA`: Para ativos novos ou complementados
   - `REBALANCEAMENTO_VENDA`: Para ativos removidos ou reduzidos

---

## 🎯 Observações Importantes

1. **Congelamento de Preços**: A carteira antiga não será mais atualizada pela API. Os preços ficam congelados no momento do encerramento.

2. **Preço Médio**: O sistema mantém o custo histórico dos ativos transferidos, calculando PM ponderado apenas para compras adicionais.

3. **Histórico Completo**: Todas as operações são registradas na tabela `transacoes` para auditoria.

4. **Valor Inicial**: A nova carteira herda o valor acumulado (valor inicial da antiga + novo aporte).

---

## 🐛 Possíveis Ajustes Futuros

- [ ] Adicionar preview detalhado das operações antes de confirmar
- [ ] Permitir ajuste manual das quantidades calculadas
- [ ] Exportar relatório de rebalanceamento em PDF
- [ ] Notificação quando uma carteira completar 1 ano (elegível para rebalanceamento)
- [ ] Comparação lado a lado: Carteira Antiga vs Nova

---

**Status**: ✅ Implementação Completa - Pronta para Teste
