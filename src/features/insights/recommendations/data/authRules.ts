import type { PatternRule } from "../patternRule"

export const AUTH_RULES: PatternRule[] = [
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
