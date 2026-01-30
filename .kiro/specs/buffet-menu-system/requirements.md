# Documento de Requisitos

## Introdução

Este documento especifica os requisitos para transformar o sistema de cardápio de Natal Affetto em um sistema de buffet genérico. A transformação inclui um novo modelo de preços baseado em faixas de convidados, estrutura de produtos expandida, carrinho adaptado e remoção de branding natalino.

## Glossário

- **Sistema**: A aplicação PWA Vue 3 + TypeScript + Vite com backend Supabase
- **Produto_Buffet**: Item do cardápio que pode ter preços baseados em faixas de convidados
- **Faixa_Preco**: Configuração de preço associada a uma quantidade máxima de convidados (ex: "Até 50 Convidados" = R$6.500)
- **Carrinho**: Store Pinia que gerencia os itens selecionados pelo cliente
- **Admin**: Interface administrativa para gerenciamento de produtos, categorias e configurações
- **Cliente**: Usuário final que navega pelo cardápio e faz pedidos

## Requisitos

### Requisito 1: Modelo de Preços por Faixa de Convidados

**User Story:** Como administrador, eu quero definir preços baseados em faixas de quantidade de convidados, para que eu possa precificar produtos de buffet de forma flexível.

#### Critérios de Aceitação

1. WHEN um administrador cria um Produto_Buffet THEN o Sistema SHALL permitir adicionar múltiplas Faixa_Preco ao produto
2. WHEN uma Faixa_Preco é criada THEN o Sistema SHALL armazenar: label descritivo, quantidade máxima de convidados e preço
3. WHEN um Produto_Buffet possui Faixa_Preco THEN o Sistema SHALL exibir todas as faixas disponíveis para o Cliente
4. WHEN um administrador edita um Produto_Buffet THEN o Sistema SHALL permitir adicionar, editar ou remover Faixa_Preco existentes
5. IF uma Faixa_Preco é removida de um Produto_Buffet THEN o Sistema SHALL manter a integridade dos dados do produto

### Requisito 2: Modelo de Preços Unitários

**User Story:** Como administrador, eu quero definir preços unitários para produtos avulsos, para que eu possa vender itens individuais além dos pacotes de buffet.

#### Critérios de Aceitação

1. WHEN um administrador cria um Produto_Buffet THEN o Sistema SHALL permitir escolher entre modo de preço por faixa de convidados OU modo de preço unitário
2. WHEN um produto usa modo de preço unitário THEN o Sistema SHALL armazenar um preço base por unidade
3. WHEN um Cliente adiciona um produto unitário ao Carrinho THEN o Sistema SHALL permitir selecionar a quantidade desejada
4. WHEN o Carrinho calcula o subtotal de um produto unitário THEN o Sistema SHALL multiplicar preço unitário pela quantidade
5. THE Sistema SHALL permitir que um produto tenha AMBOS os modos: faixas de convidados E preço unitário (para flexibilidade)

### Requisito 3: Estrutura de Produto Expandida

**User Story:** Como administrador, eu quero cadastrar produtos com descrições detalhadas e múltiplas seções de informação, para que os clientes tenham todas as informações necessárias sobre o buffet.

#### Critérios de Aceitação

1. WHEN um administrador cria um Produto_Buffet THEN o Sistema SHALL permitir inserir uma descrição longa com formatação de lista
2. WHEN um Produto_Buffet possui seções de observação THEN o Sistema SHALL exibir essas observações de forma destacada para o Cliente
3. WHEN um Produto_Buffet é exibido THEN o Sistema SHALL renderizar a descrição preservando quebras de linha e listas
4. WHEN um administrador edita um Produto_Buffet THEN o Sistema SHALL permitir adicionar campo de observações opcionais

### Requisito 4: Faixas de Preço Customizáveis no Admin

**User Story:** Como administrador, eu quero criar faixas de preço personalizadas para cada produto, para que eu possa adaptar a precificação às necessidades específicas de cada tipo de buffet.

#### Critérios de Aceitação

1. WHEN um administrador acessa o formulário de Produto_Buffet THEN o Sistema SHALL exibir interface para gerenciar Faixa_Preco dinamicamente
2. WHEN um administrador adiciona uma Faixa_Preco THEN o Sistema SHALL validar que label, quantidade máxima e preço são obrigatórios
3. WHEN um administrador salva um Produto_Buffet com Faixa_Preco THEN o Sistema SHALL persistir as faixas no banco de dados
4. WHEN um Produto_Buffet é carregado para edição THEN o Sistema SHALL recuperar e exibir todas as Faixa_Preco associadas
5. IF um administrador tenta salvar uma Faixa_Preco com dados inválidos THEN o Sistema SHALL exibir mensagem de erro específica

### Requisito 5: Carrinho Adaptado para Buffet

**User Story:** Como cliente, eu quero selecionar a faixa de convidados ou quantidade ao adicionar um produto ao carrinho, para que o preço correto seja aplicado ao meu pedido.

#### Critérios de Aceitação

1. WHEN um Cliente adiciona um Produto_Buffet com Faixa_Preco ao Carrinho THEN o Sistema SHALL registrar a faixa selecionada junto com o item
2. WHEN um Cliente adiciona um produto unitário ao Carrinho THEN o Sistema SHALL registrar a quantidade selecionada
3. WHEN o Carrinho é exibido THEN o Sistema SHALL mostrar o nome do produto, a faixa OU quantidade selecionada, e o preço correspondente
4. WHEN um Cliente adiciona múltiplos produtos ao Carrinho THEN o Sistema SHALL calcular o total somando os preços de todos os itens
5. WHEN o Carrinho é persistido THEN o Sistema SHALL armazenar a identificação da Faixa_Preco ou quantidade para cada item

### Requisito 6: Exibição de Produtos para o Cliente

**User Story:** Como cliente, eu quero visualizar os produtos de buffet com todas as opções disponíveis, para que eu possa escolher a opção adequada ao meu evento.

#### Critérios de Aceitação

1. WHEN um Produto_Buffet com Faixa_Preco é exibido no catálogo THEN o Sistema SHALL mostrar todas as faixas disponíveis como opções selecionáveis
2. WHEN um Produto_Buffet com preço unitário é exibido THEN o Sistema SHALL mostrar o preço por unidade e botão de adicionar ao carrinho
3. WHEN um Cliente visualiza um Produto_Buffet THEN o Sistema SHALL exibir a descrição completa com formatação preservada
4. WHEN um Produto_Buffet possui observações THEN o Sistema SHALL exibir as observações em seção destacada
5. WHEN um Cliente clica em uma Faixa_Preco THEN o Sistema SHALL adicionar o produto ao Carrinho com a faixa selecionada

### Requisito 7: Remoção de Branding Natalino

**User Story:** Como administrador, eu quero que o sistema seja genérico para qualquer tipo de buffet, para que eu possa usar a plataforma durante todo o ano para diferentes eventos.

#### Critérios de Aceitação

1. THE Sistema SHALL remover todas as referências textuais a "Natal", "Ceia" e "Natalino" do código-fonte
2. THE Sistema SHALL utilizar textos genéricos configuráveis via settings para títulos e descrições
3. WHEN a página inicial é carregada THEN o Sistema SHALL exibir textos padrão genéricos para buffet/eventos
4. THE Sistema SHALL manter a funcionalidade de personalização de textos via painel administrativo
5. THE Sistema SHALL atualizar o título do carrinho de "Pedido de Natal" para "Seu Pedido"

### Requisito 8: Migração de Dados e Compatibilidade

**User Story:** Como administrador, eu quero que os produtos existentes continuem funcionando após a atualização, para que não haja perda de dados ou interrupção do serviço.

#### Critérios de Aceitação

1. WHEN o Sistema é atualizado THEN o Sistema SHALL manter compatibilidade com produtos que usam base_price
2. WHEN o Sistema é atualizado THEN o Sistema SHALL manter compatibilidade com produtos que usam size_5p_price e size_10p_price
3. WHEN um produto antigo é exibido THEN o Sistema SHALL renderizar corretamente usando o modelo de preços legado
4. THE Sistema SHALL permitir migração gradual de produtos do modelo antigo para o novo modelo de Faixa_Preco
5. IF um produto possui ambos os modelos de preço THEN o Sistema SHALL priorizar o novo modelo de Faixa_Preco
