import type {
  IncidentCategory,
  ParsedIncident,
  Recommendation
} from "~/shared/types/incident"
import { buildHypothesis } from "./hypothesis"

interface PatternRule {
  patterns: string[]
  text: string
  specificity: number
}

const DATABASE_RULES: PatternRule[] = [
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

const VALIDATION_RULES: PatternRule[] = [
  {
    patterns: ["unprocessable entity"],
    text: "Entidade rejeitada pela validação. Verifique os decorators do class-validator ou regras de schema da entidade.",
    specificity: 0.85
  },
  {
    patterns: ["class-validator", "validate"],
    text: "Validação do class-validator falhou. Revise os decorators da entidade e os dados enviados.",
    specificity: 0.8
  },
  {
    patterns: ["bad request"],
    text: "Request inválido (400). Verifique o body, headers e content-type esperados pelo endpoint.",
    specificity: 0.7
  },
  {
    patterns: ["zod"],
    text: "Schema Zod rejeitou o payload. Compare o objeto enviado com o schema esperado (.parse ou .safeParse).",
    specificity: 0.85
  },
  {
    patterns: ["schema"],
    text: "Schema validation falhou. Verifique se o formato dos dados está de acordo com o schema esperado.",
    specificity: 0.5
  },
  {
    patterns: ["invalid email"],
    text: "Formato de email inválido. Verifique as regras de formato aplicadas ao input.",
    specificity: 0.8
  },
  {
    patterns: ["invalid format"],
    text: "Formato de campo inválido. Verifique as regras de formato (email, CPF, telefone, etc.) aplicadas ao input.",
    specificity: 0.8
  },
  {
    patterns: ["required field"],
    text: "Campo obrigatório ausente. Verifique se o payload inclui todos os campos obrigatórios do endpoint.",
    specificity: 0.8
  },
  {
    patterns: ["missing field"],
    text: "Campo obrigatório ausente. Verifique se o payload inclui todos os campos obrigatórios do endpoint.",
    specificity: 0.8
  }
]

const TIMEOUT_RULES: PatternRule[] = [
  {
    patterns: ["etimedout"],
    text: "Timeout de conexão TCP. Verifique DNS, firewalls, security groups e se o serviço destino está acessível.",
    specificity: 0.9
  },
  {
    patterns: ["econnaborted"],
    text: "Conexão abortada. O request excedeu o timeout configurado. Considere aumentar o timeout ou otimizar o endpoint.",
    specificity: 0.85
  },
  {
    patterns: ["socket hang up"],
    text: "A conexão foi cortada antes da resposta. Possível crash no serviço downstream, proxy timeout ou keep-alive expirado.",
    specificity: 0.85
  },
  {
    patterns: ["deadline exceeded"],
    text: "gRPC deadline excedido. Aumente o deadline do client ou otimize o tempo de resposta do serviço chamado.",
    specificity: 0.9
  },
  {
    patterns: ["request timed out"],
    text: "Operação excedeu o tempo limite. Verifique a saúde do serviço downstream e considere implementar circuit breaker.",
    specificity: 0.75
  },
  {
    patterns: ["operation timed out"],
    text: "Operação excedeu o tempo limite. Verifique a saúde do serviço downstream e considere implementar circuit breaker.",
    specificity: 0.75
  },
  {
    patterns: ["econnrefused"],
    text: "Conexão recusada. O serviço destino não está ouvindo na porta esperada. Verifique se está rodando.",
    specificity: 0.85
  }
]

const AUTH_RULES: PatternRule[] = [
  {
    patterns: ["token expired"],
    text: "Token expirado. Verifique o TTL configurado, o fluxo de refresh token e o relógio do servidor (clock skew).",
    specificity: 0.9
  },
  {
    patterns: ["jwt expired"],
    text: "Token expirado. Verifique o TTL configurado, o fluxo de refresh token e o relógio do servidor (clock skew).",
    specificity: 0.9
  },
  {
    patterns: ["invalid token"],
    text: "Token inválido ou malformado. Verifique a assinatura, o secret/key usado e se o token não foi corrompido.",
    specificity: 0.9
  },
  {
    patterns: ["token invalid"],
    text: "Token inválido ou malformado. Verifique a assinatura, o secret/key usado e se o token não foi corrompido.",
    specificity: 0.9
  },
  {
    patterns: ["jwt malformed"],
    text: "Token JWT malformado. Verifique a assinatura, o secret/key usado e se o token não foi corrompido no transporte.",
    specificity: 0.9
  },
  {
    patterns: ["forbidden"],
    text: "Acesso proibido (403). O usuário está autenticado mas sem permissão. Verifique roles, policies e ACLs.",
    specificity: 0.8
  },
  {
    patterns: ["unauthorized"],
    text: "Não autenticado (401). O token não foi enviado ou é inválido. Verifique o header Authorization e o fluxo de login.",
    specificity: 0.8
  },
  {
    patterns: ["permission denied"],
    text: "Permissão negada. Verifique as permissões do recurso, roles do usuário e políticas de acesso.",
    specificity: 0.85
  },
  {
    patterns: ["access denied"],
    text: "Acesso negado. Verifique as permissões do recurso, roles do usuário e políticas de acesso.",
    specificity: 0.85
  }
]

const RUNTIME_RULES: PatternRule[] = [
  {
    patterns: ["cannot read properties of undefined"],
    text: "Acesso a propriedade de objeto undefined. Adicione optional chaining (?.) ou verifique se os dados foram carregados antes do render.",
    specificity: 0.9
  },
  {
    patterns: ["cannot read properties of null"],
    text: "Acesso a propriedade de null. Verifique se o elemento DOM existe ou se o dado retornou null da API.",
    specificity: 0.9
  },
  {
    patterns: ["is not a function"],
    text: "Chamada de função em algo que não é function. Verifique imports, named exports vs default exports e versões de dependências.",
    specificity: 0.85
  },
  {
    patterns: ["is not defined"],
    text: "Variável não definida no escopo. Possível import faltando, typo no nome ou variável fora de escopo.",
    specificity: 0.8
  },
  {
    patterns: ["undefined is not an object"],
    text: "Tentativa de acessar undefined como objeto (Safari). Mesmo que 'cannot read properties of undefined' -- adicione null guard.",
    specificity: 0.85
  },
  {
    patterns: ["maximum call stack"],
    text: "Stack overflow por recursão infinita. Verifique loops recursivos, useEffect sem dependências corretas ou re-renders infinitos.",
    specificity: 0.9
  },
  {
    patterns: ["loading chunk"],
    text: "Falha ao carregar chunk JS. Possível deploy recente invalidou os chunks. Considere implementar retry ou forçar reload.",
    specificity: 0.85
  },
  {
    patterns: ["chunk", "failed to fetch"],
    text: "Falha ao carregar chunk JS. Possível deploy recente invalidou os chunks. Considere implementar retry ou forçar reload.",
    specificity: 0.8
  }
]

const INTEGRATION_RULES: PatternRule[] = [
  {
    patterns: ["enotfound"],
    text: "DNS não resolveu o hostname do serviço externo. Verifique a URL, DNS e conectividade de rede.",
    specificity: 0.9
  },
  {
    patterns: ["502", "bad gateway"],
    text: "Bad Gateway (502). O proxy/load balancer não conseguiu conectar ao upstream. Verifique saúde do serviço destino.",
    specificity: 0.85
  },
  {
    patterns: ["503", "service unavailable"],
    text: "Serviço indisponível (503). O serviço externo está em manutenção ou sobrecarregado. Implemente retry com backoff.",
    specificity: 0.85
  },
  {
    patterns: ["rate limit"],
    text: "Rate limit atingido. Implemente throttling, backoff exponencial ou aumente o limite com o provedor.",
    specificity: 0.9
  },
  {
    patterns: ["too many requests"],
    text: "Too many requests (429). Implemente throttling, backoff exponencial ou reduza a frequência de chamadas.",
    specificity: 0.9
  },
  {
    patterns: ["429"],
    text: "Rate limit atingido (429). Implemente throttling, backoff exponencial ou aumente o limite com o provedor.",
    specificity: 0.85
  },
  {
    patterns: ["ssl", "certificate"],
    text: "Erro de certificado SSL. Verifique validade do certificado, CA trust store e se o certificado corresponde ao hostname.",
    specificity: 0.85
  },
  {
    patterns: ["cors"],
    text: "Erro de CORS. Configure os headers Access-Control-Allow-Origin, Methods e Headers no servidor.",
    specificity: 0.9
  }
]

const INFRA_RULES: PatternRule[] = [
  {
    patterns: ["heap out of memory"],
    text: "Memória heap esgotada. Aumente o --max-old-space-size, otimize uso de memória ou escale verticalmente.",
    specificity: 0.95
  },
  {
    patterns: ["out of memory"],
    text: "Memória esgotada. Aumente os limites de memória, otimize uso de memória ou escale verticalmente.",
    specificity: 0.9
  },
  {
    patterns: ["enomem"],
    text: "Erro ENOMEM. O sistema operacional não conseguiu alocar memória. Aumente a RAM disponível.",
    specificity: 0.9
  },
  {
    patterns: ["enospc"],
    text: "Disco cheio (ENOSPC). Limpe logs, arquivos temporários ou aumente o volume de armazenamento.",
    specificity: 0.9
  },
  {
    patterns: ["no space left"],
    text: "Disco cheio. Limpe logs, arquivos temporários ou aumente o volume de armazenamento.",
    specificity: 0.9
  },
  {
    patterns: ["eacces"],
    text: "Permissão de filesystem negada (EACCES). Verifique owner, group e permissões do arquivo/diretório no container.",
    specificity: 0.8
  },
  {
    patterns: ["oom"],
    text: "Processo terminado pelo OOM killer. O container excedeu o limite de memória. Aumente o resource limit ou otimize.",
    specificity: 0.85
  },
  {
    patterns: ["segmentation fault"],
    text: "Segfault em módulo nativo. Verifique compatibilidade da dependência nativa com a arquitetura/OS do container.",
    specificity: 0.9
  },
  {
    patterns: ["sigsegv"],
    text: "SIGSEGV recebido. Possível crash em módulo nativo. Verifique compatibilidade com a arquitetura do container.",
    specificity: 0.9
  }
]

const RULES_BY_CATEGORY: Partial<Record<IncidentCategory, PatternRule[]>> = {
  database: DATABASE_RULES,
  validation: VALIDATION_RULES,
  timeout: TIMEOUT_RULES,
  auth: AUTH_RULES,
  "runtime": RUNTIME_RULES,
  integration: INTEGRATION_RULES,
  infra: INFRA_RULES
}

function buildSearchText(incident: ParsedIncident): string {
  return [incident.title, ...incident.stackTrace, ...incident.breadcrumbs]
    .join("\n")
    .toLowerCase()
}

function matchesAllPatterns(text: string, patterns: string[]): boolean {
  return patterns.every((p) => text.includes(p))
}

export function buildRecommendations(
  incident: ParsedIncident,
  category: IncidentCategory
): Recommendation[] {
  const searchText = buildSearchText(incident)
  const results: Recommendation[] = []

  const categoryRules = RULES_BY_CATEGORY[category]
  if (categoryRules) {
    for (const rule of categoryRules) {
      if (matchesAllPatterns(searchText, rule.patterns)) {
        results.push({ text: rule.text, specificity: rule.specificity })
      }
    }
  }

  const allRules = Object.entries(RULES_BY_CATEGORY)
  for (const [cat, rules] of allRules) {
    if (cat === category) continue
    for (const rule of rules!) {
      if (matchesAllPatterns(searchText, rule.patterns)) {
        results.push({
          text: rule.text,
          specificity: rule.specificity * 0.5
        })
      }
    }
  }

  results.sort((a, b) => b.specificity - a.specificity)

  const seen = new Set<string>()
  const unique = results.filter((r) => {
    if (seen.has(r.text)) return false
    seen.add(r.text)
    return true
  })

  if (unique.length === 0) {
    return [{ text: buildHypothesis(category), specificity: 0 }]
  }

  return unique.slice(0, 5)
}
