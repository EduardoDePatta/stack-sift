import type { PatternRule } from "../patternRule"

export const INTEGRATION_RULES: PatternRule[] = [
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
