export interface MetricInfoItem {
  name: string
  weight: number
  description: string
  inverse?: boolean
}

export interface MetricRoleInfo {
  name: string
  description: string
  metrics: MetricInfoItem[]
}

export interface MetricCategoryInfo {
  category: string
  roles: MetricRoleInfo[]
}

export const metricasInfoData: MetricCategoryInfo[] = [
  {
    category: 'Guarda-Redes',
    roles: [
      {
        name: 'Guarda-Redes (Goalkeeper)',
        description:
          'O guardião tradicional. O seu foco é o posicionamento estrito entre os postes e a minimização de riscos. Ele raramente sai da área e prefere passes curtos e seguros para os defesas próximos.',
        metrics: [
          { name: 'Save %', weight: 10, description: 'Eficácia pura em parar remates.' },
          { name: 'xSave % Overperformance', weight: 9, description: 'Capacidade de defender o que é “indefensável”.' },
          { name: 'Saves Held/90', weight: 8, description: 'Segurança de mãos; evitar dar segundas oportunidades ao adversário.' },
          { name: 'Mistakes Leading to Goal', weight: 8, description: 'A consistência é vital para um guarda-redes conservador.' },
          { name: 'Saves/Goal Conceded', weight: 7, description: 'Rácio direto de impacto no jogo.' },
        ],
      },
      {
        name: 'Guarda-Redes Líbero (Sweeper Keeper)',
        description:
          'Ele é o 11º jogador de campo. Em posse, sobe para oferecer linhas de passe; defensivamente, varre as bolas metidas nas costas da defesa. É o motor inicial da transição ofensiva.',
        metrics: [
          { name: 'Progressive Passes', weight: 10, description: 'Essencial para quebrar a primeira linha de pressão.' },
          { name: 'Pass Completion %', weight: 9, description: 'Erros aqui resultam em baliza aberta.' },
          { name: 'xSave % Overperformance', weight: 8, description: 'Precisa de agilidade para recuperar posição após estar adiantado.' },
          { name: 'Interceptions/90', weight: 8, description: 'Mede a sua eficácia a sair da área para cortar passes longos.' },
          { name: 'Distance Covered', weight: 7, description: 'Reflete a sua mobilidade constante fora da pequena área.' },
        ],
      },
    ],
  },
  {
    category: 'Defesas Centrais',
    roles: [
      {
        name: 'Defesa Central (Central Defender)',
        description:
          'A fundação da defesa. O seu jogo é baseado em “marcar, desarmar e cobrir”. Não tem permissão para inventar com a bola, focando-se na solidez.',
        metrics: [
          { name: 'Tackle Completion %', weight: 10, description: 'Eficácia no confronto direto 1v1.' },
          { name: 'Headers Won %', weight: 9, description: 'Vital para neutralizar o jogo direto e bolas paradas.' },
          { name: 'Interceptions/90', weight: 9, description: 'Mede o sentido posicional e leitura de jogo.' },
          { name: 'Clearances/90', weight: 7, description: 'Capacidade de aliviar a pressão em momentos críticos.' },
          { name: 'Possession Lost', weight: 8, description: 'Quanto menos bolas perder, melhor cumpre o papel de segurança.', inverse: true },
        ],
      },
      {
        name: 'Defesa com Bola (Ball Playing Defender)',
        description:
          'Um estratega de recuado. Além de defender, tem a visão para lançar contra-ataques com passes longos ou verticais que saltam o meio-campo.',
        metrics: [
          { name: 'Progressive Passes/90', weight: 10, description: 'A métrica que define se ele está a “jogar” ou apenas a “defender”.' },
          { name: 'Pass Completion %', weight: 9, description: 'Precisão em passes de risco médio/alto.' },
          { name: 'Key Passes', weight: 8, description: 'Capacidade de colocar o avançado na cara do golo desde a defesa.' },
          { name: 'Tackle Completion %', weight: 8, description: 'Continua a ser um central; o desarmar é a base.' },
          { name: 'Interceptions/90', weight: 7, description: 'Importante para iniciar a transição ofensiva rapidamente.' },
        ],
      },
      {
        name: 'Defesa Central Eficiente (No-Nonsense Centre-Back)',
        description:
          'O “destruidor”. A sua única instrução é tirar a bola de zonas de perigo o mais rápido possível, sem qualquer preocupação estética ou de posse.',
        metrics: [
          { name: 'Clearances/90', weight: 10, description: 'O volume de bolas aliviadas é o seu sucesso.' },
          { name: 'Headers Won %', weight: 10, description: 'Domínio absoluto do jogo aéreo.' },
          { name: 'Tackles Completed/90', weight: 9, description: 'Volume de intervenções físicas com sucesso.' },
          { name: 'Mistakes Leading to Goal', weight: 9, description: 'Não pode falhar o básico.', inverse: true },
          { name: 'Possession Lost', weight: 6, description: 'Aceita-se que perca a bola (ao aliviar), desde que longe da baliza.' },
        ],
      },
      {
        name: 'Central Descaído (Wide Centre-Back)',
        description:
          'Exclusivo de defesas a 3. Em posse, ele abre como um lateral para permitir que o ala suba. Pode cruzar ou conduzir a bola até ao meio-campo.',
        metrics: [
          { name: 'Progressive Passes/90', weight: 10, description: 'Fundamental para a saída de bola pelos flancos.' },
          { name: 'Crosses Attempted/90', weight: 8, description: 'Indica a sua participação no último terço (em tarefa Atacar).' },
          { name: 'Tackle Completion %', weight: 8, description: 'Cobertura lateral do espaço deixado pelo ala.' },
          { name: 'Dribbles/90', weight: 7, description: 'Capacidade de transportar a bola sob pressão.' },
          { name: 'Interceptions/90', weight: 7, description: 'Leitura de bolas metidas nos corredores.' },
        ],
      },
      {
        name: 'Líbero Avançado (Libero)',
        description:
          'Um papel híbrido e raro. Recua como central para defender, mas em posse avança para o meio-campo para atuar como um organizador (DLP).',
        metrics: [
          { name: 'Passes Attempted/90', weight: 10, description: 'Tem de ser o centro do jogo de posse.' },
          { name: 'Progressive Passes', weight: 10, description: 'Capacidade de ditar o ritmo de jogo.' },
          { name: 'Interceptions/90', weight: 9, description: 'Fundamental para recuperar bolas e manter o sufoco ofensivo.' },
          { name: 'Distance Covered', weight: 8, description: 'Exige um pulmão de elite pela constante mudança de setor.' },
          { name: 'Chances Created', weight: 7, description: 'Participação ativa na criação de golo.' },
        ],
      },
    ],
  },
  {
    category: 'Defesas Laterais e Alas',
    roles: [
      {
        name: 'Defesa Lateral (Full-Back)',
        description:
          'O papel de equilíbrio. Sobe com critério e defende com rigor. É o suporte lateral clássico.',
        metrics: [
          { name: 'Tackle Completion %', weight: 10, description: 'Parar o extremo adversário é a prioridade 1.' },
          { name: 'Crosses Completed %', weight: 9, description: 'Qualidade sobre a quantidade no apoio ofensivo.' },
          { name: 'Interceptions/90', weight: 8, description: 'Fechar as linhas de passe interiores.' },
          { name: 'Progressive Passes', weight: 7, description: 'Ligar a defesa ao ataque pelo corredor.' },
          { name: 'Distance Covered', weight: 7, description: 'Consistência no vaivém lateral.' },
        ],
      },
      {
        name: 'Ala (Wing-Back)',
        description:
          'Um jogador de corredor total. Geralmente é a principal fonte de largura da equipa, exigindo enorme resistência física.',
        metrics: [
          { name: 'Sprints/90', weight: 10, description: 'Necessários para cobrir toda a ala repetidamente.' },
          { name: 'Crosses Attempted/90', weight: 9, description: 'Volume de jogo ofensivo.' },
          { name: 'Tackles Attempted/90', weight: 8, description: 'Volume de pressão defensiva no flanco.' },
          { name: 'Progressive Passes/90', weight: 8, description: 'Empurrar a equipa para a frente.' },
          { name: 'Open Play Cross Completion %', weight: 7, description: 'Eficácia em cruzamentos de jogo corrido.' },
        ],
      },
      {
        name: 'Lateral Descomplicado (No-Nonsense Full-Back)',
        description:
          'Um central adaptado à lateral. Não cruza, não dribla. Fica atrás e fecha a porta.',
        metrics: [
          { name: 'Tackles Completed/90', weight: 10, description: 'Ocupação defensiva total.' },
          { name: 'Clearances/90', weight: 9, description: 'Segurança em primeiro lugar.' },
          { name: 'Headers Won %', weight: 8, description: 'Importante para defender cruzamentos ao segundo poste.' },
          { name: 'Mistakes Leading to Goal', weight: 8, description: 'O seu valor está na nulidade de erros.', inverse: true },
          { name: 'Interceptions/90', weight: 7, description: 'Corte de bolas longas.' },
        ],
      },
      {
        name: 'Ala Completo (Complete Wing-Back)',
        description:
          'O vagabundo do flanco. Tem liberdade total para aparecer em zonas de finalização, driblar e criar. Atua quase como um extremo.',
        metrics: [
          { name: 'Chances Created/90', weight: 10, description: 'Impacto criativo direto.' },
          { name: 'Dribbles/90', weight: 10, description: 'Capacidade de romper linhas pelo drible.' },
          { name: 'Key Passes/90', weight: 9, description: 'Visão de jogo lateral.' },
          { name: 'Sprints/90', weight: 9, description: 'Intensidade ofensiva e defensiva.' },
          { name: 'xA/90', weight: 8, description: 'Qualidade da assistência esperada.' },
        ],
      },
      {
        name: 'Defesa Ala Invertido (Inverted Wing-Back)',
        description:
          'Taticamente complexo. Em posse, desloca-se para o centro do meio-campo para criar superioridade numérica (3x2 ou 2x2 no miolo).',
        metrics: [
          { name: 'Pass Completion %', weight: 10, description: 'Essencial para a retenção de bola no centro.' },
          { name: 'Progressive Passes/90', weight: 10, description: 'Distribuição a partir de zonas centrais.' },
          { name: 'Interceptions/90', weight: 9, description: 'Proteção contra o contra-ataque central.' },
          { name: 'Distance Covered', weight: 8, description: 'Movimentação diagonal constante.' },
          { name: 'Possession Won/90', weight: 7, description: 'Recuperação de bola após perda ofensiva.' },
        ],
      },
    ],
  },
  {
    category: 'Médios Defensivos',
    roles: [
      {
        name: 'Médio Defensivo (Defensive Midfielder)',
        description:
          'O protetor da zona entre linhas. Foca-se em manter a posição e distribuir de forma simples.',
        metrics: [
          { name: 'Pass Completion %', weight: 10, description: 'Manutenção da posse e segurança.' },
          { name: 'Tackles Completed/90', weight: 9, description: 'Eficácia a desarmar no miolo.' },
          { name: 'Interceptions/90', weight: 9, description: 'Prevenir que a bola chegue aos avançados adversários.' },
          { name: 'Pressure Success %', weight: 8, description: 'Eficácia em forçar o erro sem sair de posição.' },
          { name: 'Progressive Passes', weight: 7, description: 'Ligar aos médios criativos.' },
        ],
      },
      {
        name: 'Construtor de Jogo Recuado (Deep Lying Playmaker)',
        description:
          'O “quarterback”. Posiciona-se à frente da defesa e organiza todo o jogo com passes curtos e longos.',
        metrics: [
          { name: 'Passes Attempted/90', weight: 10, description: 'Volume de jogo; ele deve ser o jogador que mais toca na bola.' },
          { name: 'Progressive Passes', weight: 10, description: 'Capacidade de quebrar linhas.' },
          { name: 'xA/90', weight: 9, description: 'Qualidade da criação remota.' },
          { name: 'Key Passes', weight: 8, description: 'Passes que desequilibram a estrutura adversária.' },
          { name: 'Pass Completion %', weight: 8, description: 'Precisão obrigatória.' },
        ],
      },
      {
        name: 'Médio Recuperador de Bolas (Ball Winning Midfielder)',
        description:
          'O destruidor agressivo. Abandona a posição para perseguir o portador da bola e recuperá-la rapidamente.',
        metrics: [
          { name: 'Pressures Attempted/90', weight: 10, description: 'Atividade defensiva incessante.' },
          { name: 'Tackles Attempted/90', weight: 10, description: 'Agressividade no desarme.' },
          { name: 'Possession Won/90', weight: 9, description: 'O resultado final do seu trabalho.' },
          { name: 'Fouls Committed/90', weight: 7, description: 'Disciplina para não deixar a equipa com 10.', inverse: true },
          { name: 'Distance Covered', weight: 8, description: 'Mobilidade de pressão.' },
        ],
      },
      {
        name: 'Trinco (Anchor)',
        description:
          'Estático e disciplinado. Não sai da frente dos centrais. É o seguro de vida contra contra-ataques.',
        metrics: [
          { name: 'Interceptions/90', weight: 10, description: 'Posicionamento perfeito para cortar linhas de passe.' },
          { name: 'Tackle Completion %', weight: 10, description: 'Não pode ser ultrapassado no drible.' },
          { name: 'Pass Completion %', weight: 9, description: 'Simplicidade total.' },
          { name: 'Mistakes Leading to Goal', weight: 9, description: 'Fiabilidade máxima.', inverse: true },
          { name: 'Possession Lost', weight: 8, description: 'Não compromete a equipa em zonas baixas.', inverse: true },
        ],
      },
      {
        name: 'Pivô Defensivo (Half Back)',
        description:
          'Recua para se tornar um terceiro central em posse, permitindo que os laterais subam simultaneamente com total segurança.',
        metrics: [
          { name: 'Passes Attempted/90', weight: 10, description: 'Distribuição a partir de trás.' },
          { name: 'Pass Completion %', weight: 9, description: 'Precisão na primeira fase de construção.' },
          { name: 'Interceptions/90', weight: 8, description: 'Proteção da zona central recuada.' },
          { name: 'Headers Won %', weight: 7, description: 'Importância defensiva ao atuar como central.' },
          { name: 'Distance Covered', weight: 7, description: 'Movimentação de recuo e subida constante.' },
        ],
      },
      {
        name: 'Médio Criativo (Regista)',
        description:
          'Um DLP sem amarras. Tem liberdade para deambular e procurar a bola onde for preciso para criar magia.',
        metrics: [
          { name: 'Chances Created/90', weight: 10, description: 'Criação de oportunidades a partir de trás.' },
          { name: 'Key Passes/90', weight: 10, description: 'Visão de jogo periférica.' },
          { name: 'Progressive Passes', weight: 9, description: 'Verticalização constante do jogo.' },
          { name: 'xA/90', weight: 9, description: 'Expectativa de assistência de elite.' },
          { name: 'Passes Attempted/90', weight: 8, description: 'Centralização das ações ofensivas.' },
        ],
      },
      {
        name: 'Organizador Móvel (Roaming Playmaker)',
        description:
          'O motor da equipa. Transporta a bola da defesa para o ataque, driblando ou passando, aparecendo em todo o lado.',
        metrics: [
          { name: 'Distance Covered/90', weight: 10, description: 'Ubiquidade no campo.' },
          { name: 'Progressive Passes', weight: 9, description: 'Ligação entre setores.' },
          { name: 'Dribbles/90', weight: 9, description: 'Transporte de bola sob pressão.' },
          { name: 'Pass Completion %', weight: 8, description: 'Fluidez de jogo.' },
          { name: 'Key Passes', weight: 8, description: 'Participação no último passe.' },
        ],
      },
      {
        name: 'Segundo Volante (Segundo Volante)',
        description:
          'Um papel de “box-to-box” que parte da posição de médio defensivo. É uma arma surpresa que chega à área para rematar.',
        metrics: [
          { name: 'Shots/90', weight: 10, description: 'Presença finalizadora vindo de trás.' },
          { name: 'xG', weight: 9, description: 'Qualidade das chances que consegue encontrar.' },
          { name: 'Distance Covered/90', weight: 9, description: 'Exigência física para o “box-to-box”.' },
          { name: 'Tackles Completed/90', weight: 8, description: 'Continua a ter de defender em transição.' },
          { name: 'Sprints/90', weight: 8, description: 'Chegada rápida à área adversária.' },
        ],
      },
    ],
  },
  {
    category: 'Médios Centro',
    roles: [
      {
        name: 'Médio Centro (Central Midfielder)',
        description:
          'O generalista. Dependendo da tarefa, pode ser o cérebro, o destruidor ou o finalizador.',
        metrics: [
          { name: 'Pass Completion %', weight: 9, description: 'Elo de ligação fundamental.' },
          { name: 'Progressive Passes', weight: 8, description: 'Transição de jogo.' },
          { name: 'Tackles Completed/90', weight: 7, description: 'Estabilidade defensiva.' },
          { name: 'Key Passes', weight: 7, description: 'Apoio ofensivo.' },
          { name: 'Distance Covered', weight: 7, description: 'Presença constante.' },
        ],
      },
      {
        name: 'Médio Área-a-Área (Box To Box Midfielder)',
        description:
          'O pulmão. Defende a sua área e aparece na área adversária para finalizar. Nunca pára.',
        metrics: [
          { name: 'Distance Covered/90', weight: 10, description: 'Volume de trabalho total.' },
          { name: 'Tackles Completed/90', weight: 9, description: 'Recuperação de bola.' },
          { name: 'Shots/90', weight: 8, description: 'Ameaça de golo.' },
          { name: 'Pass Completion %', weight: 8, description: 'Continuidade de jogo.' },
          { name: 'Sprints/90', weight: 8, description: 'Intensidade de transição.' },
        ],
      },
      {
        name: 'Construtor de Jogo Avançado (Advanced Playmaker)',
        description:
          'Opera nos espaços entre o meio-campo e o ataque. Procura ditar o jogo no último terço.',
        metrics: [
          { name: 'Key Passes/90', weight: 10, description: 'Sua principal função.' },
          { name: 'xA/90', weight: 10, description: 'Qualidade técnica no passe final.' },
          { name: 'Pass Completion %', weight: 9, description: 'Retenção de posse sob pressão alta.' },
          { name: 'Chances Created/90', weight: 9, description: 'Volume de oportunidades geradas.' },
          { name: 'Progressive Passes', weight: 8, description: 'Levar a bola a zonas de perigo.' },
        ],
      },
      {
        name: 'Mezzala',
        description:
          'O médio que joga nos corredores centrais mas desloca-se para as alas em posse, criando triângulos com o extremo e o lateral.',
        metrics: [
          { name: 'Dribbles/90', weight: 10, description: 'Romper em zonas de “meio-espaço”.' },
          { name: 'Key Passes/90', weight: 9, description: 'Criatividade lateralizada.' },
          { name: 'Shots/90', weight: 9, description: 'Finalização vindo do corredor interno.' },
          { name: 'xA/90', weight: 8, description: 'Assistências esperadas.' },
          { name: 'Progressive Passes', weight: 8, description: 'Progressão ofensiva.' },
        ],
      },
      {
        name: 'Carrilero',
        description:
          'O “shuttler”. Move-se lateralmente para cobrir as subidas dos alas e tapar buracos no meio-campo.',
        metrics: [
          { name: 'Interceptions/90', weight: 10, description: 'Ocupação inteligente do espaço lateral/central.' },
          { name: 'Pass Completion %', weight: 10, description: 'Segurança absoluta na posse.' },
          { name: 'Tackles Completed/90', weight: 9, description: 'Proteção dos flancos internos.' },
          { name: 'Distance Covered', weight: 8, description: 'Trabalho de formiga constante.' },
          { name: 'Possession Lost', weight: 8, description: 'Não pode perder a bola enquanto a equipa sobe.', inverse: true },
        ],
      },
    ],
  },
  {
    category: 'Médios Ofensivos',
    roles: [
      {
        name: 'Médio Ofensivo (Attacking Midfielder)',
        description:
          'O tradicional “Camisa 10”. Joga no buraco entre a defesa e o ataque para criar e finalizar.',
        metrics: [
          { name: 'Key Passes/90', weight: 10, description: 'A métrica de ouro.' },
          { name: 'xA/90', weight: 10, description: 'Qualidade da visão de jogo.' },
          { name: 'Shots/90', weight: 9, description: 'Ameaça de golo constante.' },
          { name: 'Goals/90', weight: 8, description: 'Contribuição direta no placar.' },
          { name: 'Pass Completion %', weight: 8, description: 'Precisão no último terço.' },
        ],
      },
      {
        name: 'Número 10 (Trequartista)',
        description:
          'Tem liberdade total. Não defende. Deambula pelo campo à procura de espaços para destruir o adversário com técnica individual.',
        metrics: [
          { name: 'Chances Created/90', weight: 10, description: 'Criatividade pura.' },
          { name: 'Dribbles/90', weight: 9, description: 'Desequilíbrio individual.' },
          { name: 'xA/90', weight: 9, description: 'Qualidade de assistência.' },
          { name: 'Goal Contributions/90', weight: 9, description: 'Sua medida de sucesso final.' },
          { name: 'Open Play Key Passes', weight: 8, description: 'Criatividade sem depender de bolas paradas.' },
        ],
      },
      {
        name: 'Pivô Ofensivo (Enganche)',
        description:
          'O 10 estático. É o ponto de referência técnica que distribui jogo sem se mover muito, focando-se em ser o “cérebro” parado.',
        metrics: [
          { name: 'Pass Completion %', weight: 10, description: 'Não pode falhar passes em zonas densas.' },
          { name: 'Key Passes/90', weight: 10, description: 'Distribuição letal.' },
          { name: 'xA/90', weight: 9, description: 'Precisão técnica no passe de rutura.' },
          { name: 'Progressive Passes', weight: 9, description: 'Capacidade de ligar ao ataque.' },
          { name: 'Chances Created', weight: 8, description: 'Volume criativo.' },
        ],
      },
      {
        name: 'Avançado Sombra (Shadow Striker)',
        description:
          'Ataca o espaço criado pelo ponta de lança. É, na verdade, um finalizador que parte de trás para surpreender.',
        metrics: [
          { name: 'Goals/90', weight: 10, description: 'É medido pelos golos.' },
          { name: 'xG/90', weight: 10, description: 'Frequência de boas chances encontradas.' },
          { name: 'Shots on Target %', weight: 9, description: 'Letalidade no remate.' },
          { name: 'Non-pen Goals/90', weight: 9, description: 'Eficácia em jogo corrido.' },
          { name: 'Sprints/90', weight: 8, description: 'Rutura nas costas da defesa.' },
        ],
      },
    ],
  },
  {
    category: 'Extremos e Médios Ala',
    roles: [
      {
        name: 'Médio Ala (Wide Midfielder)',
        description:
          'Um papel tático. Ajuda a defender e apoia o ataque com passes e cruzamentos, mantendo a estrutura da equipa.',
        metrics: [
          { name: 'Crosses Completed %', weight: 10, description: 'Qualidade no serviço.' },
          { name: 'Tackles Completed/90', weight: 9, description: 'Apoio defensivo ao lateral.' },
          { name: 'Pass Completion %', weight: 9, description: 'Manutenção da posse e ritmo.' },
          { name: 'Interceptions/90', weight: 8, description: 'Corte de linhas de passe laterais.' },
          { name: 'Key Passes', weight: 7, description: 'Criatividade controlada.' },
        ],
      },
      {
        name: 'Extremo (Winger)',
        description:
          'Focado em bater o defesa na velocidade e linha de fundo para cruzar. Dá largura máxima.',
        metrics: [
          { name: 'Dribbles/90', weight: 10, description: 'Capacidade de 1v1.' },
          { name: 'Crosses Attempted/90', weight: 10, description: 'Volume de cruzamentos.' },
          { name: 'Sprints/90', weight: 9, description: 'Explosão no corredor.' },
          { name: 'Open Play Cross Completion %', weight: 9, description: 'Eficácia técnica do cruzamento.' },
          { name: 'Key Passes', weight: 8, description: 'Passes que geram remates.' },
        ],
      },
      {
        name: 'Extremo Defensivo (Defensive Winger)',
        description:
          'Pressiona o lateral adversário, recupera bolas e depois ataca de forma simples.',
        metrics: [
          { name: 'Pressures Completed/90', weight: 10, description: 'Sucesso na pressão alta.' },
          { name: 'Tackles Attempted/90', weight: 10, description: 'Agressividade defensiva lateral.' },
          { name: 'Interceptions/90', weight: 9, description: 'Recuperação de posse.' },
          { name: 'Crosses Attempted', weight: 8, description: 'Volume de apoio ofensivo.' },
          { name: 'Distance Covered', weight: 9, description: 'Sacrifício físico.' },
        ],
      },
      {
        name: 'Organizador Aberto (Wide Playmaker)',
        description:
          'Parte da ala mas flete para dentro para organizar o jogo, agindo como um médio centro criativo descaído.',
        metrics: [
          { name: 'Key Passes/90', weight: 10, description: 'Visão de jogo a partir da ala.' },
          { name: 'Pass Completion %', weight: 10, description: 'Segurança na circulação.' },
          { name: 'xA/90', weight: 9, description: 'Qualidade da assistência esperada.' },
          { name: 'Progressive Passes', weight: 9, description: 'Verticalização do jogo interior.' },
          { name: 'Chances Created', weight: 9, description: 'Volume de oportunidades.' },
        ],
      },
      {
        name: 'Extremo Invertido (Inverted Winger)',
        description:
          'Corta para dentro para abrir espaço para o lateral ou rematar/passar com o pé oposto ao flanco.',
        metrics: [
          { name: 'Key Passes/90', weight: 10, description: 'Passes em diagonal para o avançado.' },
          { name: 'Shots/90', weight: 9, description: 'Ameaça de golo interior.' },
          { name: 'Dribbles/90', weight: 9, description: 'Romper a defesa por dentro.' },
          { name: 'xA/90', weight: 8, description: 'Qualidade do último passe.' },
          { name: 'Progressive Passes', weight: 8, description: 'Conduzir a equipa para a área.' },
        ],
      },
      {
        name: 'Avançado Interior (Inside Forward)',
        description:
          'A versão mais agressiva do extremo invertido. Quer marcar golos acima de tudo.',
        metrics: [
          { name: 'Goals/90', weight: 10, description: 'Finalização é o objetivo único.' },
          { name: 'xG/90', weight: 10, description: 'Estar em posições de golo.' },
          { name: 'Shots Inside Box/90', weight: 9, description: 'Presença na área vindo de fora.' },
          { name: 'Dribbles/90', weight: 9, description: 'Bater o defesa para rematar.' },
          { name: 'Shots on Target %', weight: 8, description: 'Precisão na finalização.' },
        ],
      },
    ],
  },
  {
    category: 'Avançados',
    roles: [
      {
        name: 'Avançado de Referência (Target Forward)',
        description:
          'O ponto focal. Usa a força física para ganhar bolas aéreas e segurar o jogo para os colegas.',
        metrics: [
          { name: 'Headers Won %', weight: 10, description: 'Domínio aéreo absoluto.' },
          { name: 'Key Headers', weight: 10, description: 'Cabeceamentos que geram oportunidades.' },
          { name: 'Assists/90', weight: 9, description: 'Capacidade de servir os colegas após ganhar a bola.' },
          { name: 'Possession Won/90', weight: 8, description: 'Recuperação de bolas longas.' },
          { name: 'Goals', weight: 8, description: 'Ainda precisa de ser perigoso na área.' },
        ],
      },
      {
        name: 'Ponta de Lança Aberto (Raumdeuter)',
        description:
          'O “intérprete de espaços”. Não participa na construção, mas aparece de forma invisível em zonas de finalização.',
        metrics: [
          { name: 'Non-pen Goals/90', weight: 10, description: 'Eficácia máxima.' },
          { name: 'xG Overperformance', weight: 10, description: 'Capacidade de marcar com poucas chances.' },
          { name: 'Shots on Target %', weight: 9, description: 'Precisão letal.' },
          { name: 'Offsides/90', weight: 8, description: 'Inteligência para bater a linha defensiva.', inverse: true },
          { name: 'Goals Inside Box', weight: 9, description: 'Onde ele “caça” os seus golos.' },
        ],
      },
      {
        name: 'Avançado Recuado (Deep Lying Forward)',
        description:
          'Une o meio-campo ao ataque. Recua para receber a bola e lançar os extremos ou o parceiro de ataque.',
        metrics: [
          { name: 'Pass Completion %', weight: 10, description: 'Jogo de apoio impecável.' },
          { name: 'Key Passes/90', weight: 9, description: 'Criar chances para os colegas.' },
          { name: 'Assists/90', weight: 9, description: 'Transformar apoio em golos.' },
          { name: 'Shots/90', weight: 8, description: 'Manter a defesa ocupada com remates.' },
          { name: 'Headers Won %', weight: 7, description: 'Útil para ganhar bolas de costas para a baliza.' },
        ],
      },
      {
        name: 'Falso Nove (False Nine)',
        description:
          'Semelhante ao recuado, mas deambula mais, arrastando os centrais para fora da posição e criando caos tático.',
        metrics: [
          { name: 'Key Passes/90', weight: 10, description: 'Criação de jogo pura.' },
          { name: 'Dribbles/90', weight: 9, description: 'Capacidade de girar sobre o defesa e conduzir.' },
          { name: 'xA/90', weight: 9, description: 'Qualidade técnica na assistência.' },
          { name: 'Pass Completion %', weight: 9, description: 'Manutenção do jogo de posse.' },
          { name: 'Progressive Passes', weight: 8, description: 'Verticalizar o jogo do meio-campo.' },
        ],
      },
      {
        name: 'Ponta-de-Lança (Advanced Forward)',
        description:
          'O goleador moderno. Finaliza, corre nos canais laterais e pressiona a defesa.',
        metrics: [
          { name: 'Goals/90', weight: 10, description: 'A métrica definitiva.' },
          { name: 'xG/90', weight: 10, description: 'Frequência de finalização.' },
          { name: 'Shots on Target %', weight: 9, description: 'Precisão de remate.' },
          { name: 'Dribbles/90', weight: 8, description: 'Capacidade de criar o seu próprio remate.' },
          { name: 'Sprints/90', weight: 8, description: 'Velocidade em rutura.' },
        ],
      },
      {
        name: 'Ponta-de-Lança Fixo (Poacher)',
        description:
          'Não ajuda na construção. Fica no limite do fora de jogo para encostar bolas na pequena área.',
        metrics: [
          { name: 'Conversion %', weight: 10, description: 'Aproveitamento das poucas bolas que toca.' },
          { name: 'Goals Inside Box', weight: 10, description: 'É um especialista de área.' },
          { name: 'Shots on Target %', weight: 10, description: 'Não pode desperdiçar.' },
          { name: 'Non-pen Goals/Shot', weight: 9, description: 'Eficácia por remate.' },
          { name: 'xG Overperformance', weight: 9, description: 'Superar a expectativa estatística.' },
        ],
      },
      {
        name: 'Avançado Completo (Complete Forward)',
        description:
          'O jogador total. Tem de ser bom em tudo o que um avançado faz.',
        metrics: [
          { name: 'Goal Contributions/90', weight: 10, description: 'Golos + Assistências.' },
          { name: 'xG + xA', weight: 10, description: 'Impacto ofensivo total esperado.' },
          { name: 'Dribbles/90', weight: 9, description: 'Técnica individual superior.' },
          { name: 'Headers Won %', weight: 9, description: 'Presença física e aérea.' },
          { name: 'Key Passes', weight: 8, description: 'Visão de jogo.' },
        ],
      },
      {
        name: 'Avançado Trabalhador (Pressing Forward)',
        description:
          'O primeiro defesa. Corre quilómetros para impedir a saída de bola adversária e forçar erros.',
        metrics: [
          { name: 'Pressures Attempted/90', weight: 10, description: 'Intensidade de pressão.' },
          { name: 'Possession Won/90 (Final Third)', weight: 10, description: 'Recuperar a bola em zonas de golo.' },
          { name: 'Distance Covered/90', weight: 9, description: 'Desgaste físico em prol da equipa.' },
          { name: 'Sprints/90', weight: 9, description: 'Reação rápida à perda de bola.' },
          { name: 'Goals/90', weight: 8, description: 'Ainda precisa de finalizar após o esforço defensivo.' },
        ],
      },
    ],
  },
]
