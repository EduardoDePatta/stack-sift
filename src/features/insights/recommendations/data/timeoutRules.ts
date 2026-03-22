import type { PatternRule } from "../patternRule"

export const TIMEOUT_RULES: PatternRule[] = [
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
