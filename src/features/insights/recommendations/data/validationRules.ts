import type { PatternRule } from "../patternRule"

export const VALIDATION_RULES: PatternRule[] = [
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
