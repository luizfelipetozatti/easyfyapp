/**
 * Formata um número de telefone brasileiro para o padrão: +55 (XX) 9 XXXX-XXXX
 * Entrada esperada: "5511999999999" (código país + DDD + número)
 * Saída: "+55 (11) 9 9999-9999"
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, "");
  
  // Se não começar com 55, adiciona
  const withCountryCode = cleaned.length === 11 ? `55${cleaned}` : cleaned;
  
  // Extrai partes: código país (2) + DDD (2) + número (8-9)
  const countryCode = withCountryCode.slice(0, 2);
  const areaCode = withCountryCode.slice(2, 4);
  const firstPart = withCountryCode.slice(4, 5); // 9 para celular
  const secondPart = withCountryCode.slice(5, 9); // 4 dígitos
  const thirdPart = withCountryCode.slice(9); // últimos 4 dígitos
  
  return `+${countryCode} (${areaCode}) ${firstPart} ${secondPart}-${thirdPart}`;
}
