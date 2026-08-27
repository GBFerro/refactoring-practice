# refactoring-practice — Documento de Design

> Repositório de exercícios de refatoração em TypeScript, derivado de
> *Refactoring: Improving the Design of Existing Code* (Martin Fowler, 2ª ed., 2018).
> Este documento define **como o repositório é organizado e por quê**. Nenhum código foi
> escrito ainda — este é o contrato que o código vai seguir.

- **Status:** design aprovado, pendente de implementação
- **Stack:** TypeScript (strict) + Vitest + npm workspaces
- **Formato do exercício:** código com o smell + testes verdes + solução comentada
- **Destino:** repositório público no GitHub

---

## 1. Decisão de escopo: um repo por livro

O projeto maior é "exercícios para praticar um livro". A primeira decisão é se isso vira
um monorepo com todos os livros ou um repositório por livro.

**Decisão: um repositório por livro, com um `template` compartilhado.**

| Critério | Um repo por livro ✅ | Monorepo de livros |
| --- | --- | --- |
| Stack | Cada livro escolhe a sua (Refactoring em TS, DDD em Java, etc.) | Fica preso a uma ou vira uma torre de Babel |
| Navegação | O README raiz é o índice do livro | O índice fica dois níveis abaixo do que interessa |
| Sinal no GitHub | `refactoring-practice` é buscável e forkável isolado | Fork traz 5 livros que a pessoa não quer |
| Custo | Duplicar o tooling a cada livro | Tooling único |

O custo de duplicação é resolvido marcando o primeiro repo como **GitHub Template
Repository**. `book-practice-template` nasce da extração do esqueleto do
`refactoring-practice` depois que o formato estiver validado (Fase 4 do roadmap).

**Nome proposto:** `refactoring-practice`
**Descrição:** *Hands-on TypeScript exercises for Martin Fowler's Refactoring (2nd ed.) — one drill per refactoring, with a green test harness and a step-by-step solution.*

---

## 2. Os dois tipos de exercício

Esta é a decisão pedagógica central do repositório. Treinar refatoração tem duas
habilidades distintas e a maioria dos repos de kata só treina uma.

### 2.1 `drills/` — mecânica

O exercício **diz qual refactoring aplicar**. O código é pequeno (30–80 linhas), tem um
smell dominante e existe um único movimento correto. O objetivo é decorar a mecânica:
os passos, a ordem, onde os testes entram.

> "Extract Function em `calculateInvoice`. O corpo tem três blocos separados por
> comentários. Um comentário que explica um bloco é um nome de função esperando para
> nascer."

Um drill por refactoring do catálogo. São ~61 drills no total.

### 2.2 `katas/` — diagnóstico

O exercício **não diz qual refactoring aplicar**. O código é maior (150–400 linhas),
realista, com múltiplos smells se sobrepondo. O README descreve apenas o smell percebido
e uma pressão de negócio ("precisamos adicionar um terceiro tipo de assinatura e ninguém
quer mexer nesse arquivo"). A solução mostra *uma* saída possível, explicitamente não a
única.

> "Este módulo de precificação precisa suportar cupons percentuais. Faça a mudança fácil,
> depois faça a mudança fácil." — o roteiro do capítulo 2.

Um kata por capítulo de catálogo (6 a 12), mais dois katas finais que atravessam capítulos.

**Regra de proporção:** um kata só entra no repo quando os drills dos refactorings que ele
exige já existirem. O kata é a prova prática do módulo.

---

## 3. Estrutura de diretórios

```
refactoring-practice/
├── README.md                    # cópia gerada de README.en.md (ver §3.1)
├── README.en.md                 # índice navegável em inglês, gerado por script
├── README.pt.md                 # índice navegável em pt-BR, gerado por script
├── CONTRIBUTING.md              # como escrever um exercício novo
├── LICENSE                      # MIT
├── package.json                 # workspace raiz, scripts, deps compartilhadas
├── tsconfig.base.json
├── vitest.config.ts             # resolve o alias @exercise (ver §5)
├── .oxlintrc.json               # oxlint, perfil relaxado (ver §6)
├── .oxlintrc.strict.json        # oxlint, perfil estrito (ver §6)
├── .oxfmtrc.json                # oxfmt, formatação (ver §6.2)
├── .github/
│   └── workflows/ci.yml
├── docs/
│   ├── DESIGN.md                # este documento
│   ├── HOW-TO-PRACTICE.md       # o loop de trabalho, o que fazer quando travar
│   ├── CATALOG.md               # refactoring do livro → exercício (gerado)
│   └── SMELLS.md                # smell do cap. 3 → exercícios que o atacam (gerado)
├── scripts/
│   ├── new-exercise.ts          # scaffolding a partir de um template
│   ├── build-index.ts           # gera os READMEs, CATALOG.md e SMELLS.md do meta.json
│   └── validate.ts              # valida meta.json e a integridade dos exercícios
└── exercises/
    ├── drills/
    │   ├── 06-first-set/
    │   │   ├── 01-extract-function/
    │   │   ├── 02-inline-function/
    │   │   └── ...
    │   ├── 07-encapsulation/
    │   ├── 08-moving-features/
    │   ├── 09-organizing-data/
    │   ├── 10-conditional-logic/
    │   ├── 11-apis/
    │   └── 12-inheritance/
    └── katas/
        ├── 01-loyalty-points/
        ├── 02-shipping-rates/
        └── ...
```

A numeração `06-`, `07-` espelha os capítulos do livro. Isso é intencional: quem está
lendo o capítulo 10 acha a pasta sem consultar índice, e o `ls` já sai na ordem certa.

### 3.1 Os READMEs bilíngues

O repo é bilíngue: **`README.en.md`** (inglês) e **`README.pt.md`** (pt-BR).

Um detalhe do GitHub força a mão aqui: a home do repositório só renderiza
`README.md`, `README` ou `readme.md` — um sufixo de idioma **não** é reconhecido. Se
existirem apenas os dois arquivos com sufixo, a home do repo aparece vazia.

Por isso `build-index.ts` gera **três** arquivos: `README.en.md`, `README.pt.md` e
`README.md`, este último uma cópia literal do `.en` com uma linha de troca de idioma no
topo. Como os três saem do mesmo script e do mesmo `meta.json`, não existe risco de
divergirem — e `npm run index -- --check` na CI garante isso.

```markdown
🌐 **English** · [🇧🇷 Português](./README.pt.md)
```

E no topo do `README.pt.md`:

```markdown
[🌐 English](./README.en.md) · 🇧🇷 **Português**
```

**Inglês é o idioma padrão e obrigatório**; pt-BR é opcional. O repo é público e trata
de um livro em inglês — um exercício que só existe em português tem alcance de um país,
e a metade do valor de publicar isso é que qualquer pessoa possa forkar.

A regra vale também dentro dos exercícios: `README.en.md` é obrigatório em todo exercício,
`README.pt.md` é bem-vindo mas nunca bloqueia. O validador avisa quando falta o `.pt`, e
o índice marca a cobertura de tradução por exercício.

Isso tem uma consequência de processo que vale encarar de frente: **você vai escrever 61
enunciados em inglês**, e enunciado é o texto mais difícil do repo — é onde mora a
explicação do smell e a dica escalonada. Recomendo rascunhar em pt-BR e traduzir na
sequência, no mesmo dia; o `new-exercise.ts` cria os dois arquivos e o `.pt` fica como
rascunho de trabalho, promovido a tradução publicada quando você o revisa. Se em algum
momento o inglês virar o gargalo da Fase 2, a decisão a revisitar é esta.

Os **nomes dos refactorings e dos smells ficam sempre em inglês**, nos dois idiomas — são
o vocabulário compartilhado da profissão e o que liga o exercício ao índice do livro.
Traduzir "Extract Function" quebra a busca e não ajuda ninguém.

---

## 4. Anatomia de um exercício

```
exercises/drills/10-conditional-logic/03-replace-nested-conditional-with-guard-clauses/
├── meta.json           # metadados legíveis por máquina (§7)
├── README.en.md        # o enunciado, inglês — obrigatório (§4.1)
├── README.pt.md        # o enunciado, pt-BR — opcional (§3.1)
├── src/
│   ├── index.ts        # ← a fronteira pública, congelada
│   └── payout.ts       # ← o código com o smell, você edita aqui
├── tests/
│   └── payout.spec.ts  # ← rede de segurança, verde desde o commit inicial, imutável
└── solutions/          # uma pasta por saída legítima (§4.3)
    ├── guard-clauses/
    │   ├── index.ts    # mesma fronteira pública
    │   ├── payout.ts
    │   └── STEPS.md    # ← o diferencial: a sequência de micro-passos (§4.2)
    └── polymorphism/
        ├── index.ts
        ├── payout.ts
        └── STEPS.md
```

### 4.1 Contrato do enunciado

Todo enunciado tem exatamente estas seções, nesta ordem:

1. **Contexto** — 2 a 4 frases de domínio. Por que esse código existe.
2. **O smell** — nomeado com o vocabulário do capítulo 3, e *por que* incomoda aqui.
3. **O alvo** — nos drills, o nome do refactoring do catálogo. Nos katas, a pressão de negócio.
4. **Critério de pronto** — objetivo e verificável. Ex.: "`payout.ts` não tem `else`",
   "nenhuma função com mais de 8 linhas", "o `switch` sobre `type` sumiu". Isso é o que
   separa um exercício de um convite à divagação.
5. **Dicas** — 2 ou 3, escalonadas, cada uma dentro de `<details><summary>`. A pessoa
   escolhe quanto spoiler quer.
6. **Leitura** — página/capítulo do livro. Só a referência, nunca o texto transcrito (§10).

### 4.2 `STEPS.md` — o que torna este repo diferente

O livro insiste que refatoração é uma sequência de passos minúsculos com testes entre
cada um. Um repo que mostra só o "antes" e o "depois" ensina exatamente a coisa errada:
sugere que o refactor é um salto.

Por isso a solução não é o arquivo final — é o **diário dos passos**:

```markdown
## Passo 3 — extrair a condição de elegibilidade

Antes:   if (employee.tenure > 2 && employee.status !== "probation")
Depois:  if (isEligible(employee))

Por quê: a condição composta é o "quê"; o nome diz o "porquê".
Rode:    npm test -- 03-replace-nested   → 7 passed
Commit:  refactor: extract isEligible
```

Cada passo cita o comando de teste e o resultado esperado. Quem seguir o STEPS.md
reproduz o refactor no próprio editor, um commit por passo. **Isso é o exercício de
verdade**; o arquivo final é só o subproduto.

### 4.3 Soluções múltiplas

`solutions/` é um diretório de variantes, uma pasta por saída legítima, nomeada pela
**decisão de design** e não por ordem de chegada — `guard-clauses/`, `polymorphism/`,
`strategy-table/`, nunca `solution-1/` e `solution-2/`. O nome da pasta é metade da lição.

Isso é o melhor argumento a favor do repositório inteiro. A pergunta interessante em
refatoração quase nunca é "qual é a resposta"; é "o que cada saída te cobra". Um kata que
mostra polimorfismo *e* tabela de estratégias ensina algo que nenhum dos dois sozinho
ensina.

Cada variante declara no topo do seu `STEPS.md`, antes do primeiro passo:

```markdown
## Quando escolher esta
Quando os tipos são poucos, estáveis e cada um tem comportamento próprio de verdade.

## O que ela custa
Uma classe por tipo. Adicionar um tipo é criar um arquivo; adicionar um *comportamento*
é editar todas as classes. A tabela de estratégias inverte exatamente esse trade-off —
veja `../strategy-table/STEPS.md`.
```

As variantes **se cruzam explicitamente**. Uma variante que não sabe dizer o que a outra
faz melhor não está pronta.

**Critério de admissão**, e ele é apertado de propósito: uma variante entra quando
representa uma decisão de design diferente, com um custo nomeável. Estilo, nomes e ordem
de extração **não** são variantes — são a mesma solução escrita duas vezes, e cada uma
dessas dobra o custo de manutenção do exercício sem ensinar nada.

Daí uma invariante útil, que o validador checa:

- **Drill → exatamente 1 variante.** Mecânica tem um movimento certo. Se um drill admite
  duas saídas de verdade, ele é um kata disfarçado e está no diretório errado.
- **Kata → 2 ou mais.** É a razão de o kata existir. Um kata com uma variante só é um
  drill grande, e o validador avisa.

A exceção sai por `"allowMultipleSolutions": true` no `meta.json`, que exige um comentário
justificando — o atrito é intencional.

**Custo, para ficar registrado:** cada variante é um `STEPS.md` inteiro para escrever e
uma execução a mais na CI. Escreva a variante canônica primeiro e só volte para a segunda
quando alguém (você, resolvendo) tiver de fato chegado por outro caminho. Variante
inventada na mesa é adivinhação.

---

## 5. O harness de testes

### O problema

Se os testes ficam dentro de `src/`, cada solução em `solutions/` precisa de uma cópia deles,
e as duas cópias divergem no primeiro ajuste. Se os testes importam `../src/payout`, eles
nunca rodam contra a solução — e aí ninguém garante que a solução realmente passa.

### A solução: um alias resolvido por ambiente

Os testes ficam em `tests/` e importam **sempre** de `@exercise`:

```ts
// tests/payout.spec.ts
import { calculatePayout } from "@exercise";
```

`vitest.config.ts` resolve `@exercise` para `./src/index.ts` por padrão, e para
`./solutions/<variante>/index.ts` quando `TARGET` nomeia uma variante:

```ts
resolve: {
  alias: {
    "@exercise": process.env.TARGET
      ? `./solutions/${process.env.TARGET}/index.ts`
      : "./src/index.ts",
  },
},
```

Consequências, todas desejáveis:

- **Um único arquivo de teste** serve ao desafio e à solução.
- **A CI prova que cada solução é honesta**: `TARGET=polymorphism npm test` roda a mesma
  suíte. Com variantes, isso vira uma matriz — e o valor cresce: a suíte passa a ser a
  prova de que as duas saídas realmente preservam o *mesmo* comportamento, que é a única
  base sobre a qual comparar os trade-offs delas faz sentido.
- **`index.ts` vira a fronteira pública explícita.** O refactor acontece *atrás* dela.
  Isso não é acidente: é a definição operacional de "preserva o comportamento".

### A exceção: refactorings que mudam a assinatura

Alguns refactorings do catálogo existem justamente para mudar a interface —
*Change Function Declaration*, *Introduce Parameter Object*, *Preserve Whole Object*,
*Replace Parameter with Query*, *Remove Flag Argument*. Nesses, congelar a fronteira
inviabiliza o exercício.

Nesses casos `meta.json` declara `"apiFrozen": false` e o exercício ganha um segundo
arquivo `tests/callers.spec.ts` que exercita os *chamadores* em vez da função-alvo. A
regra vira: **o comportamento observável pelos chamadores é preservado; a assinatura não
precisa ser.** É exatamente o que o livro faz ao migrar chamadores em pequenos passos.

### Testes de caracterização

Toda suíte nasce verde e é **imutável** — está escrito no README e verificado na CI
(§8). Se você acha que precisa mudar um teste para refatorar, ou o refactor está errado
ou o exercício está mal escrito; abra uma issue.

Três katas fogem dessa regra de propósito e chegam **sem testes**: o primeiro passo é
escrever a rede de segurança (capítulo 4). Eles ficam marcados com
`"providesTests": false` e um gate de cobertura em vez de uma suíte pronta.

### 5.1 O gate de cobertura dos katas sem teste

A pergunta era "qual número". A resposta é que **um número global é a métrica errada** —
e vale explicar por quê, porque é a mesma armadilha em que times reais caem.

`80%` de cobertura no repositório não diz nada sobre o exercício. Os 20% descobertos podem
ser exatamente o `else` que você vai mover no passo 4, e a suíte continua verde enquanto
você quebra o comportamento em silêncio. Esse é precisamente o modo de falha que o
capítulo 4 existe para prevenir; um gate que não o detecta é teatro.

**O gate: 100% de cobertura de *branch* nos arquivos que o exercício declara como alvo.**

```json
{ "providesTests": false, "coverageTargets": ["src/pricing.ts", "src/discount.ts"] }
```

O `build-index.ts` já lê todos os `meta.json` — ele gera também o bloco de thresholds do
Vitest, que aceita glob como chave:

```ts
coverage: {
  thresholds: {
    "exercises/katas/02-shipping-rates/src/pricing.ts": { branches: 100 },
  },
},
```

Três razões para 100%, e não 90%:

1. **É alcançável aqui.** O alvo é um arquivo escolhido a dedo, de 80 a 200 linhas — não
   um sistema legado. Um número menor só existiria para acomodar preguiça.
2. **O critério honesto é "todo caminho que eu vou mexer está preso".** Como o exercício
   declara *quais* arquivos vai mexer, esse critério vira automatizável sem heurística.
3. **Branch, não line.** Cobertura de linha passa com um teste que executa o `if` por um
   lado só. Refatorar condicional é metade do livro (capítulos 10 e 12 inteiros); é
   justamente o ramo não exercitado que some no refactor.

Se um branch se recusar a ser coberto, **isso é um achado, não um obstáculo**: ou é código
morto — e aí o exercício ganhou um *Remove Dead Code* de brinde, que se declara em
`meta.json` — ou o desenho do kata precisa de uma entrada a mais. Nos dois casos você
aprendeu algo antes de tocar no refactor. É esse o ponto.

Os katas com suíte pronta (`providesTests: true`) não têm gate nenhum: os testes já vêm
verdes e imutáveis, medir cobertura deles seria medir o meu trabalho, não o seu.

---

## 6. Lint e formatação como critério objetivo

Ferramentas: **oxlint** (estável) no lugar do ESLint e **oxfmt** (beta) no lugar do
Prettier. Além da velocidade, há uma razão específica para este repo: são binários únicos,
sem cadeia de plugins e presets de TypeScript para instalar. Um repositório de exercícios
vive ou morre no `npm install` que a pessoa roda uma vez às 23h para fazer um drill de
20 minutos — cada dependência a menos é uma chance a menos de ele falhar.

### 6.1 oxlint — dois perfis

O código-desafio viola regras de estilo por construção. Se o perfil padrão rodasse nele,
o repo estaria vermelho o tempo todo; mas se ninguém checa nada, "pronto" vira opinião.

Dois arquivos de config, porque servem a momentos diferentes:

**`.oxlintrc.json`** — o perfil do dia a dia, aplicado ao repo inteiro. Só erros reais:
`correctness` como `error`, plugin `typescript` ligado, e as regras de tamanho
explicitamente desligadas dentro de `exercises/**/src/**` via `overrides`.

```jsonc
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "oxc"],
  "categories": { "correctness": "error", "suspicious": "error" },
  "overrides": [
    {
      "files": ["exercises/**/src/**"],
      "rules": {
        "eslint/complexity": "off",
        "eslint/max-lines-per-function": "off",
        "eslint/max-depth": "off",
        "eslint/max-params": "off"
      }
    }
  ]
}
```

**`.oxlintrc.strict.json`** — o perfil de treino, invocado explicitamente contra um
caminho:

```jsonc
{
  "extends": ["./.oxlintrc.json"],
  "rules": {
    "eslint/complexity": ["error", { "max": 5 }],
    "eslint/max-lines-per-function": ["error", { "max": 12 }],
    "eslint/max-depth": ["error", { "max": 2 }],
    "eslint/max-params": ["error", { "max": 3 }],
    "eslint/max-nested-callbacks": ["error", { "max": 2 }]
  }
}
```

As cinco regras existem no oxlint hoje (`complexity` na categoria *restriction*,
`max-depth`, `max-lines-per-function` e `max-nested-callbacks` em *pedantic*,
`max-params` em *style* — todas desligadas por padrão, o que é exatamente o que
queremos: elas só entram quando pedimos).

Aqui o oxlint sai na frente do ESLint flat config: como o perfil estrito é um arquivo
passado na linha de comando (`oxlint -c .oxlintrc.strict.json <caminho>`), a mesma
configuração serve para checar a **solução** na CI e para você checar o **seu `src/`**
enquanto pratica. Com flat config isso exigiria dois arquivos e um glob duplicado.

```json
{
  "scripts": {
    "lint": "oxlint",
    "lint:strict": "oxlint -c .oxlintrc.strict.json"
  }
}
```

`npm run lint:strict -- exercises/drills/10-conditional-logic/03-*/src` dá ao "critério
de pronto" do enunciado um respaldo executável: você sabe se chegou lá sem abrir a
solução. Os limites são deliberadamente agressivos — são alvos de treino, não uma
proposta de política para código de produção.

### 6.2 oxfmt — formatação

`.oxfmtrc.json` na raiz, defaults do oxfmt com `printWidth` explícito. A formatação é
uniforme no repo inteiro, **inclusive no código-desafio**: sujeira de formatação não é o
tipo de sujeira que este repo ensina a resolver, e código mal formatado só adiciona ruído
ao diff que a pessoa vai produzir.

```jsonc
{
  "$schema": "./node_modules/oxfmt/configuration_schema.json",
  "printWidth": 90,
  "singleQuote": false,
  "semi": true
}
```

Duas consequências de o oxfmt estar em **beta**, que precisam ficar registradas:

- **Pinar a versão exata** no `package.json` (sem `^`). Um bump de patch que muda a saída
  do formatador reformata 60+ exercícios e polui o `git blame` de todo mundo que estiver
  com um fork aberto. Bumps entram como PR próprio, isolado.
- **A CI roda `oxfmt --check`**, nunca `--write`. Se um dia o oxfmt travar o projeto, a
  saída dele é compatível com Prettier v3.8 — trocar de volta é um `--migrate` reverso e
  um script no `package.json`, não uma reescrita.

O `.editorconfig` fica na raiz também: o oxfmt o respeita, e ele cobre os arquivos que o
formatador não toca.

---

## 7. `meta.json` — o índice é gerado, não mantido à mão

Manter um README com 60+ linhas de tabela sincronizado na mão é garantia de que ele vai
apodrecer. Cada exercício declara seus metadados e os índices são gerados.

```json
{
  "id": "drill-10-03",
  "title": "Replace Nested Conditional with Guard Clauses",
  "type": "drill",
  "chapter": 10,
  "refactorings": ["Replace Nested Conditional with Guard Clauses"],
  "smells": ["Long Function"],
  "difficulty": 2,
  "estimatedMinutes": 20,
  "prerequisites": ["drill-06-01"],
  "apiFrozen": true,
  "providesTests": true,
  "translations": ["en", "pt"],
  "solutions": [
    { "slug": "guard-clauses", "title": "Guard clauses", "tradeoff": "Leitura linear; exige que os casos de saída sejam de fato excepcionais." }
  ]
}
```

Em um kata sem rede de segurança pronta, dois campos a mais:

```json
{
  "providesTests": false,
  "coverageTargets": ["src/pricing.ts", "src/discount.ts"]
}
```

`npm run index` lê todos os `meta.json` e reescreve:

- **`README.en.md`, `README.pt.md` e `README.md`** — tabela por módulo, com dificuldade,
  tempo estimado e a cobertura de tradução de cada exercício (§3.1).
- **`docs/CATALOG.md`** — os 61 refactorings do livro, cada um linkado ao seu exercício,
  com ✅ / 🚧 / ⬜ de cobertura. Este arquivo é o placar do projeto.
- **`docs/SMELLS.md`** — os 24 smells do capítulo 3 → exercícios que os atacam. É a
  entrada natural para quem chega com um problema real ("meu código tem Shotgun Surgery")
  em vez de com um capítulo aberto.

`npm run index -- --check` falha se o gerado diverge do commitado. Roda na CI.

---

## 8. CI (GitHub Actions)

Oito checks em um job, `ubuntu-latest`, Node LTS:

| Check | Comando | Garante |
| --- | --- | --- |
| Baseline verde | `npm test` | Todo desafio chega com a rede de segurança passando |
| Soluções honestas | `npm run test:solutions` (matriz sobre `solutions/*`) | Toda variante passa na *mesma* suíte |
| Solução limpa | `npm run lint:strict -- "exercises/**/solutions"` | Toda variante cumpre o critério de pronto |
| Lint do repo | `npm run lint` | Nenhum erro real em desafios, soluções e scripts |
| Formatação | `oxfmt --check .` | Diff limpo; nunca `--write` na CI (§6.2) |
| Tipos | `tsc --noEmit` | `src/` e todas as variantes compilam em modo strict |
| Cobertura | `npm run test:coverage` | Katas sem testes cumprem o gate de §5.1 |
| Metadados | `npm run validate && npm run index -- --check` | `meta.json` válido, os três READMEs e os índices sincronizados |

`npm run validate` também checa a integridade estrutural: toda pasta de exercício tem os
arquivos obrigatórios, todo `prerequisites` aponta para um `id` existente, nenhum
`id` duplicado, `README.en.md` presente em todo exercício (§3.1), a invariante de
variantes do §4.3 (drill → 1, kata → 2+), todo `coverageTargets` apontando para um arquivo
que existe, e todo nome em `refactorings` na lista canônica do catálogo (o script
carrega `docs/catalog-names.json` — a lista literal dos 61 nomes da 2ª edição). Isso mata
a classe de bug mais provável do repo: um exercício chamado "Extract Method" (nome da 1ª
edição) que nunca aparece no índice porque a 2ª edição chama de "Extract Function".

---

## 9. O loop de trabalho de quem usa

Documentado em `docs/HOW-TO-PRACTICE.md`. O modelo mental precisa caber em cinco linhas:

```bash
gh repo fork giovaniferro/refactoring-practice --clone
cd refactoring-practice && npm install
git switch -c pratica

npm run start -- drill-10-03    # imprime o README e roda a suíte em watch
# ... você edita src/, os testes ficam verdes o tempo todo ...
npm run lint:strict -- exercises/drills/10-*/03-*/src
npm run diff -- drill-10-03      # compara com as soluções (§9.1)
git restore --source=main exercises/...  # recomeçar do zero, quantas vezes quiser
```

`main` é sempre pristino. Você trabalha em branch. Reset é `git restore --source=main`,
sem script mágico, sem pasta `.baseline` duplicada — o baseline é o próprio histórico.

Três regras que vão no topo do documento:

1. **Testes verdes o tempo todo.** Se ficarem vermelhos por mais de dois minutos,
   `git restore` e recomece menor.
2. **Um commit por micro-passo.** No fim, `git log --oneline` do seu exercício deve se
   parecer com o `STEPS.md` da solução. Comparar os dois logs é a melhor autoavaliação
   que o repo oferece.
3. **Abra a solução só depois de terminar** — ou depois de travar por 20 minutos. A
   solução é uma segunda opinião, não um gabarito.

### 9.1 `npm run diff` — comparação com trava

```bash
npm run diff -- drill-10-03            # 1 variante: mostra o diff direto
npm run diff -- kata-02                # 2+ variantes: lista e pergunta qual
npm run diff -- kata-02 --all          # mostra as duas, lado a lado
npm run diff -- kata-02 --steps        # só o STEPS.md, sem o código final
```

**O primeiro passo do script é rodar a suíte contra o seu `src/`.** Se estiver vermelha,
ele recusa e imprime as falhas:

```
✗ 2 testes falhando. A comparação só faz sentido depois que o comportamento
  estiver preservado — é isso que "refatorar" quer dizer. Rode `npm test` e volte.
```

A trava é a parte importante. Comparar código quebrado com a solução ensina a copiar; a
suíte verde é o que transforma o diff em "duas soluções válidas, uma delas a minha" em vez
de "a resposta certa e o que eu tentei".

Com múltiplas variantes o script não escolhe por você — lista os `tradeoff` do `meta.json`
e deixa você pedir. Ver as duas *depois* de ter chegado numa é o momento pedagógico
inteiro do §4.3.

Duas notas honestas para o `HOW-TO-PRACTICE.md`:

- **A trava é um empurrão, não uma cadeia.** `cat solutions/*/payout.ts` sempre vai
  funcionar. O script protege contra o impulso, não contra a intenção — e não deve fingir
  o contrário.
- **O diff de código vai ser barulhento.** Seus nomes não são os meus, e a ordem das
  extrações também não. Isso é esperado e não é erro seu. A comparação que ensina de
  verdade é `git log --oneline` contra o `STEPS.md` — os *passos*, não o destino. Por isso
  existe o `--steps`, e ele é o modo que o documento recomenda usar primeiro.

---

## 10. Direito autoral — restrição de projeto, não rodapé

O catálogo de nomes de refactorings é publicado abertamente em
[refactoring.com/catalog](https://refactoring.com/catalog/); referenciar os nomes,
os smells e os números de capítulo é uso legítimo. **O código e o texto do livro não são.**

Regras que valem como critério de aceitação de qualquer PR:

- Nenhum exercício transcreve código do livro — inclusive o exemplo `statement`/`plays`
  do capítulo 1, que é o que todo mundo copia. Domínios são originais.
- Nenhum README cita mais que uma frase curta do livro, e sempre com atribuição.
- Referências de leitura são ponteiros ("cap. 10, *Replace Nested Conditional with Guard
  Clauses*"), nunca o conteúdo.
- O README raiz diz explicitamente que o repositório é material de prática **não
  oficial**, sem vínculo com Martin Fowler ou a editora, e que o livro é pré-requisito.

Licença MIT no código. `CONTRIBUTING.md` repete essas quatro regras na seção de PR.

---

## 11. Roadmap

| Fase | Entrega | Critério de pronto |
| --- | --- | --- |
| **1 — Esqueleto** | Tooling (oxlint + oxfmt + vitest), scripts, CI, `CONTRIBUTING.md`, os três READMEs gerados, `diff`, 1 drill de referência (`Extract Function`) | CI verde nos oito checks; o drill de referência é bom o bastante para ser copiado |
| **2 — Módulo piloto** | Os 11 drills do cap. 6 + o kata do módulo | Você resolve os 11 sem tocar num teste; o formato sobrevive ao contato com o uso |
| **3 — Catálogo** | Drills dos caps. 7 a 12 + 1 kata por capítulo | `CATALOG.md` em 100% ✅ |
| **4 — Template** | Extrair `book-practice-template`; validar com um segundo livro | Um repo novo de livro nasce em < 1 hora |

A Fase 2 é o *gate* real. Um formato de exercício só se prova quando alguém tenta resolver
onze deles seguidos — é aí que se descobre se as dicas ajudam, se o critério de pronto é
verificável e se o `STEPS.md` vale o trabalho de escrever. **Não escale para a Fase 3
antes de resolver o módulo piloto inteiro.**

Ordem de escrita dentro de um exercício (importa, e vai no `CONTRIBUTING.md`):
**domínio → código limpo → testes → "des-refatorar" para criar o desafio → STEPS.md.**
Escrever o código sujo primeiro produz sujeira artificial, do tipo que ninguém encontra
em produção. Sujar código limpo, desfazendo passo a passo um refactor real, produz
exatamente o tipo de bagunça que o livro descreve — e o `STEPS.md` sai quase de graça,
lendo os seus próprios commits de trás para frente.

---

## 12. Mapa dos módulos

Capítulos e nomes conforme a 2ª edição. `docs/catalog-names.json` guarda esta lista como
fonte da verdade para o validador.

### Módulo 1 — cap. 6, A First Set of Refactorings (11 drills)
Extract Function · Inline Function · Extract Variable · Inline Variable ·
Change Function Declaration · Encapsulate Variable · Rename Variable ·
Introduce Parameter Object · Combine Functions into Class ·
Combine Functions into Transform · Split Phase

### Módulo 2 — cap. 7, Encapsulation (9 drills)
Encapsulate Record · Encapsulate Collection · Replace Primitive with Object ·
Replace Temp with Query · Extract Class · Inline Class · Hide Delegate ·
Remove Middle Man · Substitute Algorithm

### Módulo 3 — cap. 8, Moving Features (9 drills)
Move Function · Move Field · Move Statements into Function ·
Move Statements to Callers · Replace Inline Code with Function Call ·
Slide Statements · Split Loop · Replace Loop with Pipeline · Remove Dead Code

### Módulo 4 — cap. 9, Organizing Data (5 drills)
Split Variable · Rename Field · Replace Derived Variable with Query ·
Change Reference to Value · Change Value to Reference

### Módulo 5 — cap. 10, Simplifying Conditional Logic (6 drills)
Decompose Conditional · Consolidate Conditional Expression ·
Replace Nested Conditional with Guard Clauses · Replace Conditional with Polymorphism ·
Introduce Special Case · Introduce Assertion

### Módulo 6 — cap. 11, Refactoring APIs (10 drills)
Separate Query from Modifier · Parameterize Function · Remove Flag Argument ·
Preserve Whole Object · Replace Parameter with Query · Replace Query with Parameter ·
Remove Setting Method · Replace Constructor with Factory Function ·
Replace Function with Command · Replace Command with Function

### Módulo 7 — cap. 12, Dealing with Inheritance (11 drills)
Pull Up Method · Pull Up Field · Pull Up Constructor Body · Push Down Method ·
Push Down Field · Replace Type Code with Subclasses · Remove Subclass ·
Extract Superclass · Collapse Hierarchy · Replace Subclass with Delegate ·
Replace Superclass with Delegate

**Total: 61 drills + 7 katas de módulo + 2 katas finais.** Com a regra do §4.3
(drill → 1 variante, kata → 2+), isso são no mínimo **79 `STEPS.md`** para escrever — o
número que melhor descreve o tamanho real do projeto, e a razão de a Fase 2 ser o gate.

Nota sobre o módulo 6: `apiFrozen: false` vale para a maioria dos drills do cap. 11 —
é o módulo que mais exercita o harness alternativo descrito em §5. Vale implementá-lo
logo depois do módulo piloto, para validar esse caminho cedo em vez de descobrir na
Fase 3 que ele não funciona.

---

## 13. Em observação

As decisões em aberto da v1 foram fechadas (§3.1, §4.3, §5.1, §9.1). O que fica é uma
lista de apostas para conferir contra a realidade durante a Fase 2:

Nada de estrutural. O que sobrou são coisas a observar durante a Fase 2:

- **O inglês obrigatório como gargalo.** §3.1 aposta que rascunhar em pt-BR e traduzir no
  mesmo dia funciona. Se depois de 11 enunciados o `README.en.md` estiver sendo o passo
  que trava o exercício, a decisão a revisitar é essa — não o formato.
- **A segunda variante dos katas.** §4.3 manda escrever a canônica primeiro e voltar
  depois. Se ao resolver os katas você nunca chegar por um segundo caminho, a regra
  "kata → 2 ou mais" está errada e vira recomendação.
- **oxfmt sair do beta.** Quando estabilizar, remover o pin exato de versão (§6.2) e
  reavaliar o `printWidth`.
- **O gate de 100% de branch em `coverageTargets`** (§5.1) é ambicioso por escolha. Se ele
  virar burocracia em vez de rede, o ajuste é reduzir o escopo de `coverageTargets` — não
  baixar o número.

---

## 14. Publicação no GitHub

Checklist para quando a Fase 1 estiver pronta:

- Repo público `refactoring-practice`, licença MIT, descrição do §1.
- Topics: `refactoring`, `typescript`, `kata`, `code-smells`, `martin-fowler`,
  `practice`, `clean-code`, `vitest`, `oxlint`.
- "Use this template" **desligado** no repo do livro; ligado só no `book-practice-template` (Fase 4).
- Branch protection em `main` exigindo o job de CI — o valor do repo é que `main` está
  sempre pristino e verde.
- Issue templates: *novo exercício*, *exercício confuso*, *solução discutível*. O terceiro
  é o mais valioso: é onde a discussão de design acontece.
- Os três READMEs (§3.1) commitados e gerados pelo script — conferir na própria home do
  GitHub que `README.md` renderiza e que a linha de troca de idioma funciona nos dois
  sentidos. É o tipo de coisa que só falha depois de publicado.
- Ambos os READMEs abrem com o disclaimer de não-oficialidade (§10) e o `CATALOG.md` como
  primeiro link.

---

## Fontes

- [Refactoring Catalog — refactoring.com](https://refactoring.com/catalog/)
- [Refactoring: Improving the Design of Existing Code, 2nd Edition — sumário completo, InformIT](https://www.informit.com/store/refactoring-improving-the-design-of-existing-code-9780134757711)
- [Bad smells do capítulo 3, excertos publicados — InformIT](https://www.informit.com/articles/article.aspx?p=2952392)
- [Oxlint — configuração e lista de regras](https://oxc.rs/docs/guide/usage/linter/config.html)
- [Oxfmt — uso e opções](https://oxc.rs/docs/guide/usage/formatter.html)
- [Oxfmt Beta — anúncio e status](https://oxc.rs/blog/2026-02-24-oxfmt-beta)
- [Migrar do Prettier para o Oxfmt](https://oxc.rs/docs/guide/usage/formatter/migrate-from-prettier.html)
- [Vitest — `coverage.thresholds` com glob por arquivo](https://vitest.dev/config/coverage)

---

## 15. Notas de implementação (Fase 1)

O que a Fase 1 descobriu ao sair do papel. Cinco pontos em que o design mudou de forma no
contato com as ferramentas — todos registrados aqui porque a Fase 3 vai depender deles.

### O alias vira um *project* do Vitest, não uma linha de config

O §5 mostra o alias como um ternário em `resolve.alias`. Isso funciona para um exercício;
para 61, não existe um valor único de `@exercise`. A implementação real gera **um projeto
do Vitest por exercício**, cada um com o seu próprio alias, a partir dos `meta.json`:

- run padrão → um projeto por exercício, apontando para `src/`;
- `SOLUTIONS=1` → um projeto por **(exercício × variante)**, apontando para
  `solutions/<slug>/`.

Ganho colateral: `--project drill-06-01` isola um exercício, que é o que o
`npm start` e a trava do `npm run diff` usam.

### `tsc` precisa de um `tsconfig.json` por exercício

O alias existia só para o Vitest; o `tsc` não sabia dele e reprovava todo arquivo de teste.
Como `paths` é global por projeto, e cada exercício resolve `@exercise` para uma pasta
diferente, cada exercício ganhou o seu `tsconfig.json` — **gerado** pelo `build-index.ts`,
como todo o resto. `npm run typecheck` roda o projeto raiz mais um por exercício.

É linear no número de exercícios. Se um dia doer, a saída é *project references* com
`tsc -b`, não checar menos.

### O perfil estrito não pode herdar do relaxado

A ideia do §6.1 era `.oxlintrc.strict.json` com `extends` do config base. Não funciona: o
`overrides` do base desliga as regras de tamanho em `exercises/**/src/**`, e o `extends`
traz esse override junto — o perfil estrito rodava em silêncio contra o código sujo. **Os
dois configs são independentes.** Verificado do jeito certo, apontando o estrito para o
desafio: 2 erros, `complexity 11` e `77 linhas`.

Duas consequências menores: `categories.pedantic: "warn"` entrou no base (é o que dá
sentido ao override), e como o oxlint não expande `**` sozinho, a checagem das soluções na
CI virou um script que monta a lista de pastas a partir dos `meta.json`.

### O oxfmt não formata markdown neste repo

`ignorePatterns: ["**/*.md"]`. Dois motivos, e o segundo é o que decide: o formatador
reflui prosa quebrada à mão (os enunciados e este documento), e reformata os READMEs
**gerados** — o que colocaria `oxfmt --check` e `npm run index -- --check` em contradição
permanente, cada um exigindo um conteúdo diferente do mesmo arquivo.

Pelo mesmo motivo o `tsconfig.json` gerado é escrito como template literal em vez de
`JSON.stringify`: para sair já no formato que o oxfmt produz.

### Versões

O ecossistema andou desde o esboço: vitest 4.1.11, oxlint 1.80.0, oxfmt 0.65.0,
TypeScript 7.0.2. Duas pegadinhas do TS 7: `baseUrl` foi **removido** (use `paths`
relativos ao próprio tsconfig) e `allowImportingTsExtensions` é necessário para o
`vitest.config.ts` importar `./scripts/lib/exercises.ts` com extensão — o que o carregador
nativo de config do Vite vai exigir em breve.

O pin exato do oxfmt (§6.2) continua valendo, e agora com um motivo a mais: ele é a única
dependência beta que pode reescrever 61 exercícios sozinha.

---

## 16. Revisão pós-Fase 1

Cinco ajustes depois de olhar o esqueleto funcionando. Os três primeiros mudam o que o
repositório ensina; os dois últimos mudam como se mexe nele.

### 16.1 A pergunta dos testes tem resposta medida

"Mais testes?" era decidível, não uma questão de gosto. Medi: cobertura de linha no
exercício de referência estava em **100%** com metade da suíte final, e os 22% de branch
descobertos eram **exclusivamente** os quatro `?? 0` — código morto que existe porque o
tipo não está estreitado. Ou seja: pela cobertura, a suíte estava pronta.

E não estava. Faltavam cinco comportamentos que uma refatoração plausível quebra em
silêncio e que a cobertura nunca acusaria, porque todos passam pelas mesmas linhas:

- empate no tempo (estabilidade da ordenação);
- ordem entre finishers e DNFs (o que quebra ao fundir os dois laços em um);
- n = 1 na média (o que quebra ao trocar o acumulador por uma query);
- nome mais largo que a coluna (transbordar ≠ truncar);
- lista vazia (não há primeiro elemento para pegar).

Daí a regra que entrou no `CONTRIBUTING.md`: **um teste por comportamento que uma
refatoração plausível pode mudar em silêncio** — não um por linha, e nunca mirando um
número. Cada teste nomeia, em comentário, o movimento contra o qual ele protege. A suíte
foi de 4 para 9.

A moral vale além do exercício: **cobertura diz que código rodou, nunca que promessa está
presa.** Por isso o gate de cobertura do §5.1 continua valendo só para os katas sem rede
pronta, onde a pergunta é outra — lá o risco é não ter teste nenhum, não ter poucos.

### 16.2 `STEPS.md` encolheu; `WALKTHROUGH.md` nasceu

O `STEPS.md` original tentava ser as duas coisas: a lista que você segue com as mãos e o
texto que explica o porquê. Ficava longo demais para a primeira função e raso demais para a
segunda.

Agora são dois arquivos por variante, e a divisão é de **momento de uso**:

- **`STEPS.md`** — a rota. Uma tabela de movimentos com a mensagem de commit de cada um.
  Fica aberto num painel lateral enquanto você trabalha. ~50 linhas.
- **`WALKTHROUGH.md`** — o comentário. O código antes/depois de cada passo, por que naquela
  ordem, o que cada nome teve de merecer, o que o refactor custou e quais alternativas são
  igualmente defensáveis. Lê-se **depois** de ter a própria versão. ~260 linhas.

O walkthrough é onde cabe o que o `STEPS.md` não podia carregar: que a ordem importa mais
que os movimentos; que os `?? 0` eram o sistema de tipos apontando a costura (e que isso
**não está no livro**, cujos exemplos são em JavaScript); que o passo 10 é *Replace Temp
with Query* do capítulo 7 aparecendo sozinho num drill do 6; e que `renderSummary` talvez
devesse ser duas funções, e que não há resposta certa. Um walkthrough que apresenta toda
decisão como óbvia mente para quem lê.

`./rp diff <id> --walkthrough` imprime esse arquivo. `--steps` continua sendo o modo
recomendado para a primeira olhada.

### 16.3 Nomes viram matéria de primeira classe

Fora do escopo do livro por escolha explícita, e registrada como tal. O livro trata nome
como **movimento** (*Rename Variable*, *Change Function Declaration*, *Mysterious Name*),
não como julgamento — ele ensina a renomear com segurança, não a distinguir um nome bom de
um plausível.

A lacuna importa aqui mais que na média, porque **Extract Function é um exercício de nomear
fantasiado de exercício mecânico**. Recortar o bloco é a metade fácil; o que dá valor à
extração é o bloco passar a ter nome, e um nome ruim deixa o leitor pior do que o comentário
que ele substituiu.

Três peças:

- **`docs/NAMING.md`** — quatro perguntas em ordem (diz *o quê* ou *como*? poderia nomear
  outra coisa neste arquivo? lê bem no ponto de chamada? é *verdade*?), mais as convenções
  do repo, incluindo a distinção real entre `format*` (valor → string) e `render*` (domínio
  → linhas).
- **Seção "On the name"** em cada passo do walkthrough: qual pergunta decidiu e qual
  candidato foi rejeitado.
- **`./rp names <id>`** — passada advisory, sempre sai 0. Acusa vago (`data`, `temp`,
  `processX`, `*Manager`); **não** consegue acusar falso. Está escrito na saída do próprio
  comando: verde ali não é o mesmo que certo.

A pergunta 4 — o nome é verdade? — é a que produz achado de verdade e a única que nenhuma
ferramenta responde. É por isso que ela é um critério da revisão (§16.4) e não do lint.

### 16.4 `docs/REVIEW.md` — revisão por IA sem gabarito

O arquivo **é** o prompt. `./rp review <id>` imprime a rubrica com o material anexado:
o enunciado, a suíte intocada, o código como está e o `git log --oneline` da rota.

A decisão de projeto que sustenta o resto: **as soluções publicadas ficam de fora do
pacote**, deliberadamente. Um revisor com gabarito na mão avalia semelhança em vez de
qualidade — e como o §4.3 já assume que mais de uma decomposição está certa, entregar o
gabarito destruiria a premissa. A rubrica diz isso na primeira seção, em voz alta: *"eu
teria dividido diferente" não é um achado.*

Cinco critérios, e o terceiro é o que quase todo revisor pula: **a rota, não só o destino**.
O log de commits é a evidência de que houve passos pequenos com testes verdes no meio. Um
único commit chamado "refactor" é uma reescrita fantasiada — pode até ter produzido código
melhor, e não praticou o que se estava praticando. A rubrica manda comentar a *forma do log*
antes de comentar o código.

Também pede explicitamente o que costuma faltar: **o que piorou**. Lazy Element, parâmetro
demais por costura errada, ping-pong entre seis funções, generalidade prematura. Nada disso
é visível para nenhum check automático do repositório.

Por exercício, `meta.json` carrega `reviewFocus` — o que pesar mais ali. Um arquivo de
rubrica compartilhado, e não 61 quase-idênticos.

### 16.5 Um comando só: `./rp`

`npm run diff -- drill-06-01` tinha três problemas num comando só: o `run`, o `--`
separador, e o id por extenso. E do outro lado havia sete scripts de topo com o mesmo
boilerplate de parsing e busca repetido em cada um.

Agora é um wrapper executável na raiz, um dispatcher e um arquivo por comando em
`scripts/commands/`, com a busca e o parsing compartilhados:

```
./rp                  ./rp start 06-01     ./rp diff 06-01 --steps
./rp review 06-01     ./rp names 06-01     ./rp check
```

Ids ficaram difusos: `06-01`, `drill-06-01`, `extract-function` e `"Extract Function"`
resolvem para o mesmo exercício. Ninguém precisa decorar o esquema de id.

`./rp check` roda os nove passos na ordem que falha mais rápido, e o CI virou um passo só —
o mesmo comando que você roda antes de abrir o PR, o que remove a classe de bug em que o
workflow e o `package.json` divergem.

Os scripts npm que sobraram são os que fazem sentido serem nativos (`test`, `lint`,
`format`) mais dois atalhos. De dez scripts, quatro.
