# Plano de Implementação: Sistema de Buffet Genérico

## Overview

Este plano detalha as tarefas para transformar o sistema de cardápio de Natal em um sistema de buffet genérico, implementando o novo modelo de preços por faixa de convidados e preços unitários.

## Tasks

- [x] 1. Configurar banco de dados e tipos
  - [x] 1.1 Criar migration SQL para tabela price_tiers e alterações em products
    - Adicionar colunas long_description, observations, pricing_mode em products
    - Criar tabela price_tiers com relacionamento FK
    - Configurar políticas RLS
    - _Requirements: 1.1, 1.2, 4.3_
  
  - [x] 1.2 Atualizar tipos TypeScript em src/types.ts
    - Adicionar tipo PriceTier
    - Criar tipo BuffetProduct estendendo Product
    - Criar tipo BuffetCartItem
    - Manter tipos legados para compatibilidade
    - _Requirements: 1.2, 2.2, 5.1, 5.2_

- [x] 2. Implementar Cart Store adaptado
  - [x] 2.1 Refatorar src/store/cart.ts para suportar novos tipos de item
    - Implementar método addWithTier(product, tier)
    - Implementar método addUnit(product)
    - Manter método add() legado para compatibilidade
    - Atualizar cálculo de total para ambos os tipos
    - _Requirements: 2.3, 2.4, 5.1, 5.2, 5.4, 5.5_
  
  - [ ]* 2.2 Escrever teste de propriedade para cálculo de subtotal
    - **Property 3: Cálculo de Subtotal para Produtos Unitários**
    - **Validates: Requirements 2.4**
  
  - [ ]* 2.3 Escrever teste de propriedade para cálculo de total
    - **Property 4: Cálculo do Total do Carrinho**
    - **Validates: Requirements 5.4**
  
  - [ ]* 2.4 Escrever teste de propriedade para round-trip do carrinho
    - **Property 10: Persistência do Carrinho (Round-Trip)**
    - **Validates: Requirements 5.5**

- [x] 3. Checkpoint - Verificar tipos e store
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.
  - ✅ Tipos e store implementados, testes opcionais pulados.

- [x] 4. Implementar interface Admin para faixas de preço
  - [x] 4.1 Expandir formulário em AdminProducts.vue
    - Adicionar seletor de pricing_mode (unit/tiers/both)
    - Criar interface dinâmica para gerenciar faixas de preço
    - Implementar validação de campos obrigatórios
    - Adicionar campos long_description e observations
    - _Requirements: 1.1, 1.4, 3.1, 3.4, 4.1, 4.2_
  
  - [x] 4.2 Implementar persistência de faixas no Admin
    - Carregar faixas existentes ao editar produto
    - Salvar faixas junto com produto (transação)
    - Deletar faixas removidas
    - _Requirements: 4.3, 4.4_
  
  - [ ]* 4.3 Escrever teste de propriedade para persistência de faixas
    - **Property 1: Persistência de Faixas de Preço (Round-Trip)**
    - **Validates: Requirements 1.1, 1.4, 4.3, 4.4**
  
  - [ ]* 4.4 Escrever teste de propriedade para validação de faixas
    - **Property 2: Validação de Campos Obrigatórios em Faixas**
    - **Validates: Requirements 1.2, 4.2, 4.5**

- [x] 5. Checkpoint - Verificar Admin
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.
  - ✅ Admin expandido com suporte a faixas de preço.

- [x] 6. Adaptar exibição de produtos para o cliente
  - [x] 6.1 Modificar ProductCard.vue para suportar faixas de preço
    - Renderizar botões para cada faixa de preço disponível
    - Manter botão de adicionar para produtos unitários
    - Exibir descrição longa e observações quando presentes
    - _Requirements: 1.3, 6.1, 6.2, 6.4, 6.5_
  
  - [x] 6.2 Implementar renderização de descrições formatadas
    - Preservar quebras de linha em descrições
    - Renderizar listas corretamente
    - _Requirements: 3.3, 6.3_
  
  - [ ]* 6.3 Escrever teste de propriedade para adição com faixa
    - **Property 5: Integridade de Adição com Faixa de Preço**
    - **Validates: Requirements 5.1, 6.5**
  
  - [ ]* 6.4 Escrever teste de propriedade para incremento de quantidade
    - **Property 6: Incremento de Quantidade para Produtos Unitários**
    - **Validates: Requirements 2.3, 5.2**
  
  - [ ]* 6.5 Escrever teste de propriedade para preservação de formatação
    - **Property 7: Preservação de Formatação em Descrições**
    - **Validates: Requirements 3.1, 3.3, 6.3**

- [x] 7. Adaptar página do carrinho
  - [x] 7.1 Modificar Cart.vue para exibir itens com faixa ou quantidade
    - Exibir tierLabel para itens com faixa de preço
    - Exibir controles de quantidade para itens unitários
    - Atualizar cálculo e exibição de totais
    - Atualizar título de "Pedido de Natal" para "Seu Pedido"
    - _Requirements: 5.3, 7.5_

- [x] 8. Checkpoint - Verificar exibição cliente
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.
  - ✅ ProductCard e Cart adaptados para faixas de preço.

- [x] 9. Implementar compatibilidade com modelo legado
  - [x] 9.1 Garantir que produtos antigos continuam funcionando
    - Manter suporte a has_size_options, size_5p_price, size_10p_price
    - Renderizar opções de tamanho legadas quando price_tiers não existe
    - Priorizar price_tiers quando ambos existem
    - _Requirements: 8.1, 8.2, 8.3, 8.5_
  
  - [ ]* 9.2 Escrever teste de propriedade para compatibilidade legada
    - **Property 8: Compatibilidade com Modelo Legado**
    - **Validates: Requirements 8.1, 8.2, 8.3**
  
  - [ ]* 9.3 Escrever teste de propriedade para priorização de modelo
    - **Property 9: Priorização do Novo Modelo de Preços**
    - **Validates: Requirements 8.5**

- [x] 10. Remover branding natalino
  - [x] 10.1 Atualizar textos hardcoded no código
    - Substituir "Ceia de Natal" por textos genéricos
    - Atualizar título do carrinho para "Seu Pedido"
    - Atualizar textos do footer e hero
    - _Requirements: 7.1, 7.3, 7.5_
  
  - [x] 10.2 Verificar e atualizar textos padrão em settings
    - Garantir que textos padrão são genéricos
    - Manter funcionalidade de personalização via admin
    - _Requirements: 7.2, 7.4_

- [x] 11. Checkpoint final
  - ✅ Implementação completa do sistema de buffet genérico.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes de propriedade validam propriedades universais de corretude
- Testes unitários validam exemplos específicos e edge cases
