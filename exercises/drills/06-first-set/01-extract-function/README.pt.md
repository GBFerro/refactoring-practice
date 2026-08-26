[🌐 English](./README.en.md) · [🇧🇷 Português](./README.pt.md)

# Extract Function

`Capítulo 6` · `Extract Function` · `●○○` · ~25 min

## Contexto

Um clube de corrida imprime uma folha de resultados em texto puro depois de cada prova:
quem terminou, na ordem do tempo de chip, quem não terminou, e um resumo curto no fim. O
programa funciona, o clube usa há três temporadas e ninguém quer mexer nele.

## O smell

**Long Function**, tendo **Comments** como sintoma. `renderRaceReport` é um procedimento
de setenta linhas, e a cada poucas linhas há um comentário anunciando o que o próximo
bloco faz — `// pace as m:ss per kilometre`. Um comentário que explica um bloco é um nome
de função esperando para nascer.

Tem **Duplicated Code** escondido ali também. Ache antes de começar; é a extração mais
satisfatória do exercício.

## O alvo

**Extract Function**, repetidas vezes, até a função de topo ler como um índice do
relatório em vez do procedimento que o constrói.

Você vai precisar de **Extract Variable** em um ou dois pontos, para dar nome a uma
expressão antes de conseguir levantá-la. Isso é normal — as entradas do catálogo são
movimentos, não capítulos.

## Critério de pronto

- `renderRaceReport` cabe em uma tela e não tem nenhum comentário explicando bloco.
- A formatação do tempo de chip existe em exatamente um lugar.
- Nenhuma função em `src/` passa de 12 linhas, aninha mais que 2 níveis ou recebe mais de
  3 parâmetros — `npm run lint:strict -- exercises/drills/06-first-set/01-extract-function/src`
  é a verificação.
- `npm test` ficou verde depois de cada passo do caminho.

## Dicas

<details>
<summary>Por onde eu começo?</summary>

Por baixo, pela coisa menor. `formatDuration` é usada duas vezes e não depende de nada
além da própria entrada — extrair é seguro, rápido e mata a duplicação de imediato.
Atacar uma função longa de fora para dentro faz cada passo tocar o todo; começar pelas
folhas mantém cada passo pequeno.
</details>

<details>
<summary>O laço está fazendo três coisas ao mesmo tempo.</summary>

Ele ordena, formata e acumula um total corrente para o pace médio. O total é o
incômodo: é calculado dentro do laço e usado lá embaixo. Extraia a formatação primeiro e
deixe o acumulador quieto; quando o corpo do laço virar uma linha, pergunte se o total
precisa mesmo ser acumulado ou se pode ser calculado a partir dos finishers na hora em
que o resumo precisa dele.
</details>

<details>
<summary>`entry.seconds` é `number | null` e está brigando comigo.</summary>

Cada `?? 0` no código do desafio é o sistema de tipos avisando que o filtro e a formatação
estão embolados. Um predicado que estreita o tipo —
`function isFinisher(entry: Entry): entry is Finisher` — permite extrair uma função que
recebe um corredor que com certeza tem tempo. Isso é extração de verdade, não truque.
</details>

## Leitura

*Refactoring*, 2ª edição — capítulo 6, *Extract Function*; capítulo 3, *Long Function* e
*Comments*.
