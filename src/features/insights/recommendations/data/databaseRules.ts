import type { PatternRule } from "../patternRule"

export const DATABASE_RULES: PatternRule[] = [
  {
    patterns: ["duplicate key"],
    text: "Race condition provável. Considere usar ON CONFLICT (upsert) ou lock otimista para evitar inserções duplicadas.",
    specificity: 0.9
  },
  {
    patterns: ["deadlock"],
    text: "Duas transações competindo por locks. Revise a ordem de acesso às tabelas e considere reduzir o escopo das transações.",
    specificity: 0.9
  },
  {
    patterns: ["connection refused"],
    text: "O banco está inacessível. Verifique o connection pool, limites de conexão e saúde do servidor de banco de dados.",
    specificity: 0.85
  },
  {
    patterns: ["too many connections"],
    text: "Limite de conexões excedido. Reduza o tamanho do pool ou aumente o max_connections do banco.",
    specificity: 0.85
  },
  {
    patterns: ["relation does not exist"],
    text: "Tabela ou coluna não encontrada. Verifique se as migrations foram aplicadas no ambiente correto.",
    specificity: 0.9
  },
  {
    patterns: ["queryfailederror", "typeorm"],
    text: "Erro no TypeORM. Verifique a query gerada, tipos das colunas e estado das migrations.",
    specificity: 0.7
  },
  {
    patterns: ["queryfailederror"],
    text: "Query SQL falhou. Verifique a sintaxe da query, constraints e integridade dos dados.",
    specificity: 0.6
  },
  {
    patterns: ["prisma"],
    text: "Erro no Prisma. Verifique o schema.prisma, execute prisma generate e confira as migrations pendentes.",
    specificity: 0.7
  },
  {
    patterns: ["sequelize"],
    text: "Erro no Sequelize. Verifique o model, a migration correspondente e a conexão com o banco.",
    specificity: 0.7
  }
]
