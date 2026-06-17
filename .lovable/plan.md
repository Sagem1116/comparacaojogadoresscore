# Plano — Nuno Scores como sistema completo

## 1. Upload de atributos em HTML (Import)
- Adicionar parser `parseFMAttributesHTML` em `src/utils/fmHtmlParser.ts`:
  - Lê o ficheiro como texto, usa `DOMParser` para extrair a primeira `<table>`.
  - Headers da `<thead>` ou primeira `<tr>`. Linhas da `<tbody>`.
  - Detecta colunas Player/Name/UID/Club/Age automaticamente; restantes colunas numéricas viram atributos.
- `ImportPage.tsx`:
  - Aceitar `.html`, `.htm` e `.csv` no 3º upload (label: "Atributos Nuno (.html FM Export ou .csv)").
  - Encaminhar para `processAttributesHtml` ou `processAttributesCsv` consoante extensão. Continua a usar UID prioritariamente para emparelhar.

## 2. Página `Nuno Scores` no estilo Role Configuration
Substituir o ecrã actual por UI igual à `RoleConfigurationPage`:
- Seletor de role (dropdown com todos os roles detetados, configurado independentemente por role).
- Secção **Atributos** — lista editável (add/remove) com:
  - Coluna (dropdown sobre `customAttributeColumns`)
  - Peso 0–100
  - Normalização: `minMax` | `percentile` | `zScore`
  - Toggle `inverse` (para atributos onde menor é melhor, ex. Fouls)
- Secção **Métricas** — mesma estrutura, mas dropdown sobre colunas numéricas de `Statistics` (`availableMetrics` similar à página Configuration).
- Secção **Fórmula final** editável, com variáveis disponíveis: `AttributeScore`, `MetricScore`, `Age`, `MinutesPlayed`, `MarketValue`.
  - Templates rápidos: `(AttributeScore*0.6)+(MetricScore*0.4)`, `AttributeScore`, `MetricScore`, etc.
- Botões "Guardar" e "Ver no Scouting Nuno" (navega para `/scouting-nuno-scores`).
- Persistência em `localStorage` (`nuno-config-v2`).

## 3. Store
Em `dataStore.ts` adicionar:
```ts
interface NunoRoleConfig {
  attributes: MetricConfig[]   // reutiliza tipo (columnName, weight, norm, inverse)
  metrics: MetricConfig[]
  formula: string              // default '(AttributeScore*0.6)+(MetricScore*0.4)'
}
nunoConfigs: Record<string /*roleId*/, NunoRoleConfig>
setNunoConfig(roleId, config)
```
Manter `customAttributes`/`customAttributeColumns` como já existem. Remover/deprecar `nunoRoleWeights` (migração: se existir no localStorage, converter para nova estrutura com `weight*10`).

## 4. Cálculo
Novo `src/services/nunoAnalysisService.ts`:
- `calculateNunoAnalysis(players, role, config, customAttributes)` que:
  1. Calcula `AttributeScore` (0–100) via min-max/zScore/percentile ponderado sobre `config.attributes`.
  2. Calcula `MetricScore` (0–100) via mesma lógica sobre `player.statistics` para `config.metrics`.
  3. Avalia `config.formula` por jogador via `evaluateFormula` existente (`utils/formula.ts`) com variáveis acima.
- Retorna `NunoPlayerAnalysis[]` semelhante a `PlayerAnalysis`, com `attributeScore`, `metricScore`, `finalScore`, `rank`.

## 5. Página `/scouting-nuno-scores`
- Criar `src/components/pages/ScoutingNunoPage.tsx` copiando `ScoutingTablePage.tsx`.
- Substituir colunas de score por: **Attribute Score**, **Metric Score**, **Final Score (Nuno)**.
- Usar `calculateNunoAnalysis` em vez de `calculateAllPlayersAnalysis`.
- Manter: AIScoutAssistant, filtros, ordenação, gestão de colunas, paginação, larguras redimensionáveis, defaults (transfer value/wage), persistência (`nuno-scouting-table-state`).
- Se a role selecionada não tiver `nunoConfigs[roleId]`, mostrar empty state com botão para `/nuno-scores`.

## 6. Routing / Navegação
- `App.tsx`: nova rota `/scouting-nuno-scores`.
- `Navigation.tsx`: adicionar link "Scouting Nuno" abaixo de "Scouting".

## 7. Limpeza
- Remover a coluna "Nuno Score" injetada em `ScoutingTablePage.tsx` (passa a viver só na página dedicada) — assim os scores antigos ficam isolados na Scouting normal, como o utilizador pediu.

## Ficheiros tocados
- novo: `src/utils/fmHtmlParser.ts`, `src/services/nunoAnalysisService.ts`, `src/components/pages/ScoutingNunoPage.tsx`
- editado: `src/components/pages/ImportPage.tsx`, `src/components/pages/NunoScoresPage.tsx`, `src/components/pages/ScoutingTablePage.tsx`, `src/stores/dataStore.ts`, `src/App.tsx`, `src/components/Navigation.tsx`
